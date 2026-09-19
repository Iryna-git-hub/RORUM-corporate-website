import { expect, test, type Page } from "@playwright/test";
import { gotoAndStabilize } from "./support";
import { isFormspreeConfigured } from "@/lib/formspree";

/**
 * Payload-quality verification for the Host at RORUM booking form's
 * `package` / `additionalServices` fields (see lib/formspree.ts's
 * resolveOptionLabel() / resolveMultiOptionLabels() and
 * components/InquiryForm.tsx's onSubmit wiring).
 *
 * This file has TWO very different kinds of test, kept apart deliberately:
 *
 * 1. Locale-mocked checks (da/uk) — network is INTERCEPTED and FULFILLED
 *    locally; nothing is ever delivered to the real Formspree endpoint or
 *    the site owner's inbox. Safe to re-run as often as needed.
 *
 * 2. Real, explicitly owner-authorized live submissions — Host at RORUM,
 *    Catering, and Contact. These actually POST to the real, configured
 *    `NEXT_PUBLIC_FORMSPREE_ENDPOINT` and deliver a real email to the real
 *    site owner. Every field is filled with obviously-synthetic QA content
 *    and the message explicitly says it's an automated test to disregard.
 *    Each of these three tests must run AT MOST ONCE per verification pass
 *    (do not loop/re-run them while iterating — use the mocked tests above
 *    for that). They are skipped cleanly when no real endpoint is
 *    configured (e.g. CI with no .env.local), so they never hit the
 *    placeholder URL.
 *
 *    IMPORTANT — additional opt-in required: being "configured" is NOT
 *    enough to run these for real. They also require the dedicated env var
 *    `ALLOW_REAL_FORMSPREE_SEND=1` to be set explicitly for that invocation
 *    (it is never set in `.env.local`, `.env.example`, or
 *    `playwright.config.ts`). Without it, a bare `npx playwright test` —
 *    the natural way anyone would run "the suite" — skips these 3 tests
 *    even though the endpoint is configured. See the describe block below
 *    for why.
 *
 * Bandwidth-safe: Sanity CDN image/video requests are aborted throughout —
 * none of this depends on downloading real media.
 */

const QA_DISCLAIMER =
  "[Automated QA test submission — please disregard. Verifying Formspree payload labels.]";

