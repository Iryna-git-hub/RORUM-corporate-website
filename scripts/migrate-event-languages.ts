/**
 * Migrates the existing Event `language` scalar to a singleton string array.
 * Drafts and published documents are fetched separately via raw perspective.
 * Dry-run is the default; pass --apply only after backup and review.
 */
import { createClient } from "@sanity/client";
import { planEventLanguageMigration } from "../lib/eventLanguageMigration";

const APPLY = process.argv.includes("--apply");
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

interface RawEvent { _id: string; _rev: string; language?: unknown }

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN (default; no writes)"}`);
  const docs = await client.fetch<RawEvent[]>(`*[_type == "event"] | order(_id asc){_id,_rev,language}`);
  const planned = docs.map((doc) => ({ doc, plan: planEventLanguageMigration(doc.language) }));
  const migrations = planned.filter((item) => item.plan.action === "migrate");

  for (const { doc, plan } of planned) {
    console.log(`${doc._id}: ${plan.action}${plan.action === "migrate" ? ` ${JSON.stringify(doc.language)} -> ${JSON.stringify(plan.value)}` : ""}`);
  }
  console.log(`Summary: ${docs.length} raw document(s); ${migrations.length} scalar value(s) to migrate.`);
  if (!APPLY) return;
  if (!process.env.SANITY_API_WRITE_TOKEN) throw new Error("SANITY_API_WRITE_TOKEN is required for --apply");

  const migratedIds: string[] = [];
  const skippedAfterFreshRead: string[] = [];
  const failedIds: { id: string; error: string }[] = [];

  for (const { doc } of migrations) {
    const fresh = await client.fetch<RawEvent | null>(`*[_id == $id][0]{_id,_rev,language}`, { id: doc._id });
    if (!fresh) throw new Error(`${doc._id}: document disappeared before apply`);
    const freshPlan = planEventLanguageMigration(fresh.language);
    if (freshPlan.action !== "migrate") {
      console.log(`${doc._id}: skipped after fresh read (${freshPlan.action})`);
      skippedAfterFreshRead.push(doc._id);
      continue;
    }
    try {
      await client.patch(fresh._id).ifRevisionId(fresh._rev).set({ language: freshPlan.value }).commit();
      const verified = await client.fetch<RawEvent | null>(`*[_id == $id][0]{_id,_rev,language}`, { id: fresh._id });
      if (!verified || JSON.stringify(verified.language) !== JSON.stringify(freshPlan.value)) {
        throw new Error(`${fresh._id}: read-back verification failed`);
      }
      console.log(`${fresh._id}: migrated and read-back verified`);
      migratedIds.push(fresh._id);
    } catch (error) {
      console.error(`\nFAILED: ${fresh._id} could not be migrated (ifRevisionId conflict, write error, or read-back verification failure).`);
      console.error(`  (${error instanceof Error ? error.message : error})`);
      failedIds.push({ id: fresh._id, error: error instanceof Error ? error.message : String(error) });
      process.exitCode = 1;
    }
  }

  console.log(`\n== Apply summary ==`);
  console.log(`  ${migratedIds.length} document(s) successfully migrated and read-back verified.`);
  console.log(`  ${skippedAfterFreshRead.length} document(s) skipped after fresh read (array/missing/invalid, as before).`);
  console.log(`  ${failedIds.length} document(s) FAILED during apply.`);
  if (failedIds.length) {
    console.log(`\n  The following document(s) require manual follow-up:`);
    for (const { id, error } of failedIds) console.log(`    - ${id}: ${error}`);
  }
}

main().catch((error) => {
  console.error("migrate-event-languages failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
