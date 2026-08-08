import { expect, test } from "@playwright/test";
import { ALL_ROUTES, VISUAL_WIDTHS } from "./routes";
import { gotoAndStabilize } from "./support";

test.describe("visual regression", () => {
  for (const route of ALL_ROUTES) {
    for (const width of VISUAL_WIDTHS) {
      const slug = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-");

      test(`${route || "home"} @ ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await gotoAndStabilize(page, route);
        await expect(page).toHaveScreenshot(`${slug}-${width}.png`, {
          fullPage: true,
        });
      });
    }
  }
});
