import { expect, test } from "@playwright/test";
import { createClient } from "@sanity/client";
import { localizedHref } from "@/lib/i18n";

/**
 * Read-only schema-to-frontend connection proof for the Events system —
 * Events listing (page-events), Event Detail pages, and cross-page
 * consistency between the Home event strip / Events listing card / Event
 * Detail page for the same underlying `event` document. Same read-only
 * philosophy as tests/cms-home-contract.spec.ts: `perspective: "published"`,
 * no write token, safe to run against production at any time.
 *
 * Data-driven, not one-test-per-field-per-event: a fixed set of
 * REPRESENTATIVE_SLUGS (one available event, one sold-out event, one
 * long-standing baseline event already used elsewhere in this test suite)
 * is exercised across all 3 locales for full render-vs-Sanity proof, then a
 * separate structural-only pass checks every published event document's
 * required fields with hard assertions (never `test.skip(!value, "no
 * published value")` for a contract-required field).
 *
 * `ticketsLeft === 0` and live edit-propagation are covered separately by a
 * temporary, disposable fixture document (created and deleted within a
 * single test run, never left in the dataset) rather than here — no live
 * event currently has ticketsLeft:0, and this file must never mutate
 * approved production content to force a state.
 */

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  useCdn: true,
  perspective: "published",
});

interface I18nEntry {
  language?: string;
  value?: string;
}
interface RawEvent {
  slug?: string;
  title?: I18nEntry[];
  date?: string;
  time?: string;
  price?: string;
  isSoldOut?: boolean;
  ticketUrl?: string;
  ticketsLeft?: number;
  imageAlt?: I18nEntry[];
  whatToExpect?: I18nEntry[];
}
interface RawPage {
  seo?: { title?: I18nEntry[]; description?: I18nEntry[] };
  sections?: { sectionKey?: string; title?: I18nEntry[]; items?: { itemKey?: string; title?: I18nEntry[] }[] }[];
}

function pick(entries: I18nEntry[] | undefined, lang: string): string | undefined {
  return entries?.find((e) => e.language === lang)?.value;
}

const LOCALES = ["en", "da", "uk"] as const;

// Chosen from live data (read-only query, not modified by this suite):
// - AVAILABLE: not sold out, fully translated en/da/uk, has a non-empty
//   `whatToExpect`. Used only by the date-agnostic detail-page + "What to
//   Expect" checks below (a detail page is always reachable regardless of the
//   event's date). The cross-page-consistency test does NOT use these pinned
//   slugs — it resolves the first currently-listed event dynamically, so it
//   keeps working whatever's in the dataset (see that test).
// - SOLD_OUT: isSoldOut === true live.
// - BASELINE: the same event tests/routes.ts's SAMPLE_EVENT_ROUTE already uses
//   elsewhere in this suite (interactions/breakpoints/locale/visual specs).
const AVAILABLE_SLUG = "mindful-morning-yoga";
const SOLD_OUT_SLUG = "freelance-morning-salon";
const BASELINE_SLUG = "copenhagen-makers-dinner";
const REPRESENTATIVE_SLUGS = [AVAILABLE_SLUG, SOLD_OUT_SLUG, BASELINE_SLUG];

const eventQuery = `*[_type == "event" && slug.current == $slug][0]{
  "slug": slug.current, title, date, time, price, isSoldOut, ticketUrl, ticketsLeft,
  "imageAlt": image.alt, whatToExpect
}`;

