import { expect, test, type BrowserContext } from "@playwright/test";
import { gotoAndStabilize } from "./support";

const ROUTES = [
  "/",
  "/da",
  "/uk",
  "/events",
  "/da/events",
  "/uk/events",
  "/events/community-reset-night",
  "/contact",
] as const;

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

test.describe("App Router favicon metadata", () => {
  for (const route of ROUTES) {
    test(`${route} exposes one favicon and one Apple touch icon`, async ({ page, context }) => {
      await blockHeavyMedia(context);
      await gotoAndStabilize(page, route);

      const favicon = page.locator('head link[rel="icon"]');
      const appleIcon = page.locator('head link[rel="apple-touch-icon"]');
      await expect(favicon).toHaveCount(1);
      await expect(appleIcon).toHaveCount(1);
      await expect(favicon).toHaveAttribute("href", /^\/favicon\.ico\?[a-f0-9]+$/);
      await expect(favicon).toHaveAttribute("sizes", "48x48");
      await expect(appleIcon).toHaveAttribute("href", /^\/apple-icon\.png\?[a-f0-9]+$/);
      await expect(appleIcon).toHaveAttribute("sizes", "180x180");
    });
  }

  test("generated icon routes return the supplied image formats", async ({ request }) => {
    const favicon = await request.get("/favicon.ico");
    expect(favicon.status()).toBe(200);
    expect(favicon.headers()["content-type"]).toContain("image/x-icon");

    const appleIcon = await request.get("/apple-icon.png");
    expect(appleIcon.status()).toBe(200);
    expect(appleIcon.headers()["content-type"]).toContain("image/png");
  });
});
