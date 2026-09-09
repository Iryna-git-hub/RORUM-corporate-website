/**
 * Removes an unrecognized Studio-residue row from page-events' `filters`
 * section — one empty `contentItem` (_key "1c3dfe879f0a", no itemKey, a single
 * valueless `label` entry) left behind before EventsFiltersInput disabled the
 * array "add" action. It's read by nothing (lib/eventFilters.ts only looks up
 * the 17 reserved itemKeys) and doesn't block Publish, but it renders as a
 * confusing unlabelled "Other items" card in the editor. Flagged by
 * `npm run sanity:audit-sections` (closed-item-set check).
 *
 * Only removes rows whose itemKey is NOT one of the 17 canonical filter keys.
 * Backs up both documents first; ifRevisionId-guarded.
 *
 * Usage:
 *   npm run sanity:clean-events-filters-residue:dry-run
 *   npm run sanity:clean-events-filters-residue -- --apply
 */
import { createClient } from "@sanity/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ALL_EVENT_FILTER_ITEM_KEYS } from "@/shared/eventFilterDefinitions";

const APPLY = process.argv.includes("--apply");
const TOKEN = process.env.SANITY_API_WRITE_TOKEN;
const ALLOWED = new Set(ALL_EVENT_FILTER_ITEM_KEYS);

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: TOKEN,
  useCdn: false,
  perspective: "raw",
});

interface Item { _key: string; itemKey?: string }
interface Section { _key: string; sectionKey?: string; items?: Item[] }
interface PageDoc { _id: string; _rev: string; sections?: Section[] }

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"} | write token: ${TOKEN ? "present" : "ABSENT"}`);
  if (APPLY && !TOKEN) { console.error("--apply needs SANITY_API_WRITE_TOKEN."); process.exit(1); }

  const ts = Date.now();
  const backupDir = join(process.cwd(), "scripts", "backups");
  const targets: { id: string; rev: string; sectionKey: string; strays: Item[] }[] = [];
  const backups: PageDoc[] = [];

  for (const id of ["page-events", "drafts.page-events"]) {
    const doc = await client.fetch<PageDoc | null>(`*[_id == $id][0]`, { id });
    if (!doc) { console.log(`${id}: not found.`); continue; }
    backups.push(doc);
    const filters = (doc.sections ?? []).find((s) => s.sectionKey === "filters");
    if (!filters) { console.log(`${id}: no filters section.`); continue; }
    const strays = (filters.items ?? []).filter((it) => !it.itemKey || !ALLOWED.has(it.itemKey));
    if (strays.length) targets.push({ id, rev: doc._rev, sectionKey: filters.sectionKey!, strays });
    console.log(`${id}: ${strays.length} stray row(s) — ${strays.map((s) => s._key).join(", ") || "none"}`);
  }

  if (!targets.length) { console.log("\nNothing to clean."); return; }

  if (APPLY) {
    mkdirSync(backupDir, { recursive: true });
    const bfile = join(backupDir, `events-filters-residue-${ts}.json`);
    writeFileSync(bfile, JSON.stringify(backups, null, 2));
    console.log(`\nBacked up to ${bfile}`);
  }

  if (!APPLY) { console.log("\nDry run — re-run with --apply."); return; }

  for (const t of targets) {
    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id: t.id });
    if (!fresh || fresh._rev !== t.rev) { console.error(`ABORT ${t.id}: changed concurrently. Re-run.`); process.exitCode = 1; continue; }
    let tx = client.transaction();
    for (const s of t.strays) {
      tx = tx.patch(t.id, (p) => p.ifRevisionId(fresh._rev).unset([`sections[sectionKey=="${t.sectionKey}"].items[_key=="${s._key}"]`]));
    }
    await tx.commit();
    console.log(`Removed ${t.strays.length} row(s) from ${t.id}.`);
  }
  console.log("\nDone. Re-run `npm run sanity:audit-sections`.");
}

main().catch((e) => { console.error("clean-events-filters-residue failed:", e instanceof Error ? e.message : e); process.exit(1); });
