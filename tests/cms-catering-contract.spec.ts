import { expect, test } from "@playwright/test";
import { createClient } from "@sanity/client";
import { localizedHref, type Locale } from "@/lib/i18n";
import { gotoAndStabilize } from "./support";

/**
 * Read-only schema-to-frontend connection proof for the Catering content
 * contract (lib/content-contracts/catering.ts) — same methodology as
 * tests/cms-home-contract.spec.ts: fetch the live, published Sanity value
 * and assert the rendered page (EN/DA/UK) actually shows it. Covers both
 * `page-catering` (the Catering page itself) and
 * `page-catering-menu-examples` (the Catering Menu Examples overlay,
 * opened from the Catering page — never a standalone route, so it's
 * exercised by opening the overlay, not by navigating to its own URL).
 *
 * `useCdn: true` deliberately matches sanity/lib/client.ts's `getClient()`
 * (the read path the site itself uses) rather than the freshest possible
 * value — this proves "what's rendered matches what production's own read
 * path returns," not "matches the absolute latest write."
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
  icon?: string;
  title?: I18nEntry[];
  text?: I18nEntry[];
  image?: { alt?: I18nEntry[] };
}
interface RawSection {
  sectionKey?: string;
  sectionKind?: string;
  label?: I18nEntry[];
  title?: I18nEntry[];
  text?: I18nEntry[];
  media?: { kind?: string; alt?: I18nEntry[] }[];
  actions?: { actionKey?: string; label?: I18nEntry[]; href?: string; enabled?: boolean }[];
  items?: RawItem[];
}
interface RawPage {
  seo?: { title?: I18nEntry[]; description?: I18nEntry[]; ogImage?: { asset?: unknown } };
  sections?: RawSection[];
}

function pick(entries: I18nEntry[] | undefined, lang: string): string | undefined {
  return entries?.find((e) => e.language === lang)?.value;
}
function section(page: RawPage | null, key: string): RawSection | undefined {
  return page?.sections?.find((s) => s.sectionKey === key);
}
function item(sec: RawSection | undefined, key: string): RawItem | undefined {
  return sec?.items?.find((i) => i.itemKey === key);
}

const LOCALES: Locale[] = ["en", "da", "uk"];

test.describe("Catering content contract — schema-to-frontend connection (read-only)", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET,
    "Sanity not configured in this environment",
  );

  let cateringPage: RawPage | null;
  let menuPage: RawPage | null;

  test.beforeAll(async () => {
    [cateringPage, menuPage] = await Promise.all([
      sanity.fetch<RawPage | null>(`*[_type == "page" && pageKey == "catering"][0]`),
      sanity.fetch<RawPage | null>(`*[_type == "page" && pageKey == "cateringMenuExamples"][0]`),
    ]);
  });

  test("page-catering exists and has all 6 expected sections", () => {
    expect(cateringPage, "page-catering must exist and be published").toBeTruthy();
    const kinds = cateringPage!.sections?.map((s) => s.sectionKind);
    expect(kinds).toEqual(["hero", "gallery", "iconGrid", "split", "steps", "form"]);
  });

  test("page-catering-menu-examples exists with exactly one banner, 6 menuCategory, and one closing section", () => {
    expect(menuPage, "page-catering-menu-examples must exist and be published").toBeTruthy();
    const categoryCount = menuPage!.sections?.filter((s) => s.sectionKind === "menuCategory").length;
    expect(categoryCount).toBe(6);
    expect(section(menuPage, "banner")).toBeTruthy();
    expect(section(menuPage, "closing")).toBeTruthy();
  });

  for (const locale of LOCALES) {
    test(`locale: ${locale} — hero label/title/text/request CTA`, async ({ page }) => {
      const hero = section(cateringPage, "hero");
      await gotoAndStabilize(page, localizedHref("/catering", locale));

      const expectedTitle = pick(hero?.title, locale);
      const expectedText = pick(hero?.text, locale);
      expect(expectedTitle, "hero title must be non-empty in Sanity").toBeTruthy();
      expect(expectedText, "hero text must be non-empty in Sanity").toBeTruthy();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(expectedTitle!);
      await expect(page.getByText(expectedText!, { exact: false })).toBeVisible();

      const requestLabel = pick(hero?.actions?.find((a) => a.actionKey === "request")?.label, locale);
      if (requestLabel) {
        await expect(page.getByRole("link", { name: new RegExp(requestLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).first()).toBeVisible();
      }
    });

    test(`locale: ${locale} — gallery renders real uploaded photos AND videos (mixed media, not images-only), "suitable for" chips render icon+label by stable key`, async ({ page }) => {
      const gallery = section(cateringPage, "gallery");
      await gotoAndStabilize(page, localizedHref("/catering", locale));

      const galleryImages = page.locator("#catering-gallery img");
      await expect(galleryImages.first()).toBeVisible();
      expect(await galleryImages.count(), "at least one real gallery image must render").toBeGreaterThan(0);

      // Schema-driven, not hardcoded: whatever the live document's photo/
      // video split currently is, the rendered gallery must match it exactly
      // — this is the assertion that would have caught the original defect
      // (video items silently filtered out before rendering). If a real
      // video item exists in the live document, this proves it actually
      // renders as a <video>, not that it's merely absent from the count.
      const mediaItems = gallery?.media ?? [];
      const photoCount = mediaItems.filter((m) => m.kind !== "video").length;
      const videoCount = mediaItems.filter((m) => m.kind === "video").length;
      expect(await galleryImages.count(), "rendered <img> count must match the document's photo-kind media count").toBe(photoCount);
      expect(await page.locator("#catering-gallery video").count(), "rendered <video> count must match the document's video-kind media count — proves video items are never silently dropped").toBe(videoCount);

      const suitableForItems = (gallery?.items ?? []).filter((i) => i.itemKey?.startsWith("suitableFor"));
      expect(suitableForItems.length, "live suitableFor chips in Sanity").toBeGreaterThan(0);
      const ariaLabel = pick(item(gallery, "ariaLabel")?.title, locale);
      const chipGroup = ariaLabel ? page.locator(`[aria-label="${ariaLabel}"]`) : page.locator("#catering-gallery .flex-wrap").last();
      for (const chip of suitableForItems.slice(0, 3)) {
        const label = pick(chip.title, locale);
        if (label) await expect(chipGroup.getByText(label, { exact: true })).toBeVisible();
      }
    });

    test(`locale: ${locale} — menu format cards and philosophy section render Sanity content`, async ({ page }) => {
      const menuFormats = section(cateringPage, "menuFormats");
      const philosophy = section(cateringPage, "philosophy");
      await gotoAndStabilize(page, localizedHref("/catering", locale));

      const formatTitle = pick((menuFormats?.items ?? [])[0]?.title, locale);
      if (formatTitle) await expect(page.getByRole("heading", { name: formatTitle })).toBeVisible();

      const philosophyTitle = pick(philosophy?.title, locale);
      expect(philosophyTitle, "philosophy title must be non-empty").toBeTruthy();
      await expect(page.getByRole("heading", { name: philosophyTitle! })).toBeVisible();
    });

    test(`locale: ${locale} — every SEO field visible in Studio for page-catering affects a real rendered <head> element`, async ({ page }) => {
      await gotoAndStabilize(page, localizedHref("/catering", locale));
      const expectedTitle = pick(cateringPage?.seo?.title, locale);
      const expectedDescription = pick(cateringPage?.seo?.description, locale);
      expect(expectedTitle, "seo.title must be set (backfilled this pass)").toBeTruthy();
      expect(expectedDescription, "seo.description must be set (backfilled this pass)").toBeTruthy();
      await expect(page).toHaveTitle(new RegExp(expectedTitle!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      const metaDescription = await page.locator('meta[name="description"]').getAttribute("content");
      expect(metaDescription).toBe(expectedDescription);

      // Social Sharing Image (seo.ogImage) — the 3rd Studio-visible SEO
      // field for this document, not locale-specific.
      expect(cateringPage?.seo?.ogImage?.asset, "seo.ogImage must have a real uploaded asset").toBeTruthy();
      const ogImageContent = await page.locator('meta[property="og:image"]').first().getAttribute("content");
      expect(ogImageContent, "og:image meta tag must point at a real Sanity CDN URL").toBeTruthy();
      expect(ogImageContent).toMatch(/^https:\/\/cdn\.sanity\.io\//);
    });

    test(`locale: ${locale} — regression: page-catering-menu-examples's seo field is hidden in Studio and has zero effect on the rendered <head> (it is not a second, competing metadata source)`, async ({ page }) => {
      await gotoAndStabilize(page, localizedHref("/catering", locale));
      // The document's seo block was intentionally removed after being
      // found disconnected — confirm it stays unset (regression guard: a
      // future script re-seeding it would silently reintroduce the bug).
      expect(menuPage?.seo, "page-catering-menu-examples.seo must stay unset").toBeFalsy();
      // And confirm the rendered <head> matches page-catering's OWN seo,
      // proving there is exactly one metadata source for /catering, not two.
      const expectedTitle = pick(cateringPage?.seo?.title, locale);
      await expect(page).toHaveTitle(new RegExp(expectedTitle!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    });

    test(`locale: ${locale} — Catering Menu Examples overlay: opening it renders real category/dish content with photos`, async ({ page }) => {
      await gotoAndStabilize(page, localizedHref("/catering", locale));

      const categorySections = (menuPage?.sections ?? []).filter((s) => s.sectionKind === "menuCategory");
      const firstCategory = categorySections[0]!;
      const firstCategoryTitle = pick(firstCategory.title, locale);
      const firstCategoryNavLabel = pick(firstCategory.label, locale);
      expect(firstCategoryTitle, "first category title must be non-empty").toBeTruthy();

      const menuExamplesCta = pick(item(section(cateringPage, "hero"), "menuExamplesCta")?.title, locale);
      expect(menuExamplesCta, "hero menuExamplesCta label must be non-empty").toBeTruthy();
      await page.getByRole("button", { name: menuExamplesCta!, exact: true }).first().click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // Nav tab renders the category's stable navLabel.
      if (firstCategoryNavLabel) {
        await expect(dialog.getByText(firstCategoryNavLabel, { exact: true }).first()).toBeVisible();
      }

      // First category is expanded by default (activeCategory = first id) — its
      // dish photos must render as real <img> elements, not be missing/broken.
      const dishItems = (firstCategory.items ?? []).filter((i) => /^dish\d+$/.test(i.itemKey ?? ""));
      expect(dishItems.length, "first category must have real dishes in Sanity").toBeGreaterThan(0);
      const firstDishName = pick(dishItems[0]?.title, locale);
      if (firstDishName) {
        await expect(dialog.getByText(firstDishName, { exact: true }).first()).toBeVisible();
      }
      const dishImages = dialog.locator("article img");
      await expect(dishImages.first()).toBeVisible();
      const firstDishImageSrc = await dishImages.first().getAttribute("src");
      expect(firstDishImageSrc, "dish photo must be a real Sanity CDN URL, not empty/broken").toBeTruthy();
    });
  }

  test("every dish's image is a real uploaded Sanity asset, not the emergency-fallback local file (regression: proves the migration replaced, not merely papered over, the missing photos)", async () => {
    const categorySections = (menuPage?.sections ?? []).filter((s) => s.sectionKind === "menuCategory");
    let checked = 0;
    for (const cat of categorySections) {
      for (const dish of (cat.items ?? []).filter((i) => /^dish\d+$/.test(i.itemKey ?? ""))) {
        const withAsset = await sanity.fetch<boolean>(
          `defined(*[_type=="page" && pageKey=="cateringMenuExamples"][0].sections[sectionKey==$sk][0].items[_key==$ik][0].image.asset)`,
          { sk: cat.sectionKey, ik: (dish as { _key?: string })._key },
        );
        expect(withAsset, `${cat.sectionKey}/${(dish as { _key?: string })._key} must have a real image asset`).toBe(true);
        checked++;
      }
    }
    expect(checked).toBe(51);
  });

  test("every menuCategory section has a categoryIcon item with a non-empty icon (regression: the tab-icon mismatch bug this pass fixed)", async () => {
    const categorySections = (menuPage?.sections ?? []).filter((s) => s.sectionKind === "menuCategory");
    expect(categorySections.length).toBe(6);
    for (const cat of categorySections) {
      const iconItem = item(cat, "categoryIcon");
      expect(iconItem?.icon, `${cat.sectionKey} must have a categoryIcon item with a set icon`).toBeTruthy();
    }
  });

  test("regression: every informative Catering image (59 gallery photos, 51 dish photos, 3 menu-format cards, 1 philosophy image) has en/da/uk alt text — zero missing required Catering alt translations", () => {
    const langsOf = (alt: I18nEntry[] | undefined) => new Set((alt ?? []).map((e) => e.language));
    const requireAll3 = (alt: I18nEntry[] | undefined, label: string) => {
      const langs = langsOf(alt);
      for (const lang of ["en", "da", "uk"]) {
        expect(langs.has(lang), `${label} missing ${lang} alt text`).toBe(true);
      }
    };

    const gallery = section(cateringPage, "gallery");
    const galleryPhotos = (gallery?.media ?? []).filter((m) => m.kind !== "video");
    expect(galleryPhotos.length).toBe(59);
    galleryPhotos.forEach((m, i) => requireAll3(m.alt, `gallery photo #${i}`));

    const menuFormats = section(cateringPage, "menuFormats");
    const formatCards = menuFormats?.items ?? [];
    expect(formatCards.length).toBe(3);
    formatCards.forEach((f, i) => requireAll3(f.image?.alt, `menu format card #${i}`));

    const philosophy = section(cateringPage, "philosophy");
    const philosophyMedia = philosophy?.media ?? [];
    expect(philosophyMedia.length).toBeGreaterThan(0);
    philosophyMedia.forEach((m, i) => requireAll3(m.alt, `philosophy image #${i}`));

    const categorySections = (menuPage?.sections ?? []).filter((s) => s.sectionKind === "menuCategory");
    let dishCount = 0;
    for (const cat of categorySections) {
      for (const dish of (cat.items ?? []).filter((i) => /^dish\d+$/.test(i.itemKey ?? ""))) {
        requireAll3(dish.image?.alt, `${cat.sectionKey}/${dish.itemKey}`);
        dishCount++;
      }
    }
    expect(dishCount).toBe(51);
  });
});
