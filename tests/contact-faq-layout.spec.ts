import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { localizedHref, type Locale } from "@/lib/i18n";
import { gotoAndStabilize } from "./support";

const LOCALES: Locale[] = ["en", "da", "uk"];
const WIDTHS = [390, 768, 1024, 1440] as const;
const TRANSPARENT_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");

async function blockHeavyMedia(context: BrowserContext): Promise<void> {
  await context.route("**/*", (route) => {
    const request = route.request();
    if (!request.url().includes("cdn.sanity.io")) return route.continue();
    if (request.resourceType() === "image") {
      return route.fulfill({ status: 200, contentType: "image/gif", body: TRANSPARENT_GIF });
    }
    if (request.resourceType() === "media") return route.abort();
    return route.continue();
  });
}

async function openContact(page: Page, context: BrowserContext, locale: Locale, width: number) {
  await blockHeavyMedia(context);
  await page.setViewportSize({ width, height: 1000 });
  await gotoAndStabilize(page, localizedHref("/contact", locale));
}

test.describe("Contact FAQ row placement", () => {
  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      test(`${locale} @ ${width}px keeps one FAQ row between intro and contact details`, async ({ page, context }) => {
        await openContact(page, context, locale, width);

        const contentColumn = page.locator(".contact-content-column");
        const majorBlocks = contentColumn.locator(":scope > div");
        const formColumn = page.locator(".contact-form-column");
        const faq = page.locator(".faq-inline-prompt");
        const intro = contentColumn.locator("h2").first().locator("..");
        const details = contentColumn.locator(".grid.gap-3").first();

        await expect(faq).toHaveCount(1);
        await expect(majorBlocks).toHaveCSS("row-gap", "32px");
        await expect(contentColumn.locator(".faq-inline-prompt")).toHaveCount(1);
        await expect(formColumn.locator(".faq-inline-prompt")).toHaveCount(0);
        await expect(faq).toBeVisible();

        const [introBox, faqBox, detailsBox] = await Promise.all([
          intro.boundingBox(),
          faq.boundingBox(),
          details.boundingBox(),
        ]);
        expect(introBox).toBeTruthy();
        expect(faqBox).toBeTruthy();
        expect(detailsBox).toBeTruthy();
        expect(faqBox!.y).toBeGreaterThanOrEqual(introBox!.y + introBox!.height);
        expect(detailsBox!.y).toBeGreaterThanOrEqual(faqBox!.y + faqBox!.height);
      });
    }
  }

  test("localized copy, FAQ destination, icon and keyboard access are preserved", async ({ page, context }) => {
    await openContact(page, context, "uk", 390);

    const faq = page.locator(".faq-inline-prompt");
    const link = faq.locator(".faq-inline-prompt-link");
    await expect(faq.locator(":scope > span")).toHaveText("Питання?");
    await expect(link.locator("span")).toHaveText("Переглянути поширені запитання");
    await expect(link.locator("svg")).toHaveCount(1);
    await expect(link).toHaveAttribute("href", localizedHref("/faq", "uk"));

    await link.focus();
    await expect(link).toBeFocused();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${localizedHref("/faq", "uk").replaceAll("/", "\\/")}/?$`));
  });
});
