/**
 * Writes a timestamped JSON backup of every Catering-related document
 * (published + draft, `perspective: "raw"` so drafts are included) — used
 * before any live mutation as part of the Catering CMS integration:
 *   - page-catering / drafts.page-catering (new pageSection model — already
 *     the live authoritative source for the Catering page);
 *   - page-catering-menu-examples / drafts.page-catering-menu-examples (the
 *     canonical Menu Examples document — see sanity/lib/pageIds.ts's
 *     PAGE_DOC_ID; NOT "page-cateringMenuExamples", a camelCase id that
 *     briefly, erroneously existed this session and has since been deleted
 *     — see MIGRATION_REPORT.md/the Catering integration report for that
 *     incident);
 *   - cateringPage / drafts.cateringPage (legacy singleton, draft-only,
 *     dead in production — kept for compatibility, not deleted);
 *   - cateringMenuExamplesPage / drafts.cateringMenuExamplesPage (legacy
 *     singleton, draft-only — holds the real translated menu text this
 *     migration reads from);
 *   - every cateringMenuCategory document (orphaned schema type, 0 live
 *     documents as of this migration — included for completeness in case
 *     that ever changes).
 *
 * Usage: npx tsx --env-file=.env.local scripts/backup-catering-docs.ts <label>
 */
import { createClient } from "@sanity/client";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

const FIXED_IDS = [
  "page-catering",
  "drafts.page-catering",
  "page-catering-menu-examples",
  "drafts.page-catering-menu-examples",
  "cateringPage",
  "drafts.cateringPage",
  "cateringMenuExamplesPage",
  "drafts.cateringMenuExamplesPage",
];

async function main() {
  const label = process.argv[2] ?? "backup";
  const [fixedDocs, categoryDocs] = await Promise.all([
    client.fetch<{ _id: string }[]>(`*[_id in $ids]`, { ids: FIXED_IDS }),
    client.fetch<{ _id: string }[]>(`*[_type == "cateringMenuCategory"]`),
  ]);
  const docs = [...fixedDocs, ...categoryDocs];

  const backupDir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const filename = `catering-${label}-${Date.now()}.json`;
  const filepath = path.join(backupDir, filename);

  writeFileSync(
    filepath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        purpose: `Pre-migration backup (${label}) of all Catering-related documents`,
        documentCount: docs.length,
        documentIds: docs.map((d) => d._id),
        documents: docs,
      },
      null,
      2,
    ),
  );

  console.log(`Backed up ${docs.length} document(s) to ${filepath}`);
  console.log("IDs:", docs.map((d) => d._id).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
