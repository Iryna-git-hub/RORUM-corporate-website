/**
 * Cleanup step for the page-id migration (scripts/migrate-page-ids.ts).
 * Deletes the old, dotted `page.<key>` documents — ONLY after verifying,
 * for each one, that the new dash-based `page-<key>` document exists AND
 * its content matches. Also finds and deletes the corresponding obsolete
 * draft (`drafts.page.<key>`), if any, gated on that same published-side
 * verification. Never run automatically as part of the migration; run this
 * explicitly, and only after the new ids have been verified to work
 * (anonymous reads succeeding, frontend rendering CMS content).
 *
 * Backs up every document it's about to delete to scripts/backups/ first,
 * live run only, same safety convention as every other destructive script
 * in this project.
 *
 * FIXED (found while diagnosing a live Publish-blocking pageKey collision on
 * page-catering): the client used to be configured with
 * `perspective: "published"`. Under that perspective, an explicit
 * `_id == "drafts.X"` lookup silently returns null even when the document
 * exists — confirmed live: 3 real, orphaned draft-only documents
 * (drafts.page.catering, drafts.page.about, drafts.page.home) were
 * completely invisible to this script's own dry-run ("no draft found" for
 * every key), while directly provably existing under `perspective: "raw"`
 * and actively causing page.ts's async pageKey-uniqueness validator to
 * block Publish on page-catering/page-about/page-home. Switched to
 * `perspective: "raw"` so every `_id ==` lookup here (draft or published)
 * reflects the real dataset state — this only changes what the script CAN
 * SEE; the deletion-eligibility logic below (a draft is only touched
 * alongside a verified-matching published old/new pair) is unchanged and
 * stays exactly as conservative as before. See
 * scripts/delete-orphaned-dotted-page-drafts.ts for the narrowly-scoped,
 * explicitly-authorized script that actually removed those 3 draft-only
 * orphans (this script's own gating still correctly refuses to touch a
 * draft with no published old-dotted counterpart — that's by design, not a
 * remaining bug).
 *
 * Usage:
 *   npm run sanity:delete-old-page-ids:dry-run
 *   npm run sanity:delete-old-page-ids
 */
import { createClient } from "@sanity/client";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { OLD_PAGE_DOC_ID, PAGE_DOC_ID, PAGE_KEYS } from "../sanity/lib/pageIds";
import { CLEANUP_CLIENT_PERSPECTIVE, evaluateDeletionEligibility, type CleanupDoc } from "../sanity/lib/dottedPageIdCleanup";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: CLEANUP_CLIENT_PERSPECTIVE,
});

type PageDoc = CleanupDoc;

async function main() {
  console.log(`Delete old dotted page ids (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):`);
  console.log("\nOld id -> new id mapping under review:");
  for (const key of PAGE_KEYS) {
    console.log(`  ${OLD_PAGE_DOC_ID[key]}  ->  ${PAGE_DOC_ID[key]}  (draft: drafts.${OLD_PAGE_DOC_ID[key]})`);
  }
  console.log("");

  const toDelete: { key: string; id: string; kind: "published" | "draft"; doc: PageDoc }[] = [];
  let skipped = 0;
  let conflicts = 0;
  let draftsFound = 0;

  for (const key of PAGE_KEYS) {
    const oldId = OLD_PAGE_DOC_ID[key];
    const newId = PAGE_DOC_ID[key];
    const draftId = `drafts.${oldId}`;

    const [oldDoc, newDoc, draftDoc] = await Promise.all([
      client.fetch<PageDoc | null>(`*[_id == $id][0]`, { id: oldId }),
      client.fetch<PageDoc | null>(`*[_id == $id][0]`, { id: newId }),
      client.fetch<PageDoc | null>(`*[_id == $id][0]`, { id: draftId }),
    ]);

    if (draftDoc) {
      draftsFound += 1;
      console.log(`[${key}] draft found: ${draftId}`);
    } else {
      console.log(`[${key}] no draft found at ${draftId}.`);
    }

    const decision = evaluateDeletionEligibility({ oldDoc, newDoc, draftDoc });

    if (!decision.eligible) {
      if (!oldDoc) {
        console.log(`[${key}] ${oldId} does not exist — nothing to delete for the published document.`);
        if (draftDoc) {
          console.warn(`[${key}] SKIPPING draft ${draftId} — ${decision.reason}.`);
          skipped += 1;
        }
      } else if (!newDoc) {
        console.warn(`[${key}] SKIPPING — ${decision.reason} (${oldId}).`);
        skipped += 1;
        if (draftDoc) console.warn(`[${key}] SKIPPING draft ${draftId} for the same reason.`);
      } else {
        console.warn(`[${key}] CONFLICT — ${decision.reason} (${newId} vs ${oldId}).`);
        conflicts += 1;
        if (draftDoc) console.warn(`[${key}] SKIPPING draft ${draftId} for the same reason.`);
      }
      continue;
    }

    console.log(`[${key}] ${newId} confirmed to match ${oldId} — would delete ${oldId}.`);
    toDelete.push({ key, id: oldId, kind: "published", doc: oldDoc! });
    if (decision.deleteDraft && draftDoc) {
      console.log(`[${key}] published match confirmed — would also delete obsolete draft ${draftId}.`);
      toDelete.push({ key, id: draftId, kind: "draft", doc: draftDoc });
    }
  }

  console.log(
    `\nSummary: ${toDelete.filter((d) => d.kind === "published").length} published document(s) eligible, ${draftsFound} draft(s) found, ${skipped} skipped (no confirmed replacement), ${conflicts} conflict(s).`,
  );

  if (!toDelete.length) {
    console.log("\nNothing to delete.");
    return;
  }

  if (DRY_RUN) {
    console.log(`\nDry run complete — would delete:`);
    for (const d of toDelete) console.log(`  [${d.kind}] ${d.id}`);
    const backupDir = path.join(process.cwd(), "scripts", "backups");
    const wouldBePath = path.join(backupDir, `old-dotted-page-ids-<timestamp>.json`);
    console.log(`\nOn a live run, a backup of these ${toDelete.length} document(s) would be written to:\n  ${wouldBePath}`);
    console.log("\nRe-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write.");
    return;
  }

  const backupDir = path.join(process.cwd(), "scripts", "backups");
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `old-dotted-page-ids-${Date.now()}.json`);
  writeFileSync(backupPath, JSON.stringify(toDelete.map((d) => d.doc), null, 2), "utf-8");
  console.log(`\nBackup written to ${backupPath} (${toDelete.length} document(s)).`);

  const transaction = client.transaction();
  for (const { id } of toDelete) transaction.delete(id);
  await transaction.commit();
  console.log(`Deleted: ${toDelete.map((d) => d.id).join(", ")}.`);
}

main().catch((error) => {
  console.error("delete-old-dotted-page-ids failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
