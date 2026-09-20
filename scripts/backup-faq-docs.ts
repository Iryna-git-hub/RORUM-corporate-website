/**
 * Writes a timestamped JSON backup of every FAQ-related document (published
 * + draft, `perspective: "raw"` so drafts are included) — used before any
 * live mutation as part of the FAQ Studio workflow migration:
 *   - page-faq / drafts.page-faq (the canonical pageSection-based document);
 *   - faqPage / drafts.faqPage (legacy singleton, draft-only, dead in
 *     production — kept for compatibility, not deleted);
 *   - every faqGroup document (legacy per-group document type, kept for
 *     completeness).
 *
 * Usage: npx tsx --env-file=.env.local scripts/backup-faq-docs.ts <label>
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

const FIXED_IDS = ["page-faq", "drafts.page-faq", "faqPage", "drafts.faqPage"];

async function main() {
  const label = process.argv[2] ?? "backup";
  const [fixedDocs, groupDocs] = await Promise.all([
    client.fetch<{ _id: string }[]>(`*[_id in $ids]`, { ids: FIXED_IDS }),
    client.fetch<{ _id: string }[]>(`*[_type == "faqGroup"]`),
  ]);
  const docs = [...fixedDocs, ...groupDocs];

  const backupDir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const filename = `faq-${label}-${Date.now()}.json`;
  const filepath = path.join(backupDir, filename);

  writeFileSync(
    filepath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        purpose: `Pre-migration backup (${label}) of all FAQ-related documents`,
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
