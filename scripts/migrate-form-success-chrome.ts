/**
 * Backfills the two new first-class `formMessages` fields the shared
 * success-modal/content chrome reads — `successTitle` ("Thank you!") and
 * `doneLabel` ("Done") — with their EN/DA/UK values, so production no
 * longer relies on the hardcoded code fallback in lib/sanityForms.ts for
 * any locale.
 *
 * Context: these two strings were briefly resolved through `extraLabels`
 * (see git history), but the required rows were never actually created in
 * production — and `extraLabels`' `key` field is intentionally `readOnly`
 * in Studio, so the site owner could never have created them herself. They
 * were promoted to explicit first-class `internationalizedArrayString`
 * fields (same type as `closeLabel`) in sanity/schemaTypes/singletons/
 * formMessages.ts specifically so a manager can edit them directly in
 * Studio without touching any technical key. This script does the one-time
 * backfill of the initial content; from then on Studio is the source of
 * truth.
 *
 * Safety:
 *  - Backs up the full current `formMessages` document to scripts/backups/
 *    before writing anything.
 *  - Per-locale idempotent: only ever SETS a locale that is currently
 *    missing on `successTitle`/`doneLabel` — never overwrites a value that
 *    already exists (whether seeded by an earlier partial run or entered
 *    by the owner in Studio in the meantime). Safe to re-run.
 *  - Also checks (and, if found, migrates+removes) any stray
 *    `extraLabels` rows keyed `successTitle`/`doneLabel` from an earlier
 *    approach — production has none today, but this keeps the script safe
 *    to run again later without leaving duplicate/orphaned content.
 *  - Reads the document back after writing and prints the resolved values
 *    for a final sanity check.
 *
 * Usage:
 *   npm run sanity:migrate-form-success-chrome:dry-run   (default-safe: prints a plan, writes nothing)
 *   npm run sanity:migrate-form-success-chrome           (requires SANITY_API_WRITE_TOKEN)
 */
import { createClient } from "@sanity/client";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { tri } from "./lib/sanityImportUtils";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;
const DOC_ID = "formMessages";

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
interface KeyedStringRow {
  _key: string;
  key?: string | null;
  value?: I18nEntry[] | null;
}
interface FormMessagesDoc {
  _id: string;
  successTitle?: I18nEntry[] | null;
  doneLabel?: I18nEntry[] | null;
  extraLabels?: KeyedStringRow[] | null;
}

const VALUES: Record<"successTitle" | "doneLabel", { en: string; da: string; uk: string }> = {
  successTitle: { en: "Thank you!", da: "Tak!", uk: "Дякуємо!" },
  doneLabel: { en: "Done", da: "Færdig", uk: "Готово" },
};

function backup(doc: FormMessagesDoc) {
  const backupDir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const filepath = path.join(backupDir, `form-messages-success-chrome-${Date.now()}.json`);
  writeFileSync(
    filepath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        purpose: "Pre-migration backup of formMessages before backfilling successTitle/doneLabel",
        document: doc,
      },
      null,
      2,
    ),
  );
  console.log(`Backed up formMessages to ${filepath}`);
}

/** Locales already present on a first-class internationalizedArrayString field. */
function presentLocales(entries: I18nEntry[] | null | undefined): Set<string> {
  return new Set((entries ?? []).map((e) => e.language).filter((l): l is string => Boolean(l)));
}

async function backfillField(
  doc: FormMessagesDoc,
  field: "successTitle" | "doneLabel",
  label: string,
) {
  const existing = presentLocales(doc[field]);
  const wanted = tri(VALUES[field].en, VALUES[field].da, VALUES[field].uk);
  const missing = wanted.filter((entry) => !existing.has(entry.language));

  if (!missing.length) {
    console.log(`  ${label} (${field}): already has EN/DA/UK — skipping.`);
    return;
  }

  console.log(
    `  ${label} (${field}): would add ${missing.length} locale(s) (${missing.map((e) => e.language).join(", ")}).` +
      (existing.size ? ` Existing locale(s) preserved untouched: ${[...existing].join(", ")}.` : ""),
  );
  if (DRY_RUN) return;

  await client
    .patch(doc._id)
    .setIfMissing({ [field]: [] })
    .append(field, missing)
    .commit({ autoGenerateArrayKeys: false });
  console.log(`  ${label} (${field}): added ${missing.length} locale(s).`);
}

/** Phase 5: migrate + remove any stray legacy extraLabels rows for these two keys, if present. */
async function cleanupLegacyExtraLabelsRows(doc: FormMessagesDoc) {
  const legacyKeys: Array<"successTitle" | "doneLabel"> = ["successTitle", "doneLabel"];
  const rows = (doc.extraLabels ?? []).filter((r) => legacyKeys.includes(r.key as "successTitle" | "doneLabel"));

  if (!rows.length) {
    console.log("  Legacy extraLabels rows for successTitle/doneLabel: none found — nothing to migrate or delete.");
    return;
  }

  console.log(`  Legacy extraLabels rows found: ${rows.map((r) => r.key).join(", ")} — will preserve any values not already on the first-class field, then remove the legacy row(s).`);
  for (const row of rows) {
    const field = row.key as "successTitle" | "doneLabel";
    const existing = presentLocales(doc[field]);
    const legacyValues = (row.value ?? []).filter((v) => v.language && !existing.has(v.language));
    if (legacyValues.length) {
      console.log(`    would carry over ${legacyValues.length} legacy locale(s) from extraLabels.${field} to the first-class field.`);
      if (!DRY_RUN) {
        await client
          .patch(doc._id)
          .setIfMissing({ [field]: [] })
          .append(
            field,
            legacyValues.map((v) => ({ _key: v.language!, _type: "internationalizedArrayStringValue", language: v.language, value: v.value })),
          )
          .commit({ autoGenerateArrayKeys: false });
      }
    }
    console.log(`    would remove legacy extraLabels row "${field}".`);
    if (!DRY_RUN) {
      await client.patch(doc._id).unset([`extraLabels[key == "${field}"]`]).commit();
    }
  }
}

async function main() {
  console.log(`Form success chrome migration (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):`);

  const doc = await client.fetch<FormMessagesDoc | null>(
    `*[_id == "${DOC_ID}"][0]{_id, successTitle, doneLabel, extraLabels[]{_key, key, value}}`,
  );
  if (!doc) {
    console.error(`  ${DOC_ID} document not found — aborting.`);
    process.exitCode = 1;
    return;
  }

  console.log(`  Found document _id="${doc._id}".`);
  if (!DRY_RUN) backup(doc);

  await cleanupLegacyExtraLabelsRows(doc);
  await backfillField(doc, "successTitle", "Success title");
  await backfillField(doc, "doneLabel", "Done button");

  if (DRY_RUN) {
    console.log("\nDry run complete — no writes were made. Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to apply.");
    return;
  }

  const after = await client.fetch<FormMessagesDoc | null>(
    `*[_id == "${DOC_ID}"][0]{_id, successTitle, doneLabel}`,
  );
  console.log("\nRead-back after write:");
  console.log(JSON.stringify({ successTitle: after?.successTitle, doneLabel: after?.doneLabel }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
