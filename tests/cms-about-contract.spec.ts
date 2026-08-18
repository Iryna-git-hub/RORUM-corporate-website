import { expect, test } from "@playwright/test";
import { createClient } from "@sanity/client";
import { localizedHref } from "@/lib/i18n";

/**
 * Read-only schema-to-frontend connection proof for the About page content
 * contract (lib/content-contracts/about.ts). Same approach as
 * cms-home-contract.spec.ts: fetch the live, published Sanity value and
 * assert the rendered page (EN/DA/UK) actually shows it.
 *
 * About's JSX currently has no `data-testid` attributes (unlike Home, which
 * added them as an approved fix) — this audit pass is read-only and does
 * not modify about/page.tsx, so selectors below use markers already present
 * in the source: `aria-label` attributes on the quick-link containers, ARIA
 * roles for headings, exact text matches for paragraphs, and the
 * `.next-step-section-not-sure` class already used by the closing CTA. None
 * of these are Tailwind-utility-coupled.
 *
 * Fields classified "disconnected" (see the contract) are NOT asserted as
 * rendered here — asserting a hardcoded value would just prove the defect
 * exists twice. Each has a documenting `test.skip` naming the contract
 * classification instead, so "not connected yet" stays a visible, explained
 * fact rather than a silent gap.
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
interface RawAction {
  actionKey?: string;
  label?: I18nEntry[];
  href?: string;
  openInNewTab?: boolean;
  enabled?: boolean;
}
interface RawItem {
  itemKey?: string;
  icon?: string;
  title?: I18nEntry[];
  text?: I18nEntry[];
  label?: I18nEntry[];
  href?: string;
}
interface RawMedia {
  alt?: I18nEntry[];
}
interface RawSetting {
  key?: string;
  value?: string;
}
interface RawSection {
  sectionKey?: string;
  label?: I18nEntry[];
  title?: I18nEntry[];
  text?: I18nEntry[];
  media?: RawMedia[];
  actions?: RawAction[];
  items?: RawItem[];
  settings?: RawSetting[];
}
interface RawPage {
  seo?: { title?: I18nEntry[]; description?: I18nEntry[] };
  sections?: RawSection[];
}

function pick(entries: I18nEntry[] | undefined, lang: string): string | undefined {
  return entries?.find((e) => e.language === lang)?.value;
}

test.describe("About content contract — schema-to-frontend connection (read-only)", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET,
    "Sanity not configured in this environment",
  );

  let page_: RawPage = {};

  test.beforeAll(async () => {
    page_ = await sanity.fetch<RawPage>(
      `*[_id == "page-about"][0]{
        "seo": seo{title, description},
        "sections": sections[]{
          sectionKey, label, title, text,
          "media": media[]{alt},
          "actions": actions[]{actionKey, label, href, openInNewTab, enabled},
          "items": items[]{itemKey, icon, title, text, label, href},
          settings
        }
      }`,
    );
  });

  const byKey = (key: string) => page_.sections?.find((s) => s.sectionKey === key);
  const itemByKey = (section: RawSection | undefined, key: string) => section?.items?.find((i) => i.itemKey === key);

  for (const locale of ["en", "da", "uk"] as const) {
    test.describe(`locale: ${locale}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(localizedHref("/about", locale));
      });

      // ---- hero ------------------------------------------------------------
      test("hero label", async ({ page }) => {
        const value = pick(byKey("hero")?.label, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByText(value!, { exact: true }).first()).toBeVisible();
      });

      test("hero H1", async ({ page }) => {
        const value = pick(byKey("hero")?.title, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(value!);
      });

      test("hero lead paragraph", async ({ page }) => {
        const value = pick(byKey("hero")?.text, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByText(value!, { exact: true })).toBeVisible();
      });

      test("hero intro quick links (label + href, by stable key)", async ({ page }) => {
        const section = byKey("hero");
        const container = page.locator('[aria-label="RORUM event paths"]');
        for (const key of ["intro0", "intro1"]) {
          const item = itemByKey(section, key);
          const label = pick(item?.label, locale);
          if (!label || !item?.href) continue;
          const link = container.getByRole("link", { name: label });
          await expect(link).toHaveAttribute("href", localizedHref(item.href, locale));
        }
      });

      test("atmosphere images (3, real Sanity assets, localized alt text)", async ({ page }) => {
        const media = byKey("hero")?.media ?? [];
        test.skip(media.length !== 3, "expected exactly 3 atmosphere media items");
        const imgs = page.locator('[aria-label="RORUM atmosphere"] img');
        await expect(imgs).toHaveCount(3);
        for (let i = 0; i < media.length; i++) {
          const alt = pick(media[i]?.alt, locale);
          if (!alt) continue;
          await expect(imgs.nth(i)).toHaveAttribute("alt", alt);
          await expect(imgs.nth(i)).toHaveAttribute("src", /cdn\.sanity\.io/);
        }
      });

      // ---- statement ---------------------------------------------------------
      test("statement title", async ({ page }) => {
        const value = pick(byKey("statement")?.title, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByRole("heading", { level: 2, name: value! })).toBeVisible();
      });

      test("statement text (rendered, but NOT editable in Studio — see contract note)", async ({ page }) => {
        const value = pick(byKey("statement")?.text, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByText(value!, { exact: true })).toBeVisible();
      });

      test("statement service quick links (label + href, by stable key)", async ({ page }) => {
        const section = byKey("statement");
        const container = page.locator('[aria-label="RORUM service paths"]');
        for (const key of ["service0", "service1"]) {
          const item = itemByKey(section, key);
          const label = pick(item?.label, locale);
          if (!label || !item?.href) continue;
          const link = container.getByRole("link", { name: label });
          await expect(link).toHaveAttribute("href", localizedHref(item.href, locale));
        }
      });

      // ---- community ---------------------------------------------------------
      test("community title", async ({ page }) => {
        const value = pick(byKey("community")?.title, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByRole("heading", { level: 2, name: value! })).toBeVisible();
      });

      test("community text (rendered, but NOT editable in Studio — see contract note)", async ({ page }) => {
        const value = pick(byKey("community")?.text, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByText(value!, { exact: true })).toBeVisible();
      });

      test("community quick links (label + href, by stable key)", async ({ page }) => {
        const section = byKey("community");
        const container = page.locator('[aria-label="Community paths"]');
        for (const key of ["community0", "community1", "community2"]) {
          const item = itemByKey(section, key);
          const label = pick(item?.label, locale);
          if (!label || !item?.href) continue;
          const link = container.getByRole("link", { name: label });
          await expect(link).toHaveAttribute("href", localizedHref(item.href, locale));
        }
      });

      // ---- pillars -------------------------------------------------------------
      test("pillars label", async ({ page }) => {
        const value = pick(byKey("pillars")?.label, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByText(value!, { exact: true })).toBeVisible();
      });

      test("pillars title", async ({ page }) => {
        const value = pick(byKey("pillars")?.title, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByRole("heading", { level: 2, name: value! })).toBeVisible();
      });

      test("pillars text", async ({ page }) => {
        const value = pick(byKey("pillars")?.text, locale);
        test.skip(!value, "no published value for this locale yet");
        await expect(page.getByText(value!, { exact: true })).toBeVisible();
      });

      test("4 principle cards render by stable key, in order, with title + text", async ({ page }) => {
        const section = byKey("pillars");
        for (const key of ["pillar0", "pillar1", "pillar2", "pillar3"]) {
          const item = itemByKey(section, key);
          const title = pick(item?.title, locale);
          const text = pick(item?.text, locale);
          if (!title) continue;
          await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();
          if (text) await expect(page.getByText(text, { exact: true })).toBeVisible();
        }
      });

      // ---- closingCta ------------------------------------------------------------
      test("closing CTA eyebrow/title/text", async ({ page }) => {
        const closing = page.locator(".next-step-section-not-sure");
        const section = byKey("closingCta");
        const eyebrow = pick(section?.label, locale);
        const title = pick(section?.title, locale);
        const text = pick(section?.text, locale);
        if (eyebrow) await expect(closing.getByText(eyebrow, { exact: true })).toBeVisible();
        if (title) await expect(closing.getByRole("heading", { level: 2, name: title })).toBeVisible();
        if (text) await expect(closing.getByText(text, { exact: true })).toBeVisible();
      });

      test("closing CTA button label", async ({ page }) => {
        const closing = page.locator(".next-step-section-not-sure");
        const action = byKey("closingCta")?.actions?.find((a) => a.actionKey === "main");
        const label = pick(action?.label, locale);
        test.skip(!label, "no published value for this locale yet");
        await expect(closing.getByRole("link", { name: label! })).toBeVisible();
      });

      test("closing CTA button href (FIXED — now wired via resolveAction())", async ({ page }) => {
        const closing = page.locator(".next-step-section-not-sure");
        const action = byKey("closingCta")?.actions?.find((a) => a.actionKey === "main");
        test.skip(!action?.href, "no published href for this locale yet");
        await expect(closing.getByRole("link", { name: pick(action?.label, locale) ?? "" })).toHaveAttribute(
          "href",
          localizedHref(action!.href!, locale),
        );
      });

      test("closing CTA openInNewTab / enabled (FIXED — now wired via resolveAction())", async ({ page }) => {
        const closing = page.locator(".next-step-section-not-sure");
        const action = byKey("closingCta")?.actions?.find((a) => a.actionKey === "main");
        const link = closing.getByRole("link", { name: pick(action?.label, locale) ?? "" });
        if (action?.enabled === false) {
          await expect(link).toHaveCount(0);
        } else if (action?.openInNewTab) {
          await expect(link).toHaveAttribute("target", "_blank");
          await expect(link).toHaveAttribute("rel", "noopener noreferrer");
        } else {
          await expect(link).not.toHaveAttribute("target", "_blank");
        }
      });

      test("closing CTA settings.variant (correctly hidden in Studio, unread by the frontend — see contract)", async () => {
        test.skip(
          true,
          "correctly-hidden: sectionKind \"cta\" never shows the settings field in Studio (verified this pass — see the Studio Visibility Contract); about/page.tsx also still hardcodes variant=\"final\" as a JSX literal, so there is nothing to assert against a rendered value even if it were visible",
        );
      });

      test("closing FAQ prompt (question + label)", async ({ page }) => {
        const closing = page.locator(".next-step-section-not-sure");
        const section = byKey("closingCta");
        const question = pick(itemByKey(section, "faqQuestion")?.title, locale);
        const label = pick(itemByKey(section, "faqLabel")?.title, locale);
        if (question) await expect(closing.getByText(question, { exact: true })).toBeVisible();
        if (label) await expect(closing.getByRole("link", { name: label })).toBeVisible();
      });

      test("closing suggested-path links (by stable key, in order)", async ({ page }) => {
        const section = byKey("closingCta");
        const container = page.locator('[aria-label="Suggested paths"]');
        for (const key of ["link0", "link1", "link2", "link3"]) {
          const item = itemByKey(section, key);
          const label = pick(item?.label, locale);
          if (!label || !item?.href) continue;
          const link = container.getByRole("link", { name: label });
          await expect(link).toHaveAttribute("href", localizedHref(item.href, locale));
        }
      });

      // ---- SEO (FIXED — now wired with Home's fallback chain) ---------------------------------------
      test("SEO title falls back to the hardcoded default when Sanity has no value", async ({ page }) => {
        const value = pick(page_.seo?.title, locale);
        test.skip(!!value, "a value is published for this locale — see the companion 'reflects the published value' test instead");
        await expect(page).toHaveTitle("About");
      });

      test("SEO title reflects the published Sanity value when present", async ({ page }) => {
        const value = pick(page_.seo?.title, locale);
        test.skip(!value, "no published SEO title for this locale yet — see the companion fallback test instead");
        await expect(page).toHaveTitle(value!);
      });

      test("SEO description falls back to the hardcoded default when Sanity has no value", async ({ page }) => {
        const value = pick(page_.seo?.description, locale);
        test.skip(!!value, "a value is published for this locale — see the companion 'reflects the published value' test instead");
        await expect(page.locator('head meta[name="description"]')).toHaveAttribute(
          "content",
          "Learn about RORUM, a small curated ground-floor creative and event space in Copenhagen.",
        );
      });

      test("SEO description reflects the published Sanity value when present", async ({ page }) => {
        const value = pick(page_.seo?.description, locale);
        test.skip(!value, "no published value for this locale yet — see the companion fallback test instead");
        await expect(page.locator('head meta[name="description"]')).toHaveAttribute("content", value!);
      });
    });
  }
});
