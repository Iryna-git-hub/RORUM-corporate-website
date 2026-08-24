/**
 * Adds 4 new, localized "Additional service" rows (itemKey "service0"
 * .."service3": Breakfast/Snacks/Lunch/Coffee setup) to Host at RORUM's
 * `inquiryForm` section — the canonical source `components/InquiryForm.tsx`'s
 * booking form now reads its Additional Services checkboxes from, replacing
 * a hardcoded, English-only `bookingServiceOptions` array. English values
 * match the text already shown live; Danish/Ukrainian are new accurate
 * translations of that same already-approved English meaning (see
 * MIGRATION_REPORT.md for the full translation-provenance record).
 *
 * A purely additive, revision-guarded structural-completeness migration —
 * no existing field, item, or document is altered; idempotent (a second
 * dry-run after applying reports zero pending). Published and draft are
 * migrated independently. Never invokes Publish.
 *
 * Usage:
 *   npm run sanity:migrate-host-additional-services:dry-run
 *   npm run sanity:migrate-host-additional-services -- --apply
 */
import { createClient } from "@sanity/client";

const APPLY = process.argv.includes("--apply") && Boolean(process.env.SANITY_API_WRITE_TOKEN);
const DOC_IDS = ["page-host-at-rorum", "drafts.page-host-at-rorum"] as const;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

const NEW_SERVICE_ITEMS: { itemKey: string; en: string; da: string; uk: string }[] = [
  { itemKey: "service0", en: "Breakfast", da: "Morgenmad", uk: "Сніданок" },
  { itemKey: "service1", en: "Snacks", da: "Snacks", uk: "Снеки" },
  { itemKey: "service2", en: "Lunch", da: "Frokost", uk: "Обід" },
  { itemKey: "service3", en: "Coffee setup", da: "Kaffestation", uk: "Кавова станція" },
];

interface ContentItem {
  _key: string;
  itemKey?: string;
}
interface Section {
  _key: string;
  sectionKey?: string;
  items?: ContentItem[];
}
interface PageDoc {
  _id: string;
  _rev: string;
  sections?: Section[];
}

async function planFor(id: string) {
  const doc = await client.fetch<PageDoc | null>(`*[_id == $id][0]{_id, _rev, sections}`, { id });
  if (!doc) {
    console.log(`${id}: document not found — nothing to do.`);
    return null;
  }
  const form = doc.sections?.find((s) => s.sectionKey === "inquiryForm");
  if (!form) {
    console.log(`${id}: no "inquiryForm" section found — nothing to do.`);
    return null;
  }
  const existingKeys = new Set((form.items ?? []).map((i) => i.itemKey));
  const missing = NEW_SERVICE_ITEMS.filter((s) => !existingKeys.has(s.itemKey));
  console.log(`${id}: inquiryForm section _key = ${form._key} — ${missing.length} of ${NEW_SERVICE_ITEMS.length} service rows missing`);
  for (const s of missing) console.log(`  + ${s.itemKey}: en=${JSON.stringify(s.en)} da=${JSON.stringify(s.da)} uk=${JSON.stringify(s.uk)}`);
  if (!missing.length) return null;
  return { doc, form, missing };
}

async function main() {
  console.log(`Mode: ${APPLY ? "LIVE (--apply passed)" : "DRY RUN (no writes) — pass --apply with a write token to apply"}`);
  console.log(`== Host at RORUM Additional Services migration — plan ==`);

  for (const id of DOC_IDS) {
    const plan = await planFor(id);
    if (!plan) continue;

    if (!APPLY) {
      console.log(`  Dry run only for ${id} — no writes performed. Requires explicit authorization before --apply.`);
      continue;
    }

    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
    if (!fresh || fresh._rev !== plan.doc._rev) {
      console.error(`ABORTED for ${id}: changed concurrently since the plan was computed — re-run to recompute.`);
      process.exitCode = 1;
      continue;
    }

    // One .patch() per distinct insert — chaining multiple .insert() calls
    // on one Patch object silently keeps only the last (this project's own
    // established fix — see scripts/backfill-seo-copy.ts).
    const tx = client.transaction();
    for (const s of plan.missing) {
      tx.patch(id, (p) =>
        p.ifRevisionId(fresh._rev).insert("after", `sections[_key=="${plan.form._key}"].items[-1]`, [
          {
            _key: s.itemKey,
            _type: "contentItem",
            itemKey: s.itemKey,
            title: [
              { _key: "en", _type: "internationalizedArrayStringValue", language: "en", value: s.en },
              { _key: "da", _type: "internationalizedArrayStringValue", language: "da", value: s.da },
              { _key: "uk", _type: "internationalizedArrayStringValue", language: "uk", value: s.uk },
            ],
          },
        ]),
      );
    }
    await tx.commit();
    console.log(`  Applied ${plan.missing.length} insert(s) to ${id}.`);
  }
}

main().catch((error) => {
  console.error("migrate-host-additional-services failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
