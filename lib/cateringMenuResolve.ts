import type { Locale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/sanity-i18n";
import { getItem, listItems, type RawPage } from "@/lib/sanity-sections";
import { sanitySectionItemAttr } from "@/sanity/lib/dataAttr";
import { urlForImage } from "@/sanity/lib/image";
import type { CateringMenuCategory } from "@/lib/cateringMenu";

/**
 * Resolves the Catering Menu Examples category list from
 * `page-catering-menu-examples`, distinguishing "the document is missing"
 * (Sanity unreachable, or the document itself was deleted — an emergency,
 * technical fallback to hardcoded content is appropriate) from "the
 * document exists but a manager has intentionally emptied its category
 * list" (must render as genuinely empty — [] — never resurrect the old
 * hardcoded categories). Extracted as its own pure function specifically so
 * this distinction is independently unit-testable without a live Sanity
 * fetch — see lib/cateringMenuResolve.test.ts.
 *
 * `newMenuPage === undefined` is the ONLY case that returns
 * `fallbackMenuCategories`. Every other case — including a document with
 * zero `menuCategory` sections — returns an array built purely from
 * `newMenuPage`, which is `[]` when there are no categories.
 */
export function resolveCateringMenuCategories(
  newMenuPage: RawPage | null | undefined,
  locale: Locale,
  fallbackMenuCategories: readonly CateringMenuCategory[],
  opts: { editable?: boolean } = {},
): CateringMenuCategory[] {
  if (!newMenuPage) return [...fallbackMenuCategories];

  const categorySections = (newMenuPage.sections ?? []).filter((s) => s.sectionKind === "menuCategory");

  return categorySections.map((cat, i) => {
    const fb = fallbackMenuCategories[i];
    const dishes = listItems(cat, ["categoryIcon"]);
    const iconItem = getItem(cat, "categoryIcon");
    return {
      id: cat.sectionKey ?? cat._key,
      title: pickLocalized(cat.title, locale) ?? fb?.title ?? "",
      navLabel: pickLocalized(cat.label, locale) ?? fb?.navLabel ?? "",
      description: pickLocalized(cat.text, locale) ?? fb?.description ?? "",
      icon: iconItem?.icon ?? undefined,
      featuredItems: dishes.map((item, j) => {
        const fbItem = fb?.featuredItems[j];
        const src =
          urlForImage(item.image as unknown as Parameters<typeof urlForImage>[0])
            ?.width(600)
            .height(338)
            .url() ?? fbItem?.image ?? "";
        return {
          name: pickLocalized(item.title, locale) ?? fbItem?.name ?? "",
          description: pickLocalized(item.text, locale) ?? fbItem?.description ?? "",
          image: src,
          alt: pickLocalized(item.image?.alt, locale) ?? fbItem?.alt ?? "",
          // Focuses the whole dish `contentItem` (name + description + image);
          // the row's stega text still targets the specific string field.
          editAttr: sanitySectionItemAttr(opts.editable ?? false, newMenuPage._id, cat._key, item._key),
        };
      }),
    };
  });
}
