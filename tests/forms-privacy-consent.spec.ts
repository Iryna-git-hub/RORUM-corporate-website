import { expect, test, type Page } from "@playwright/test";
import { gotoAndStabilize } from "./support";

/**
 * Real-browser proof that Privacy Policy consent is mandatory on EVERY
 * RORUM submission form. Written after a live Formspree submission from the
 * Host at RORUM (booking) form showed `Consent: No` — that form's
 * `PrivacyConsent` was rendered with `required={false}` and its own
 * `onSubmit` never called `validatePrivacyConsent()` at all, so the browser
 * never blocked it. Fixed in `components/InquiryForm.tsx` (booking branch)
 * and backed by a second, independent guard in
 * `lib/useFormspreeSubmit.ts`'s `submit()`, which now refuses to deliver ANY
 * form (all 6) unless `privacyConsent === "on"`.
 *
 * This local environment has a REAL `NEXT_PUBLIC_FORMSPREE_ENDPOINT`
 * configured, so every test here intercepts the `formspree.io` POST itself —
 * nothing is ever actually delivered, whether the test expects success or
 * rejection. Bandwidth-safe: Sanity CDN image/video requests are aborted.
 */

async function blockHeavyAssets(page: Page) {
  await page.route(/cdn\.sanity\.io\/(images|files)\//, (route) => route.abort());
}

/** Captures the outgoing Formspree POST (as parsed name -> value fields) and fulfills it locally — never delivered. */
async function interceptFormspree(page: Page): Promise<() => Record<string, string> | undefined> {
  let fields: Record<string, string> | undefined;
  await page.route(/formspree\.io/, async (route) => {
    const body = route.request().postData() ?? "";
    const parsed: Record<string, string> = {};
    for (const part of body.split(/------WebKitFormBoundary\S+/)) {
      const m = part.match(/name="([^"]+)"\r?\n\r?\n([\s\S]*?)\r?\n?$/);
      if (m) parsed[m[1]!] = m[2]!.trim();
    }
    fields = parsed;
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  return () => fields;
}

/** Records any attempt to actually reach formspree.io (there must be none when consent is missing). */
async function watchFormspreeHits(page: Page): Promise<() => number> {
  let hits = 0;
  await page.route(/formspree\.io/, (route) => {
    hits++;
    return route.abort();
  });
  return () => hits;
}

test.describe("Privacy consent — checkbox is unchecked by default on every form", () => {
  test.beforeEach(async ({ page }) => blockHeavyAssets(page));

  test("Contact", async ({ page }) => {
    await gotoAndStabilize(page, "/contact");
    await expect(page.locator('input[name="privacyConsent"]')).not.toBeChecked();
  });

  test("Volunteer (modal)", async ({ page }) => {
    await gotoAndStabilize(page, "/volunteer");
    await page.getByRole("button", { name: /Apply to volunteer/i }).click();
    await expect(page.getByRole("dialog").locator('input[name="privacyConsent"]')).not.toBeChecked();
  });

  test("Work With Us (modal)", async ({ page }) => {
    await gotoAndStabilize(page, "/work-with-us");
    await page.getByRole("button", { name: /Apply now/i }).click();
    await expect(page.getByRole("dialog").locator('input[name="privacyConsent"]')).not.toBeChecked();
  });

  test("Catering", async ({ page }) => {
    await gotoAndStabilize(page, "/catering");
    await expect(page.locator('input[name="privacyConsent"]')).not.toBeChecked();
  });

  test("Event Decoration", async ({ page }) => {
    await gotoAndStabilize(page, "/event-decoration");
    await expect(page.locator('input[name="privacyConsent"]')).not.toBeChecked();
  });

  test("Host at RORUM (booking) — the form that shipped with this bug", async ({ page }) => {
    await gotoAndStabilize(page, "/host-at-rorum");
    await expect(page.locator('input[name="privacyConsent"]')).not.toBeChecked();
  });
});

test.describe("Privacy consent — blocked without it, on every form (mouse submit)", () => {
  test.beforeEach(async ({ page }) => blockHeavyAssets(page));

  test("Contact: valid submit without consent never reaches formspree.io", async ({ page }) => {
    const hits = await watchFormspreeHits(page);
    await gotoAndStabilize(page, "/contact");
    await page.fill('input[name="name"]', "QA NoConsent");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa-noconsent@example.com");
    await page.fill('textarea[name="message"]', "Should be blocked.");
    await page.locator('form button[type="submit"]').first().click();

    await expect(page.getByRole("alert").filter({ hasText: /agree to the Privacy policy/i })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator('input[name="name"]')).toHaveValue("QA NoConsent");
    expect(hits()).toBe(0);
  });

  test("Host at RORUM (booking): valid submit without consent never reaches formspree.io — the exact bug found live", async ({ page }) => {
    const hits = await watchFormspreeHits(page);
    await gotoAndStabilize(page, "/host-at-rorum");
    await page.fill('input[name="name"]', "QA NoConsent");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa-noconsent@example.com");
    await page.fill('input[name="eventDate"]', "2099-06-01");
    await page.fill('textarea[name="message"]', "Should be blocked.");
    await page.locator('form button[type="submit"]').first().click();

    await expect(page.getByRole("alert").filter({ hasText: /agree to the Privacy policy/i })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator('input[name="name"]')).toHaveValue("QA NoConsent");
    expect(hits()).toBe(0);
  });

  test("Event Decoration: valid submit without consent never reaches formspree.io", async ({ page }) => {
    const hits = await watchFormspreeHits(page);
    await gotoAndStabilize(page, "/event-decoration");
    await page.fill('input[name="name"]', "QA NoConsent");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa-noconsent@example.com");
    await page.fill('input[name="eventDate"]', "2099-06-01");
    await page.fill('textarea[name="message"]', "Should be blocked.");
    await page.locator('form button[type="submit"]').first().click();

    await expect(page.getByRole("alert").filter({ hasText: /agree to the Privacy policy/i })).toBeVisible();
    expect(hits()).toBe(0);
  });

  test("Catering: valid submit without consent never reaches formspree.io", async ({ page }) => {
    const hits = await watchFormspreeHits(page);
    await gotoAndStabilize(page, "/catering");
    await page.fill('input[name="name"]', "QA NoConsent");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa-noconsent@example.com");
    await page.fill('input[name="eventDate"]', "2099-06-01");
    await page.fill('textarea[name="message"]', "Should be blocked.");
    await page.getByRole("button", { name: /Request Catering/i }).click();

    await expect(page.getByRole("alert").filter({ hasText: /agree to the Privacy policy/i })).toBeVisible();
    expect(hits()).toBe(0);
  });

  test("Volunteer (modal): valid submit without consent never reaches formspree.io", async ({ page }) => {
    const hits = await watchFormspreeHits(page);
    await gotoAndStabilize(page, "/volunteer");
    await page.getByRole("button", { name: /Apply to volunteer/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator('input[name="name"]').fill("QA NoConsent");
    await dialog.locator('input[name="email"]').fill("qa-noconsent@example.com");
    await dialog.locator('input[name="phone"]').fill("+45 12 34 56 78");
    await dialog.locator('textarea[name="message"]').fill("Should be blocked.");
    await dialog.getByRole("button", { name: /Send Application/i }).click();

    await expect(dialog.getByRole("alert").filter({ hasText: /agree to the Privacy policy/i })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Done" })).toHaveCount(0);
    await expect(dialog.locator('input[name="name"]')).toHaveValue("QA NoConsent");
    expect(hits()).toBe(0);
  });

  test("Work With Us (modal): valid submit without consent never reaches formspree.io", async ({ page }) => {
    const hits = await watchFormspreeHits(page);
    await gotoAndStabilize(page, "/work-with-us");
    await page.getByRole("button", { name: /Apply now/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator('input[name="name"]').fill("QA NoConsent");
    await dialog.locator('input[name="email"]').fill("qa-noconsent@example.com");
    await dialog.locator('input[name="phone"]').fill("+45 12 34 56 78");
    await dialog.getByRole("checkbox", { name: /Social media/i }).check();
    await dialog.locator('textarea[name="experience"]').fill("Experience.");
    await dialog.locator('textarea[name="whyRorum"]').fill("Why.");
    await dialog.getByRole("button", { name: /Send Application/i }).click();

    await expect(dialog.getByRole("alert").filter({ hasText: /agree to the Privacy policy/i })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Done" })).toHaveCount(0);
    expect(hits()).toBe(0);
  });
});

test.describe("Privacy consent — keyboard-only submission is blocked exactly like a mouse click", () => {
  test.beforeEach(async ({ page }) => blockHeavyAssets(page));

  test("Host at RORUM (booking): pressing Enter in a text field without consent is blocked", async ({ page }) => {
    const hits = await watchFormspreeHits(page);
    await gotoAndStabilize(page, "/host-at-rorum");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa-keyboard@example.com");
    await page.fill('input[name="eventDate"]', "2099-06-01");
    await page.fill('textarea[name="message"]', "Keyboard submit test.");
    const name = page.locator('input[name="name"]');
    await name.fill("QA Keyboard");
    await name.press("Enter");

    await expect(page.getByRole("alert").filter({ hasText: /agree to the Privacy policy/i })).toBeVisible();
    expect(hits()).toBe(0);
  });
});

test.describe("Privacy consent — checking it allows a genuinely valid submission through, with Consent: Yes", () => {
  test.beforeEach(async ({ page }) => blockHeavyAssets(page));

  test("Host at RORUM (booking): checking consent after a blocked attempt succeeds without re-entering anything else", async ({ page }) => {
    const getFields = await interceptFormspree(page);
    await gotoAndStabilize(page, "/host-at-rorum");
    await page.fill('input[name="name"]', "QA WithConsent");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa-withconsent@example.com");
    await page.fill('input[name="eventDate"]', "2099-06-01");
    await page.fill('textarea[name="message"]', "Should succeed once checked.");
    await page.locator('form button[type="submit"]').first().click();
    await expect(page.getByRole("alert").filter({ hasText: /agree to the Privacy policy/i })).toBeVisible();

    await page.locator('input[name="privacyConsent"]').check();
    await page.locator('form button[type="submit"]').first().click();

    await expect(page.getByRole("dialog")).toBeVisible();
    const fields = getFields();
    expect(fields?.Consent).toBe("Yes");
    expect(fields?.Name).toBe("QA WithConsent");
  });

  test("Contact (DA locale): a valid, consented submission delivers with Consent: Yes", async ({ page }) => {
    const getFields = await interceptFormspree(page);
    await gotoAndStabilize(page, "/da/contact");
    await page.fill('input[name="name"]', "QA Consent DA");
    await page.fill('input[name="phone"]', "+45 12 34 56 78");
    await page.fill('input[name="email"]', "qa-da@example.com");
    await page.fill('textarea[name="message"]', "Dansk test.");
    await page.locator('input[name="privacyConsent"]').check();
    await page.locator('form button[type="submit"]').first().click();

    await expect(page.getByRole("dialog")).toBeVisible();
    const fields = getFields();
    expect(fields?.Consent).toBe("Yes");
    expect(fields?.Language).toBe("Danish");
  });

  test("Work With Us (UK locale, modal): a valid, consented submission delivers with Consent: Yes", async ({ page }) => {
    const getFields = await interceptFormspree(page);
    await gotoAndStabilize(page, "/uk/work-with-us");
    await page.getByRole("button", { name: /Подати заявку/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator('input[name="name"]').fill("QA Consent UK");
    await dialog.locator('input[name="email"]').fill("qa-uk@example.com");
    await dialog.locator('input[name="phone"]').fill("+45 12 34 56 78");
    await dialog.getByRole("checkbox", { name: "Соціальні мережі та контент" }).check();
    await dialog.locator('textarea[name="experience"]').fill("Experience.");
    await dialog.locator('textarea[name="whyRorum"]').fill("Why.");
    await dialog.locator('input[name="privacyConsent"]').check();
    await dialog.getByRole("button", { name: /Надіслати заявку/i }).click();

    await expect(dialog.getByRole("button", { name: /Готово/i })).toBeVisible();
    const fields = getFields();
    expect(fields?.Consent).toBe("Yes");
    expect(fields?.Language).toBe("Ukrainian");
  });
});

test.describe("Privacy consent — Privacy Policy link works from the consent copy", () => {
  test.beforeEach(async ({ page }) => blockHeavyAssets(page));

  test("Host at RORUM: clicking the Privacy Policy link opens the policy, in the current locale", async ({ page }) => {
    await gotoAndStabilize(page, "/da/host-at-rorum");
    await page.getByRole("button", { name: /Privatlivspolitik/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

test.describe("Privacy consent — reopening a form after a previous successful submission starts unchecked", () => {
  test.beforeEach(async ({ page }) => blockHeavyAssets(page));

  test("Work With Us (modal): Done, then reopen, then consent is unchecked again", async ({ page }) => {
    await page.route(/formspree\.io/, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
    );
    await gotoAndStabilize(page, "/work-with-us");
    const trigger = page.getByRole("button", { name: /Apply now/i });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await dialog.locator('input[name="name"]').fill("QA Reopen");
    await dialog.locator('input[name="email"]').fill("qa-reopen@example.com");
    await dialog.locator('input[name="phone"]').fill("+45 12 34 56 78");
    await dialog.getByRole("checkbox", { name: /Social media/i }).check();
    await dialog.locator('textarea[name="experience"]').fill("Experience.");
    await dialog.locator('textarea[name="whyRorum"]').fill("Why.");
    await dialog.locator('input[name="privacyConsent"]').check();
    await dialog.getByRole("button", { name: /Send Application/i }).click();
    await expect(dialog.getByRole("button", { name: "Done" })).toBeVisible();
    await dialog.getByRole("button", { name: "Done" }).click();

    await trigger.click();
    await expect(page.getByRole("dialog").locator('input[name="privacyConsent"]')).not.toBeChecked();
  });
});
