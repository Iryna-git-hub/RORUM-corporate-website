import { expect, test, type Page } from "@playwright/test";
import { gotoAndStabilize } from "./support";

/**
 * End-to-end proof that EVERY real submission form on the site (Task 4):
 *  - routes a valid submit through the shared Formspree path
 *  - with no `NEXT_PUBLIC_FORMSPREE_ENDPOINT` configured (the shipped state),
 *    shows the localized "not available yet" message
 *  - NEVER shows a false success and NEVER clears the user's input
 *  - makes zero requests to formspree.io
 *
 * Bandwidth-safe: aborts Sanity CDN image/video so the run stays cheap; the
 * page content and form behaviour don't need the media.
 */

const UNAVAILABLE = /not been configured yet|isn't fully set up yet|temporarily unavailable/i;

// This spec asserts the UNCONFIGURED/placeholder Formspree state (the
// shipped default). If this environment's `.env.local` has a real endpoint
// configured (some local dev setups do), the app actually attempts the
// POST instead of short-circuiting, and this spec's own route interception
// aborts it — producing the generic failure message instead of the
// "not configured" one these tests expect. Skip here in that case rather
// than fail noisily; tests/forms-success-modal.spec.ts is this spec's
// mirror image (it needs a real endpoint and skips when this one would run).
const configuredEndpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT ?? "";
const isFormspreeConfigured = Boolean(configuredEndpoint) && !configuredEndpoint.includes("FORM_ID_PLACEHOLDER");
test.skip(isFormspreeConfigured, "Asserts the unconfigured/placeholder Formspree state; this .env.local has a real endpoint configured.");

