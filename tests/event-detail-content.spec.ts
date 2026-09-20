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
const INFO_WIDTHS = [375, 590, 768, 900, 1024, 1100, 1279, 1280, 1440] as const;

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

test.describe("Event info responsive grid", () => {
  for (const locale of LOCALES) {
    test(`${locale} keeps its intended placement through mobile, tablet and desktop`, async ({ page, context }) => {
      await openEvent(page, context, locale, 1440);
      const widths = [...new Set([...INFO_WIDTHS, ...Array.from({ length: 33 }, (_, index) => 768 + index * 16), 767, 769, 1023, 1025, 1278, 1281])].sort((a, b) => a - b);

      for (const width of widths) {
        await page.setViewportSize({ width, height: 1000 });
        const layout = await page.locator(".event-facts-grid").evaluate((grid) => {
          const rect = (element: Element) => {
            const { x, y, width, height } = element.getBoundingClientRect();
            return { x, y, width, height };
          };
          const items = Array.from(grid.children).map(rect);
          const ticket = grid.querySelector(".event-ticket-item a, .event-ticket-item button")!;
          return { card: rect(grid), items, button: rect(ticket), overflow: grid.scrollWidth > grid.clientWidth + 1 };
        });
        const [date, time, location, price, cta] = layout.items;
        const near = (a: number, b: number) => Math.abs(a - b) <= 2;
        expect(layout.overflow, `${locale} at ${width}px: card overflow`).toBe(false);
        expect(layout.items.every((item) => item.x >= layout.card.x - 1 && item.x + item.width <= layout.card.x + layout.card.width + 1), `${locale} at ${width}px: item outside card`).toBe(true);
        expect(layout.button.x >= cta.x && layout.button.x + layout.button.width <= cta.x + cta.width + 1, `${locale} at ${width}px: CTA outside cell`).toBe(true);

        if (width < 768) {
          expect(date.y < time.y && time.y < location.y && location.y < price.y && price.y < cta.y, `${locale} at ${width}px: mobile order`).toBe(true);
          expect(layout.button.width, `${locale} at ${width}px: mobile CTA width`).toBeGreaterThan(cta.width - 30);
        } else if (width < 1280) {
          expect(near(date.y, time.y) && near(location.y, price.y) && location.y >= date.y + date.height - 1, `${locale} at ${width}px: 2×2 facts`).toBe(true);
          expect(near(date.x, location.x) && near(time.x, price.x) && cta.x >= time.x + time.width - 1, `${locale} at ${width}px: grid columns`).toBe(true);
          expect(near(cta.y, date.y) && near(cta.y + cta.height, location.y + location.height), `${locale} at ${width}px: CTA spans both rows`).toBe(true);
        } else {
          expect(layout.items.every((item) => near(item.y, date.y)), `${locale} at ${width}px: single row`).toBe(true);
          expect(date.x < time.x && time.x < location.x && location.x < price.x && price.x < cta.x, `${locale} at ${width}px: desktop order`).toBe(true);
        }
      }
    });
  }
});

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
