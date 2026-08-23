/**
 * Backfills missing Danish/Ukrainian (and, for menu-format cards, English)
 * alt text across every informative Catering image, on both `page-catering`
 * (+ its draft) and `page-catering-menu-examples` (no draft exists):
 *
 *   - 59 gallery photos (36 distinct English captions) — missing da/uk on
 *     both the published and draft copy (118 entries total). No specific
 *     dish/title exists for these (they're ambient event photos), so
 *     da/uk are literal, accurate translations of the existing English
 *     caption's meaning — see GALLERY_TRANSLATIONS below. Nothing is
 *     invented: no ingredient, dish, or claim not already present in the
 *     English text.
 *   - 51 dish photos — missing da/uk. Per instruction, alt text for a dish
 *     photo is DERIVED from that dish's own already-approved, already-
 *     translated `title` (e.g. dish "Borscht" / "Borsjtj" / "Борщ" — the
 *     exact same value already used as the dish's visible name), not a
 *     freestanding translation. Zero new text invented here at all.
 *   - 3 menu-format card images — missing EVERY language, not just da/uk.
 *     Same principle: alt = the card's own title ("Private dinner menu" /
 *     "Reception-style menu" / "Business meeting menu", already fully
 *     trilingual).
 *   - 1 philosophy image — missing da/uk. No card/dish title exists for
 *     this one either (a standalone descriptive photo), so da/uk are a
 *     literal translation of the existing English caption.
 *
 * Every `set` is per-language and additive: an existing English value (or
 * any existing da/uk value, though none currently exist) is read first and
 * preserved untouched — this script only ever ADDS a missing language
 * entry, never replaces an existing one. Revision-guarded, dry-run by
 * default.
 *
 * Usage:
 *   npm run sanity:backfill-catering-alt:dry-run
 *   npm run sanity:backfill-catering-alt
 */
import { createClient } from "@sanity/client";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

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
  _type?: string;
  language?: string;
  value?: string;
}