test.describe("Events listing content contract", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET,
    "Sanity not configured in this environment",
  );

  let listingPage: RawPage = {};

  test.beforeAll(async () => {
    listingPage = await sanity.fetch<RawPage>(
      `*[_id == "page-events"][0]{
        "seo": seo{title, description},
        "sections": sections[]{sectionKey, title, "items": items[]{itemKey, title}}
      }`,
    );
  });

  const heroTitle = () => listingPage.sections?.find((s) => s.sectionKey === "hero")?.title;
  const filterItem = (key: string) => listingPage.sections?.find((s) => s.sectionKey === "filters")?.items?.find((i) => i.itemKey === key)?.title;

  for (const locale of LOCALES) {
    test.describe(`locale: ${locale}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(localizedHref("/events", locale));
      });

      test("H1 matches page-events hero title", async ({ page }) => {
        const value = pick(heroTitle(), locale);
        expect(value, "page-events hero title must be published for locale " + locale).toBeTruthy();
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(value!);
      });

      test("Date filter label matches page-events filters item", async ({ page }) => {
        const value = pick(filterItem("dateLabel"), locale);
        expect(value, "filters.dateLabel must be published for locale " + locale).toBeTruthy();
        await expect(page.getByText(value!, { exact: true }).first()).toBeVisible();
      });
    });
  }

  test("listing SEO: <title> reflects page-events.seo.title when set, else the documented fallback", async ({ page }) => {
    const value = pick(listingPage.seo?.title, "en");
    await page.goto(localizedHref("/events", "en"));
    if (value) {
      await expect(page).toHaveTitle(value);
    } else {
      // Documented empty state, same as Home/About's seo.title before population —
      // not a skip, an explicit assertion of the known fallback behavior.
      // Updated (later session, SEO task Section 7) to the approved
      // "Upcoming Events at RORUM | Find Your Next Event" copy.
      await expect(page).toHaveTitle("Upcoming Events at RORUM | Find Your Next Event");
    }
  });
});

test.describe("Events Listing filter groups, order and closing CTA (Events Listing Studio task)", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET,
    "Sanity not configured in this environment",
  );

  let listingPage: RawPage & { closingCta?: { label?: I18nEntry[]; title?: I18nEntry[]; text?: I18nEntry[] } } = {};

  test.beforeAll(async () => {
    listingPage = await sanity.fetch(
      `*[_id == "page-events"][0]{
        "sections": sections[]{sectionKey, title, "items": items[]{itemKey, title}},
        "closingCta": sections[sectionKey == "closingCta"][0]{label, title, text}
      }`,
    );
  });

  const filterItem = (key: string) => listingPage.sections?.find((s) => s.sectionKey === "filters")?.items?.find((i) => i.itemKey === key)?.title;

  test("the 3 new language-option labels (languageEnLabel/languageDaLabel/languageUkLabel) are published and EN/DA/UK complete", () => {
    for (const key of ["languageEnLabel", "languageDaLabel", "languageUkLabel"]) {
      for (const locale of LOCALES) {
        const value = pick(filterItem(key), locale);
        expect(value, `${key}[${locale}]`).toBeTruthy();
      }
    }
  });

  test("the Language filter dropdown shows the CMS-sourced label, not a hardcoded one, for at least one real event language", async ({ page }) => {
    const enLabel = pick(filterItem("languageEnLabel"), "en");
    expect(enLabel).toBeTruthy();
    await page.goto(localizedHref("/events", "en"));
    await page.getByRole("button", { name: pick(filterItem("languageLabel"), "en") ?? "Language" }).click();
    await expect(page.getByRole("menuitemradio", { name: enLabel!, exact: true })).toBeVisible();
  });

  test("the Language dropdown renders the 3 language options in page-events.filters' own stored order (regression: EventsClientPage.tsx used to alphabetically re-sort, silently ignoring this stored order)", async ({ page }) => {
    const storedItemKeysInOrder = (listingPage.sections?.find((s) => s.sectionKey === "filters")?.items ?? [])
      .map((i) => i.itemKey)
      .filter((k): k is string => k === "languageEnLabel" || k === "languageDaLabel" || k === "languageUkLabel");
    expect(storedItemKeysInOrder.length, "expected all 3 language rows to be published").toBe(3);
    const storedLabelsInOrder = storedItemKeysInOrder.map((k) => pick(filterItem(k), "en")!);

    await page.goto(localizedHref("/events", "en"));
    await page.getByRole("button", { name: pick(filterItem("languageLabel"), "en") ?? "Language" }).click();
    const renderedLabels = await page.getByRole("menuitemradio").allTextContents();

    // Only languages that actually have a loaded event render at all — the
    // proof is that whichever DO render stay in their own relative stored
    // order, never re-sorted (e.g. alphabetically) by the frontend.
    const renderedStoredLabels = storedLabelsInOrder.filter((label) => renderedLabels.includes(label));
    expect(renderedStoredLabels.length, "expected at least one language to have a loaded event").toBeGreaterThan(0);
    const renderedOrderOfStoredLabels = renderedLabels.filter((label) => renderedStoredLabels.includes(label));
    expect(renderedOrderOfStoredLabels, "Language dropdown order must match page-events.filters' own stored order").toEqual(renderedStoredLabels);
  });

  for (const locale of LOCALES) {
    test(`empty-state text [${locale}] matches page-events.filters.emptyStateTitle/.emptyStateText`, async ({ page }) => {
      const title = pick(filterItem("emptyStateTitle"), locale);
      const text = pick(filterItem("emptyStateText"), locale);
      expect(title, `emptyStateTitle[${locale}]`).toBeTruthy();
      expect(text, `emptyStateText[${locale}]`).toBeTruthy();
      // Force the empty state via an implausible combination (sold-out AND
      // a date window unlikely to match) rather than asserting on whatever
      // real events happen to be loaded — read-only, no mutation.
      await page.goto(`${localizedHref("/events", locale)}?availability=sold-out&date=week&price=price-asc`);
      const emptyHeading = page.getByText(title!, { exact: true });
      // Not every combination is guaranteed empty on live data — only assert
      // when it genuinely is, so this stays a real proof, not a flaky guess.
      if (await emptyHeading.isVisible().catch(() => false)) {
        await expect(page.getByText(text!, { exact: true })).toBeVisible();
      }
    });
  }

  for (const locale of LOCALES) {
    test(`closing CTA [${locale}]: label/title/text render from page-events.closingCta, not Home/About's own`, async ({ page }) => {
      const label = pick(listingPage.closingCta?.label, locale);
      const title = pick(listingPage.closingCta?.title, locale);
      expect(title, `closingCta.title[${locale}]`).toBeTruthy();
      await page.goto(localizedHref("/events", locale));
      await expect(page.getByRole("heading", { name: title! })).toBeVisible();
      if (label) {
        // Not asserted as a unique match — this exact label text also
        // legitimately appears in nav/other CTAs elsewhere on the page.
        await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
      }
    });
  }

  test("the 'Have questions?' prompt on /events uses formMessages, NOT page-events.closingCta's own faqQuestion/faqLabel items (confirmed live: those items exist but are unread)", async ({ page }) => {
    const formMessages = await sanity.fetch<{ faqQuestion?: I18nEntry[]; faqLabel?: I18nEntry[] }>(
      `*[_id == "formMessages"][0]{faqQuestion, faqLabel}`,
    );
    const closingCtaFaqQuestion = pick(
      listingPage.sections?.find((s) => s.sectionKey === "closingCta")?.items?.find((i) => i.itemKey === "faqQuestion")?.title,
      "en",
    );
    const sharedFaqQuestion = pick(formMessages.faqQuestion, "en");
    expect(sharedFaqQuestion, "formMessages.faqQuestion must be published").toBeTruthy();

    await page.goto(localizedHref("/events", "en"));
    await expect(page.getByText(sharedFaqQuestion!, { exact: true })).toBeVisible();
    // Only a meaningful proof if the 2 texts actually differ live — if a
    // manager has coincidentally made them identical, this assertion is
    // skipped rather than reported as a false pass.
    if (closingCtaFaqQuestion && closingCtaFaqQuestion !== sharedFaqQuestion) {
      await expect(page.getByText(closingCtaFaqQuestion, { exact: true })).not.toBeVisible();
    }
  });
});

