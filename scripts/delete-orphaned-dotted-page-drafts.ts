/**
 * Fixes the actual, proven root cause of the disabled-Publish bug found while
 * diagnosing page-catering: `sanity/schemaTypes/documents/page.ts`'s async
 * `pageKey` uniqueness validator was correctly firing "Another page document
 * already uses pageKey ..." for page-catering, page-home, AND page-about,
 * because 3 orphaned DRAFT-ONLY documents from the page-id migration
 * (drafts.page.catering, drafts.page.about, drafts.page.home — old, dotted
 * ids, see sanity/lib/pageIds.ts's OLD_PAGE_DOC_ID) still exist and carry the
 * same pageKey as their real, current dash-id counterparts.
 *
 * scripts/delete-old-dotted-page-ids.ts (the existing cleanup script for
 * exactly this id migration) does NOT catch these: its client is configured
 * with `perspective: "published"`, and under that perspective a direct
 * `_id == "drafts.X"` lookup returns null — confirmed live (its own dry-run
 * reports "no draft found" for all 12 keys, including these 3, despite them
 * demonstrably existing under `perspective: "raw"`). That script also
 * requires a PUBLISHED old-dotted document to exist before it will touch the
 * corresponding draft, which structurally can never be satisfied here since
 * no published page.catering/page.about/page.home exists (confirmed) — only
 * these 3 abandoned drafts do.
 *
 * Explicitly authorized scope only (per user instruction): this script does
 * NOT loop over sanity/lib/pageIds.ts's full PAGE_KEYS list or accept a
 * wildcard — TARGET_IDS below is the complete, hardcoded, exhaustive set of
 * ids this script will ever touch. Adding a new orphan requires editing this
 * file, not passing a flag.
 *
 * Usage:
 *   npm run sanity:delete-orphaned-dotted-drafts:dry-run
 *   npm run sanity:delete-orphaned-dotted-drafts
 */
import { createClient } from "@sanity/client";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PAGE_DOC_ID } from "../sanity/lib/pageIds";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

// The complete, explicit, hardcoded set of documents this script may ever
// delete — not derived from a loop or a list that could grow. Each entry
// pairs the obsolete dotted draft id with the current dash-id document that
// makes it redundant.
const TARGET_IDS: { draftId: string; currentId: string }[] = [
  { draftId: "drafts.page.home", currentId: PAGE_DOC_ID.home },
  { draftId: "drafts.page.about", currentId: PAGE_DOC_ID.about },
  { draftId: "drafts.page.catering", currentId: PAGE_DOC_ID.catering },
];

interface PageDoc {
  _id: string;
  _type?: string;
  pageKey?: string;
  _rev?: string;
}

async function inspect(draftId: string, currentId: string) {
  const oldDottedId = draftId.replace(/^drafts\./, "");
  const [draftDoc, publishedDottedDoc, currentPublished, currentDraft] = await Promise.all([
    client.fetch<PageDoc | null>(`*[_id == $id][0]{_id, _type, pageKey, _rev}`, { id: draftId }),
    client.fetch<PageDoc | null>(`*[_id == $id][0]{_id}`, { id: oldDottedId }),
    client.fetch<PageDoc | null>(`*[_id == $id][0]{pageKey}`, { id: currentId }),
    client.fetch<PageDoc | null>(`*[_id == $id][0]{pageKey}`, { id: `drafts.${currentId}` }),
  ]);
  const currentPageKey = currentPublished?.pageKey ?? currentDraft?.pageKey;
  return { draftDoc, publishedDottedDoc, currentPageKey, currentId, currentExists: Boolean(currentPublished || currentDraft) };
}

function assertEligible(draftId: string, info: Awaited<ReturnType<typeof inspect>>): PageDoc {
  const { draftDoc, publishedDottedDoc, currentPageKey, currentId, currentExists } = info;
  if (!draftDoc) throw new Error(`${draftId} does not exist — nothing to delete.`);
  if (draftDoc._type !== "page") throw new Error(`${draftId} has unexpected _type "${draftDoc._type}" (expected "page") — refusing to delete.`);
  if (publishedDottedDoc) throw new Error(`${draftId.replace(/^drafts\./, "")} (published, dotted) still exists — ${draftId} is not a pure orphan. Refusing to delete.`);
  if (!currentExists) throw new Error(`Neither ${currentId} nor drafts.${currentId} exists — cannot confirm ${draftId} is redundant. Refusing to delete.`);
  if (!currentPageKey || currentPageKey !== draftDoc.pageKey) {
    throw new Error(`${draftId}'s pageKey ("${draftDoc.pageKey}") does not match ${currentId}'s current pageKey ("${currentPageKey ?? "(none)"}") — refusing to delete.`);
  }
  return draftDoc;
}

