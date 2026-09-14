import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { localizedHref, type Locale } from "@/lib/i18n";
import { gotoAndStabilize } from "./support";

const LOCALES: Locale[] = ["en", "da", "uk"];
const WIDTHS = [390, 768, 1024, 1440] as const;
const EVENT_PATH = "/events/copenhagen-makers-dinner";
const LONG_ADDRESS_LINE =
  "Ukraine House in Denmark with an intentionally very long venue name, Strandgade 27B,";
const LONG_ADDRESS_CITY = "1401 Copenhagen";
const TRANSPARENT_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");

async function blockHeavyMedia(context: BrowserContext): Promise<void> {
  await context.route("**/*", (route) => {
    const request = route.request();
    const url = request.url();
    const isSanityMedia = url.includes("cdn.sanity.io") && ["image", "media"].includes(request.resourceType());
    if (!isSanityMedia) return route.continue();
    if (request.resourceType() === "image") {
      return route.fulfill({ status: 200, contentType: "image/gif", body: TRANSPARENT_GIF });
    }
    return route.abort();
  });
}

async function openEvent(page: Page, context: BrowserContext, locale: Locale, width: number) {
  await blockHeavyMedia(context);
  await page.setViewportSize({ width, height: 1000 });
  await gotoAndStabilize(page, localizedHref(EVENT_PATH, locale));
}

function overlaps(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

test.describe("Event detail address layout", () => {
  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      test(`${locale} @ ${width}px wraps a long address without overlapping Price or CTA`, async ({ page, context }) => {
        await openEvent(page, context, locale, width);

        const address = page.locator(".event-address-item");
        const addressValue = address.locator("dd");
        const addressLines = addressValue.locator(":scope > span > span");
        const price = page.locator(".event-price-item");
        const ticket = page.locator(".event-ticket-item");
        await expect(addressLines).toHaveCount(2);
        await addressLines.nth(0).evaluate((element, value) => {
          element.textContent = value;
        }, LONG_ADDRESS_LINE);
        await addressLines.nth(1).evaluate((element, value) => {
          element.textContent = value;
        }, LONG_ADDRESS_CITY);

        await expect(addressLines.nth(0)).toHaveText(LONG_ADDRESS_LINE);
        await expect(addressLines.nth(1)).toHaveText(LONG_ADDRESS_CITY);
        await expect(price).toBeVisible();
        await expect(ticket.locator("a, button")).toBeVisible();

        const [addressBox, priceBox, ticketBox] = await Promise.all([
          address.boundingBox(),
          price.boundingBox(),
          ticket.boundingBox(),
        ]);
        expect(addressBox).toBeTruthy();
        expect(priceBox).toBeTruthy();
        expect(ticketBox).toBeTruthy();
        expect(overlaps(addressBox!, priceBox!)).toBe(false);
        expect(overlaps(addressBox!, ticketBox!)).toBe(false);

        const addressOverflows = await address.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
        const pageOverflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
        expect(addressOverflows).toBe(false);
        expect(pageOverflows).toBe(false);
      });
    }
  }
});

test.describe("Event detail description integration", () => {
  for (const locale of LOCALES) {
    test(`${locale} renders the localized rich description through EventDescription`, async ({ page, context }) => {
      await blockHeavyMedia(context);
      await page.setViewportSize({ width: 1024, height: 900 });
      await gotoAndStabilize(page, localizedHref("/events/copenhagen-makers-dinner", locale));
      const description = page.locator(".event-description");
      await expect(description).toBeVisible();
      await expect(description.locator(":scope > p").first()).toBeVisible();
      await expect(description).not.toHaveText("");
    });
  }
});