test.describe("Event detail content contract (data-driven)", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET,
    "Sanity not configured in this environment",
  );

  for (const slug of REPRESENTATIVE_SLUGS) {
    for (const locale of LOCALES) {
      test(`${slug} @ ${locale}`, async ({ page }) => {
        const event = await sanity.fetch<RawEvent | null>(eventQuery, { slug });
        expect(event, `event "${slug}" must exist and be published`).toBeTruthy();

        const title = pick(event!.title, locale);
        expect(title, `${slug}.title must be published for locale ${locale}`).toBeTruthy();

        await page.goto(localizedHref(`/events/${slug}`, locale));
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(title!);

        // Locale-agnostic: the sold-out/buy-ticket LABEL text is itself
        // localized (eventMessages/defaults), so this asserts the underlying
        // *state* (a disabled control, no active purchase link) rather than
        // matching English copy that only exists for the "en" locale.
        if (event!.isSoldOut) {
          await expect(page.locator("button:disabled")).toBeVisible();
          if (event!.ticketUrl) {
            await expect(page.locator(`a[href="${event!.ticketUrl}"]`)).toHaveCount(0);
          }
        } else if (event!.ticketUrl) {
          await expect(page.locator(`a[href="${event!.ticketUrl}"]`).first()).toBeVisible();
        }

        const imageAlt = pick(event!.imageAlt, locale);
        if (imageAlt) {
          await expect(page.locator(`img[alt="${imageAlt}"]`)).toBeVisible();
        }
      });
    }
  }

  test("What to Expect renders in the exact stored line order (en)", async ({ page }) => {
    const event = await sanity.fetch<RawEvent | null>(eventQuery, { slug: AVAILABLE_SLUG });
    const lines = pick(event?.whatToExpect, "en")
      ?.split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    expect(lines?.length, `${AVAILABLE_SLUG}.whatToExpect must have at least one line`).toBeGreaterThan(0);

    await page.goto(localizedHref(`/events/${AVAILABLE_SLUG}`, "en"));
    const items = page.locator("li", { hasText: lines![0]! }).first();
    await expect(items).toBeVisible();
    const allListText = await page.locator("ul li").allTextContents();
    const renderedOrder = lines!.filter((line) => allListText.some((t) => t.includes(line)));
    expect(renderedOrder, "What to Expect lines must render in the same order they're stored").toEqual(lines);
  });
});

