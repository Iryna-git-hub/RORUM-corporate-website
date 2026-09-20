/**
 * Seeds page-events' filters section with the 3 new "languageXxLabel" rows
 * (Events Listing Studio task, Section 6) — the manager-editable display
 * name for each of `event.language`'s 3 possible stored values ("English"/
 * "Danish"/"Ukrainian"), previously hardcoded in lib/eventLanguage.ts. Each
 * row is inserted WITH the owner-approved EN/DA/UK copy already filled in
 * (these 3 rows are required — see contentItem.ts's "Events filter/
 * empty-state label" role's `requiredFields: ["title"]` — leaving them
 * empty would immediately block Publish).
 *
 * Approved copy matches lib/eventLanguage.ts's existing hardcoded table
 * exactly (English -> English/Engelsk/Англійська, etc.) — nothing to
 * reconcile or report a difference on.
 *
 * Only inserts rows that are genuinely missing — a document that already
 * has some (or all) of the 3 (e.g. re-run after a partial manual edit) only
 * gets the ones still absent, exactly like scripts/migrate-contact-details-order.ts's
 * own "already present -> left untouched" policy, applied per-row here
 * instead of per-document since these 3 are independent of each other.
 *
 * Writes directly to both the published AND draft `page-events` (same
 * precedent as migrate-contact-details-order.ts) — these are missing
 * STRUCTURAL rows required for the filter architecture to be complete, not
 * pending editorial content awaiting review. Nothing is ever published via
 * Sanity's own publish action; the published and draft documents are
 * patched independently, each revision-guarded.
 *
 * Usage:
 *   npm run sanity:migrate-events-filter-labels:dry-run
 *   npm run sanity:migrate-events-filter-labels
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

const DOC_IDS = ["page-events", "drafts.page-events"];

const NEW_ROWS: { itemKey: string; en: string; da: string; uk: string }[] = [
  { itemKey: "languageDaLabel", en: "Danish", da: "Dansk", uk: "Данська" },
  { itemKey: "languageEnLabel", en: "English", da: "Engelsk", uk: "Англійська" },
  { itemKey: "languageUkLabel", en: "Ukrainian", da: "Ukrainsk", uk: "Українська" },
];

interface Section {
  _key: string;
  sectionKey?: string;
  items?: { _key?: string; itemKey?: string }[];
}
interface EventsPageDoc {
  _id: string;
  _rev: string;
  sections?: Section[];
}

function i18nTitle(en: string, da: string, uk: string) {
  return [
    { _key: "en", _type: "internationalizedArrayStringValue" as const, language: "en", value: en },
    { _key: "da", _type: "internationalizedArrayStringValue" as const, language: "da", value: da },
    { _key: "uk", _type: "internationalizedArrayStringValue" as const, language: "uk", value: uk },
  ];
}

async function migrateDoc(id: string) {
  const doc = await client.fetch<EventsPageDoc | null>(`*[_id == $id][0]{_id, _rev, sections}`, { id });
  if (!doc) {
    console.log(`\n${id}: document not found — skipped.`);
    return;
  }

  const filters = doc.sections?.find((s) => s.sectionKey === "filters");
  if (!filters) {
    console.log(`\n${id}: no filters section found — skipped (unexpected shape, needs manual review).`);
    return;
  }

  const existingKeys = new Set((filters.items ?? []).map((i) => i.itemKey).filter(Boolean));
  const toInsert = NEW_ROWS.filter((row) => !existingKeys.has(row.itemKey));
  console.log(`\n${id}: filters section "${filters._key}" — ${NEW_ROWS.length - toInsert.length}/${NEW_ROWS.length} of the new rows already present.`);
  if (toInsert.length === 0) {
    console.log("  All 3 rows already present — nothing to do.");
    return;
  }

  for (const row of toInsert) {
    console.log(`  Would insert "${row.itemKey}": en=${JSON.stringify(row.en)}, da=${JSON.stringify(row.da)}, uk=${JSON.stringify(row.uk)}`);
  }

  if (DRY_RUN) return;

  const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
  if (!fresh || fresh._rev !== doc._rev) {
    console.error(`  ABORTED (${id}): changed concurrently since the plan was computed — re-run to recompute.`);
    process.exitCode = 1;
    return;
  }

  const items = toInsert.map((row) => ({
    _key: row.itemKey,
    _type: "contentItem" as const,
    itemKey: row.itemKey,
    title: i18nTitle(row.en, row.da, row.uk),
  }));

  await client
    .patch(id)
    .ifRevisionId(fresh._rev)
    .insert("after", `sections[_key=="${filters._key}"].items[-1]`, items)
    .commit();
  console.log(`  Applied — inserted ${items.length} row(s).`);
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log("== Events filters: language-option label rows (Section 6) — plan ==");
  for (const id of DOC_IDS) {
    await migrateDoc(id);
  }
  console.log(DRY_RUN ? "\nDry run only — no writes performed." : "\nLive migration complete.");
}

main().catch((error) => {
  console.error("migrate-events-filter-labels failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
