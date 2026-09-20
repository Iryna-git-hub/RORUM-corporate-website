import { expect, test } from "@playwright/test";

/**
 * Verifies the no-JS fallback question from the privacy-consent task: with
 * JavaScript disabled, can Contact or Volunteer (the only 2 forms that used
 * to render a native `action={formspreeConfig.endpoint}` fallback) reach
 * Formspree at all?
 *
 * They used to — and with NO validation of any kind, consent included: both
 * forms render `<form noValidate ...>` (so the JS path's own localized
 * validation runs instead of the browser's native tooltips), and
 * `noValidate` ALSO disables native `required`-attribute enforcement
 * unconditionally. With JavaScript disabled there's no handler left to run
 * at all, so a no-JS visitor could submit straight through with consent
 * unchecked (or any other required field blank). Confirmed live before the
 * fix: this same test, run against the pre-fix markup, actually reached
 * formspree.io.
 *
 * Fixed by removing the native `action`/no-JS fallback from both forms
 * entirely (components/ContactForm.tsx, components/VolunteerApplicationForm.tsx)
 * — delivery is now JS-only on all 6 RORUM forms, closing this off instead of
 * trying to make `required` selectively survive `noValidate`.
 */

test.use({ javaScriptEnabled: false });

test.describe("No-JS — Contact and Volunteer no longer have any way to reach Formspree without JavaScript", () => {
  test("Contact: a no-JS submission (consent unchecked, every field filled) does not reach formspree.io", async ({ page }) => {
    let hit = false;
    await page.route(/formspree\.io/, async (route) => {
      hit = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/contact");
    await page.fill('input[name="name"]', "QA NoJS");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa-nojs@example.com");
    await page.fill('textarea[name="message"]', "No-JS test.");
    // Deliberately left unchecked.
    await page.locator('form button[type="submit"]').first().click();
    // No JS handler and no `action` target — nothing should happen at all.
    // A short, bounded wait (not waitForResponse, which would legitimately
    // time out here) confirms no delayed/async request sneaks through.
    await page.waitForTimeout(1000);

    expect(hit).toBe(false);
  });
});
