import { expect, test } from "@playwright/test";

// Whether Sanity is configured is a property of the `webServer` process
// (which loads `.env.local` the way Next.js does), not of this test
// runner's own Node process (which doesn't) — so this test checks the
// rendered page for either valid state instead of importing sanity/env
// and trying to predict which branch applies.
test.describe("Sanity integration", () => {
  test("/studio loads without crashing and never shows the site's own chrome", async ({ page }) => {
    const response = await page.goto("/studio");
    expect(response?.status()).toBeLessThan(500);

    // Regression check for the app/(site) route-group bug this test caught
    // once: /studio briefly inherited the marketing site's Header/Footer
    // because the root layout wrapped every route in <SiteShell> — /studio
    // must never show the site's own nav links.
    await expect(page.getByRole("link", { name: "Attend Events" })).toHaveCount(0);

    // Either the "not configured" fallback (no project set up yet), or the
    // real Studio shell / Sanity's own "register this origin" CORS screen
    // (once .env.local has real credentials) — both mean the Studio
    // component actually rendered, not a crash or the wrong page.
    await expect(page.locator("body")).toContainText(/not configured|Studio|CORS|Sanity/i);
  });

  test("public routes still render with the site's own header/footer", async ({ page }) => {
    for (const route of ["/", "/events", "/faq", "/catering"]) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("link", { name: "Attend Events" }).first()).toBeVisible();
    }
  });
});
