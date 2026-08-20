/**
 * Writes a timestamped JSON backup of the *complete* content of every Events
 * document — used before any live mutation (scripts/repair-events-validation.ts):
 *
 *   - every `event` document, published and draft (`_type == "event"` covers
 *     both — a draft keeps the same `_type` as its published counterpart)
 *   - `page-events` and `drafts.page-events` (Events listing page)
 *   - `eventsPage` and `drafts.eventsPage` (legacy singleton)
 *   - `eventMessages` and `drafts.eventMessages` (shared UI labels)
 *
 * `perspective: "raw"` to include drafts. Read-only.
 *
 * Usage: npx tsx --env-file=.env.local scripts/backup-events-docs.ts <label>
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

const FIXED_IDS = ["page-events", "drafts.page-events", "eventsPage", "drafts.eventsPage", "eventMessages", "drafts.eventMessages"];

async function main() {
  const label = process.argv[2] ?? "backup";
  const docs = await client.fetch<{ _id: string; _type: string }[]>(
    `*[_type == "event" || _id in $fixedIds] | order(_id asc)`,
    { fixedIds: FIXED_IDS },
  );

  const backupDir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const filename = `events-${label}-${Date.now()}.json`;
  const filepath = path.join(backupDir, filename);

  writeFileSync(
    filepath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        purpose: `Pre-migration backup (${label}) of every event document, page-events, eventsPage (legacy), and eventMessages, published + draft`,
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
