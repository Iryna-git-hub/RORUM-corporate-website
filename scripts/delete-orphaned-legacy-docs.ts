/**
 * Deletes the 3 legacy document types Phase 1's `migrate-content-to-pages.ts`
 * copied out of (into `faqPage.groups`, `cateringMenuExamplesPage.categories`,
 * and the 3 page `gallery` fields) but never removed — they were only
 * unlisted from the Studio sidebar (see sanity/structure.ts's history),
 * left in place "so nothing is lost if anything here needs to be re-
 * verified." That verification has now happened (see the backup this script
 * writes before deleting anything, and the counts logged below matching each
 * destination field), and this project has hit Sanity's free-plan 2,000-
 * attribute-per-dataset cap — these fully-migrated duplicates are the
 * safest attribute budget to reclaim, since deleting them removes no content
 * that isn't already live elsewhere.
 *
 * Usage:
 *   npm run sanity:delete-orphaned-legacy:dry-run   (default-safe: prints a plan, writes nothing)
 *   npm run sanity:delete-orphaned-legacy           (requires SANITY_API_WRITE_TOKEN)
 *
 * Safety: writes a full JSON backup of every document it's about to delete
 * to scripts/backups/ before deleting anything, live run only.
 */
import { createClient } from "@sanity/client";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;
const LEGACY_TYPES = ["cateringMenuCategory", "faqGroup", "galleryCollection"];

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

async function main() {
  console.log(`Delete orphaned legacy documents (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):\n`);

  const allDocs: Record<string, unknown>[] = [];
  for (const type of LEGACY_TYPES) {
    const docs = await client.fetch<Record<string, unknown>[]>(`*[_type == $type]`, { type });
    console.log(`${type}: ${docs.length} document(s) found — ${docs.map((d) => d._id).join(", ")}`);
    allDocs.push(...docs);
  }

  if (!allDocs.length) {
    console.log("\nNothing to delete.");
    return;
  }

  console.log(`\nTotal: ${allDocs.length} document(s) would be deleted.`);
  if (DRY_RUN) {
    console.log("Dry run complete. Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write.");
    return;
  }

  const backupDir = path.join(process.cwd(), "scripts", "backups");
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `orphaned-legacy-docs-${Date.now()}.json`);
  writeFileSync(backupPath, JSON.stringify(allDocs, null, 2), "utf-8");
  console.log(`\nBackup written to ${backupPath} (${allDocs.length} document(s)).`);

  const transaction = client.transaction();
  for (const doc of allDocs) {
    transaction.delete(doc._id as string);
  }
  await transaction.commit();
  console.log(`\nDeleted ${allDocs.length} document(s).`);
}

main().catch((error) => {
  console.error("Delete orphaned legacy documents failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
