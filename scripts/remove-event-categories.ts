/**
 * One-time cleanup: event categories are no longer used anywhere in the
 * product (no filter, no badge — confirmed unused before removal). This
 * script removes the live Sanity data now that the schema field/document
 * type, GROQ projections, and every code reference have already been
 * deleted from the codebase:
 *   1. Unsets the `category` field (a dangling reference once its target
 *      is gone) on every `event` document — draft and published.
 *   2. Deletes every `eventCategory` document — draft and published.
 *
 * Usage:
 *   npm run sanity:remove-event-categories:dry-run
 *   npm run sanity:remove-event-categories
 *
 * Not idempotent in the usual "safe to re-run forever" sense — it's a
 * one-time migration. Re-running after a successful live run is still safe
 * (it will simply find 0 events with a category field and 0 eventCategory
 * documents left to remove), it just isn't meant to be part of the normal
 * workflow.
 */
import { createClient } from "@sanity/client";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_WRITE_TOKEN;

  if (!projectId || !dataset) {
    throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET are required.");
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
    token,
    useCdn: false,
  });

  // `perspective: "raw"` is required here — @sanity/client's default
  // perspective only returns published documents, silently excluding any
  // `drafts.*` variant. Missing that distinction is exactly what made the
  // first run of this script fail: a leftover draft with `category` still
  // set wasn't in the "published"-perspective result set, so it never got
  // unset before the eventCategory delete tried to run and hit a dangling
  // reference from that invisible draft.
  const fetchOptions = { perspective: "raw" as const };

  const eventsWithCategory = await client.fetch<{ _id: string }[]>(
    `*[_type == "event" && defined(category)]{_id}`,
    {},
    fetchOptions,
  );
  const categoryDocs = await client.fetch<{ _id: string }[]>(
    `*[_type == "eventCategory"]{_id}`,
    {},
    fetchOptions,
  );

  console.log(`Remove-event-categories summary (${DRY_RUN ? "DRY RUN — nothing will change" : "LIVE RUN"}):`);
  console.log(`  ${eventsWithCategory.length} event document(s) have a "category" field to unset.`);
  console.log(`  ${categoryDocs.length} eventCategory document(s) to delete.`);

  if (DRY_RUN) {
    console.log("\nDry run complete. Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to apply.");
    return;
  }

  if (!token) {
    throw new Error("SANITY_API_WRITE_TOKEN is required for a live run.");
  }

  let unset = 0;
  for (const doc of eventsWithCategory) {
    await client.patch(doc._id).unset(["category"]).commit();
    unset++;
  }
  console.log(`Unset "category" on ${unset} event document(s).`);

  let deleted = 0;
  for (const doc of categoryDocs) {
    await client.delete(doc._id);
    deleted++;
  }
  console.log(`Deleted ${deleted} eventCategory document(s).`);

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Remove-event-categories failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
