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
