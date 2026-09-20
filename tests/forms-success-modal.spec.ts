import { expect, test, type Page } from "@playwright/test";
import { gotoAndStabilize } from "./support";

/**
 * Real-browser proof of the unified success experience (not just the jsdom
 * component tests). This local environment's `.env.local` has a REAL
 * `NEXT_PUBLIC_FORMSPREE_ENDPOINT` configured (unlike the placeholder the
 * shipped/default state assumes — see tests/forms-formspree.spec.ts's own
 * header comment), so a POST to formspree.io is actually attempted. Rather
 * than letting it reach the real endpoint, every test here intercepts that
 * POST and fulfills it with a 200 — no real submission ever leaves this
 * machine, and the run stays bandwidth-safe (Sanity image/video CDN
 * requests are aborted as usual).
 *
 * This spec needs a real (non-placeholder) endpoint configured to reach the
 * success path at all — with the shipped/default placeholder,
 * `submitToFormspree` throws `FORMSPREE_NOT_CONFIGURED` before any fetch, so
 * no dialog would ever open. Skip rather than fail noisily in that state;
 * tests/forms-formspree.spec.ts is this spec's mirror image (it asserts the
 * unconfigured state and skips here).
 */
const configuredEndpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT ?? "";
const isFormspreeConfigured = Boolean(configuredEndpoint) && !configuredEndpoint.includes("FORM_ID_PLACEHOLDER");
test.skip(!isFormspreeConfigured, "Requires a real NEXT_PUBLIC_FORMSPREE_ENDPOINT in .env.local (this spec mocks a successful POST) — see header comment.");

