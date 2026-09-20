/**
 * Finds every `drafts.<id>` document whose published counterpart exists and
 * overwrites the draft with the published document's current content.
 *
 * Why this is needed: Sanity Studio creates a draft the moment a document is
 * opened for editing (autosave-on-focus), even if nothing is changed. A few
 * documents in this dataset were opened in Studio (during CORS/UI testing
 * earlier in this project) before `scripts/import-pages.ts` and
 * `scripts/import-translations.ts` finished populating their published
 * content — so their draft copy is stale (English-only or pre-fix) while
 * the published copy is now complete and trilingual. This script makes
 * every draft match its published document exactly, so opening any of them
 * in Studio doesn't show stale content. It's read-then-overwrite, not a
 * merge — safe here specifically because the published documents are the
 * ones this project's own idempotent import scripts just finished writing,
 * not unrelated editor work.
 *
 * Usage:
 *   npm run sanity:sync-drafts:dry-run
 *   npm run sanity:sync-drafts
 */
import { createClient } from "@sanity/client";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_WRITE_TOKEN;

  const client = createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
    token,
    useCdn: false,
    perspective: "raw",
  });

  const draftIds = await client.fetch<string[]>(`*[_id match "drafts.*"]._id`);

  let synced = 0;
  for (const draftId of draftIds) {
    const publishedId = draftId.replace(/^drafts\./, "");
    const published = await client.fetch<Record<string, unknown> | null>(`*[_id == $id][0]`, { id: publishedId });
    if (!published) {
      console.log(`${draftId}: no published counterpart — skipping (leaving draft as-is).`);
      continue;
    }
    const { _id, _rev, _createdAt, _updatedAt, ...content } = published;
    void _id;
    void _rev;
    void _createdAt;
    void _updatedAt;
    console.log(`${DRY_RUN ? "[dry run] would sync" : "Syncing"} ${draftId} <- ${publishedId}`);
    if (!DRY_RUN) {
      await client.createOrReplace({ _id: draftId, ...content } as never);
    }
    synced++;
  }

  console.log(
    `\n${DRY_RUN ? "Dry run" : "Live run"} complete. ${synced} draft(s) ${DRY_RUN ? "would be" : "were"} synced to their published content.`,
  );
  if (DRY_RUN) {
    console.log("Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write.");
  }
}

main().catch((error) => {
  console.error("Sync failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
