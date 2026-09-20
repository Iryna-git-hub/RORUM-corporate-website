/**
 * Phase 2 (2026-09-09) — TEMPORARY test-data redistribution.
 *
 * This is a TEST version of the site. Every one of the 32 published `event`
 * documents is currently dated 2026-05-02 … 2026-07-18 — all in the past, so
 * with the Phase 3 "past events don't render" rule the Events listing and
 * Home strip would be empty. This script spreads those 32 events across
 * 2026-09-01 … 2026-10-31 so every filter (This week / This month / Soonest
 * first / Language / Price / Availability / sold-out / empty-state) can be
 * exercised realistically:
 *
 *   - 8 already-passed September dates (Sep 1 – Sep 8)   → must NOT render
 *   - 5 in the current week (Sep 9 – Sep 13)             → "This week"
 *   - 7 later in September (Sep 15 – Sep 29)             → "This month"
 *   - 12 in October (Oct 1 – Oct 31)                     → future
 *
 * ONLY the `date` field is patched. Title, slug, description, image, locale
 * content, ticket/price/availability, SEO — everything else is untouched.
 * Mapping is by document `_id` (stable), applied to the published doc AND its
 * draft sibling when one exists (field-scoped `.set({date})` — any unrelated
 * unpublished edit on that draft, e.g. drafts.event-f388771dc938's
 * visibleLocales change, is preserved). Full backup of every target +
 * `ifRevisionId` guard per doc. Fully reversible from the backup.
 *
 * Usage:
 *   npm run sanity:redistribute-test-event-dates:dry-run
 *   npm run sanity:redistribute-test-event-dates -- --apply
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

// Ordered by the events' current ascending date (see MIGRATION_REPORT.md
// Part 35). Index 0 → earliest new date, index 31 → latest. Explicit,
// exhaustive, hardcoded — no wildcard, no "all events" loop.
const NEW_DATE_BY_ID: Record<string, string> = {
  "event-7b27b9aedc11": "2026-09-01", // past
  "event-62598f0397d5": "2026-09-02", // past
  "event-15bd6b1d5254": "2026-09-04", // past (sold out)
  "event-97e190f5514b": "2026-09-05", // past
  "event-d79939e4ac73": "2026-09-06", // past
  "event-1ae05d32b005": "2026-09-07", // past
  "event-e003e09c68d2": "2026-09-08", // past
  "event-2f8203083e5d": "2026-09-08", // past
  "event-c6d72832acab": "2026-09-09", // this week (today)
  "event-ddc618d18d7c": "2026-09-10", // this week
  "event-8aaa9a55dce7": "2026-09-11", // this week
  "event-5b1c0e99c990": "2026-09-12", // this week
  "event-a5409ba70713": "2026-09-13", // this week
  "event-a4c1c910533c": "2026-09-15", // later this month
  "event-13bcbbdf8946": "2026-09-17", // later this month
  "event-a91720a9154c": "2026-09-19", // later this month
  "event-2d3f652271b6": "2026-09-21", // later this month
  "event-f3d8e5804b5d": "2026-09-23", // later this month
  "event-42b12da85e31": "2026-09-26", // later this month
  "event-18b70c5c92c8": "2026-09-29", // later this month
  "event-f388771dc938": "2026-10-01", // October
  "event-0a65e3c2e96b": "2026-10-03", // October
  "event-33fa13f65f05": "2026-10-06", // October
  "event-770dc458e83d": "2026-10-08", // October
  "event-73f9f1c60887": "2026-10-10", // October
  "event-7560b87e4ac1": "2026-10-13", // October
  "event-8f07cee99bb7": "2026-10-15", // October
  "event-2a537ce291f6": "2026-10-18", // October
  "event-f149fb29b711": "2026-10-21", // October
  "event-d6dbc3cf8e32": "2026-10-24", // October (sold out)
  "event-6d2d24a81814": "2026-10-28", // October
  "event-8df3fa20c44d": "2026-10-31", // October
};

interface EventDoc { _id: string; _rev: string; date?: string; slug?: { current?: string }; title?: { language?: string; value?: string }[] }

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"} | write token: ${TOKEN ? "present" : "ABSENT"}`);
  if (APPLY && !TOKEN) { console.error("--apply needs SANITY_API_WRITE_TOKEN."); process.exit(1); }

  const ids = Object.keys(NEW_DATE_BY_ID);
  const allIds = ids.flatMap((id) => [id, `drafts.${id}`]);
  const docs = await client.fetch<EventDoc[]>(`*[_id in $ids]`, { ids: allIds });
  const byId = new Map(docs.map((d) => [d._id, d]));

  const ts = Date.now();
  const backupDir = join(process.cwd(), "scripts", "backups");

  console.log("\nBEFORE → AFTER:");
  const rows: { id: string; before?: string; after: string; title?: string }[] = [];
  for (const id of ids) {
    const pub = byId.get(id);
    if (!pub) { console.error(`  MISSING published ${id} — aborting.`); process.exit(1); }
    const en = pub.title?.find((t) => t.language === "en")?.value;
    rows.push({ id, before: pub.date, after: NEW_DATE_BY_ID[id]!, title: en });
    const draft = byId.get(`drafts.${id}`);
    console.log(
      `  ${id.padEnd(24)} ${String(pub.date).padEnd(12)} -> ${NEW_DATE_BY_ID[id]}  ${draft ? "(+draft)" : ""}  ${en ?? ""}`,
    );
  }

  if (!APPLY) { console.log("\nDry run — nothing written."); return; }

  mkdirSync(backupDir, { recursive: true });
  writeFileSync(join(backupDir, `test-event-dates-${ts}.json`), JSON.stringify(docs, null, 2));
  writeFileSync(join(backupDir, `test-event-dates-map-${ts}.json`), JSON.stringify(rows, null, 2));

  let patched = 0;
  for (const doc of docs) {
    const baseId = doc._id.replace(/^drafts\./, "");
    const nextDate = NEW_DATE_BY_ID[baseId];
    if (!nextDate) continue;
    if (doc.date === nextDate) { console.log(`  skip ${doc._id} (already ${nextDate})`); continue; }
    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id: doc._id });
    if (!fresh || fresh._rev !== doc._rev) { console.error(`  ABORT ${doc._id}: changed concurrently.`); process.exitCode = 1; continue; }
    await client.patch(doc._id).ifRevisionId(fresh._rev).set({ date: nextDate }).commit();
    patched++;
    console.log(`  patched ${doc._id} -> ${nextDate}`);
  }
  console.log(`\nDone. ${patched} document(s) patched. Backup: scripts/backups/test-event-dates-${ts}.json`);
  console.log("Re-run `npm run sanity:audit-validation`.");
}

main().catch((e) => { console.error("redistribute-test-event-dates failed:", e instanceof Error ? e.message : e); process.exit(1); });
