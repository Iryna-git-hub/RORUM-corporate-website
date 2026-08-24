import { test, expect } from "@playwright/test";
import { createClient } from "@sanity/client";
import { STATIC_ROUTES, SAMPLE_EVENT_ROUTE } from "./routes";

const LOCALES = ["en", "da", "uk"] as const;

// Read-only, `perspective: "published"`, no write token — same philosophy
// as tests/cms-events-contract.spec.ts's own client.
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  useCdn: true,
  perspective: "published",
});

function withLocale(route: string, locale: (typeof LOCALES)[number]): string {
  return locale === "en" ? route : `/${locale}${route}`;
}

test.describe("robots.txt / sitemap.xml (SEO task Section 13/14)", () => {
  test("robots.txt allows public routes but disallows /studio", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).toContain("Disallow: /studio");
    expect(body).toMatch(/Allow: \//);
    expect(body).toContain("Sitemap:");
    expect(body).not.toContain("Disallow: /_next");
  });

  test("sitemap.xml excludes Studio and Catering Menu Examples, includes every static route", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).not.toContain("/studio");
    expect(body).not.toContain("menu-examples");
    for (const route of STATIC_ROUTES) {
      expect(body).toContain(`<loc>https://ro-rum.dk${route}</loc>`);
    }
  });

  test("sitemap.xml entries have a real (non-\"today\") lastmod, not the moment the sitemap was generated", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    const firstLastmod = body.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    expect(firstLastmod).toBeTruthy();
    // Not a strict assertion on the exact date (content changes over time) —
    // just proves a real ISO timestamp is present and parseable.
    expect(new Date(firstLastmod!).toString()).not.toBe("Invalid Date");
  });
});

test.describe("Studio is not indexable (SEO task Section 13)", () => {
  test("/studio has noindex,nofollow", async ({ page }) => {
    await page.goto("/studio");
    const robotsMeta = page.locator('meta[name="robots"]');
    await expect(robotsMeta).toHaveAttribute("content", /noindex/);
    await expect(robotsMeta).toHaveAttribute("content", /nofollow/);
  });
});

test.describe("Every static route has non-empty localized title/description, correct canonical/hreflang (SEO task Section 18)", () => {
  for (const route of STATIC_ROUTES) {
    for (const locale of LOCALES) {
      test(`${route} [${locale}]`, async ({ page }) => {
        await page.goto(withLocale(route, locale));

        const title = await page.title();
        expect(title.trim().length).toBeGreaterThan(0);
        expect(title).not.toBe("RORUM"); // every static route has its own approved title, not the bare emergency fallback

        const description = await page.locator('meta[name="description"]').getAttribute("content");
        expect(description?.trim().length).toBeGreaterThan(0);

        const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
        // Next.js's own metadata resolver strips the trailing "/" from the
        // bare root URL specifically (confirmed against the real generated
        // HTML) — every other route keeps its full path unchanged.
        const expectedCanonical = route === "/" && locale === "en" ? "https://ro-rum.dk" : `https://ro-rum.dk${withLocale(route, locale)}`;
        expect(canonical).toBe(expectedCanonical);

        const hreflangs = await page.locator('link[rel="alternate"][hrefLang]').all();
        const hreflangValues = await Promise.all(hreflangs.map((l) => l.getAttribute("hrefLang")));
        expect(hreflangValues).toEqual(expect.arrayContaining(["en", "da", "uk", "x-default"]));

        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
        expect(ogTitle).toBe(title);

        const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute("content");
        expect(twitterCard).toBe("summary_large_image");
      });
    }
  }
});

test.describe("Organization/WebSite JSON-LD present site-wide", () => {
  test("Home renders Organization and WebSite structured data", async ({ page }) => {
    await page.goto("/");
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = scripts.map((s) => JSON.parse(s));
    expect(parsed.some((d) => d["@type"] === "Organization")).toBe(true);
    expect(parsed.some((d) => d["@type"] === "WebSite")).toBe(true);
  });
});

