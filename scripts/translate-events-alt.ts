/**
 * Adds accurate Danish and Ukrainian translations for `event.image.alt`
 * on every event whose alt text currently exists in English only —
 * explicitly authorized by the user for this pass (translation of existing
 * approved content, not new marketing copy). Every source EN alt text
 * follows the exact same template, "<Title> event atmosphere" (confirmed
 * live across all 34 affected documents before writing this script) — the
 * DA/UK translations below are a faithful rendering of that same template,
 * using each event's OWN already-approved DA/UK `title` field values (read
 * only, never modified) so the alt text stays internally consistent with
 * the event's displayed title:
 *
 *   DA: "Stemning fra {da title}"
 *   UK: "Атмосфера події «{uk title}»"
 *
 * No event facts, dates, prices, or claims are added — only a description
 * of the photo, matching the EN source's own scope exactly.
 *
 * Explicitly EXCLUDED (2 test/demo documents, per a separate, not-yet-made
 * decision — see the final report): 4db90711-eb57-4388-930e-f9c70a3bd3bf and
 * its draft. Every other event already has real da/uk titles verified live
 * immediately before writing this script.
 *
 * `image.alt` on every affected document currently holds exactly ONE entry
 * (`en`, verified live — no stray da/uk placeholder to collide with), so
 * this always APPENDS 2 new array items; it never touches the existing `en`
 * entry.
 *
 * Usage:
 *   npm run sanity:translate-events-alt:dry-run
 *   npm run sanity:translate-events-alt
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

interface Translation {
  docId: string;
  da: string;
  uk: string;
}

// title (da/uk) sourced read-only from each document's own already-approved
// `title` field, verified live immediately before writing this file.
const TRANSLATIONS: Translation[] = [
  { docId: "drafts.event-62598f0397d5", da: "Stemning fra Botanisk bordstyling-workshop", uk: "Атмосфера події «Воркшоп із ботанічного сервірування столу»" },
  { docId: "event-62598f0397d5", da: "Stemning fra Botanisk bordstyling-workshop", uk: "Атмосфера події «Воркшоп із ботанічного сервірування столу»" },
  { docId: "drafts.event-7b27b9aedc11", da: "Stemning fra Copenhagen makers-middag", uk: "Атмосфера події «Вечеря копенгагенських майстрів»" },
  { docId: "event-7b27b9aedc11", da: "Stemning fra Copenhagen makers-middag", uk: "Атмосфера події «Вечеря копенгагенських майстрів»" },
  { docId: "drafts.event-8df3fa20c44d", da: "Stemning fra Internationalt middagssalon", uk: "Атмосфера події «Міжнародний вечірній салон»" },
  { docId: "event-8df3fa20c44d", da: "Stemning fra Internationalt middagssalon", uk: "Атмосфера події «Міжнародний вечірній салон»" },
  { docId: "drafts.event-d6dbc3cf8e32", da: "Stemning fra Ler & rolige hænder", uk: "Атмосфера події «Глина та спокійні руки»" },
  { docId: "event-d6dbc3cf8e32", da: "Stemning fra Ler & rolige hænder", uk: "Атмосфера події «Глина та спокійні руки»" },
  { docId: "drafts.event-f3d8e5804b5d", da: "Stemning fra Præsenter dig selv med selvtillid", uk: "Атмосфера події «Впевнена самопрезентація»" },
  { docId: "event-f3d8e5804b5d", da: "Stemning fra Præsenter dig selv med selvtillid", uk: "Атмосфера події «Впевнена самопрезентація»" },
  { docId: "event-0a65e3c2e96b", da: "Stemning fra Mindful morgenyoga", uk: "Атмосфера події «Усвідомлена ранкова йога»" },
  { docId: "event-13bcbbdf8946", da: "Stemning fra Netværk for internationale iværksættere", uk: "Атмосфера події «Нетворкінг для міжнародних засновників»" },
  { docId: "event-15bd6b1d5254", da: "Stemning fra Freelance morgensalon", uk: "Атмосфера події «Ранковий салон для фрилансерів»" },
  { docId: "event-18b70c5c92c8", da: "Stemning fra Dansk samtalecafé", uk: "Атмосфера події «Кафе данської розмовної практики»" },
  { docId: "event-1ae05d32b005", da: "Stemning fra Sommer bordlaboratorium", uk: "Атмосфера події «Літня лабораторія сервірування»" },
  { docId: "event-2a537ce291f6", da: "Stemning fra Åndedrætsøvelser & te", uk: "Атмосфера події «Дихальні практики та чай»" },
  { docId: "event-2d3f652271b6", da: "Stemning fra Yoga efter arbejde reset", uk: "Атмосфера події «Йога для перезавантаження після роботи»" },
  { docId: "event-2f8203083e5d", da: "Stemning fra Nordisk brunch-klub", uk: "Атмосфера події «Клуб нордичного бранчу»" },
  { docId: "event-33fa13f65f05", da: "Stemning fra LinkedIn-profillaboratorium", uk: "Атмосфера події «Лабораторія профілю LinkedIn»" },
  { docId: "event-42b12da85e31", da: "Stemning fra Slow art-aften", uk: "Атмосфера події «Вечір повільного мистецтва»" },
  { docId: "event-5b1c0e99c990", da: "Stemning fra Sæsonmiddag preview", uk: "Атмосфера події «Прев'ю сезонної вечері»" },
  { docId: "event-6d2d24a81814", da: "Stemning fra Dansk for ukrainere: Ord på arbejdspladsen", uk: "Атмосфера події «Данська для українців: слова на робочому місці»" },
  { docId: "event-73f9f1c60887", da: "Stemning fra Akvarel & vin", uk: "Атмосфера події «Акварель і вино»" },
  { docId: "event-7560b87e4ac1", da: "Stemning fra Dansk arbejdskultur-morgenmad", uk: "Атмосфера події «Сніданок про данську культуру праці»" },
  { docId: "event-770dc458e83d", da: "Stemning fra Ukrainsk-dansk fællesskabsaften", uk: "Атмосфера події «Українсько-данський вечір спільноти»" },
  { docId: "event-8aaa9a55dce7", da: "Stemning fra Selvstændig arbejdsmorgen", uk: "Атмосфера події «Ранок незалежної роботи»" },
  { docId: "event-8f07cee99bb7", da: "Stemning fra Rolig netværk for nytilkomne", uk: "Атмосфера події «Спокійний нетворкінг для новоприбулих»" },
  { docId: "event-97e190f5514b", da: "Stemning fra Soft launch-morgenmad", uk: "Атмосфера події «Сніданок м'якого запуску»" },
  { docId: "event-a4c1c910533c", da: "Stemning fra Erhvervsmorgenmad København", uk: "Атмосфера події «Бізнес-сніданок у Копенгагені»" },
  { docId: "event-a5409ba70713", da: "Stemning fra Fællesskabets resetaften", uk: "Атмосфера події «Вечір перезавантаження спільноти»" },
  { docId: "event-a91720a9154c", da: "Stemning fra Dansk for ukrainere: Hverdagsgrundlag", uk: "Атмосфера події «Данська для українців: базові фрази»" },
  { docId: "event-c6d72832acab", da: "Stemning fra Tiny talks-aften", uk: "Атмосфера події «Вечір коротких розмов»" },
  { docId: "event-d79939e4ac73", da: "Stemning fra Lysbelyst lytterum", uk: "Атмосфера події «Кімната для прослуховування при свічках»" },
  { docId: "event-ddc618d18d7c", da: "Stemning fra Blomsterstemning-workshop", uk: "Атмосфера події «Воркшоп квіткового настрою»" },
  { docId: "event-e003e09c68d2", da: "Stemning fra Kreativ værtscirkel", uk: "Атмосфера події «Коло творчих господарів»" },
  { docId: "event-f149fb29b711", da: "Stemning fra Pitch-øvelsesaften", uk: "Атмосфера події «Вечір відпрацювання пітчів»" },
  { docId: "event-f388771dc938", da: "Stemning fra Kreativt erhvervsrundbord", uk: "Атмосфера події «Круглий стіл творчого бізнесу»" },
];

interface RawEvent {
  _id: string;
  _rev: string;
  altEntries?: { language?: string; value?: string }[];
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log(`\n== Events image.alt translation (da/uk) — plan (${TRANSLATIONS.length} documents) ==`);

  const docs = await client.fetch<RawEvent[]>(
    `*[_id in $ids]{_id, _rev, "altEntries": image.alt}`,
    { ids: TRANSLATIONS.map((t) => t.docId) },
  );
  const byId = new Map(docs.map((d) => [d._id, d]));

  const toApply: Translation[] = [];
  for (const t of TRANSLATIONS) {
    const doc = byId.get(t.docId);
    if (!doc) {
      console.log(`\n${t.docId}: document not found — skipping.`);
      continue;
    }
    const hasDa = doc.altEntries?.some((e) => e.language === "da" && e.value?.trim());
    const hasUk = doc.altEntries?.some((e) => e.language === "uk" && e.value?.trim());
    if (hasDa && hasUk) {
      console.log(`\n${t.docId}: already has da+uk — skipping (idempotent).`);
      continue;
    }
    console.log(`\n${t.docId} (_rev ${doc._rev}):`);
    if (!hasDa) console.log(`  WOULD APPEND image.alt[da] = "${t.da}"`);
    if (!hasUk) console.log(`  WOULD APPEND image.alt[uk] = "${t.uk}"`);
    toApply.push(t);
  }

  console.log(`\n== Summary ==`);
  console.log(`  ${toApply.length} document(s) to update (out of ${TRANSLATIONS.length} planned).`);

  if (DRY_RUN) {
    console.log("\nDry run only — no writes performed.");
    return;
  }
  if (toApply.length === 0) {
    console.log("\nNothing to apply — live run would be a no-op. Exiting without writing.");
    return;
  }

  for (const t of toApply) {
    const fresh = await client.fetch<{ _rev: string; altEntries?: { language?: string; value?: string }[] } | null>(
      `*[_id == $id][0]{_rev, "altEntries": image.alt}`,
      { id: t.docId },
    );
    if (!fresh) {
      console.error(`\nABORTED: ${t.docId} no longer exists.`);
      process.exitCode = 1;
      continue;
    }
    const hasDa = fresh.altEntries?.some((e) => e.language === "da" && e.value?.trim());
    const hasUk = fresh.altEntries?.some((e) => e.language === "uk" && e.value?.trim());
    const newEntries = [
      ...(!hasDa ? [{ _key: "da", _type: "internationalizedArrayStringValue", language: "da", value: t.da }] : []),
      ...(!hasUk ? [{ _key: "uk", _type: "internationalizedArrayStringValue", language: "uk", value: t.uk }] : []),
    ];
    if (!newEntries.length) {
      console.log(`${t.docId}: already clean as of re-fetch — skipped.`);
      continue;
    }
    try {
      await client
        .patch(t.docId)
        .ifRevisionId(fresh._rev)
        .setIfMissing({ "image.alt": [] })
        .append("image.alt", newEntries)
        .commit();
      console.log(`${t.docId}: appended ${newEntries.length} translation(s).`);
    } catch (error) {
      console.error(`\nABORTED: ${t.docId} changed concurrently, or the patch failed.`);
      console.error(`  (${error instanceof Error ? error.message : error})`);
      process.exitCode = 1;
    }
  }

  console.log("\nLive translation apply complete.");
}

main().catch((error) => {
  console.error("translate-events-alt failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
