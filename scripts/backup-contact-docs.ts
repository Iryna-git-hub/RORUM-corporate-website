/**
 * Writes a timestamped JSON backup of every Contact-related document
 * (published + draft, `perspective: "raw"` so drafts are included) — used
 * before any live mutation as part of the Contact Studio workflow
 * migration: page-contact/drafts.page-contact, contactInfo, socialLinks,
 * formMessages, and the legacy contactPage/drafts.contactPage.
 *
 * Usage: npx tsx --env-file=.env.local scripts/backup-contact-docs.ts <label>
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
  "page-contact",
  "drafts.page-contact",
  "contactInfo",
  "drafts.contactInfo",
  "socialLinks",
  "drafts.socialLinks",
  "formMessages",
  "drafts.formMessages",
  "contactPage",
  "drafts.contactPage",
];

async function main() {
  const label = process.argv[2] ?? "backup";
  const docs = await client.fetch<{ _id: string }[]>(`*[_id in $ids]`, { ids: FIXED_IDS });

  const backupDir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const filename = `contact-${label}-${Date.now()}.json`;
  const filepath = path.join(backupDir, filename);

  writeFileSync(
    filepath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        purpose: `Pre-migration backup (${label}) of all Contact-related documents`,
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
