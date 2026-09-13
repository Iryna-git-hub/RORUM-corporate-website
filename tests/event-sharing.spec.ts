import { expect, test } from "@playwright/test";

const EVENT_SLUG = "community-reset-night";
const SOCIAL_IMAGE_ASSET = "8190a2ea174619553f3bf1bb2b497b879ce7f5f8";
const SOCIAL_IMAGE_URL =
  `https://cdn.sanity.io/images/939cqwfo/production/${SOCIAL_IMAGE_ASSET}-1448x1086.png` +
  "?rect=0,163,1448,760&w=1200&h=630&fit=crop&auto=format";
const testOrigin = process.env.EVENT_SHARING_TEST_ORIGIN?.replace(/\/$/, "") ?? "";
// The webServer (see playwright.config.ts) is a real `next build && next
// start`, which loads .env.local itself — so the canonical/OG `url` this
// server actually emits is built from THAT run's NEXT_PUBLIC_SITE_URL, not
// a hardcoded domain. playwright.config.ts also loads .env.local into this
// test-runner process, so the same value is available here to build the
// expected string.
const configuredSiteOrigin = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

const cases = [
  {
    locale: "en",
    route: `/events/${EVENT_SLUG}`,
    title: "Community reset night | RORUM",
    description:
      "Community reset night brings people together around a simple hosted format with thoughtful pacing, a calm room setup and space for useful conversation.",
  },
  {
    locale: "da",
    route: `/da/events/${EVENT_SLUG}`,
    title: "Fællesskabets resetaften | RORUM",
    description:
      "Fællesskabets resetaften samler mennesker om et enkelt værtsformat med gennemtænkt tempo, en rolig rumindretning og plads til nyttig samtale.",
  },
  {
    locale: "uk",
    route: `/uk/events/${EVENT_SLUG}`,
    title: "Вечір перезавантаження спільноти | RORUM",
    description:
      "Вечір перезавантаження спільноти об'єднує людей у простому організованому форматі з продуманим темпом, спокійним облаштуванням простору та місцем для змістовних розмов.",
  },
] as const;

test.describe("Community Reset Night share metadata", () => {
  test("the explicit social image is publicly accessible to an anonymous crawler", async ({ request }) => {
    const response = await request.head(SOCIAL_IMAGE_URL);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
  });

  for (const eventCase of cases) {
    test(`${eventCase.locale} emits localized crawler metadata and the explicit Sanity social image`, async ({ page }) => {
      await page.route("**/*", async (route) => {
        const request = route.request();
        if (request.resourceType() === "image" || request.resourceType() === "media") {
          await route.abort();
        } else {
          await route.continue();
        }
      });

      const response = await page.goto(`${testOrigin}${eventCase.route}`);
      expect(response?.status()).toBe(200);

      const canonicalUrl = `${configuredSiteOrigin}${eventCase.route}`;
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", eventCase.title);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", eventCase.description);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonicalUrl);
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
      await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
      await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "630");

      const imageUrl = await page.locator('meta[property="og:image"]').getAttribute("content");
      expect(imageUrl).toContain(`cdn.sanity.io/images/939cqwfo/production/${SOCIAL_IMAGE_ASSET}`);
      expect(imageUrl).toContain("w=1200");
      expect(imageUrl).toContain("h=630");

      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
      await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", eventCase.title);
      await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute("content", eventCase.description);
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", imageUrl!);

      // The event detail page's JSON-LD <script type="application/ld+json">
      // (@type "Event") used to independently re-derive `description` and
      // `image` instead of reusing the same `resolveEventShareData()` result
      // OG/Twitter above are built from — which let it show a DIFFERENT
      // image/description than the rest of the page's social metadata for
      // the same event. This asserts the fix actually reaches rendered
      // HTML: JSON-LD's description/image now match OG's exactly, and its
      // `url` carries this locale's own prefix and this event's slug.
      const jsonLdBlocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      const eventJsonLd = jsonLdBlocks.map((block) => JSON.parse(block)).find((doc) => doc["@type"] === "Event");
      expect(eventJsonLd).toBeTruthy();
      expect(eventJsonLd.description).toBe(eventCase.description);
      expect(eventJsonLd.image).toBe(imageUrl);
      expect(eventJsonLd.name).toBe(eventCase.title.replace(/ \| RORUM$/, ""));
      // JSON-LD's `url` now reuses the same resolved `shareData.url` as
      // `og:url`/canonical (lib/structuredData.ts's `eventJsonLd` call
      // site), so it must carry this locale's own prefix (e.g. `/da/`,
      // `/uk/`) and match `og:url` exactly — not just contain the slug.
      expect(eventJsonLd.url).toBe(canonicalUrl);
    });
  }
});
