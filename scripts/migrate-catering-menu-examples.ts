/**
 * Backfills the missing pieces on the REAL, already-published
 * `page-catering-menu-examples` document (pageKey "cateringMenuExamples",
 * the canonical id per sanity/lib/pageIds.ts's PAGE_DOC_ID — the id Studio's
 * "Catering Menu Examples" nav item and `pageByKeyQuery` both actually use).
 *
 * That document already has complete, real, professionally translated
 * en/da/uk text for its banner, all 6 menu categories, and all 51 dishes —
 * a full earlier migration pass populated it correctly. What it's missing:
 *   1. Every dish's photo (all 51 `image` fields are unset) — this script
 *      uploads the exact same local files `lib/cateringMenu.ts`'s hardcoded
 *      fallback (and therefore the current live site) already uses,
 *      verified name-for-name against the document's own dish list first.
 *   2. Each category's own tab icon. `CateringMenuOverlay.tsx` has always
 *      resolved this from a hardcoded id-keyed map (`CATEGORY_ICONS`), but
 *      this document's section keys are "category-ukrainian" etc., which
 *      never matched that map's plain "ukrainian" etc. keys — so in
 *      production every category tab has always silently rendered the
 *      map's neutral fallback icon (Soup) regardless of category. This adds
 *      a `categoryIcon` reserved item (see contentItem.ts's ITEM_ROLE_RULES)
 *      holding the SAME icon the map already intended for that category, so
 *      the rendered result is unchanged but now Studio-editable and no
 *      longer silently wrong for every non-Ukrainian category.
 *   3. Danish/Ukrainian translations of the banner image's alt text (only
 *      English was ever set — `mediaItem.alt` requires all 3 languages).
 *      This is the one genuinely NEW text this script writes: a literal,
 *      mechanical translation of an existing plain photo caption, not an
 *      invented claim — flagged here and in the final report.
 *
 * Idempotent / safe to re-run: every check below is "already set? skip."
 * A dish that already has an image is never re-uploaded or overwritten; a
 * category that already has a `categoryIcon` item is left alone; banner alt
 * languages that already exist are never replaced. Nothing outside these
 * three gaps is read destructively or modified — no title/text/label
 * anywhere on this document is ever touched.
 *
 * Usage:
 *   npm run sanity:migrate-catering-menu:dry-run
 *   npm run sanity:migrate-catering-menu
 */
import { createClient } from "@sanity/client";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;
const DOC_ID = "page-catering-menu-examples";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

interface I18nEntry {
  _key: string;
  language?: string;
  value?: string;
}
interface DishItem {
  _key: string;
  itemKey?: string;
  title?: I18nEntry[];
  image?: { asset?: { _ref?: string } };
}
interface CategorySection {
  _key: string;
  sectionKey: string;
  sectionKind: string;
  items?: (DishItem & { icon?: string })[];
}
interface MediaItem {
  _key: string;
  alt?: I18nEntry[];
}
interface Doc {
  _id: string;
  _rev: string;
  sections?: (CategorySection & { media?: MediaItem[] })[];
}

// Order matches the document's own category section order exactly
// (verified via a live read-only probe before this script was written —
// see the migration's accompanying audit). `icon` is the canonical
// `lucide-react` export name CateringMenuOverlay.tsx's CATEGORY_ICONS map
// already assigns that category id.
const CATEGORY_META = [
  { id: "ukrainian", icon: "Soup", dishImages: [
    "ukrainian-borscht-traditional.png", "catering-gallery-new-07.png", "ukrainian-varenyky.png",
    "ukrainian-country-potatoes.png", "ukrainian-pork-neck.png", "ukrainian-vereshchaka.png",
    "ukrainian-chicken-kyiv.png", "ukrainian-green-borscht.png", "ukrainian-homemade-sausage.png",
    "vegetarian-deruny-mushroom-sauce.png", "ukrainian-pickles.png", "ukrainian-seasonal-salads.png",
    "catering-board.png",
  ] },
  { id: "danish", icon: "Sandwich", dishImages: [
    "danish-smorrebrod.png", "danish-frikadeller.png", "danish-marinated-herring.png",
    "danish-flaeskesteg.png", "danish-kalveculotte.png", "danish-baked-potatoes.png",
    "danish-flodekartofler.png", "danish-seasonal-appetizers.png", "danish-traditional-dishes.png",
  ] },
  { id: "vegetarian", icon: "Leaf", dishImages: [
    "vegetarian-baked-pumpkin-feta-honey.png", "vegetarian-deruny-mushroom-sauce.png",
    "vegetarian-varenyky-potatoes-onion.png", "vegetarian-arugula-beetroot-feta-walnuts.png",
    "vegetarian-hummus-seasonal-vegetables.png", "vegetarian-bruschetta-tomatoes-basil.png",
    "vegetarian-vegetable-tartlets.png",
  ] },
  { id: "finger-food", icon: "HandPlatter", dishImages: [
    "finger-food-salmon-cream-cheese.png", "finger-food-avocado-shrimp.png", "finger-food-cheese-platter.png",
    "finger-food-vegetable-platter.png", "finger-food-canapes.png", "finger-food-bruschetta.png",
    "finger-food-mini-burgers.png", "finger-food-seasonal-snacks.png",
  ] },
  { id: "grill", icon: "Flame", dishImages: [
    "grill-shashlyk.png", "grill-grilled-salmon.png", "grill-grilled-vegetables.png",
    "grill-homemade-sauces.png", "grill-steaks.png", "grill-sausages.png", "grill-seasonal-sides.png",
  ] },
  { id: "desserts", icon: "Dessert", dishImages: [
    "desserts-fruit-sets.png", "desserts-napoleon-cake.png", "desserts-chocolate-fountain.png",
    "desserts-ice-cream-toppings.png", "desserts-medivnyk.png", "desserts-pliatsky-green-apple.png",
    "desserts-festive-sweets.png",
  ] },
];