async function blockHeavyAssets(page: Page) {
  await page.route(/cdn\.sanity\.io\/(images|files)\//, (route) => route.abort());
}

test.describe("Host at RORUM payload labels — locale-mocked (da/uk), never delivered", () => {
  test.beforeEach(async ({ page }) => {
    await blockHeavyAssets(page);
  });

  test("da: selecting 'Eftermiddagssession' and checking DA service labels sends those labels, never packageN/serviceN", async ({ page }) => {
    let capturedBody = "";
    await page.route(/formspree\.io/, async (route) => {
      capturedBody = route.request().postData() ?? "";
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await gotoAndStabilize(page, "/da/host-at-rorum");
    await page.fill('input[name="name"]', "QA Formspree DA");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa@example.com");
    await page.fill('input[name="eventDate"]', "2099-06-01");
    await page.fill('textarea[name="message"]', QA_DISCLAIMER);
    await page.locator('select[name="package"]').selectOption({ label: "Eftermiddagssession" });
    await page.getByRole("checkbox", { name: "Morgenmad" }).check();
    await page.getByRole("checkbox", { name: "Frokost" }).check();
    await page.locator('form button[type="submit"]').first().click();

    // Page-embedded forms (Host at RORUM included) now show the shared
    // success DIALOG (FormSuccessModal/ApplicationModal), not an inline
    // role="status" element — see components/InquiryForm.tsx.
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Tak!" })).toBeVisible();
    await expect(dialog).toContainText("Tak. Din Vær vært hos RORUM-anmodning er klar til RORUM-teamet.");
    expect(capturedBody).toContain("Eftermiddagssession");
    expect(capturedBody).toContain("Morgenmad");
    expect(capturedBody).toContain("Frokost");
    for (const rawId of ["package0", "package1", "package2", "service0", "service1", "service2", "service3"]) {
      expect(capturedBody).not.toContain(`name="package"\r\n\r\n${rawId}`);
      expect(capturedBody).not.toContain(rawId);
    }
  });

  test("uk: selecting 'Денна сесія' and checking UK service labels sends those labels, never packageN/serviceN", async ({ page }) => {
    let capturedBody = "";
    await page.route(/formspree\.io/, async (route) => {
      capturedBody = route.request().postData() ?? "";
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await gotoAndStabilize(page, "/uk/host-at-rorum");
    await page.fill('input[name="name"]', "QA Formspree UK");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa@example.com");
    await page.fill('input[name="eventDate"]', "2099-06-01");
    await page.fill('textarea[name="message"]', QA_DISCLAIMER);
    await page.locator('select[name="package"]').selectOption({ label: "Денна сесія" });
    await page.getByRole("checkbox", { name: "Сніданок" }).check();
    await page.getByRole("checkbox", { name: "Обід" }).check();
    await page.locator('form button[type="submit"]').first().click();

    // Page-embedded forms (Host at RORUM included) now show the shared
    // success DIALOG (FormSuccessModal/ApplicationModal), not an inline
    // role="status" element — see components/InquiryForm.tsx.
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Дякуємо!" })).toBeVisible();
    await expect(dialog).toContainText("Дякуємо. Ваш запит на проведення в RORUM передано команді RORUM.");
    expect(capturedBody).toContain("Денна сесія");
    expect(capturedBody).toContain("Сніданок");
    expect(capturedBody).toContain("Обід");
    for (const rawId of ["package0", "package1", "package2", "service0", "service1", "service2", "service3"]) {
      expect(capturedBody).not.toContain(rawId);
    }
  });
});

// ---------------------------------------------------------------------------
// REAL, rare, explicitly-authorized live submissions. Each runs at most ONCE.
//
// !!! DANGER: these 3 tests send REAL emails to the REAL RORUM site owner's
// inbox when they run (via the live, configured NEXT_PUBLIC_FORMSPREE_ENDPOINT).
// They do NOT run by default and must NOT be re-enabled as part of routine
// regression runs. They require explicit opt-in via the environment variable
// `ALLOW_REAL_FORMSPREE_SEND=1`, set deliberately for a single invocation —
// e.g. `ALLOW_REAL_FORMSPREE_SEND=1 npx playwright test
// tests/forms-formspree-real-payload.spec.ts`. Merely having a configured
// Formspree endpoint (isFormspreeConfigured()) is intentionally NOT enough;
// both conditions are required together.
//
// These three tests were already explicitly authorized and run once, as a
// one-time real-payload verification pass. That authorization is consumed.
// Anyone re-enabling them (by setting ALLOW_REAL_FORMSPREE_SEND=1) should do
// so sparingly and deliberately, with fresh explicit authorization — never
// as a side effect of running "the Playwright suite".
// ---------------------------------------------------------------------------

test.describe("Real live Formspree submissions — explicitly authorized, run once", () => {
  test.skip(
    !isFormspreeConfigured() || process.env.ALLOW_REAL_FORMSPREE_SEND !== "1",
    "Real live Formspree submissions require explicit opt-in via ALLOW_REAL_FORMSPREE_SEND=1 — skipping by default to avoid unintended real-world email sends.",
  );

  test.beforeEach(async ({ page }) => {
    await blockHeavyAssets(page);
  });

  test("Host at RORUM: real submission delivers resolved package + service LABELS, never raw ids, to the real endpoint", async ({ page }) => {
    const requestPromise = page.waitForRequest((request) => /formspree\.io/.test(request.url()) && request.method() === "POST");

    await gotoAndStabilize(page, "/host-at-rorum");
    await page.fill('input[name="name"]', "QA Formspree Test");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa-automated-test@example.com");
    await page.fill('input[name="eventDate"]', "2099-06-01");
    await page.fill('textarea[name="message"]', QA_DISCLAIMER);
    await page.locator('select[name="package"]').selectOption({ label: "Morning session" });
    await page.getByRole("checkbox", { name: "Breakfast" }).check();
    await page.getByRole("checkbox", { name: "Lunch" }).check();
    await page.locator('form button[type="submit"]').first().click();

    const request = await requestPromise;
    const body = request.postData() ?? "";
    // Page-embedded forms now show the shared success DIALOG (FormSuccessModal/
    // ApplicationModal), not an inline role="status" element — see components/InquiryForm.tsx.
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Thank you!" })).toBeVisible();

    // The resolved LABELS must be present...
    expect(body).toContain("Morning session");
    expect(body).toContain("Breakfast");
    expect(body).toContain("Lunch");
    expect(body).toContain(QA_DISCLAIMER);
    // ...and none of the raw internal ids must appear anywhere in the body.
    for (const rawId of ["package0", "package1", "package2", "service0", "service1", "service2", "service3"]) {
      expect(body).not.toContain(rawId);
    }
  });

  test("Catering inquiry: real submission delivers successfully (no package/service fields on this form)", async ({ page }) => {
    const requestPromise = page.waitForRequest((request) => /formspree\.io/.test(request.url()) && request.method() === "POST");

    await gotoAndStabilize(page, "/catering");
    await page.fill('input[name="name"]', "QA Formspree Test");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa-automated-test@example.com");
    await page.fill('input[name="eventDate"]', "2099-06-01");
    await page.fill('textarea[name="message"]', QA_DISCLAIMER);
    const consent = page.locator('input[name="privacyConsent"]');
    if (await consent.count()) await consent.first().check();
    await page.getByRole("button", { name: /Request Catering/i }).click();

    const request = await requestPromise;
    const body = request.postData() ?? "";
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Thank you!" })).toBeVisible();
    expect(body).toContain(QA_DISCLAIMER);
    expect(body).toContain("Catering inquiry");
  });

  test("Contact form: real submission delivers successfully (no package/service fields on this form)", async ({ page }) => {
    const requestPromise = page.waitForRequest((request) => /formspree\.io/.test(request.url()) && request.method() === "POST");

    await gotoAndStabilize(page, "/contact");
    await page.fill('input[name="name"]', "QA Formspree Test");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa-automated-test@example.com");
    await page.fill('textarea[name="message"]', QA_DISCLAIMER);
    const consent = page.locator('input[name="privacyConsent"]');
    if (await consent.count()) await consent.first().check();
    await page.locator('form button[type="submit"]').first().click();

    const request = await requestPromise;
    const body = request.postData() ?? "";
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Thank you!" })).toBeVisible();
    expect(body).toContain(QA_DISCLAIMER);
    expect(body).toContain("Contact request");
  });
});