// Literal, accurate Danish/Ukrainian translations of each distinct English
// gallery caption's existing meaning — no ingredient, dish name, or claim
// added beyond what the English text already says.
const GALLERY_TRANSLATIONS: Record<string, { da: string; uk: string }> = {
  "Long buffet table set up for a RORUM catering event": { da: "Langt buffetbord dækket op til et RORUM-cateringarrangement", uk: "Довгий фуршетний стіл, накритий для кейтерингової події RORUM" },
  "Spread of dishes from a RORUM catering event": { da: "Udvalg af retter fra et RORUM-cateringarrangement", uk: "Асортимент страв з кейтерингової події RORUM" },
  "Catering table set up for a WECODA membership gathering": { da: "Cateringbord dækket op til et WECODA-medlemsarrangement", uk: "Кейтеринговий стіл, накритий для зустрічі учасників WECODA" },
  "Plated dishes served at a RORUM catering event": { da: "Anrettede retter serveret ved et RORUM-cateringarrangement", uk: "Порційні страви, подані на кейтеринговій події RORUM" },
  "Dishes prepared for a RORUM catering event": { da: "Retter tilberedt til et RORUM-cateringarrangement", uk: "Страви, приготовані для кейтерингової події RORUM" },
  "Catering dishes arranged for a RORUM event": { da: "Cateringretter arrangeret til et RORUM-arrangement", uk: "Кейтерингові страви, розставлені для події RORUM" },
  "Catering spread from a RORUM gathering": { da: "Cateringudvalg fra en RORUM-sammenkomst", uk: "Кейтеринговий асортимент із зустрічі RORUM" },
  "Plates of food from a RORUM catering event": { da: "Tallerkener med mad fra et RORUM-cateringarrangement", uk: "Тарілки з їжею з кейтерингової події RORUM" },
  "Welcome drinks arranged for a RORUM catering event": { da: "Velkomstdrikke arrangeret til et RORUM-cateringarrangement", uk: "Вітальні напої, підготовлені для кейтерингової події RORUM" },
  "Catering dishes served at a RORUM event": { da: "Cateringretter serveret ved et RORUM-arrangement", uk: "Кейтерингові страви, подані на події RORUM" },
  "Table of catering dishes at a RORUM gathering": { da: "Bord med cateringretter ved en RORUM-sammenkomst", uk: "Стіл із кейтеринговими стравами на зустрічі RORUM" },
  "Catering plates styled for a RORUM event": { da: "Cateringtallerkener stylet til et RORUM-arrangement", uk: "Кейтерингові тарілки, оформлені для події RORUM" },
  "Catering dishes from a RORUM event": { da: "Cateringretter fra et RORUM-arrangement", uk: "Кейтерингові страви з події RORUM" },
  "Catering table from a RORUM gathering": { da: "Cateringbord fra en RORUM-sammenkomst", uk: "Кейтеринговий стіл із зустрічі RORUM" },
  "Dishes served at a RORUM catering event": { da: "Retter serveret ved et RORUM-cateringarrangement", uk: "Страви, подані на кейтеринговій події RORUM" },
  "Traditional Ukrainian dumplings (varenyky) served on a plate": { da: "Traditionelle ukrainske dumplings (varenyky) serveret på en tallerken", uk: "Традиційні українські вареники, подані на тарілці" },
  "Catering dishes arranged on a table": { da: "Cateringretter arrangeret på et bord", uk: "Кейтерингові страви, розставлені на столі" },
  "Catering spread from a RORUM event": { da: "Cateringudvalg fra et RORUM-arrangement", uk: "Кейтеринговий асортимент з події RORUM" },
  "Plated dishes from a RORUM catering event": { da: "Anrettede retter fra et RORUM-cateringarrangement", uk: "Порційні страви з кейтерингової події RORUM" },
  "Catering dishes served at a RORUM gathering": { da: "Cateringretter serveret ved en RORUM-sammenkomst", uk: "Кейтерингові страви, подані на зустрічі RORUM" },
  "Catering plates from a RORUM event": { da: "Cateringtallerkener fra et RORUM-arrangement", uk: "Кейтерингові тарілки з події RORUM" },
  "Desserts styled with fresh flowers": { da: "Desserter stylet med friske blomster", uk: "Десерти, оформлені свіжими квітами" },
  "Catering dishes arranged for a RORUM gathering": { da: "Cateringretter arrangeret til en RORUM-sammenkomst", uk: "Кейтерингові страви, розставлені для зустрічі RORUM" },
  "Catering spread at a RORUM event": { da: "Cateringudvalg ved et RORUM-arrangement", uk: "Кейтеринговий асортимент на події RORUM" },
  "Plated catering dishes from a RORUM event": { da: "Anrettede cateringretter fra et RORUM-arrangement", uk: "Порційні кейтерингові страви з події RORUM" },
  "Appetizer board with bread, pickles and savory accompaniments": { da: "Forretbræt med brød, syltede grøntsager og salte tilbehør", uk: "Дошка з закусками: хліб, соління та пікантні доповнення" },
  "Catering table from a RORUM event": { da: "Cateringbord fra et RORUM-arrangement", uk: "Кейтеринговий стіл з події RORUM" },
  "Charcuterie board with cheese, meats and accompaniments": { da: "Delikatessebræt med ost, pålæg og tilbehør", uk: "Дошка асорті із сиром, м'ясними делікатесами та доповненнями" },
  "Catering plates arranged for a RORUM gathering": { da: "Cateringtallerkener arrangeret til en RORUM-sammenkomst", uk: "Кейтерингові тарілки, розставлені для зустрічі RORUM" },
  "Traditional Ukrainian borscht served with herbs": { da: "Traditionel ukrainsk borsjtj serveret med krydderurter", uk: "Традиційний український борщ, поданий із зеленню" },
  "Catering table styled for a RORUM gathering": { da: "Cateringbord stylet til en RORUM-sammenkomst", uk: "Кейтеринговий стіл, оформлений для зустрічі RORUM" },
  "Dessert table styled for a RORUM event": { da: "Dessertbord stylet til et RORUM-arrangement", uk: "Десертний стіл, оформлений для події RORUM" },
  "Catering spread at a RORUM gathering": { da: "Cateringudvalg ved en RORUM-sammenkomst", uk: "Кейтеринговий асортимент на зустрічі RORUM" },
  "Catering table styled for a RORUM event": { da: "Cateringbord stylet til et RORUM-arrangement", uk: "Кейтеринговий стіл, оформлений для події RORUM" },
  "Catering dishes from a RORUM gathering": { da: "Cateringretter fra en RORUM-sammenkomst", uk: "Кейтерингові страви із зустрічі RORUM" },
  "Catering spread styled for a RORUM gathering": { da: "Cateringudvalg stylet til en RORUM-sammenkomst", uk: "Кейтеринговий асортимент, оформлений для зустрічі RORUM" },
};