async function blockHeavyAssets(page: Page) {
  await page.route(/cdn\.sanity\.io\/(images|files)\//, (route) => route.abort());
}

async function mockFormspreeSuccess(page: Page) {
  await page.route(/formspree\.io/, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
}

test.describe("Success experience — page-embedded form (Contact) opens an accessible modal", () => {
  test.beforeEach(async ({ page }) => {
    await blockHeavyAssets(page);
    await mockFormspreeSuccess(page);
  });

  test("valid submit opens a dialog with Done, closes on Done, returns focus to the submit button, and can be resubmitted", async ({ page }) => {
    await gotoAndStabilize(page, "/contact");
    await page.fill('input[name="name"]', "QA Success");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa-success@example.com");
    await page.fill('textarea[name="message"]', "Real-browser success modal check.");
    const consent = page.locator('input[name="privacyConsent"]');
    if (await consent.count()) await consent.first().check();

    const submitButton = page.locator('form button[type="submit"]').first();
    await submitButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Done" })).toBeVisible();
    // No leftover inline success banner anywhere on the page.
    await expect(page.getByRole("status")).toHaveCount(0);
    // Fields behind the modal were reset on success.
    await expect(page.locator('input[name="name"]')).toHaveValue("");

    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(submitButton).toBeFocused();

    // Resubmission must actually work — not silently no-op against a stale
    // "already sent" guard inside the shared hook.
    await page.fill('input[name="name"]', "QA Success Two");
    await page.fill('input[name="phone"]', "+45 98 76 54 32");
    await page.fill('input[name="email"]', "qa-success-2@example.com");
    await page.fill('textarea[name="message"]', "Second submission after Done.");
    if (await consent.count()) await consent.first().check();
    await submitButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("Escape closes the success modal", async ({ page }) => {
    await gotoAndStabilize(page, "/contact");
    await page.fill('input[name="name"]', "QA Escape");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa-escape@example.com");
    await page.fill('textarea[name="message"]', "Escape check.");
    const consent = page.locator('input[name="privacyConsent"]');
    if (await consent.count()) await consent.first().check();
    await page.locator('form button[type="submit"]').first().click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

// Real-browser proof that the production formMessages backfill (successTitle/
// doneLabel, scripts/migrate-form-success-chrome.ts) actually renders in each
// locale — not just that resolveFormMessages() resolves it in isolation
// (lib/sanityForms.test.ts already covers that). One page-embedded form
// (Contact) at each of the three site locales.
test.describe("Success experience — EN/DA/UK success chrome renders the backfilled Sanity content", () => {
  test.beforeEach(async ({ page }) => {
    await blockHeavyAssets(page);
    await mockFormspreeSuccess(page);
  });

  const cases: { locale: string; path: string; title: string; done: string }[] = [
    { locale: "EN", path: "/contact", title: "Thank you!", done: "Done" },
    { locale: "DA", path: "/da/contact", title: "Tak!", done: "Færdig" },
    { locale: "UK", path: "/uk/contact", title: "Дякуємо!", done: "Готово" },
  ];

  for (const { locale, path, title, done } of cases) {
    test(`${locale}: success modal shows the ${locale}-localized title and Done label`, async ({ page }) => {
      await gotoAndStabilize(page, path);
      await page.fill('input[name="name"]', `QA ${locale}`);
      await page.fill('input[name="phone"]', "+45 12 34 56 78");
      await page.fill('input[name="email"]', `qa-${locale.toLowerCase()}@example.com`);
      await page.fill('textarea[name="message"]', `Locale check (${locale}).`);
      const consent = page.locator('input[name="privacyConsent"]');
      if (await consent.count()) await consent.first().check();
      await page.locator('form button[type="submit"]').first().click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("heading", { name: title })).toBeVisible();
      await expect(dialog.getByRole("button", { name: done })).toBeVisible();
      // No leaked English chrome when the requested locale has its own value.
      if (locale !== "EN") {
        await expect(dialog.getByRole("heading", { name: "Thank you!" })).toHaveCount(0);
        await expect(dialog.getByRole("button", { name: "Done" })).toHaveCount(0);
      }
    });
  }
});

test.describe("Success experience — Volunteer (already a modal) swaps content in place", () => {
  test.beforeEach(async ({ page }) => {
    await blockHeavyAssets(page);
    await mockFormspreeSuccess(page);
  });

  test("valid submit shows the shared success content inside the SAME dialog — never a second/nested dialog", async ({ page }) => {
    await gotoAndStabilize(page, "/volunteer");
    const trigger = page.getByRole("button", { name: /Apply to volunteer/i });
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await dialog.locator('input[name="name"]').fill("QA Volunteer");
    await dialog.locator('input[name="email"]').fill("qa-volunteer@example.com");
    await dialog.locator('input[name="phone"]').fill("+45 11 22 33 44");
    await dialog.locator('textarea[name="message"]').fill("Real-browser volunteer success check.");
    await dialog.locator('input[name="privacyConsent"]').check();
    await dialog.getByRole("button", { name: /Send Application/i }).click();

    // Still exactly one dialog — success replaced the form in place.
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(dialog.getByRole("button", { name: "Done" })).toBeVisible();
    await expect(dialog.locator('input[name="name"]')).toHaveCount(0);

    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();

    // Reopening starts a fresh form, not the previous success state.
    await trigger.click();
    await expect(page.getByRole("dialog").locator('input[name="name"]')).toHaveValue("");
  });
});

// Real-browser proof of the fully text-based Work With Us application form
// (the CV/file-upload flow was removed — see components/
// WorkWithUsApplicationForm.tsx and scripts/
// migrate-work-with-us-application-form.ts). Same "already a modal, swap
// content in place" pattern as Volunteer, plus the new multi-select and
// multiline-preservation behavior this form specifically introduces.
test.describe("Success experience — Work With Us (text-based application, no CV upload)", () => {
  test.beforeEach(async ({ page }) => {
    await blockHeavyAssets(page);
    await mockFormspreeSuccess(page);
  });

  test("no CV/file field exists, multi-select works, multiline is preserved, and success swaps the SAME dialog in place", async ({ page }) => {
    let capturedBody = "";
    await page.route(/formspree\.io/, async (route) => {
      capturedBody = route.request().postData() ?? "";
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await gotoAndStabilize(page, "/work-with-us");
    const trigger = page.getByRole("button", { name: /Apply now/i });
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    // No file input anywhere in the modal — the old CV upload is gone.
    expect(await dialog.locator('input[type="file"]').count()).toBe(0);

    await dialog.locator('input[name="name"]').fill("QA Work With Us");
    await dialog.locator('input[name="email"]').fill("qa-wwu@example.com");
    await dialog.locator('input[name="phone"]').fill("+45 22 33 44 55");
    await dialog.getByRole("checkbox", { name: /Social media/i }).check();
    await dialog.getByRole("checkbox", { name: "Other" }).check();
    const multilineExperience =
      "I have worked in hospitality for five years.\nI have experience with customer service.\n\nI can also help with:\n- food preparation\n- event setup\n- social media";
    await dialog.locator('textarea[name="experience"]').fill(multilineExperience);
    await dialog.locator('textarea[name="whyRorum"]').fill("Because I care about community spaces.");
    await dialog.locator('input[name="privacyConsent"]').check();
    await dialog.getByRole("button", { name: /Send Application/i }).click();

    // Still exactly one dialog — success replaced the form in place.
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(dialog.getByRole("button", { name: "Done" })).toBeVisible();
    await expect(dialog.locator('input[name="name"]')).toHaveCount(0);

    // The REAL request body Formspree received. `submit()` POSTs a FormData
    // object, so the browser serializes it as multipart/form-data (raw part
    // bodies, not percent-encoded) — this proves the browser's own
    // serialization preserved every newline and blank-line paragraph break
    // exactly, and that role LABELS (not raw "role0"/"role7" ids) were sent.
    // Multipart wire bodies CRLF-normalize line breaks (a universal
    // web-platform encoding detail, not app behavior) — normalize back to
    // "\n" before comparing so the assertion checks structure, not wire
    // format.
    const normalizedBody = capturedBody.replace(/\r\n/g, "\n");
    expect(capturedBody).not.toContain("role0");
    expect(capturedBody).not.toContain("role7");
    expect(normalizedBody).toContain("Social media & content, Other");
    expect(normalizedBody).toContain(multilineExperience);
    expect(capturedBody).not.toContain('name="cv"');

    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("EN/DA/UK: modal title and role-interest label render the locale's own Sanity-backed text", async ({ page }) => {
    const cases: { locale: string; path: string; triggerName: RegExp; title: string }[] = [
      { locale: "EN", path: "/work-with-us", triggerName: /Apply now/i, title: "Apply to work with us" },
      { locale: "DA", path: "/da/work-with-us", triggerName: /Ansøg nu/i, title: "Ansøg om at arbejde med os" },
      { locale: "UK", path: "/uk/work-with-us", triggerName: /Подати заявку/i, title: "Подайте заявку на співпрацю" },
    ];
    for (const { path, triggerName, title } of cases) {
      await gotoAndStabilize(page, path);
      await page.getByRole("button", { name: triggerName }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("heading", { name: title })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
  });

  test("EN/DA/UK: Full name/Email/Phone placeholders render the exact Sanity-backed example text, not the field labels", async ({ page }) => {
    const cases: { path: string; triggerName: RegExp; name: string; email: string; phone: string }[] = [
      { path: "/work-with-us", triggerName: /Apply now/i, name: "e.g. Anna Jensen", email: "e.g. anna@example.com", phone: "e.g. +45 12 34 56 78" },
      { path: "/da/work-with-us", triggerName: /Ansøg nu/i, name: "f.eks. Anna Jensen", email: "f.eks. anna@example.com", phone: "f.eks. +45 12 34 56 78" },
      { path: "/uk/work-with-us", triggerName: /Подати заявку/i, name: "напр. Анна Іваненко", email: "напр. anna@example.com", phone: "напр. +45 12 34 56 78" },
    ];
    for (const { path, triggerName, name, email, phone } of cases) {
      await gotoAndStabilize(page, path);
      await page.getByRole("button", { name: triggerName }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.locator('input[name="name"]')).toHaveAttribute("placeholder", name);
      await expect(dialog.locator('input[name="email"]')).toHaveAttribute("placeholder", email);
      await expect(dialog.locator('input[name="phone"]')).toHaveAttribute("placeholder", phone);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
  });

  test("role checkbox is vertically centered against the full row height, for both one-line and a genuinely-wrapped two-line label (Ukrainian, narrow viewport)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await gotoAndStabilize(page, "/uk/work-with-us");
    await page.getByRole("button", { name: /Подати заявку/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const rows = dialog.locator('fieldset input[name="roleInterest"]').locator("..");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(1);

    const heights: number[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const rowBox = await row.boundingBox();
      const checkboxBox = await row.locator('input[name="roleInterest"]').boundingBox();
      expect(rowBox).not.toBeNull();
      expect(checkboxBox).not.toBeNull();
      if (!rowBox || !checkboxBox) continue;
      heights.push(rowBox.height);

      const rowCenter = rowBox.y + rowBox.height / 2;
      const checkboxCenter = checkboxBox.y + checkboxBox.height / 2;
      // flex-shrink:0 + items-center on the row keeps the checkbox centered
      // against the FULL row height regardless of 1-line vs 2-line wrap —
      // no per-locale CSS hack, no fixed height clipping Ukrainian text.
      expect(Math.abs(rowCenter - checkboxCenter)).toBeLessThanOrEqual(2);
    }

    // Prove this test actually exercised a wrapped 2-line row, not just
    // uniform 1-line rows (which would make the centering check trivial).
    const shortest = Math.min(...heights);
    const tallest = Math.max(...heights);
    expect(tallest).toBeGreaterThan(shortest * 1.3);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
