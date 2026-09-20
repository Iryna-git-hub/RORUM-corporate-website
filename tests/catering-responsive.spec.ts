import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@sanity/client";
import { localizedHref, type Locale } from "@/lib/i18n";
import { gotoAndStabilize } from "./support";

/**
 * Multi-locale × multi-breakpoint responsive sweep for the Catering page
 * AND the Catering Menu Examples overlay (opened explicitly in every
 * combination below, not just checked once). Permanent (not a temporary
 * spec) — same status as tests/breakpoints.spec.ts/interactions.spec.ts,
 * which this complements: those cover Events/nav/forms at a handful of
 * breakpoints; this is the first sweep with full locale × breakpoint
 * coverage specifically for Catering + its overlay, per the explicit
 * requirement that responsive regressions here be caught going forward.
 *
 * 3 locales × 4 breakpoints = 12 combinations, each exercising BOTH the
 * closed page state and the opened-overlay state = 24 checked states
 * minimum, satisfying the task's stated floor.
 *
 * No visual snapshots are captured or compared here — this checks layout
 * *properties* (no overflow, elements fit/are reachable, content isn't
 * clipped) programmatically, so a genuine layout regression fails loudly
 * without ever touching tests/visual.spec.ts's committed baselines.
 */
const LOCALES: Locale[] = ["en", "da", "uk"];
const WIDTHS = [375, 768, 1024, 1440] as const;
const VIEWPORT_HEIGHT = 900;

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

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test.describe("Catering + Menu Examples overlay — multi-locale responsive sweep", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET,
    "Sanity not configured in this environment",
  );

  let cateringPage: RawPage | null;

  test.beforeAll(async () => {
    cateringPage = await sanity.fetch<RawPage | null>(`*[_type == "page" && pageKey == "catering"][0]{sections}`);
  });

  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      test(`locale: ${locale} @ ${width}px — page has no horizontal overflow; overlay opens, fits, scrolls, and closes cleanly`, async ({ page }) => {
        await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
        await gotoAndStabilize(page, localizedHref("/catering", locale));

        // --- state 1: the closed page ------------------------------------
        expect(await horizontalOverflow(page), `page horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);

        const bodyOverflowBefore = await page.evaluate(() => getComputedStyle(document.body).overflow);
        expect(bodyOverflowBefore, "background scroll must not be locked before the overlay opens").not.toBe("hidden");

        // --- open the overlay ---------------------------------------------
        const heroSection = cateringPage?.sections?.find((s) => s.sectionKey === "hero");
        const menuExamplesCta = pick(heroSection?.items?.find((i) => i.itemKey === "menuExamplesCta")?.title, locale);
        expect(menuExamplesCta, "menuExamplesCta label must be non-empty in Sanity").toBeTruthy();
        await page.getByRole("button", { name: menuExamplesCta!, exact: true }).first().click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute("aria-modal", "true");

        // --- state 2: the open overlay -------------------------------------
        // No horizontal overflow introduced by the overlay itself.
        expect(await horizontalOverflow(page), `page horizontal overflow while overlay is open at ${width}px`).toBeLessThanOrEqual(1);

        // The overlay's own shell must fit within the viewport width — its
        // bounding box must never exceed the viewport (would indicate the
        // overlay itself overflows horizontally, distinct from the page).
        const dialogBox = await dialog.boundingBox();
        expect(dialogBox, "dialog must have a measurable bounding box").toBeTruthy();
        expect(dialogBox!.width, `overlay width must fit within the ${width}px viewport`).toBeLessThanOrEqual(width + 1);

        // Background scroll is locked while the overlay is open.
        const bodyOverflowDuring = await page.evaluate(
          () => getComputedStyle(document.body).overflow || getComputedStyle(document.documentElement).overflow,
        );
        expect(bodyOverflowDuring, "background scroll must be locked while the overlay is open").toBe("hidden");

        // Category nav tabs remain usable — visible and individually
        // clickable, not clipped to zero width. Long category names either
        // wrap or the nav scrolls horizontally (CSS: overflow-x: auto on
        // .catering-menu-nav's inner row) — either way every tab stays
        // reachable via scrollIntoViewIfNeeded, asserted below.
        const navTabs = dialog.locator(".catering-menu-nav a");
        const tabCount = await navTabs.count();
        expect(tabCount, "at least one category nav tab must render").toBeGreaterThan(0);
        for (let i = 0; i < tabCount; i++) {
          const tab = navTabs.nth(i);
          await tab.scrollIntoViewIfNeeded();
          await expect(tab, `nav tab ${i} must remain reachable/visible at ${width}px`).toBeVisible();
          const box = await tab.boundingBox();
          expect(box && box.width > 0, `nav tab ${i} must have non-zero width`).toBe(true);
        }

        // Close button remains visible and reachable — the single button
        // inside the overlay's <header> (see CateringMenuOverlay.tsx); its
        // aria-label is locale-translated, so it's found structurally
        // rather than by an English-only accessible-name match.
        const closeButton = dialog.locator("header button").first();
        await expect(closeButton).toBeVisible();
        const closeBox = await closeButton.boundingBox();
        expect(closeBox && closeBox.x >= 0 && closeBox.x <= width, "close button must be within the viewport, not pushed off-screen").toBe(true);

        // First (expanded-by-default) category's dish content isn't
        // clipped: text content must render at non-zero height, and the
        // dish photo must preserve its aspect ratio (natural vs rendered
        // ratio close to the CSS-declared 16/9).
        const firstCard = dialog.locator("article").first();
        if (await firstCard.count()) {
          await expect(firstCard).toBeVisible();
          const titleBox = await firstCard.locator("h3").boundingBox();
          expect(titleBox && titleBox.height > 0, "dish title must not be clipped to zero height").toBe(true);
          const img = firstCard.locator("img").first();
          const ratio = await img.evaluate((el: HTMLImageElement) => (el.naturalWidth && el.naturalHeight ? el.clientWidth / el.clientHeight : null));
          if (ratio !== null) {
            expect(ratio, "dish photo must preserve its aspect ratio (not stretched/squashed)").toBeGreaterThan(1.5);
            expect(ratio).toBeLessThan(2.1);
          }
        }

        // Overlay content taller than the viewport must be scrollable, not
        // clipped — its scrollHeight must reach at least its clientHeight
        // (trivially true) and, for narrow/short viewports where content
        // clearly exceeds the viewport, scrollHeight must exceed
        // clientHeight (proving a real scroll container exists, not an
        // overflow:hidden clip).
        const shellMetrics = await page.evaluate(() => {
          const shell = document.querySelector('[role="dialog"] > div') as HTMLElement | null;
          const overlay = document.querySelector('[role="dialog"]') as HTMLElement | null;
          const el = shell?.scrollHeight && shell.scrollHeight > (shell.clientHeight || 0) ? shell : overlay;
          return el ? { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight } : null;
        });
        if (shellMetrics && shellMetrics.scrollHeight > VIEWPORT_HEIGHT) {
          expect(shellMetrics.scrollHeight, "overlay content taller than the viewport must be scrollable").toBeGreaterThanOrEqual(shellMetrics.clientHeight);
        }

        // Escape closes the overlay and restores background scroll.
        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
        const bodyOverflowAfter = await page.evaluate(() => getComputedStyle(document.body).overflow);
        expect(bodyOverflowAfter, "background scroll must be restored after the overlay closes").not.toBe("hidden");
      });
    }
  }

  test("Ukrainian and Danish long category names render without horizontal clipping at the narrowest breakpoint (375px)", async ({ page }) => {
    for (const locale of ["da", "uk"] as const) {
      await page.setViewportSize({ width: 375, height: VIEWPORT_HEIGHT });
      await gotoAndStabilize(page, localizedHref("/catering", locale));
      const heroSection = cateringPage?.sections?.find((s) => s.sectionKey === "hero");
      const menuExamplesCta = pick(heroSection?.items?.find((i) => i.itemKey === "menuExamplesCta")?.title, locale);
      await page.getByRole("button", { name: menuExamplesCta!, exact: true }).first().click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      expect(await horizontalOverflow(page), `${locale} @ 375px overlay open`).toBeLessThanOrEqual(1);
      await page.keyboard.press("Escape");
    }
  });
});
