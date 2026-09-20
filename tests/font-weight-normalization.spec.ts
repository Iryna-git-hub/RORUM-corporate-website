import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createClient } from "@sanity/client";
import { localizedHref, type Locale } from "@/lib/i18n";
import { gotoAndStabilize } from "./support";

/**
 * Regression coverage for the site-wide font-weight normalization: every
 * occurrence that used to render at a Tailwind/CSS weight above 800
 * (`font-black` => 900, `font-[850]`, `font-[950]`, raw CSS
 * `font-weight: 900`) must now compute to exactly 800 in a real browser —
 * across all three locales, since the rule is locale-invariant (no
 * `[lang="uk"]` or other locale-conditional font-weight logic exists or
 * should exist). The one-off static source scan lives in
 * lib/fontWeightAudit.test.ts; this spec instead verifies the *rendered*
 * result via `getComputedStyle`.
 *
 * Same bandwidth-safe media-blocking convention as
 * tests/community-membership-wecoda-alignment.spec.ts / interactions.spec.ts
 * — this is a typography check, not an image-rendering check, so heavy
 * Sanity CDN image/video requests are intercepted rather than downloaded.
 */
const TRANSPARENT_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");
async function blockHeavySanityMedia(context: BrowserContext): Promise<void> {
  await context.route("**/*", (route) => {
    const request = route.request();
    const url = request.url();
    const type = request.resourceType();
    const isSanity = url.includes("cdn.sanity.io") || url.includes("sanity-cdn.com");
    if (!isSanity) return route.continue();
    if (type === "image") {
      return route.fulfill({ status: 200, contentType: "image/gif", body: TRANSPARENT_GIF });
    }
    if (type === "media" || /\.(mp4|webm|mov)(\?|$)/.test(url)) {
      return route.abort();
    }
    return route.continue();
  });
}

async function fontWeightOf(page: Page, selector: string): Promise<string> {
  return page.locator(selector).first().evaluate((el) => getComputedStyle(el).fontWeight);
}

const LOCALES: Locale[] = ["en", "da", "uk"];

// Same env-gated Sanity read used by tests/catering-responsive.spec.ts, to
// click the Menu Examples CTA by its real per-locale label rather than a
// guessed/regex button name.
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
interface RawItem {
  itemKey?: string;
  title?: I18nEntry[];
}
interface RawSection {
  sectionKey?: string;
  items?: RawItem[];
}
interface RawPage {
  sections?: RawSection[];
}

function pick(entries: I18nEntry[] | undefined, lang: string): string | undefined {
  return entries?.find((e) => e.language === lang)?.value;
}

