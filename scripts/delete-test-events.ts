/**
 * One-off: delete the two obsolete test/demo events the owner explicitly
 * authorized for removal (Phase A, 2026-09-08).
 *
 *   1. slug "one-more-event-test"      — event 4db90711-eb57-4388-930e-f9c70a3bd3bf (published + draft)
 *   2. slug "a-new-event-at-the-rorom" — event 4112b7ff-3205-48f6-8c06-40d7a3d29642 (draft only, never published)
 *
 * Both hold placeholder junk (Lorem Ipsum overview, "da test" title,
 * Russian-not-Ukrainian body) and are the only remaining `sanity:audit-validation`
 * markers. Verified: no inbound references anywhere in the dataset.
 *
 * Backs up every target document (full content) to scripts/backups/ BEFORE
 * deleting. Draft deleted before its published counterpart.
 *
 * Usage:
 *   npm run sanity:delete-test-events:dry-run
 *   npm run sanity:delete-test-events -- --apply
 */
import { createClient } from "@sanity/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const TOKEN = process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: TOKEN,
  useCdn: false,
  perspective: "raw",
});

const EXPECTED = [
  { base: "4db90711-eb57-4388-930e-f9c70a3bd3bf", slug: "one-more-event-test" },
  { base: "4112b7ff-3205-48f6-8c06-40d7a3d29642", slug: "a-new-event-at-the-rorom" },
];

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"} | write token: ${TOKEN ? "present" : "ABSENT"}`);
  if (APPLY && !TOKEN) {
    console.error("--apply given but SANITY_API_WRITE_TOKEN is not set.");
    process.exit(1);
  }

  const ids = EXPECTED.flatMap((e) => [e.base, `drafts.${e.base}`]);
  const docs = await client.fetch<{ _id: string; _type: string; slug?: { current?: string } }[]>(`*[_id in $ids]`, { ids });

  // Safety gates
  for (const d of docs) {
    if (d._type !== "event") {
      console.error(`ABORT: ${d._id} is not an event (${d._type}).`);
      process.exit(1);
    }
    const base = d._id.replace(/^drafts\./, "");
    const expected = EXPECTED.find((e) => e.base === base)!;
    if (d.slug?.current !== expected.slug) {
      console.error(`ABORT: ${d._id} slug is "${d.slug?.current}", expected "${expected.slug}".`);
      process.exit(1);
    }
  }

  const bases = EXPECTED.map((e) => e.base);
  const refs = await client.fetch<{ _id: string }[]>(`*[references($bases)]{_id}`, { bases });
  if (refs.length) {
    console.error(`ABORT: inbound references exist: ${refs.map((r) => r._id).join(", ")}`);
    process.exit(1);
  }

  console.log(`\nFound ${docs.length} document(s) to delete:`);
  for (const d of docs) console.log(`  ${d._id}  (slug: ${d.slug?.current})`);

  const ts = Date.now();
  const backupDir = join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const bfile = join(backupDir, `deleted-test-events-${ts}.json`);
  writeFileSync(bfile, JSON.stringify(docs, null, 2));
  console.log(`\nBacked up full content to ${bfile}`);

  if (!APPLY) {
    console.log("\nDry run — re-run with --apply to delete.");
    return;
  }

  // draft(s) first, then published
  const ordered = [...docs].sort((a, b) => (a._id.startsWith("drafts.") ? -1 : 1) - (b._id.startsWith("drafts.") ? -1 : 1));
  for (const d of ordered) {
    await client.delete(d._id);
    console.log(`Deleted ${d._id}`);
  }
  console.log("\nDone. Re-run `npm run sanity:audit-validation`.");
}

main().catch((e) => {
  console.error("delete-test-events failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