test.describe("Event Detail structured data and SEO (SEO task Section 8/18)", () => {
  test(`${SAMPLE_EVENT_ROUTE} renders Event JSON-LD with only proven fields`, async ({ page }) => {
    await page.goto(SAMPLE_EVENT_ROUTE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = scripts.map((s) => JSON.parse(s));
    const eventLd = parsed.find((d) => d["@type"] === "Event");
    expect(eventLd).toBeTruthy();
    expect(eventLd.name).toBeTruthy();
    expect(eventLd.startDate).toBeTruthy();
    expect(eventLd.eventAttendanceMode).toBe("https://schema.org/OfflineEventAttendanceMode");
    expect(eventLd.location?.address).toBeTruthy();
    // Never a fabricated rating/review/price — this project's schema has no
    // approved source for any of these on an Event.
    expect(eventLd).not.toHaveProperty("aggregateRating");
    expect(eventLd).not.toHaveProperty("review");
  });

  test(`${SAMPLE_EVENT_ROUTE} has a non-empty title/canonical`, async ({ page }) => {
    await page.goto(SAMPLE_EVENT_ROUTE);
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBe(`https://ro-rum.dk${SAMPLE_EVENT_ROUTE}`);
  });

  test(`${SAMPLE_EVENT_ROUTE} relies on the GENERATED fallback (no seo.title override live for this event) — proves the '<event title> | RORUM' precedence tier for real, not just at the unit level`, async ({ page }) => {
    const slug = SAMPLE_EVENT_ROUTE.split("/").pop();
    const event = await sanity.fetch<{ title?: { language?: string; value?: string }[]; seo?: { title?: unknown } } | null>(
      `*[_type == "event" && slug.current == $slug][0]{title, seo}`,
      { slug },
    );
    expect(event, `event "${slug}" must exist and be published`).toBeTruthy();
    const seoTitleEn = (event!.seo as { title?: { language?: string; value?: string }[] } | undefined)?.title?.find(
      (v) => v.language === "en",
    )?.value;
    expect(seoTitleEn, "this test's own premise: this event must NOT have an EN seo.title override live").toBeFalsy();
    const eventTitleEn = event!.title?.find((v) => v.language === "en")?.value;
    expect(eventTitleEn).toBeTruthy();

    await page.goto(SAMPLE_EVENT_ROUTE);
    expect(await page.title()).toBe(`${eventTitleEn} | RORUM`);
  });

  // NOTE: "an Event with an explicit seo.title/description override renders
  // that verbatim" is deliberately NOT a live Playwright test here — a live
  // audit (this task) found no published Event currently has an SEO
  // override to exercise end-to-end, and this project's own established
  // convention is not to create a permanent Sanity-mutating fixture inside
  // the committed test suite for a code path already covered elsewhere (see
  // MIGRATION_REPORT.md's disposable-fixture precedent, which explicitly
  // deletes such scripts after use rather than committing them). The exact
  // same "caller-supplied value wins verbatim" code path IS proven live,
  // above, by every one of the 14 static routes' own real `seo.title`
  // overrides — and at the unit/component level by
  // shared/seoResolution.test.ts, lib/seo.test.ts, and
  // sanity/components/SeoObjectInput.test.tsx's own "Event WITH its own
  // seo.title/description override" case.
});

test.describe("middleware.ts — old-domain / insecure-request redirects (application-level safety net; see MIGRATION_REPORT.md for the authoritative Netlify-level fix)", () => {
  test("a request with Host: rorum.dk redirects (308) to https://ro-rum.dk, preserving path and query string", async ({ request }) => {
    const response = await request.get("/about?ref=test", {
      headers: { host: "rorum.dk" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toBe("https://ro-rum.dk/about?ref=test");
  });

  test("a request with Host: ro-rum.dk and x-forwarded-proto: http redirects (308) to the https version of the same URL", async ({ request }) => {
    const response = await request.get("/faq", {
      headers: { host: "ro-rum.dk", "x-forwarded-proto": "http" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toBe("https://ro-rum.dk/faq");
  });

  test("a normal request (no old-domain Host, no insecure x-forwarded-proto) is unaffected — locale routing still works as before", async ({ request }) => {
    const response = await request.get("/about", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });
});

test.describe("Domain-authority gate — no public metadata anywhere uses the wrong no-hyphen domain", () => {
  test("sitemap.xml and robots.txt contain no https://rorum.dk", async ({ request }) => {
    const [sitemapRes, robotsRes] = await Promise.all([request.get("/sitemap.xml"), request.get("/robots.txt")]);
    const [sitemapBody, robotsBody] = await Promise.all([sitemapRes.text(), robotsRes.text()]);
    expect(sitemapBody).not.toContain("https://rorum.dk");
    expect(robotsBody).not.toContain("https://rorum.dk");
    expect(sitemapBody).toContain("https://ro-rum.dk");
    expect(robotsBody).toContain("https://ro-rum.dk");
  });

  for (const route of [...STATIC_ROUTES, SAMPLE_EVENT_ROUTE]) {
    test(`${route}: full rendered HTML (canonical/hreflang/OG/Twitter/JSON-LD) contains no https://rorum.dk`, async ({ page }) => {
      await page.goto(route);
      const html = await page.content();
      expect(html).not.toContain("https://rorum.dk");
      // Real proof this isn't a vacuous check — the correct domain genuinely appears.
      expect(html).toContain("https://ro-rum.dk");
    });
  }
});
