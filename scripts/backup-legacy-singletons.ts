/**
 * Writes a timestamped JSON backup of the legacy `homePage`/`aboutPage`
 * singleton documents that page-home/page-about were migrated FROM. Both
 * are confirmed draft-only (no published version exists), unreachable from
 * Studio's navigation, and read by no frontend code — but Task 5 requires
 * backing them up before any migration pass touches Home/About, so this
 * captures them the same way scripts/backup-home-page-docs.ts and
 * scripts/backup-about-page-docs.ts already do for the live documents.
 * Read-only; a no-op (reports 0 documents) once neither legacy doc exists.
 *
 * Usage: npx tsx --env-file=.env.local scripts/backup-legacy-singletons.ts <label>
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

async function main() {
  const label = process.argv[2] ?? "backup";
  const docs = await client.fetch<{ _id: string }[]>(
    `*[_id in ["homePage", "drafts.homePage", "aboutPage", "drafts.aboutPage"]]`,
  );

  const backupDir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const filename = `legacy-singletons-${label}-${Date.now()}.json`;
  const filepath = path.join(backupDir, filename);

  writeFileSync(
    filepath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        purpose: `Pre-migration backup (${label}) of legacy homePage/aboutPage singletons`,
        documentCount: docs.length,
        documentIds: docs.map((d) => d._id),
        documents: docs,
      },
      null,
      2,
    ),
  );

  console.log(`Backed up ${docs.length} document(s) to ${filepath}`);
  console.log("IDs:", docs.map((d) => d._id).join(", ") || "(none found)");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