const PHILOSOPHY_TRANSLATION = {
  da: "RORUMs cateringteam tilbereder mad til et arrangement",
  uk: "Кейтеринг-команда RORUM готує їжу для події",
};

function entry(language: string, value: string, typeName = "internationalizedArrayStringValue"): I18nEntry {
  return { _key: language, _type: typeName, language, value };
}

function langsOf(entries: I18nEntry[] | undefined): Set<string> {
  return new Set((entries ?? []).map((e) => e.language).filter((l): l is string => !!l));
}

interface PlannedSet {
  docId: string;
  path: string;
  description: string;
  value: I18nEntry[];
}

interface MediaItem {
  _key: string;
  kind?: string;
  alt?: I18nEntry[];
}
interface FormatItem {
  _key: string;
  itemKey?: string;
  title?: I18nEntry[];
  image?: { alt?: I18nEntry[] };
}
interface CateringPageDoc {
  _id: string;
  _rev: string;
  sections?: { sectionKey?: string; media?: MediaItem[]; items?: FormatItem[] }[];
}
interface DishItem {
  _key: string;
  title?: I18nEntry[];
  image?: { alt?: I18nEntry[] };
}
interface MenuDoc {
  _id: string;
  _rev: string;
  sections?: { sectionKind?: string; sectionKey?: string; items?: DishItem[] }[];
}

function en(entries: I18nEntry[] | undefined): string | undefined {
  return entries?.find((e) => e.language === "en")?.value;
}

function planCateringPage(doc: CateringPageDoc): PlannedSet[] {
  const plans: PlannedSet[] = [];
  const gallery = doc.sections?.find((s) => s.sectionKey === "gallery");
  for (const media of gallery?.media ?? []) {
    if (media.kind === "video") continue;
    const existingLangs = langsOf(media.alt);
    const caption = en(media.alt);
    if (!caption) continue; // no EN caption to derive from — not this script's job to invent one
    const translation = GALLERY_TRANSLATIONS[caption];
    if (!translation) continue; // unknown caption — surfaced separately, never guessed
    const missing: I18nEntry[] = [];
    if (!existingLangs.has("da")) missing.push(entry("da", translation.da));
    if (!existingLangs.has("uk")) missing.push(entry("uk", translation.uk));
    if (missing.length) {
      plans.push({
        docId: doc._id,
        path: `sections[sectionKey=="gallery"].media[_key=="${media._key}"].alt`,
        description: `gallery photo "${caption}" +${missing.map((m) => m.language).join(",")}`,
        value: [...(media.alt ?? []), ...missing],
      });
    }
  }

  const menuFormats = doc.sections?.find((s) => s.sectionKey === "menuFormats");
  for (const item of menuFormats?.items ?? []) {
    const existingLangs = langsOf(item.image?.alt);
    const title = item.title;
    if (!title?.length) continue;
    const missing: I18nEntry[] = [];
    for (const lang of ["en", "da", "uk"] as const) {
      if (!existingLangs.has(lang)) {
        const value = title.find((t) => t.language === lang)?.value;
        if (value) missing.push(entry(lang, value));
      }
    }
    if (missing.length) {
      plans.push({
        docId: doc._id,
        path: `sections[sectionKey=="menuFormats"].items[_key=="${item._key}"].image.alt`,
        description: `menu format card "${en(title)}" +${missing.map((m) => m.language).join(",")} (derived from the card's own title)`,
        value: [...(item.image?.alt ?? []), ...missing],
      });
    }
  }

  const philosophy = doc.sections?.find((s) => s.sectionKey === "philosophy");
  for (const media of philosophy?.media ?? []) {
    const existingLangs = langsOf(media.alt);
    const missing: I18nEntry[] = [];
    if (!existingLangs.has("da")) missing.push(entry("da", PHILOSOPHY_TRANSLATION.da));
    if (!existingLangs.has("uk")) missing.push(entry("uk", PHILOSOPHY_TRANSLATION.uk));
    if (missing.length) {
      plans.push({
        docId: doc._id,
        path: `sections[sectionKey=="philosophy"].media[_key=="${media._key}"].alt`,
        description: `philosophy image +${missing.map((m) => m.language).join(",")}`,
        value: [...(media.alt ?? []), ...missing],
      });
    }
  }

  return plans;
}

