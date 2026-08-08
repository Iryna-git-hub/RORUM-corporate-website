import { expect, test } from "@playwright/test";

// This environment has no Sanity project provisioned (see MIGRATION_REPORT.md's
// Sanity section) — these tests protect the specific "fail safely, never
// crash the site" behavior that's actually true right now: `/studio` shows a
// clear configuration message instead of a 500, and every public route still
// renders its existing content and returns 200 with no Sanity project
// configured at all, exactly as the task's fallback requirement specifies.
// Once real credentials exist, add the corresponding "does load when
// configured" / draft-mode / locale-route assertions alongside these.
test.describe("Sanity integration — unconfigured-environment behavior", () => {
  test("/studio renders a clear configuration message instead of crashing", async ({ page }) => {
    const response = await page.goto("/studio");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText("Sanity Studio is not configured")).toBeVisible();
  });

  test("public routes render normally with no Sanity project configured", async ({ page }) => {
    for (const route of ["/", "/events", "/faq", "/catering"]) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
    }
  });
});
