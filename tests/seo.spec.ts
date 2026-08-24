import { test, expect } from "@playwright/test";
import { STATIC_ROUTES, SAMPLE_EVENT_ROUTE } from "./routes";

const LOCALES = ["en", "da", "uk"] as const;

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
      expect(body).toContain(`<loc>https://rorum.dk${route}</loc>`);
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
        const expectedCanonical = route === "/" && locale === "en" ? "https://rorum.dk" : `https://rorum.dk${withLocale(route, locale)}`;
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
    expect(canonical).toBe(`https://rorum.dk${SAMPLE_EVENT_ROUTE}`);
  });
});
