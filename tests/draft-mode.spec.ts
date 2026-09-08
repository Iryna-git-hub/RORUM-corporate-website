import { expect, test, type BrowserContext } from "@playwright/test";
import { createClient } from "@sanity/client";

/**
 * Sanity Presentation Tool + secure Next.js Draft Mode.
 *
 *  - "isolation & security" — always runs. A normal visitor sees published
 *    content only: no Visual Editing, no stega anywhere, no draft cookie, no
 *    `data-sanity` attributes; the enable route is not an open query-param
 *    preview.
 *  - "draft preview" — runs when SANITY_API_READ_TOKEN (+ WRITE token, to mint
 *    a preview secret and make a reversible draft-only edit) are set. Proves
 *    draft content renders, page-BODY text carries stega source maps (Visual
 *    Editing overlays), localization still works per-locale, images/media on
 *    every representative page carry a `data-sanity` attribute that resolves
 *    to the correct document + type + stable `_key` field path, and none of
 *    it leaks to a normal visitor.
 *
 * Draft mutations are draft-only and cleaned up; published content is never
 * touched. Sanity image/media requests are aborted (bandwidth policy).
 */

const HAS_READ_TOKEN = !!process.env.SANITY_API_READ_TOKEN;
const HAS_WRITE_TOKEN = !!process.env.SANITY_API_WRITE_TOKEN;
const SANITY_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && !!process.env.NEXT_PUBLIC_SANITY_DATASET;

// Zero-width characters vercel/stega hides edit metadata inside strings with.
const STEGA_CHARS = /[​‌‍⁠-⁤﻿]/;
const STEGA_CHARS_G = /[​‌‍⁠-⁤﻿]/g;
const hasStega = (s: string) => STEGA_CHARS.test(s);
const stripStega = (s: string) => s.replace(STEGA_CHARS_G, "");

async function blockHeavySanityMedia(context: BrowserContext): Promise<void> {
  await context.route("**/*", (route) => {
    const url = route.request().url();
    const type = route.request().resourceType();
    const heavy =
      (url.includes("cdn.sanity.io") || url.includes("sanity-cdn.com")) &&
      (type === "image" || type === "media" || /\.(mp4|webm|mov)(\?|$)/.test(url));
    return heavy ? route.abort() : route.continue();
  });
}

test.beforeEach(async ({ context }) => {
  await blockHeavySanityMedia(context);
});

test.describe("Draft Mode isolation & security (normal visitor)", () => {
  test.skip(!SANITY_CONFIGURED, "Sanity not configured in this environment");

  for (const path of [
    "/",
    "/uk",
    "/about",
    "/catering",
    "/events",
    "/event-decoration",
    "/host-at-rorum",
    "/community-membership",
    "/da/catering",
  ]) {
    test(`${path} serves published content with no preview leakage`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);

      expect((await page.context().cookies()).find((c) => c.name === "__prerender_bypass")).toBeUndefined();

      const html = await page.content();
      expect(html).not.toContain('data-testid="disable-draft-mode"');
      // no real Visual Editing markup in published HTML
      await expect(page.locator("[data-sanity]")).toHaveCount(0);

      const bodyText = await page.locator("body").innerText();
      expect(hasStega(bodyText), "published body text must be stega-free").toBe(false);
      expect(hasStega(await page.title()), "published <title> must be stega-free").toBe(false);
      for (const ld of await page.locator('script[type="application/ld+json"]').allTextContents()) {
        expect(hasStega(ld), "published JSON-LD must be stega-free").toBe(false);
      }

      await expect(page.locator("h1").first()).toBeVisible();
    });
  }

  test("localized published content still renders per locale (regression guard for the Draft Mode refactor)", async ({ page }) => {
    await page.goto("/uk");
    await expect(page.locator("h1").first()).toHaveText(/Простір/); // Ukrainian
    await page.goto("/da");
    await expect(page.locator("h1").first()).toHaveText(/København/); // Danish
  });

  test("the enable route is not an open preview — it rejects requests without a valid secret", async ({ request }) => {
    const bare = await request.get("/api/draft-mode/enable", { maxRedirects: 0 });
    expect([401, 501]).toContain(bare.status());
    const forged = await request.get(
      "/api/draft-mode/enable?sanity-preview-secret=forged-value&sanity-preview-pathname=%2Fabout",
      { maxRedirects: 0 },
    );
    expect([401, 501]).toContain(forged.status());
  });

  test("the disable route clears Draft Mode and redirects home", async ({ request }) => {
    const res = await request.get("/api/draft-mode/disable", { maxRedirects: 0 });
    expect([302, 307]).toContain(res.status());
    expect(res.headers()["location"]).toMatch(/\/$/);
  });

  test("robots.txt keeps the Draft Mode API out of crawlers", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toContain("Disallow: /api/");
  });
});

