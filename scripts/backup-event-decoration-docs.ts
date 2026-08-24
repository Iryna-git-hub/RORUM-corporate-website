/**
 * Writes a timestamped JSON backup of page-event-decoration and its draft
 * (published + draft, `perspective: "raw"` so drafts are included) — used
 * before any live mutation, same convention as
 * scripts/backup-catering-docs.ts.
 *
 * Usage: npx tsx --env-file=.env.local scripts/backup-event-decoration-docs.ts <label>
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

const FIXED_IDS = ["page-event-decoration", "drafts.page-event-decoration"];

async function main() {
  const label = process.argv[2] ?? "backup";
  const docs = await client.fetch<{ _id: string }[]>(`*[_id in $ids]`, { ids: FIXED_IDS });

  const backupDir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const filename = `event-decoration-${label}-${Date.now()}.json`;
  const filepath = path.join(backupDir, filename);

  writeFileSync(
    filepath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        purpose: `Pre-mutation backup (${label}) of page-event-decoration + draft`,
        documentCount: docs.length,
        documentIds: docs.map((d) => d._id),
        documents: docs,
      },
      null,
      2,
    ),
  );

  console.log(`Backed up ${docs.length} document(s) to ${filepath}`);
  console.log("IDs found:", docs.map((d) => d._id).join(", ") || "(none)");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
