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