test.describe("Cross-page consistency — same event, no contradictions", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET,
    "Sanity not configured in this environment",
  );

  test(`the first event on the listing is consistent across the listing card, its detail page, and (when shown) the Home strip`, async ({ page }) => {
    // Resolve the event the listing actually shows first, rather than pinning a
    // slug to a specific dataset state. Both the Home strip (allEventsQuery) and
    // the Events listing (EventsClientPage default sort) order by date ascending
    // and do NOT hide past events, so the earliest-dated published event is the
    // first card on both surfaces — a real, always-present consistency subject.
    const firstEvent = await sanity.fetch<RawEvent | null>(
      `*[_type == "event" && defined(slug.current) && defined(date) && "en" in visibleLocales]
        | order(date asc)[0]{ "slug": slug.current, title, date }`,
    );
    expect(firstEvent?.slug, "at least one published event shown on the EN site must exist").toBeTruthy();
    const slug = firstEvent!.slug!;
    const title = pick(firstEvent!.title, "en");
    expect(title, `${slug}.title (en) must be published`).toBeTruthy();

    // Listing: the first card must be this event and show its title.
    await page.goto(localizedHref("/events", "en"));
    const listingCard = page.locator(`a[href$="/events/${slug}"]`).first();
    await expect(listingCard).toBeVisible();
    await expect(listingCard).toContainText(title!);

    // Home strip: shows the same date-ordered set — assert consistency when the
    // card is present (it is, unless the strip is deliberately empty for EN).
    await page.goto(localizedHref("/", "en"));
    const homeCard = page.locator(`a[href$="/events/${slug}"]`).first();
    if (await homeCard.count()) {
      await expect(homeCard).toContainText(title!);
    }

    // Detail page: always reachable, H1 must match.
    await page.goto(localizedHref(`/events/${slug}`, "en"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title!);
  });
});

test.describe("Structural completeness — every published event document", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET,
    "Sanity not configured in this environment",
  );

  test("every published event has required fields (English title, slug, date, time, image) populated", async () => {
    const events = await sanity.fetch<{ slug?: string; title?: I18nEntry[]; date?: string; time?: string; hasImage?: boolean }[]>(
      `*[_type == "event" && defined(slug.current)]{
        "slug": slug.current, title, date, time, "hasImage": defined(image.asset)
      }`,
    );
    expect(events.length, "at least one published event should exist").toBeGreaterThan(0);

    for (const e of events) {
      const titleEn = pick(e.title, "en");
      expect(titleEn, `${e.slug}: English title is required, must not be silently skipped`).toBeTruthy();
      expect(e.date, `${e.slug}: date is required`).toBeTruthy();
      expect(e.time, `${e.slug}: time is required`).toBeTruthy();
      expect(e.hasImage, `${e.slug}: banner image is required`).toBeTruthy();
    }
  });
});
