/**
 * Backfills `visibleLocales: ["en", "da", "uk"]` onto every `event`
 * document (published and draft, `perspective: "raw"`) that doesn't already
 * have it — preserving current website visibility exactly (every existing
 * event is currently shown on all 3 locales implicitly; this makes that
 * explicit) rather than causing any event to silently disappear once the
 * new locale-filtered queries (sanity/queries/events.ts's allEventsQuery)
 * go live.
 *
 * Idempotent: a document that already has ANY `visibleLocales` value
 * (even a single locale, even from a previous partial run) is left
 * completely alone — this script only ever fills in a genuinely missing
 * field, never overwrites an editor's own selection.
 *
 * Usage:
 *   npm run sanity:migrate-events-visible-locales:dry-run
 *   npm run sanity:migrate-events-visible-locales
 */
import { createClient } from "@sanity/client";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;
const DEFAULT_LOCALES = ["en", "da", "uk"];

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

interface RawEvent {
  _id: string;
  _rev: string;
  visibleLocales?: unknown;
}

function needsMigration(doc: RawEvent): boolean {
  return !(Array.isArray(doc.visibleLocales) && doc.visibleLocales.length > 0);
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log(`\n== visibleLocales migration — plan (default: ${JSON.stringify(DEFAULT_LOCALES)}) ==`);

  const docs = await client.fetch<RawEvent[]>(`*[_type == "event"] | order(_id asc){_id, _rev, visibleLocales}`);
  const toMigrate = docs.filter(needsMigration);

  console.log(`\n${docs.length} event document(s) checked.`);
  for (const doc of toMigrate) {
    console.log(`  ${doc._id}: WOULD SET visibleLocales = ${JSON.stringify(DEFAULT_LOCALES)} (currently: ${JSON.stringify(doc.visibleLocales ?? null)})`);
  }
  const alreadySet = docs.length - toMigrate.length;
  if (alreadySet) console.log(`  (${alreadySet} document(s) already have visibleLocales set — left untouched.)`);

  console.log(`\n== Summary ==`);
  console.log(`  ${toMigrate.length} document(s) to migrate (out of ${docs.length} event documents checked).`);

  if (DRY_RUN) {
    console.log("\nDry run only — no writes performed.");
    return;
  }
  if (toMigrate.length === 0) {
    console.log("\nNothing to migrate — live run would be a no-op. Exiting without writing.");
    return;
  }

  for (const doc of toMigrate) {
    const fresh = await client.fetch<RawEvent | null>(`*[_id == $id][0]{_id, _rev, visibleLocales}`, { id: doc._id });
    if (!fresh) {
      console.error(`\nABORTED: ${doc._id} no longer exists. No writes performed for this document.`);
      process.exitCode = 1;
      continue;
    }
    if (!needsMigration(fresh)) {
      console.log(`${doc._id}: already migrated as of re-fetch (concurrent edit) — skipped, not overwritten.`);
      continue;
    }
    try {
      await client
        .patch(doc._id)
        .ifRevisionId(fresh._rev)
        .setIfMissing({ visibleLocales: DEFAULT_LOCALES })
        .commit();
      console.log(`${doc._id}: set visibleLocales = ${JSON.stringify(DEFAULT_LOCALES)}.`);
    } catch (error) {
      console.error(`\nABORTED: ${doc._id} changed concurrently, or the patch failed. No changes were applied for this document.`);
      console.error(`  (${error instanceof Error ? error.message : error})`);
      process.exitCode = 1;
    }
  }

  console.log("\nLive migration complete.");
}

main().catch((error) => {
  console.error("migrate-events-visible-locales failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
