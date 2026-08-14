/**
 * Clears data from fields that are explicitly documented in their own
 * schema as superseded/legacy, to reclaim attribute budget under Sanity's
 * free-plan 2,000-attribute-per-dataset cap (see MIGRATION_REPORT.md).
 * Unlike deleting whole documents, this targets specific fields that the
 * schema itself already says are redundant with a newer field:
 *
 *   - `event.shortDescription`/`practicalDetails`/`ticketProvider` — the
 *     schema's own comment says these are "superseded by longDescription/
 *     duration/arrival/ticketProviderInfo" and kept only as a fallback for
 *     documents not yet migrated. Cleared only on events that already have
 *     all 4 replacement fields populated (verified per-event, not blanket).
 *   - `aboutPage.values` — the schema's own description says this is
 *     "Legacy field, no longer read by the site (replaced by
 *     communityTitle/communityText)".
 *
 * Usage:
 *   npm run sanity:clear-redundant-legacy:dry-run
 *   npm run sanity:clear-redundant-legacy
 *
 * Safety: writes a JSON backup of every field value it's about to clear to
 * scripts/backups/ before writing anything, live run only. Only touches
 * documents where the replacement field(s) are already confirmed present.
 */
import { createClient } from "@sanity/client";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

function writeBackup(name: string, docs: Record<string, unknown>[]) {
  if (!docs.length) return;
  const backupDir = path.join(process.cwd(), "scripts", "backups");
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `${name}-${Date.now()}.json`);
  writeFileSync(backupPath, JSON.stringify(docs, null, 2), "utf-8");
  console.log(`  Backup written to ${backupPath} (${docs.length} document(s)).`);
}

async function clearEventLegacyFields() {
  console.log("\n== event.shortDescription / practicalDetails / ticketProvider ==");
  const candidates = await client.fetch<
    { _id: string; shortDescription?: unknown; practicalDetails?: unknown; ticketProvider?: unknown }[]
  >(
    `*[_type == "event"
      && (defined(shortDescription) || defined(practicalDetails) || defined(ticketProvider))
      && defined(longDescription) && defined(duration) && defined(arrival) && defined(ticketProviderInfo)
    ]{_id, shortDescription, practicalDetails, ticketProvider}`,
  );

  if (!candidates.length) {
    console.log("  No events have both the legacy fields and full replacement coverage — nothing to clear.");
    return;
  }

  console.log(`  ${candidates.length} event(s) have full replacement-field coverage — would clear their legacy fields.`);
  if (DRY_RUN) return;

  writeBackup("event-legacy-fields", candidates);

  const transaction = client.transaction();
  for (const doc of candidates) {
    transaction.patch(doc._id, (p) => p.unset(["shortDescription", "practicalDetails", "ticketProvider"]));
  }
  await transaction.commit();
  console.log(`  Cleared legacy fields on ${candidates.length} event(s).`);
}

async function clearAboutPageValues() {
  console.log("\n== aboutPage.values (superseded by communityTitle/communityText) ==");
  const doc = await client.fetch<{ _id: string; values?: unknown } | null>(`*[_id == "aboutPage"][0]{_id, values}`);
  if (!doc?.values) {
    console.log("  Not set — nothing to clear.");
    return;
  }
  console.log("  Would clear aboutPage.values.");
  if (DRY_RUN) return;

  writeBackup("aboutpage-values", [doc]);
  await client.patch("aboutPage").unset(["values"]).commit();
  console.log("  Cleared aboutPage.values.");
}

async function main() {
  console.log(`Clear redundant legacy fields (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):`);
  await clearEventLegacyFields();
  await clearAboutPageValues();
  console.log(
    `\n${DRY_RUN ? "Dry run" : "Live run"} complete.` +
      (DRY_RUN ? " Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write." : ""),
  );
}

main().catch((error) => {
  console.error("Clear redundant legacy fields failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
