/**
 * One-time cleanup: "Related events" is no longer used anywhere in the
 * product (never rendered on the event detail page or anywhere else —
 * confirmed unused before removal, same as the eventCategory removal this
 * mirrors). This script unsets the now-schema-orphaned `relatedEvents`
 * field on every `event` document, now that the schema field, GROQ
 * projection, and every code reference have already been removed.
 *
 * Usage:
 *   npm run sanity:remove-related-events:dry-run
 *   npm run sanity:remove-related-events
 *
 * Uses `perspective: "raw"` on every fetch — @sanity/client's default
 * perspective only returns published documents, silently excluding
 * `drafts.*` variants. That gap caused the eventCategory removal script to
 * fail on its first run (a draft's dangling reference wasn't visible to a
 * "published"-perspective query); fixed here from the start.
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

  const eventsWithRelated = await client.fetch<{ _id: string }[]>(
    `*[_type == "event" && defined(relatedEvents)]{_id}`,
    {},
    { perspective: "raw" },
  );

  console.log(`Remove-related-events summary (${DRY_RUN ? "DRY RUN — nothing will change" : "LIVE RUN"}):`);
  console.log(`  ${eventsWithRelated.length} event document(s) have a "relatedEvents" field to unset.`);

  if (DRY_RUN) {
    console.log("\nDry run complete. Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to apply.");
    return;
  }

  if (!token) {
    throw new Error("SANITY_API_WRITE_TOKEN is required for a live run.");
  }

  let unset = 0;
  for (const doc of eventsWithRelated) {
    await client.patch(doc._id).unset(["relatedEvents"]).commit();
    unset++;
  }
  console.log(`Unset "relatedEvents" on ${unset} event document(s).`);

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Remove-related-events failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