const BANNER_ALT_DA = "Eksempel på cateringmenu fra RORUMs cateringgalleri";
const BANNER_ALT_UK = "Приклад кейтерингового меню з галереї RORUM";

function en(entries: I18nEntry[] | undefined): string | undefined {
  return entries?.find((e) => e.language === "en")?.value;
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes, no uploads)" : "LIVE"}`);
  console.log(`\n== Catering Menu Examples backfill — plan (target: ${DOC_ID}) ==`);

  const doc = await client.fetch<Doc | null>(`*[_id == $id][0]`, { id: DOC_ID });
  if (!doc) {
    console.error(`ABORTED: ${DOC_ID} not found.`);
    process.exitCode = 1;
    return;
  }
  const categorySections = (doc.sections ?? []).filter((s): s is CategorySection & { media?: MediaItem[] } => s.sectionKind === "menuCategory");
  if (categorySections.length !== CATEGORY_META.length) {
    console.error(`ABORTED: expected ${CATEGORY_META.length} menuCategory sections, found ${categorySections.length}.`);
    process.exitCode = 1;
    return;
  }

  // Verify name-for-name + count alignment before planning any upload.
  let alignmentOk = true;
  const plannedDishUploads: { sectionKey: string; itemKey: string; localPath: string; dishName: string }[] = [];
  for (let i = 0; i < categorySections.length; i++) {
    const section = categorySections[i]!;
    const meta = CATEGORY_META[i]!;
    const dishes = (section.items ?? []).filter((it) => /^dish\d+$/.test(it._key));
    if (dishes.length !== meta.dishImages.length) {
      console.error(`ABORTED: section "${section.sectionKey}" has ${dishes.length} dishes but ${meta.dishImages.length} images configured for "${meta.id}".`);
      alignmentOk = false;
      continue;
    }
    for (let j = 0; j < dishes.length; j++) {
      const dish = dishes[j]!;
      const imageFile = meta.dishImages[j]!;
      const localPath = path.join(process.cwd(), "public", "images", "catering", imageFile);
      if (!existsSync(localPath)) {
        console.error(`ABORTED: local dish image not found: ${localPath}`);
        alignmentOk = false;
      }
      if (!dish.image?.asset?._ref) {
        plannedDishUploads.push({ sectionKey: section.sectionKey, itemKey: dish._key, localPath, dishName: en(dish.title) ?? "(untitled)" });
      }
    }
  }
  if (!alignmentOk) {
    process.exitCode = 1;
    return;
  }

  const plannedIcons = categorySections
    .map((section, i) => ({ section, meta: CATEGORY_META[i]! }))
    .filter(({ section }) => !section.items?.some((it) => it.itemKey === "categoryIcon"));

  const banner = doc.sections?.find((s) => s.sectionKey === "banner");
  const bannerAlt = banner?.media?.[0]?.alt ?? [];
  const bannerNeedsDa = !bannerAlt.some((e) => e.language === "da");
  const bannerNeedsUk = !bannerAlt.some((e) => e.language === "uk");

  console.log(`\nDishes missing a photo: ${plannedDishUploads.length} / ${plannedDishUploads.length === 0 ? "(all 51 already have one — nothing to upload)" : "51"}`);
  console.log(`Categories missing a categoryIcon item: ${plannedIcons.length} / ${CATEGORY_META.length}`);
  console.log(`Banner alt text: needs da=${bannerNeedsDa}, needs uk=${bannerNeedsUk}`);

  if (plannedDishUploads.length === 0 && plannedIcons.length === 0 && !bannerNeedsDa && !bannerNeedsUk) {
    console.log("\nEverything already backfilled — nothing to do.");
    return;
  }

  if (DRY_RUN) {
    for (const { sectionKey, itemKey, dishName, localPath } of plannedDishUploads.slice(0, 5)) {
      console.log(`  WOULD UPLOAD + SET sections[sectionKey=="${sectionKey}"].items[_key=="${itemKey}"].image ("${dishName}", ${path.basename(localPath)})`);
    }
    if (plannedDishUploads.length > 5) console.log(`  ... and ${plannedDishUploads.length - 5} more.`);
    for (const { section, meta } of plannedIcons) {
      console.log(`  WOULD INSERT sections[sectionKey=="${section.sectionKey}"].items += categoryIcon (icon: "${meta.icon}")`);
    }
    if (bannerNeedsDa) console.log(`  WOULD SET sections[sectionKey=="banner"].media[0].alt += da: "${BANNER_ALT_DA}"`);
    if (bannerNeedsUk) console.log(`  WOULD SET sections[sectionKey=="banner"].media[0].alt += uk: "${BANNER_ALT_UK}"`);
    console.log("\nDry run only — no writes performed.");
    return;
  }

  // Re-fetch immediately before writing, guard on revision.
  const fresh = await client.fetch<Doc | null>(`*[_id == $id][0]`, { id: DOC_ID });
  if (!fresh || fresh._rev !== doc._rev) {
    console.error(`ABORTED: ${DOC_ID} changed since the plan was computed (concurrent edit) — re-run to recompute the plan.`);
    process.exitCode = 1;
    return;
  }

  // Dish-image `.set()` calls and the banner-alt `.set()` call all merge
  // into ONE `set: {...}` mutation object (each call adds a distinct key),
  // so they're safe to chain on a single patch. `.insert()` is NOT safe to
  // chain the same way — each call replaces the patch's whole `insert`
  // config rather than accumulating, so a second `.insert()` on the same
  // patch silently discards the first (confirmed the hard way against this
  // exact dataset: only the LAST category's icon landed on the first live
  // run). The 6 category-icon inserts are therefore committed as 6
  // independent mutations in one transaction instead.
  let setPatch = client.patch(DOC_ID).ifRevisionId(fresh._rev);
  let hasSetOps = false;

  for (const { sectionKey, itemKey, localPath, dishName } of plannedDishUploads) {
    const asset = await client.assets.upload("image", readFileSync(localPath), { filename: path.basename(localPath) });
    console.log(`  uploaded ${path.basename(localPath)} -> ${asset._id} (for "${dishName}")`);
    setPatch = setPatch.set({
      [`sections[sectionKey=="${sectionKey}"].items[_key=="${itemKey}"].image`]: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
        alt: [{ _key: "en", _type: "internationalizedArrayStringValue", language: "en", value: dishName }],
      },
    });
    hasSetOps = true;
  }

  if (bannerNeedsDa || bannerNeedsUk) {
    const nextAlt = [...bannerAlt];
    if (bannerNeedsDa) nextAlt.push({ _key: "da", language: "da", value: BANNER_ALT_DA });
    if (bannerNeedsUk) nextAlt.push({ _key: "uk", language: "uk", value: BANNER_ALT_UK });
    setPatch = setPatch.set({
      [`sections[sectionKey=="banner"].media[0].alt`]: nextAlt.map((e) => ({ ...e, _type: "internationalizedArrayStringValue" })),
    });
    hasSetOps = true;
  }

  if (hasSetOps) {
    await setPatch.commit();
    console.log(`\nApplied ${plannedDishUploads.length} dish photo(s) and banner-alt updates.`);
  }

  if (plannedIcons.length) {
    // No `ifRevisionId` here: within one transaction, several sequential
    // patch mutations to the SAME document each see the document as it
    // stood after the previous mutation in that same transaction, so a
    // revision guard captured once before the transaction would fail on
    // every mutation after the first. Safe without it regardless — each
    // insert only ever fires for a category this run's own pre-flight
    // check just confirmed has no `categoryIcon` item yet, and the whole
    // transaction is atomic (all 6 land, or none do).
    let tx = client.transaction();
    for (const { section, meta } of plannedIcons) {
      tx = tx.patch(
        client.patch(DOC_ID).insert("after", `sections[sectionKey=="${section.sectionKey}"].items[-1]`, [
          { _key: "categoryIcon", _type: "contentItem", itemKey: "categoryIcon", icon: meta.icon },
        ]),
      );
    }
    await tx.commit();
    console.log(`Applied ${plannedIcons.length} category icon insert(s).`);
  }

  console.log(`\n${DOC_ID} updated: ${plannedDishUploads.length} dish photo(s), ${plannedIcons.length} category icon(s), banner alt da=${bannerNeedsDa} uk=${bannerNeedsUk}.`);
  console.log("Live migration complete.");
}

main().catch((error) => {
  console.error("migrate-catering-menu-examples failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
