/**
 * Removes exactly one malformed stray entry from `drafts.page-home`'s
 * `seo.title` array — confirmed via the official `sanity documents
 * validate` engine as the one remaining Publish blocker on that draft after
 * scripts/backfill-seo-copy.ts filled in the real EN/DA/UK titles:
 *
 *   { "_key": "7ca7a0c040e2", "_type": "internationalizedArrayStringValue" }
 *
 * Confirmed live before this script touches anything:
 *   - the target has ONLY `_key`/`_type` — no `language`, no `value`;
 *   - it predates this session's own SEO backfill (present in the pre-
 *     backfill backup snapshot already) — not something this session wrote;
 *   - `seo.title` also has real en/da/uk entries (the backfill's own work),
 *     which this script never touches — only the one stray, valueless entry;
 *   - it cannot be rendered: `pickLocalized()` matches by `entry.language`,
 *     so an entry with no `language` at all can never match any locale —
 *     already inert to every reader before this fix, not just after;
 *   - this touches `drafts.page-home` ONLY — the published `page-home` has
 *     no such stray entry and is not read or written by this script.
 *
 * Same pattern as scripts/repair-event-decoration-seo-residue.ts. Fully
 * revision-guarded and dry-run by default.
 *
 * Usage:
 *   npm run sanity:repair-home-seo-residue:dry-run
 *   npm run sanity:repair-home-seo-residue -- --apply
 */
import { createClient } from "@sanity/client";

const APPLY = process.argv.includes("--apply") && Boolean(process.env.SANITY_API_WRITE_TOKEN);
const DOC_ID = "drafts.page-home";
const TARGET_KEY = "7ca7a0c040e2";

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
interface HomeDoc {
  _id: string;
  _rev: string;
  seo?: { title?: SeoTitleEntry[] };
}

async function main() {
  console.log(`Mode: ${APPLY ? "LIVE (--apply passed)" : "DRY RUN (no writes) — pass --apply with a write token to apply"}`);
  console.log(`== ${DOC_ID}: seo.title stray-entry cleanup — plan ==`);

  const doc = await client.fetch<HomeDoc | null>(`*[_id == $id][0]{_id, _rev, seo}`, { id: DOC_ID });
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
  console.log(`\nWould unset exactly: seo.title[_key=="${TARGET_KEY}"] (the one array member, by _key — nothing else)`);

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
  console.error("repair-home-seo-title-residue failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
