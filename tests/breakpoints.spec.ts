import { expect, test } from "@playwright/test";
import { BREAKPOINT_MATRIX } from "./routes";
import { gotoAndStabilize } from "./support";

// Protects the specific regressions this migration is required not to
// reintroduce (see MIGRATION_REPORT.md): the mobile burger must stay usable
// below `lg`, the desktop nav must appear at `lg`, event-filter dropdowns
// must stay inside the viewport, and the Buy Ticket control must never
// collapse to an icon-sized column.
test.describe("breakpoint transitions", () => {
  for (const width of BREAKPOINT_MATRIX) {
    const isDesktop = width >= 1024; // `lg`

    test(`header nav shows the correct control at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoAndStabilize(page, "/events");

      const burger = page.getByTestId("mobile-menu-toggle");
      const desktopNav = page.getByRole("navigation", { name: "Main navigation" });

      if (isDesktop) {
        await expect(desktopNav).toBeVisible();
        await expect(burger).toBeHidden();
      } else {
        await expect(burger).toBeVisible();
        await expect(desktopNav).toBeHidden();
      }
    });

    test(`no horizontal overflow on /events at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoAndStabilize(page, "/events");

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test(`Buy Ticket control stays a usable width at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoAndStabilize(page, "/events/copenhagen-makers-dinner");

      const ticket = page.getByRole("link", { name: "Buy Ticket" });
      const box = await ticket.first().boundingBox();
      expect(box).not.toBeNull();
      // A collapsed/squeezed button (the original regression) measured
      // ~44-50px wide; a healthy button is always well above that.
      expect(box!.width).toBeGreaterThan(80);
    });
  }

  test("event-filter dropdown menu stays within the viewport when opened (360px)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await gotoAndStabilize(page, "/events");

    const trigger = page.locator(".events-filter-trigger").first();
    await trigger.click();
    const menu = page.locator(".events-filter-menu").first();
    await expect(menu).toBeVisible();

    const box = await menu.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360 + 1);
  });
});

// Regression guard for the fix that stopped closed `.events-filter-menu`
// dropdown panels from contributing to the Events page's horizontal
// scrollable width. Each panel is `position: absolute` and, before this fix,
// stayed `visibility: hidden` while closed — a box that's invisible but
// still laid out still counts toward an ancestor's scrollable overflow, so
// three of the four panels measured 8px past their flex-row container on one
// edge, which could in principle escape the page's own margin and produce
// real document-level horizontal scrolling. The fix removes each closed
// panel from layout entirely (`display: none`) once its existing fade-out
// transition finishes, so a closed dropdown can never contribute to
// overflow while the open/close animation plays unchanged.
test.describe("Events filter dropdowns — closed panels never cause page-level horizontal overflow", () => {
  async function docMetrics(page: import("@playwright/test").Page) {
    return page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
  }

  async function filterGroupMetrics(page: import("@playwright/test").Page) {
    return page.evaluate(() => {
      const group = document.querySelector('[role="group"].flex.flex-wrap') as HTMLElement | null;
      return { clientWidth: group?.clientWidth ?? 0, scrollWidth: group?.scrollWidth ?? 0 };
    });
  }

  const LOCALE_PATHS = ["/en/events", "/da/events", "/uk/events"] as const;

  for (const path of LOCALE_PATHS) {
    test(`closed state: no local or document overflow on ${path} (360px)`, async ({ page }) => {
      await page.route(/cdn\.sanity\.io\/(images|files)\//, (route) => route.abort());
      await page.setViewportSize({ width: 360, height: 900 });
      await gotoAndStabilize(page, path);

      const menus = page.locator(".events-filter-menu");
      const count = await menus.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        await expect(menus.nth(i)).toHaveCSS("display", "none");
      }

      const group = await filterGroupMetrics(page);
      expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth + 1);

      const doc = await docMetrics(page);
      expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth + 1);
    });
  }

  // Default (English) filter order — Date, Language, Price, Availability —
  // used only to name each test; the assertions themselves address triggers
  // by position, so this holds regardless of locale.
  const FILTER_NAMES = ["Date", "Language", "Price", "Availability"] as const;

  for (let i = 0; i < FILTER_NAMES.length; i++) {
    test(`open/close state: ${FILTER_NAMES[i]} dropdown stays within viewport and leaves no overflow (360px)`, async ({
      page,
    }) => {
      await page.route(/cdn\.sanity\.io\/(images|files)\//, (route) => route.abort());
      await page.setViewportSize({ width: 360, height: 900 });
      await gotoAndStabilize(page, "/events");

      const trigger = page.locator(".events-filter-trigger").nth(i);
      const menu = page.locator(".events-filter-menu").nth(i);

      // OPEN
      await trigger.click();
      await expect(menu).toBeVisible();
      await expect(menu).not.toHaveCSS("display", "none");

      const box = await menu.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(360 + 1);

      const docWhileOpen = await docMetrics(page);
      expect(docWhileOpen.scrollWidth).toBeLessThanOrEqual(docWhileOpen.clientWidth + 1);

      // CLOSE — allow the exit transition to finish, then confirm it's fully
      // out of layout again and left no horizontal overflow behind.
      await trigger.click();
      await expect(menu).toHaveCSS("display", "none", { timeout: 1000 });

      const docAfterClose = await docMetrics(page);
      expect(docAfterClose.scrollWidth).toBeLessThanOrEqual(docAfterClose.clientWidth + 1);
    });
  }

  test("resize sequence 440 -> 390 -> 375 -> 360 keeps closed panels out of layout and never overflows", async ({
    page,
  }) => {
    await page.route(/cdn\.sanity\.io\/(images|files)\//, (route) => route.abort());
    await page.setViewportSize({ width: 440, height: 956 });
    await gotoAndStabilize(page, "/events");

    async function checkAtCurrentSize() {
      const menus = page.locator(".events-filter-menu");
      const count = await menus.count();
      for (let i = 0; i < count; i++) {
        await expect(menus.nth(i)).toHaveCSS("display", "none");
      }
      const doc = await docMetrics(page);
      expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth + 1);
    }

    await checkAtCurrentSize();
    for (const width of [390, 375, 360]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);
      await checkAtCurrentSize();
    }
  });
});

// Regression guard: on short mobile viewports, the Home Hero's copy (label,
// heading, text, CTAs) plus its trust/benefits bar together needed more
// height than `.home-hero-full`'s `min-height: 100svh` box provides, so the
// trust bar (`position: absolute; bottom: 0`) visually overlapped the
// bottom of the copy — worse in Danish/Ukrainian, which wrap onto more
// lines than English. An earlier fix reflowed the Hero into normal document
// flow below this threshold; that was reverted (it altered the Hero's
// height model and, combined with small anti-aliased text over a photo
// backdrop, made the trust bar's own content harder to read). Current
// approach: below this size, hide the trust/benefits bar entirely
// (`display: none` in app/globals.css) and leave the ORIGINAL Hero
// (100svh, centered copy, absolutely-positioned trust bar) completely
// untouched otherwise. `860px` (not the 639px width breakpoint the rest of
// this file uses) is the measured cutoff — Ukrainian still overlapped at
// 390x844 (English did not), verified live against real content.
test.describe("Home Hero — trust/benefits bar is hidden (not reflowed) on short mobile viewports", () => {
  const SHORT_SIZES = [
    { width: 360, height: 640 },
    { width: 375, height: 667 },
    { width: 360, height: 740 },
    { width: 375, height: 812 },
    { width: 390, height: 844 },
  ] as const;
  const TALL_SIZES = [
    { width: 414, height: 896 },
    { width: 412, height: 915 },
  ] as const;
  const LOCALE_PATHS = ["/", "/da", "/uk"] as const;

  for (const path of LOCALE_PATHS) {
    for (const { width, height } of SHORT_SIZES) {
      test(`trust/benefits bar is hidden and reserves no space at ${width}x${height} (${path === "/" ? "en" : path.slice(1)})`, async ({ page }) => {
        await page.route(/cdn\.sanity\.io\/(images|files)\//, (route) => route.abort());
        await page.setViewportSize({ width, height });
        await gotoAndStabilize(page, path);

        const trust = page.locator(".home-hero-trust");
        // Still in the DOM (content/testid queries elsewhere keep working),
        // but not rendered and not visible.
        await expect(trust).toBeAttached();
        await expect(trust).toBeHidden();
        await expect(trust).toHaveCSS("display", "none");
        // `display: none` means no box at all — no reserved empty space.
        expect(await trust.boundingBox()).toBeNull();

        // The rest of the original Hero is completely untouched: still
        // 100svh, still centered.
        const hero = page.locator(".home-hero-full");
        await expect(hero).toHaveCSS("display", "grid");
        await expect(hero).toHaveCSS("min-height", `${height}px`);

        // CTA buttons remain visible and usable.
        const ctas = page.locator(".home-hero-copy a.btn, .home-hero-copy button.btn");
        if (await ctas.count()) {
          await expect(ctas.first()).toBeVisible();
        }

        // The copy block (eyebrow/H1/description/CTAs, treated as ONE
        // group) fits entirely within the Hero and is visually centered —
        // regression guard for the bug where `.home-hero-copy`'s
        // `margin-top: -35%` (calibrated to leave room for the now-hidden
        // trust bar) biased the whole block upward with nothing left to
        // make room for. `.home-hero-full`'s pre-existing `align-items:
        // center` does the actual centering once that bias is cancelled —
        // no fixed offset here, so this stays correct for any content
        // length/wrap (checked across EN/DA/UK, which wrap differently).
        const copyBox = (await page.locator(".home-hero-copy").boundingBox())!;
        const heroBox = (await hero.boundingBox())!;
        expect(copyBox.y).toBeGreaterThanOrEqual(0);
        expect(copyBox.y + copyBox.height).toBeLessThanOrEqual(height + 1);
        const copyCenter = copyBox.y + copyBox.height / 2;
        const heroCenter = heroBox.y + heroBox.height / 2;
        expect(Math.abs(copyCenter - heroCenter)).toBeLessThan(height * 0.12);
      });
    }
  }

  for (const { width, height } of TALL_SIZES) {
    test(`trust/benefits bar remains visible with the ORIGINAL layout at ${width}x${height} (EN)`, async ({ page }) => {
      await page.route(/cdn\.sanity\.io\/(images|files)\//, (route) => route.abort());
      await page.setViewportSize({ width, height });
      await gotoAndStabilize(page, "/");

      const hero = page.locator(".home-hero-full");
      const trust = page.locator(".home-hero-trust");
      await expect(trust).toBeVisible();
      await expect(hero).toHaveCSS("min-height", `${height}px`);
      await expect(hero).toHaveCSS("display", "grid");
      await expect(trust).toHaveCSS("position", "absolute");
      await expect(trust).toHaveCSS("display", "grid");

      // Original colors/typography untouched.
      const li = trust.locator("li").first();
      const svg = li.locator("svg");
      await expect(li).toHaveCSS("color", "rgb(245, 241, 234)"); // --color-cream
      await expect(svg).toHaveCSS("color", "rgb(228, 187, 133)"); // --color-gold
    });
  }

  test("tablet (768x700) is completely unaffected — trust bar visible, original layout", async ({ page }) => {
    await page.route(/cdn\.sanity\.io\/(images|files)\//, (route) => route.abort());
    await page.setViewportSize({ width: 768, height: 700 });
    await gotoAndStabilize(page, "/");

    const hero = page.locator(".home-hero-full");
    const trust = page.locator(".home-hero-trust");
    await expect(trust).toBeVisible();
    await expect(hero).toHaveCSS("min-height", "700px");
    await expect(trust).toHaveCSS("position", "absolute");
  });

  test("desktop (1440x900) is completely unaffected — trust bar visible, original layout", async ({ page }) => {
    await page.route(/cdn\.sanity\.io\/(images|files)\//, (route) => route.abort());
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndStabilize(page, "/");

    const hero = page.locator(".home-hero-full");
    const trust = page.locator(".home-hero-trust");
    await expect(trust).toBeVisible();
    await expect(hero).toHaveCSS("min-height", "900px");
    await expect(trust).toHaveCSS("position", "absolute");
  });

  test("360x740 wide enough for both CTA buttons to stay side by side (EN)", async ({ page }) => {
    await page.route(/cdn\.sanity\.io\/(images|files)\//, (route) => route.abort());
    await page.setViewportSize({ width: 360, height: 740 });
    await gotoAndStabilize(page, "/");

    const ctas = page.locator(".home-hero-copy a.btn, .home-hero-copy button.btn");
    const count = await ctas.count();
    if (count >= 2) {
      const first = await ctas.nth(0).boundingBox();
      const second = await ctas.nth(1).boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      // Side by side means roughly the same vertical position, not stacked.
      expect(Math.abs(first!.y - second!.y)).toBeLessThan(10);
    }
  });
});
