import { expect, test } from "@playwright/test";
import { createClient } from "@sanity/client";
import { localizedHref } from "@/lib/i18n";

/**
 * Read-only schema-to-frontend connection proof for the Community Membership
 * page's localized editorial content (MIGRATION_REPORT.md Part 34, Phase A).
 *
 * Same approach as cms-about-contract.spec.ts: fetch the live *published*
 * Sanity value and assert the rendered page (EN / DA / UK) actually shows it.
 * Part 34 backfilled every field asserted below with real EN + DA + UK values
 * (script: scripts/backfill-community-membership-donation-copy.ts), so a
 * missing locale here is a regression, not an expected gap — these assert
 * truthy first, then visible.
 *
 * Bank table: the row LABEL is localized (EN/DA/UK, Part 32); the row VALUE is
 * a single source string shown identically in every locale (never localized —
 * IBAN / SWIFT / account number / beneficiary). Both halves of that contract
 * are asserted explicitly.
 */

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  useCdn: true,
  perspective: "published",
});

interface I18nEntry {
  language?: string;
  value?: string;
}
interface RawItem {
  itemKey?: string;
  title?: I18nEntry[];
  text?: I18nEntry[];
  value?: string;
}
interface RawSection {
  sectionKey?: string;
  label?: I18nEntry[];
  title?: I18nEntry[];
  text?: I18nEntry[];
  items?: RawItem[];
}
interface RawPage {
  sections?: RawSection[];
}

function pick(entries: I18nEntry[] | undefined, lang: string): string | undefined {
  return entries?.find((e) => e.language === lang)?.value;
}

test.describe("Community Membership content contract — localized editorial copy (read-only)", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET,
    "Sanity not configured in this environment",
  );

  let page_: RawPage = {};

  test.beforeAll(async () => {
    page_ = await sanity.fetch<RawPage>(
      `*[_id == "page-community-membership"][0]{
        "sections": sections[]{
          sectionKey, label, title, text,
          "items": items[]{itemKey, title, text, value}
        }
      }`,
    );
  });

  const byKey = (key: string) => page_.sections?.find((s) => s.sectionKey === key);
  const itemByKey = (section: RawSection | undefined, key: string) =>
    section?.items?.find((i) => i.itemKey === key);

  for (const locale of ["en", "da", "uk"] as const) {
    test.describe(`locale: ${locale}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(localizedHref("/community-membership", locale));
      });

      // ---- donation section (#support-wecoda) --------------------------------
      test("donation section eyebrow / heading / paragraph", async ({ page }) => {
        const section = byKey("donation");
        const donation = page.locator("#support-wecoda");
        for (const [field, entries] of [
          ["label", section?.label],
          ["title", section?.title],
          ["text", section?.text],
        ] as const) {
          const value = pick(entries, locale);
          expect(value, `donation ${field} must be published for "${locale}"`).toBeTruthy();
          await expect(donation.getByText(value!, { exact: true }).first()).toBeVisible();
        }
      });

      test("donation message rows (scan / or / bank-transfer / bank-details title / support note)", async ({ page }) => {
        const section = byKey("donation");
        const donation = page.locator("#support-wecoda");
        for (const key of ["scanText", "scanSubtext", "orText", "bankTransferText", "bankDetailsTitle"]) {
          const value = pick(itemByKey(section, key)?.title, locale);
          expect(value, `donation "${key}" must be published for "${locale}"`).toBeTruthy();
          await expect(donation.getByText(value!, { exact: true }).first()).toBeVisible();
        }
        const support = pick(itemByKey(section, "supportText")?.text, locale);
        expect(support, `donation supportText must be published for "${locale}"`).toBeTruthy();
        await expect(donation.getByText(support!, { exact: true })).toBeVisible();
      });

      // ---- bank table: localized label, single-source value ------------------
      test("bank rows — label is localized, value is identical in every locale", async ({ page }) => {
        const section = byKey("donation");
        const bankRows = (section?.items ?? []).filter(
          (i) => i.itemKey?.startsWith("bank") && (i.value ?? "").trim().length > 0,
        );
        expect(bankRows.length, "expected the 9 populated bank rows").toBeGreaterThanOrEqual(9);
        const panel = page.locator("#wecoda-bank-panel");
        for (const row of bankRows) {
          const label = pick(row.title, locale);
          expect(label, `bank row "${row.itemKey}" label must be published for "${locale}"`).toBeTruthy();
          // The value is a single source string — the SAME text on /, /da and /uk.
          const value = row.value!;
          await expect(panel.getByRole("term").filter({ hasText: label! }).first()).toBeVisible();
          await expect(panel.getByText(value, { exact: true }).first()).toBeVisible();
        }
      });

      test("bank label is actually translated away from English on non-EN locales", async ({ page }) => {
        test.skip(locale === "en", "EN is the source locale");
        const beneficiary = itemByKey(byKey("donation"), "bank0");
        const en = pick(beneficiary?.title, "en");
        const loc = pick(beneficiary?.title, locale);
        expect(loc, `bank0 label must be published for "${locale}"`).toBeTruthy();
        expect(loc, "bank0 label should differ from English (it was translated in Part 32)").not.toBe(en);
        await expect(page.locator("#wecoda-bank-panel").getByText(loc!, { exact: true }).first()).toBeVisible();
      });

      // ---- intro / benefits / gallery section headers -----------------------
      test("intro section eyebrow + heading", async ({ page }) => {
        const section = byKey("intro");
        for (const entries of [section?.label, section?.title]) {
          const value = pick(entries, locale);
          expect(value, `intro header must be published for "${locale}"`).toBeTruthy();
          await expect(page.getByText(value!, { exact: true }).first()).toBeVisible();
        }
      });

      test("benefits section eyebrow (newly wired to Sanity) + heading", async ({ page }) => {
        const section = byKey("benefits");
        const eyebrow = pick(section?.label, locale);
        const heading = pick(section?.title, locale);
        expect(eyebrow, `benefits label must be published for "${locale}"`).toBeTruthy();
        expect(heading, `benefits title must be published for "${locale}"`).toBeTruthy();
        const benefits = page.locator(".wecoda-benefits-section");
        await expect(benefits.getByText(eyebrow!, { exact: true })).toBeVisible();
        await expect(benefits.getByRole("heading", { name: heading! })).toBeVisible();
      });

      test("gallery section eyebrow + heading", async ({ page }) => {
        const section = byKey("gallery");
        const gallery = page.locator(".wecoda-membership-week-section");
        for (const entries of [section?.label, section?.title]) {
          const value = pick(entries, locale);
          expect(value, `gallery header must be published for "${locale}"`).toBeTruthy();
          await expect(gallery.getByText(value!, { exact: true }).first()).toBeVisible();
        }
      });
    });
  }

  test("donation copy is genuinely trilingual — EN, DA and UK strings all differ", () => {
    const t = byKey("donation")?.title;
    const en = pick(t, "en");
    const da = pick(t, "da");
    const uk = pick(t, "uk");
    expect(en && da && uk).toBeTruthy();
    expect(new Set([en, da, uk]).size, "donation title should have 3 distinct localizations").toBe(3);
  });
});