async function blockHeavyAssets(page: Page) {
  await page.route(/cdn\.sanity\.io\/(images|files)\//, (route) => route.abort());
}

/** Records any attempt to actually POST to Formspree — there must be none. */
async function watchFormspree(page: Page): Promise<() => string[]> {
  const hits: string[] = [];
  await page.route(/formspree\.io/, (route) => {
    hits.push(route.request().method() + " " + route.request().url());
    return route.abort();
  });
  return () => hits;
}

async function fillContactLike(page: Page) {
  await page.fill('input[name="name"]', "QA Formspree");
  await page.fill('input[name="phone"]', "+45 12 34 56 78");
  await page.fill('input[name="email"]', "qa@example.com");
  const eventDate = page.locator('input[name="eventDate"]');
  if (await eventDate.count()) await eventDate.first().fill("2099-06-01");
  await page.fill('textarea[name="message"]', "Automated delivery-wiring check.");
  const consent = page.locator('input[name="privacyConsent"]');
  if (await consent.count()) await consent.first().check();
}

test.describe("Formspree delivery — every form, unconfigured state", () => {
  test.beforeEach(async ({ page }) => {
    await blockHeavyAssets(page);
  });

  test("Contact form: valid submit → localized 'unavailable' alert, no success, input kept, no formspree.io request", async ({ page }) => {
    const getHits = await watchFormspree(page);
    await gotoAndStabilize(page, "/contact");
    await fillContactLike(page);
    await page.locator('form button[type="submit"]').first().click();

    await expect(page.getByRole("alert").filter({ hasText: UNAVAILABLE })).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.locator('input[name="name"]')).toHaveValue("QA Formspree");
    expect(getHits(), "no POST to formspree.io").toEqual([]);
  });

  test("Catering inquiry: valid submit → localized 'unavailable' alert, no success, input kept", async ({ page }) => {
    const getHits = await watchFormspree(page);
    await gotoAndStabilize(page, "/catering");
    await fillContactLike(page);
    await page.getByRole("button", { name: /Request Catering/i }).click();

    await expect(page.getByRole("alert").filter({ hasText: UNAVAILABLE })).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.locator('input[name="name"]')).toHaveValue("QA Formspree");
    expect(getHits()).toEqual([]);
  });

  test("Event Decoration inquiry: valid submit → localized 'unavailable' alert, no success, input kept", async ({ page }) => {
    const getHits = await watchFormspree(page);
    await gotoAndStabilize(page, "/event-decoration");
    await fillContactLike(page);
    // The submit label is CMS-driven (e.g. "Send request") — select by type.
    await page.locator('form button[type="submit"]').first().click();

    await expect(page.getByRole("alert").filter({ hasText: UNAVAILABLE })).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.locator('input[name="name"]')).toHaveValue("QA Formspree");
    expect(getHits()).toEqual([]);
  });

  test("Host at RORUM inquiry (booking): valid submit → localized 'unavailable' alert, no success, input kept", async ({ page }) => {
    const getHits = await watchFormspree(page);
    await gotoAndStabilize(page, "/host-at-rorum");
    await page.fill('input[name="name"]', "QA Formspree");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa@example.com");
    await page.fill('textarea[name="message"]', "Automated delivery-wiring check.");
    // Event date is required on the booking form (Phase 7); Package is optional.
    await page.fill('input[name="eventDate"]', "2099-06-01");
    const pkg = page.locator('select[name="package"]');
    await pkg.selectOption({ index: 1 });
    // CMS-driven submit label (e.g. "Submit Hosting Request") — select by type.
    await page.locator('form button[type="submit"]').first().click();

    await expect(page.getByRole("alert").filter({ hasText: UNAVAILABLE })).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.locator('input[name="name"]')).toHaveValue("QA Formspree");
    expect(getHits()).toEqual([]);
  });

  test("Volunteer application (modal): valid submit → localized 'unavailable' alert, no success, input kept", async ({ page }) => {
    const getHits = await watchFormspree(page);
    await gotoAndStabilize(page, "/volunteer");
    await page.getByRole("button", { name: /Apply to volunteer/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator('input[name="name"]').fill("QA Formspree");
    await dialog.locator('input[name="email"]').fill("qa@example.com");
    await dialog.locator('input[name="phone"]').fill("+45 12 34 56 78");
    await dialog.locator('textarea[name="message"]').fill("Automated delivery-wiring check.");
    await dialog.locator('input[name="privacyConsent"]').check();
    await dialog.getByRole("button", { name: /Send Application/i }).click();

    await expect(dialog.getByRole("alert").filter({ hasText: UNAVAILABLE })).toBeVisible();
    await expect(dialog.getByRole("status")).toHaveCount(0);
    await expect(dialog.locator('input[name="name"]')).toHaveValue("QA Formspree");
    expect(getHits()).toEqual([]);
  });

  test("Work With Us application (text-based, no CV/file upload): valid submit → localized 'unavailable' alert, no success, input kept, no file field, no formspree.io request", async ({ page }) => {
    const getHits = await watchFormspree(page);
    await gotoAndStabilize(page, "/work-with-us");
    await page.getByRole("button", { name: /Apply now/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // The old CV/file-upload flow is gone — confirm it stays gone.
    expect(await dialog.locator('input[type="file"]').count()).toBe(0);
    await dialog.locator('input[name="name"]').fill("QA Formspree");
    await dialog.locator('input[name="email"]').fill("qa@example.com");
    await dialog.locator('input[name="phone"]').fill("+45 12 34 56 78");
    await dialog.getByRole("checkbox", { name: /Social media/i }).check();
    await dialog.locator('textarea[name="experience"]').fill("Automated delivery-wiring check — experience.");
    await dialog.locator('textarea[name="whyRorum"]').fill("Automated delivery-wiring check — why RORUM.");
    await dialog.locator('input[name="privacyConsent"]').check();
    await dialog.getByRole("button", { name: /Send Application/i }).click();

    await expect(dialog.getByRole("alert").filter({ hasText: UNAVAILABLE })).toBeVisible();
    await expect(dialog.getByText(/we received your application/i)).toHaveCount(0);
    await expect(dialog.locator('input[name="name"]')).toHaveValue("QA Formspree");
    expect(getHits()).toEqual([]);
  });
});
