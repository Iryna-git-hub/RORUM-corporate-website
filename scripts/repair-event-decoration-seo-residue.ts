/**
 * Removes exactly one malformed stray entry from
 * drafts.page-event-decoration's `seo.title` array — the entire current
 * Publish blocker for that draft (confirmed via the official `sanity
 * documents validate` engine, see MIGRATION_REPORT.md):
 *
 *   { "_key": "01705d3487af", "_type": "internationalizedArrayStringValue" }
 *
 * Proven safe before this script does anything (re-checked live, not
 * assumed):
 *   - the target has ONLY `_key`/`_type` — no `language`, no `value`, no
 *     other property;
 *   - it is the ONLY entry in `seo.title` (no sibling translation exists
 *     that could be confused for it or accidentally touched);
 *   - the entire `seo` block on this draft has no `description`/`ogImage`
 *     either — this residue was never part of a real, filled-in SEO edit;
 *   - it cannot be rendered: `lib/sanity-i18n.ts`'s `pickLocalized()` (what
 *     every SEO consumer uses) matches entries by `entry.language ===
 *     locale` — an entry with no `language` at all can never match any
 *     locale, so it was already inert to every reader before this fix, not
 *     just after;
 *   - this touches `drafts.page-event-decoration` ONLY — `page-event-decoration`
 *     (published) has no `seo.title` at all and is not read or written by
 *     this script;
 *   - published-vs-draft state elsewhere (the video, the gallery reorder)
 *     is completely untouched by this patch, which targets one array
 *     member by `_key` inside `seo.title` only.
 *
 * Fully revision-guarded (`ifRevisionId`) and dry-run by default —
 * requires explicit `--apply` AND a real write token to write anything.
 *
 * Usage:
 *   npm run sanity:repair-ed-seo-residue:dry-run
 *   npm run sanity:repair-ed-seo-residue -- --apply   (only after authorization)
 */
import { createClient } from "@sanity/client";

const APPLY = process.argv.includes("--apply") && Boolean(process.env.SANITY_API_WRITE_TOKEN);
const DOC_ID = "drafts.page-event-decoration";
const TARGET_KEY = "01705d3487af";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

interface SeoTitleEntry {
  _key: string;
  _type: string;
  language?: string;
  value?: string;
}
interface EventDecorationDoc {
  _id: string;
  _rev: string;
  seo?: { title?: SeoTitleEntry[]; description?: unknown; ogImage?: unknown };
}

async function main() {
  console.log(`Mode: ${APPLY ? "LIVE (--apply passed)" : "DRY RUN (no writes) — pass --apply with a write token to apply"}`);
  console.log(`== ${DOC_ID}: seo.title stray-entry cleanup — plan ==`);

  const doc = await client.fetch<EventDecorationDoc | null>(`*[_id == $id][0]{_id, _rev, seo}`, { id: DOC_ID });
  if (!doc) {
    console.log(`${DOC_ID}: document not found — nothing to do.`);
    return;
  }

  const target = doc.seo?.title?.find((e) => e._key === TARGET_KEY);
  if (!target) {
    console.log(`${DOC_ID}: no entry with _key "${TARGET_KEY}" found in seo.title — already clean, nothing to do.`);
    return;
  }

  const extraKeys = Object.keys(target).filter((k) => k !== "_key" && k !== "_type");
  console.log(`Target entry: ${JSON.stringify(target)}`);
  console.log(`  has language: ${"language" in target} | has value: ${"value" in target} | other properties: ${extraKeys.length ? extraKeys.join(", ") : "(none)"}`);
  console.log(`  sibling seo.title entries left untouched: ${JSON.stringify((doc.seo?.title ?? []).filter((e) => e._key !== TARGET_KEY))}`);
  console.log(`  seo.description/.ogImage on this draft: ${JSON.stringify({ description: doc.seo?.description, ogImage: doc.seo?.ogImage })} (untouched either way — this patch only targets seo.title[_key=="${TARGET_KEY}"])`);
  console.log(`\nWould unset exactly: sections/seo.title[_key=="${TARGET_KEY}"] (the one array member, by _key — nothing else)`);

  if (!APPLY) {
    console.log("\nDry run only — no writes performed. Requires explicit authorization before --apply.");
    return;
  }

  const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id: DOC_ID });
  if (!fresh || fresh._rev !== doc._rev) {
    console.error(`ABORTED: ${DOC_ID} changed concurrently since the plan was computed — re-run to recompute.`);
    process.exitCode = 1;
    return;
  }

  await client
    .patch(DOC_ID)
    .ifRevisionId(fresh._rev)
    .unset([`seo.title[_key=="${TARGET_KEY}"]`])
    .commit();
  console.log("\nApplied.");
}

main().catch((error) => {
  console.error("repair-event-decoration-seo-residue failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