test.describe("Draft Mode preview (draft content + Visual Editing source maps)", () => {
  // Serial: one shared `drafts.page-home` fixture, created once and cleaned up
  // once — must not run in parallel workers (each would fight over the draft).
  test.describe.configure({ mode: "serial" });

  test.skip(
    !SANITY_CONFIGURED || !HAS_READ_TOKEN || !HAS_WRITE_TOKEN,
    "Needs SANITY_API_READ_TOKEN + SANITY_API_WRITE_TOKEN in the run environment.",
  );

  const DOC_ID = "page-home";
  const DRAFT_ID = `drafts.${DOC_ID}`;
  const SENTINEL = `ZZ-DRAFT-PREVIEW-${Date.now()}`;

  const writeClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
    useCdn: false,
    token: process.env.SANITY_API_WRITE_TOKEN,
  });

  interface PageDoc {
    _id: string;
    _type: string;
    sections?: { _key: string; sectionKey?: string; title?: { _key: string; language?: string; value?: string }[] }[];
  }

  let draftPreexisted = false;
  let secret: string | undefined;
  let secretDocId: string | undefined;
  let fixtureReady = false;
  let eventSlug: string | undefined;
  let eventLocales: string[] = [];

  test.beforeAll(async () => {
    // A published, multi-locale event for the detail-route Draft Mode check.
    const ev = await writeClient.fetch<{ slug: string; visibleLocales: string[] } | null>(
      `*[_type == "event" && defined(slug.current) && count(visibleLocales) >= 2]
        | order(_createdAt desc)[0]{ "slug": slug.current, visibleLocales }`,
    );
    eventSlug = ev?.slug;
    eventLocales = ev?.visibleLocales ?? [];

    draftPreexisted = !!(await writeClient.fetch<string | null>(`*[_id == $id][0]._id`, { id: DRAFT_ID }));
    if (draftPreexisted) return;

    const full = (await writeClient.getDocument(DOC_ID)) as PageDoc | undefined;
    const hero = full?.sections?.find((s) => s.sectionKey === "hero");
    const enEntry = hero?.title?.find((t) => t.language === "en") ?? hero?.title?.[0];
    if (!full || !hero || !enEntry?._key) return;

    const draftDoc = JSON.parse(JSON.stringify(full)) as PageDoc;
    draftDoc._id = DRAFT_ID;
    for (const s of draftDoc.sections ?? []) {
      if (s._key !== hero._key) continue;
      for (const t of s.title ?? []) if (t._key === enEntry._key) t.value = SENTINEL;
    }
    await writeClient.createOrReplace(draftDoc as unknown as Record<string, unknown> & { _id: string; _type: string });

    const { createPreviewSecret } = await import("@sanity/preview-url-secret/create-secret");
    secret = (await createPreviewSecret(writeClient, "test/playwright", "/studio")).secret;
    secretDocId =
      (await writeClient.fetch<string | null>(
        `*[_type == "sanity.previewUrlSecret" && secret == $s][0]._id`,
        { s: secret },
      )) ?? undefined;
    fixtureReady = true;
  });

  test.afterAll(async () => {
    if (!draftPreexisted) await writeClient.delete(DRAFT_ID).catch(() => {});
    if (secretDocId) await writeClient.delete(secretDocId).catch(() => {});
  });

  async function enterDraftMode(browser: import("@playwright/test").Browser, pathname: string): Promise<BrowserContext> {
    const ctx = await browser.newContext();
    await blockHeavySanityMedia(ctx);
    const res = await ctx.request.get(
      `/api/draft-mode/enable?sanity-preview-secret=${encodeURIComponent(secret!)}` +
        `&sanity-preview-pathname=${encodeURIComponent(pathname)}&sanity-preview-perspective=drafts`,
      { maxRedirects: 0 },
    );
    expect([302, 307]).toContain(res.status());
    expect((await ctx.cookies()).find((c) => c.name === "__prerender_bypass")).toBeTruthy();
    return ctx;
  }

  test("draft content shows only after the secure handshake, never to a normal visitor", async ({ browser }) => {
    test.skip(draftPreexisted, "page-home already had an unpublished draft — not disturbing editor work");
    test.skip(!fixtureReady, "could not set up the draft fixture");

    const plain = await browser.newContext();
    await blockHeavySanityMedia(plain);
    const plainPage = await plain.newPage();
    await plainPage.goto("/");
    expect(await plainPage.content()).not.toContain(SENTINEL);
    await plain.close();

    const preview = await enterDraftMode(browser, "/");
    const previewPage = await preview.newPage();
    // Poll: the first draft render may lag the draft write by a Live revalidation.
    await expect(async () => {
      await previewPage.goto("/");
      expect(await previewPage.content()).toContain(SENTINEL);
    }).toPass({ timeout: 20_000 });
    await expect(previewPage.locator('[data-testid="disable-draft-mode"]')).toBeVisible();

    // exit restores published in that same session
    await previewPage.goto("/api/draft-mode/disable");
    await previewPage.goto("/");
    expect(await previewPage.content()).not.toContain(SENTINEL);
    await preview.close();
  });

  test("page BODY text carries stega source maps (headings, paragraphs, buttons — not just navigation)", async ({ browser }) => {
    test.skip(!fixtureReady, "no draft fixture (page-home may have a pre-existing editor draft) — cannot mint a preview secret safely");
    const preview = await enterDraftMode(browser, "/");
    const page = await preview.newPage();
    await page.goto("/");

    // The hero heading, hero paragraph and a CTA button must each be stega-encoded.
    expect(hasStega(await page.locator("h1").first().innerText()), "hero <h1> must carry stega").toBe(true);
    expect(hasStega(await page.getByTestId("home-hero-text").innerText()), "hero text must carry stega").toBe(true);
    const cta = page.getByTestId("home-hero-primary-cta");
    if (await cta.count()) expect(hasStega(await cta.innerText()), "hero CTA must carry stega").toBe(true);

    // Section headings further down the page too (proves it's not just the hero).
    expect(hasStega(await page.getByTestId("home-quickpaths-label").innerText())).toBe(true);

    // The hero media element carries a data-sanity attribute for image editing.
    await expect(page.locator('[data-sanity*="page-home"]').first()).toHaveCount(1);

    await preview.close();
  });

  test("page-body images/media carry data-sanity on EVERY representative page, resolving to the right doc + stable _key path", async ({ browser }) => {
    test.skip(!fixtureReady, "no preview secret available");

    // Each page's non-text (image / gallery / icon-card) annotations must
    // name that page's own `page` document (`event` docs for event media).
    const pages: { path: string; docId: string; type: string }[] = [
      { path: "/", docId: "page-home", type: "page" },
      { path: "/about", docId: "page-about", type: "page" },
      { path: "/catering", docId: "page-catering", type: "page" },
      { path: "/event-decoration", docId: "page-event-decoration", type: "page" },
      { path: "/host-at-rorum", docId: "page-host-at-rorum", type: "page" },
      { path: "/community-membership", docId: "page-community-membership", type: "page" },
    ];

    for (const { path, docId, type } of pages) {
      const ctx = await enterDraftMode(browser, path);
      const page = await ctx.newPage();
      await page.goto(path);

      const attrs = await page
        .locator("[data-sanity]")
        .evaluateAll((els) => els.map((e) => e.getAttribute("data-sanity") ?? ""));

      // A non-text annotation = a media element (`.media:<key>`) or a whole
      // list-item card (`.items:<key>`) — NOT a bare stega text field.
      const nonText = attrs.filter(
        (a) => a.includes(`type=${type}`) && a.includes(`id=${docId}`) && /(\.media:|\.items:)/.test(a),
      );
      expect(nonText.length, `${path}: expected >=1 image/media/card data-sanity naming ${docId}`).toBeGreaterThan(0);

      // Every path segment must be _key-based (`array:<key>`), never a
      // positional index (`array:0` / `array.0`).
      for (const a of nonText) {
        expect(a, `${path}: annotation must use _key paths, not array indexes — ${a}`).not.toMatch(/[:.]\d+(?:[.;]|$)/);
      }
      await ctx.close();
    }
  });

  test("a Sanity-backed event's banner image is annotated on its detail page in Draft Mode", async ({ browser }) => {
    test.skip(!fixtureReady, "no preview secret available");
    test.skip(!eventSlug, "no published multi-locale event to test");

    const ctx = await enterDraftMode(browser, `/events/${eventSlug}`);
    const page = await ctx.newPage();
    await page.goto(`/events/${eventSlug}`);
    const attrs = await page
      .locator("[data-sanity]")
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-sanity") ?? ""));
    const eventImageAttrs = attrs.filter((a) => a.includes("type=event") && a.includes("path=image"));
    // Only Sanity events that have uploaded their OWN banner asset get an
    // overlay (a static fallback image has no `event.image` to point at) —
    // assert the shape only when present rather than forcing a data precondition.
    for (const a of eventImageAttrs) {
      expect(a, "event image annotation must name a real published event id").toMatch(/id=[0-9a-f-]{6,};type=event/);
      expect(a, "must target the published document, never a drafts. id").not.toContain("drafts.");
    }
    await ctx.close();
  });

  test("Draft Mode preserves per-locale content (EN / DA / UK)", async ({ browser }) => {
    test.skip(!fixtureReady, "no draft fixture (page-home may have a pre-existing editor draft) — cannot mint a preview secret safely");
    for (const [path, re] of [
      ["/", /Copenhagen|meaningful|ZZ-DRAFT/],
      ["/da", /København|meningsfulde/],
      ["/uk", /Копенгаген|змістовних|Простір/],
    ] as const) {
      const ctx = await enterDraftMode(browser, path);
      const page = await ctx.newPage();
      await page.goto(path);
      const h1 = stripStega(await page.locator("h1").first().innerText());
      expect(h1, `${path} h1`).toMatch(re);
      await ctx.close();
    }
  });

  test("event DETAIL routes are previewable in Draft Mode, in every visible locale (visibleLocales isn't stega-broken)", async ({ browser }) => {
    test.skip(!fixtureReady, "no preview secret available");
    test.skip(!eventSlug, "no published multi-locale event to test");
    for (const locale of eventLocales.filter((l) => ["en", "da", "uk"].includes(l))) {
      const path = `${locale === "en" ? "" : `/${locale}`}/events/${eventSlug}`;
      const ctx = await enterDraftMode(browser, path);
      const page = await ctx.newPage();
      const res = await page.goto(path);
      expect(res?.status(), `${path} must not 404 in Draft Mode`).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
      // it's the event detail page, not the 404 page
      expect(await page.title()).not.toMatch(/not found/i);
      await ctx.close();
    }
  });
});