function planMenuExamples(doc: MenuDoc): PlannedSet[] {
  const plans: PlannedSet[] = [];
  for (const section of doc.sections ?? []) {
    if (section.sectionKind !== "menuCategory") continue;
    for (const item of section.items ?? []) {
      if (!/^dish\d+$/.test(item._key)) continue;
      const existingLangs = langsOf(item.image?.alt);
      const title = item.title;
      if (!title?.length) continue;
      const missing: I18nEntry[] = [];
      for (const lang of ["en", "da", "uk"] as const) {
        if (!existingLangs.has(lang)) {
          const value = title.find((t) => t.language === lang)?.value;
          if (value) missing.push(entry(lang, value));
        }
      }
      if (missing.length) {
        plans.push({
          docId: doc._id,
          path: `sections[sectionKey=="${section.sectionKey}"].items[_key=="${item._key}"].image.alt`,
          description: `dish "${en(title)}" +${missing.map((m) => m.language).join(",")} (derived from the dish's own title)`,
          value: [...(item.image?.alt ?? []), ...missing],
        });
      }
    }
  }
  return plans;
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log("\n== Catering alt-text backfill — plan ==");

  const [pageCatering, draftPageCatering, menuExamples] = await Promise.all([
    client.fetch<CateringPageDoc | null>(`*[_id == "page-catering"][0]`),
    client.fetch<CateringPageDoc | null>(`*[_id == "drafts.page-catering"][0]`),
    client.fetch<MenuDoc | null>(`*[_id == "page-catering-menu-examples"][0]`),
  ]);

  const allPlans: PlannedSet[] = [
    ...(pageCatering ? planCateringPage(pageCatering) : []),
    ...(draftPageCatering ? planCateringPage(draftPageCatering) : []),
    ...(menuExamples ? planMenuExamples(menuExamples) : []),
  ];

  console.log(`\n${allPlans.length} field(s) to update:`);
  const byDoc = new Map<string, number>();
  for (const p of allPlans) byDoc.set(p.docId, (byDoc.get(p.docId) ?? 0) + 1);
  for (const [id, count] of byDoc) console.log(`  ${id}: ${count}`);

  for (const p of allPlans.slice(0, 12)) {
    console.log(`  ${p.docId} :: ${p.path}\n    ${p.description}`);
  }
  if (allPlans.length > 12) console.log(`  ... and ${allPlans.length - 12} more.`);

  if (DRY_RUN) {
    console.log("\nDry run only — no writes performed.");
    return;
  }
  if (allPlans.length === 0) {
    console.log("\nNothing to backfill — live run would be a no-op. Exiting without writing.");
    return;
  }

  const docs = new Map<string, { _rev: string }>();
  for (const doc of [pageCatering, draftPageCatering, menuExamples]) {
    if (doc) docs.set(doc._id, { _rev: doc._rev });
  }

  const plansByDoc = new Map<string, PlannedSet[]>();
  for (const p of allPlans) plansByDoc.set(p.docId, [...(plansByDoc.get(p.docId) ?? []), p]);

  for (const [docId, plans] of plansByDoc) {
    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id: docId });
    const expected = docs.get(docId)!._rev;
    if (!fresh || fresh._rev !== expected) {
      console.error(`ABORTED (${docId}): changed concurrently — re-run to recompute. No writes applied for this document.`);
      process.exitCode = 1;
      continue;
    }
    let patch = client.patch(docId).ifRevisionId(fresh._rev);
    for (const p of plans) {
      patch = patch.set({ [p.path]: p.value });
    }
    await patch.commit();
    console.log(`${docId}: applied ${plans.length} update(s).`);
  }

  console.log("\nLive backfill complete.");
}

main().catch((error) => {
  console.error("backfill-catering-alt-text failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
