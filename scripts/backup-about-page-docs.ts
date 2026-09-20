/**
 * Writes a timestamped JSON backup of the *complete* content of both the
 * published `page-about` document and its draft (`drafts.page-about`, if it
 * exists) — used before any live mutation on About. Read-only.
 *
 * Usage: npx tsx --env-file=.env.local scripts/backup-about-page-docs.ts <label>
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
  const docs = await client.fetch<{ _id: string }[]>(`*[_id in ["page-about", "drafts.page-about"]]`);

  const backupDir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const filename = `about-page-${label}-${Date.now()}.json`;
  const filepath = path.join(backupDir, filename);

  writeFileSync(
    filepath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        purpose: `Pre-migration backup (${label}) of page-about and drafts.page-about`,
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