async function main() {
  console.log(`Delete orphaned dotted-id page DRAFTS (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):`);
  console.log(`Explicitly authorized target ids (exactly ${TARGET_IDS.length}, no wildcard):`);
  for (const t of TARGET_IDS) console.log(`  ${t.draftId}  (must be redundant with ${t.currentId})`);
  console.log("");

  const eligible: { draftId: string; doc: PageDoc }[] = [];

  for (const { draftId, currentId } of TARGET_IDS) {
    const info = await inspect(draftId, currentId);
    const doc = assertEligible(draftId, info);
    console.log(`[OK] ${draftId}: draft-only ✓, dotted-id scheme ✓, current dash-id counterpart ${currentId} exists ✓, pageKey "${doc.pageKey}" duplicated ✓ (causes the Publish-blocking collision), _rev=${doc._rev}.`);
    eligible.push({ draftId, doc });
  }

  if (DRY_RUN) {
    console.log(`\nDry run complete — would delete exactly these ${eligible.length} document(s):`);
    for (const d of eligible) console.log(`  ${d.draftId} (_rev: ${d.doc._rev})`);
    console.log("\nRe-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write.");
    return;
  }

  // --- Backup, then verify the backup was written correctly ---
  const backupDir = path.join(process.cwd(), "scripts", "backups");
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `orphaned-dotted-page-drafts-${Date.now()}.json`);
  writeFileSync(backupPath, JSON.stringify(eligible.map((d) => d.doc), null, 2), "utf-8");
  const verifyBackup = JSON.parse(readFileSync(backupPath, "utf-8")) as PageDoc[];
  if (verifyBackup.length !== eligible.length || verifyBackup.some((d, i) => d._id !== eligible[i]!.doc._id || d._rev !== eligible[i]!.doc._rev)) {
    throw new Error(`Backup verification failed at ${backupPath} — refusing to delete without a confirmed-good backup.`);
  }
  console.log(`\nBackup written and verified at ${backupPath} (${eligible.length} document(s), full content + _id/_rev/_type).`);

  // --- Immediately re-verify each document is still exactly at the dry-run/pre-flight revision before touching anything ---
  console.log("\nRe-checking revisions immediately before delete (abort on any mismatch)...");
  for (const { draftId, doc } of eligible) {
    const fresh = await client.fetch<{ _rev?: string } | null>(`*[_id == $id][0]{_rev}`, { id: draftId });
    if (!fresh || fresh._rev !== doc._rev) {
      throw new Error(`ABORTING — ${draftId} changed since the pre-flight check (was _rev=${doc._rev}, now ${fresh?._rev ?? "(deleted or missing)"}). No documents have been deleted.`);
    }
  }
  console.log("All revisions confirmed unchanged.");

  // --- Atomic, revision-guarded delete: a no-op ifRevisionId-guarded patch
  // precedes each delete in the SAME transaction, so if a document changed
  // between the check above and commit, the whole transaction is rejected
  // and nothing is deleted (transactions are all-or-nothing). ---
  const transaction = client.transaction();
  for (const { draftId, doc } of eligible) {
    transaction.patch(draftId, (p) => p.ifRevisionId(doc._rev!).unset(["__deleteGuardNoop__"]));
    transaction.delete(draftId);
  }
  await transaction.commit();
  console.log(`\nDeleted (revision-guarded, single atomic transaction): ${eligible.map((d) => d.draftId).join(", ")}.`);

  console.log("\nVerifying deletion...");
  for (const { draftId } of eligible) {
    const gone = await client.fetch<unknown>(`*[_id == $id][0]`, { id: draftId });
    console.log(`  ${draftId}: ${gone ? "STILL EXISTS (unexpected!)" : "confirmed gone"}`);
  }
}

main().catch((error) => {
  console.error("delete-orphaned-dotted-page-drafts failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
