/**
 * Deletes the old `homePage`/`cateringPage`/`cateringMenuExamplesPage`
 * singleton documents now that their content has been verified as fully
 * copied into the new `page.home`/`page.catering`/`page.cateringMenuExamples`
 * documents (see scripts/migrate-to-page-sections.ts, MIGRATION_REPORT.md).
 *
 * This is the Phase 6 cleanup step from the plan, scoped to just the pilot's
 * 3 pages instead of the full 15-page rollout — done now because the
 * dataset's temporary dual-model state pushed it over Sanity's free-plan
 * 2,000-attribute cap, which was degrading the Live Content API's ability to
 * serve the new pages' data reliably (not just blocking writes).
 *
 * Safety: refuses to delete a page if the corresponding new `page.*`
 * document doesn't exist yet (never deletes source-of-truth data without a
 * confirmed replacement). Writes a full JSON backup of each document to
 * scripts/backups/ before deleting, live run only.
 *
 * Usage:
 *   npm run sanity:delete-migrated-singletons:dry-run
 *   npm run sanity:delete-migrated-singletons
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

const PAIRS = [
  { oldId: "homePage", newId: "page.home" },
  { oldId: "cateringPage", newId: "page.catering" },
  { oldId: "cateringMenuExamplesPage", newId: "page.cateringMenuExamples" },
];

async function main() {
  console.log(`Delete migrated page singletons (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):`);

  const toDelete: { oldId: string; doc: Record<string, unknown> }[] = [];

  for (const { oldId, newId } of PAIRS) {
    const [oldDoc, newDoc] = await Promise.all([
      client.fetch<Record<string, unknown> | null>(`*[_id == $id][0]`, { id: oldId }),
      client.fetch<{ _id: string; sections?: unknown[] } | null>(`*[_id == $id][0]{_id, sections}`, { id: newId }),
    ]);

    if (!oldDoc) {
      console.log(`  ${oldId}: doesn't exist — nothing to delete.`);
      continue;
    }
    if (!newDoc?.sections?.length) {
      console.warn(`  ${oldId}: SKIPPING — replacement ${newId} doesn't exist or has no sections. Refusing to delete without a confirmed replacement.`);
      continue;
    }
    console.log(`  ${oldId}: replacement ${newId} confirmed (${newDoc.sections.length} sections) — would delete ${oldId}.`);
    toDelete.push({ oldId, doc: oldDoc });
  }

  if (!toDelete.length) {
    console.log("\nNothing to delete.");
    return;
  }

  if (DRY_RUN) {
    console.log(`\nDry run complete — would delete: ${toDelete.map((d) => d.oldId).join(", ")}.`);
    console.log("Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write.");
    return;
  }

  const backupDir = path.join(process.cwd(), "scripts", "backups");
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `migrated-page-singletons-${Date.now()}.json`);
  writeFileSync(backupPath, JSON.stringify(toDelete.map((d) => d.doc), null, 2), "utf-8");
  console.log(`\nBackup written to ${backupPath} (${toDelete.length} document(s)).`);

  const transaction = client.transaction();
  for (const { oldId } of toDelete) {
    transaction.delete(oldId);
  }
  await transaction.commit();
  console.log(`Deleted: ${toDelete.map((d) => d.oldId).join(", ")}.`);
}

main().catch((error) => {
  console.error("delete-migrated-page-singletons failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