test.describe("Font-weight normalization — nothing above 800 renders, across EN/DA/UK", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET,
    "Sanity not configured in this environment",
  );

  let cateringPage: RawPage | null;

  test.beforeAll(async () => {
    cateringPage = await sanity.fetch<RawPage | null>(`*[_type == "page" && pageKey == "catering"][0]{sections}`);
  });

  for (const locale of LOCALES) {
    test(`FAQ question text and group heading compute to 800 (${locale})`, async ({ page, context }) => {
      await blockHeavySanityMedia(context);
      await gotoAndStabilize(page, localizedHref("/faq", locale));

      await expect(page.locator(".faq-question").first()).toBeVisible();
      expect(await fontWeightOf(page, ".faq-question")).toBe("800");

      // FAQ group heading (<h2 class="... font-extrabold ...">) — was font-black.
      const groupHeading = page.locator("section h2.font-extrabold").first();
      await expect(groupHeading).toBeVisible();
      expect(await fontWeightOf(page, "section h2.font-extrabold")).toBe("800");
    });

    test(`Catering menu overlay tab computes to 800 (${locale})`, async ({ page, context }) => {
      await blockHeavySanityMedia(context);
      await gotoAndStabilize(page, localizedHref("/catering", locale));

      const heroSection = cateringPage?.sections?.find((s) => s.sectionKey === "hero");
      const menuExamplesCta = pick(heroSection?.items?.find((i) => i.itemKey === "menuExamplesCta")?.title, locale);
      expect(menuExamplesCta, "menuExamplesCta label must be non-empty in Sanity").toBeTruthy();
      await page.getByRole("button", { name: menuExamplesCta!, exact: true }).first().click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      const tab = dialog.locator('nav a[href^="#catering-menu-"]').first();
      await expect(tab).toBeVisible();
      expect(await tab.evaluate((el) => getComputedStyle(el).fontWeight)).toBe("800");

      await page.keyboard.press("Escape");
    });
  }

  test("Catering page: package card title and 'Suitable for' label compute to 800 (en)", async ({ page, context }) => {
    await blockHeavySanityMedia(context);
    await gotoAndStabilize(page, localizedHref("/catering", "en"));

    // "Suitable for" label — <p class="... font-extrabold"> — was font-black.
    const suitableForLabel = page.locator("p.font-extrabold").first();
    await expect(suitableForLabel).toBeVisible();
    expect(await suitableForLabel.evaluate((el) => getComputedStyle(el).fontWeight)).toBe("800");

    // Package/menu-format step number badge — was font-black.
    const stepNumber = page.locator("span.font-extrabold").first();
    await expect(stepNumber).toBeVisible();
    expect(await stepNumber.evaluate((el) => getComputedStyle(el).fontWeight)).toBe("800");
  });

  test("Host at RORUM: step number and step title compute to 800 (en)", async ({ page, context }) => {
    await blockHeavySanityMedia(context);
    await gotoAndStabilize(page, localizedHref("/host-at-rorum", "en"));

    const stepSection = page.locator("#request-private-meeting");
    await expect(stepSection).toBeVisible();

    const stepNumber = stepSection.locator("span.font-extrabold").first();
    await expect(stepNumber).toBeVisible();
    expect(await stepNumber.evaluate((el) => getComputedStyle(el).fontWeight)).toBe("800");

    const stepTitle = stepSection.locator("h3.font-extrabold").first();
    await expect(stepTitle).toBeVisible();
    expect(await stepTitle.evaluate((el) => getComputedStyle(el).fontWeight)).toBe("800");
  });

  test("Footer column heading computes to 800 (en, present on every page)", async ({ page, context }) => {
    await blockHeavySanityMedia(context);
    await gotoAndStabilize(page, localizedHref("/", "en"));

    const footerHeading = page.locator("footer span.font-extrabold").first();
    await expect(footerHeading).toBeVisible();
    expect(await footerHeading.evaluate((el) => getComputedStyle(el).fontWeight)).toBe("800");
  });

  test("EventCard date number computes to 800 on the events listing (en)", async ({ page, context }) => {
    await blockHeavySanityMedia(context);
    await gotoAndStabilize(page, localizedHref("/events", "en"));

    const dateNumber = page.locator("span.font-extrabold").first();
    await expect(dateNumber).toBeVisible();
    expect(await dateNumber.evaluate((el) => getComputedStyle(el).fontWeight)).toBe("800");
  });

  test("Mobile nav active link computes to 800, inactive links stay at 700 (en, 390px)", async ({ page, context }) => {
    await blockHeavySanityMedia(context);
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAndStabilize(page, localizedHref("/about", "en"));

    await page.getByTestId("mobile-menu-toggle").click();
    const panel = page.getByLabel("Mobile menu");
    await expect(panel).toBeVisible();

    const activeLink = panel.locator('nav [aria-current="page"]').first();
    await expect(activeLink).toBeVisible();
    expect(await activeLink.evaluate((el) => getComputedStyle(el).fontWeight)).toBe("800");

    // The "Home" row is never the active item on /about and stays
    // `font-bold` (700) unconditionally — confirms the active-only 800
    // upgrade didn't leak onto sibling nav rows.
    const homeLink = panel.locator('nav a[href="/"]').first();
    await expect(homeLink).toBeVisible();
    expect(await homeLink.evaluate((el) => getComputedStyle(el).fontWeight)).toBe("700");
  });
});
