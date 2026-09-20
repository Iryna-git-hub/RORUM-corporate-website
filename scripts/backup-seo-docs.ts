/**
 * Writes a timestamped JSON backup of the *complete* content of every
 * `page`/`legalPage` document (published, and its draft if one exists) —
 * used before scripts/backfill-seo-copy.ts writes anything. Read-only.
 *
 * Usage: npx tsx --env-file=.env.local scripts/backup-seo-docs.ts <label>
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
  // Every page/legalPage document, published or draft, regardless of id
  // prefix — `perspective: "raw"` (set above) is what makes drafts.* ids
  // visible to this query at all.
  const docs = await client.fetch<{ _id: string }[]>(`*[_type in ["page", "legalPage"]]`);

  const backupDir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const filename = `seo-copy-${label}-${Date.now()}.json`;
  const filepath = path.join(backupDir, filename);

  writeFileSync(
    filepath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        purpose: `Pre-backfill backup (${label}) of every page/legalPage document (published + draft) before scripts/backfill-seo-copy.ts`,
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
