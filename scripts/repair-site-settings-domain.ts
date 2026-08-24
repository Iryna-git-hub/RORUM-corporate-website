/**
 * Corrects exactly one fact on `siteSettings` (and `drafts.siteSettings`,
 * if it exists): the `siteUrl` field's stored value. Live audit (raw
 * perspective, before this script existed) found:
 *
 *   siteUrl: "https://rorum.dk"   <- wrong, no-hyphen domain
 *   website: "ro-rum.dk"          <- already correct, left untouched
 *
 * `siteUrl` is corrected to "https://ro-rum.dk" (matching
 * shared/siteIdentity.ts's PRODUCTION_ORIGIN exactly) purely for data
 * consistency/reference — the runtime no longer reads this field as an
 * authority at all (see lib/siteSettings.ts's getSeoSiteDefaults(), which
 * always uses PRODUCTION_ORIGIN directly) and the schema field is now
 * read-only in Studio, so this script is a one-time data correction, not a
 * behavior change.
 *
 * Explicitly does NOT touch: companyName, cvr, website, defaultSeo (title/
 * description/ogImage/alt, any language), announcementEnabled/Text/Link, or
 * any other document. Only the single `siteUrl` string field, only if its
 * current value differs from the target.
 *
 * Same dry-run-by-default, revision-guarded, re-fetch-before-write pattern
 * as scripts/repair-home-seo-title-residue.ts.
 *
 * Usage:
 *   npm run sanity:repair-site-settings-domain:dry-run
 *   npm run sanity:repair-site-settings-domain -- --apply
 */
import { createClient } from "@sanity/client";
import { PRODUCTION_ORIGIN } from "../shared/siteIdentity";

const APPLY = process.argv.includes("--apply") && Boolean(process.env.SANITY_API_WRITE_TOKEN);
const DOC_IDS = ["siteSettings", "drafts.siteSettings"] as const;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

interface SiteSettingsDoc {
  _id: string;
  _rev: string;
  siteUrl?: string;
  website?: string;
}

async function planFor(id: string): Promise<{ doc: SiteSettingsDoc; needsChange: boolean } | null> {
  const doc = await client.fetch<SiteSettingsDoc | null>(`*[_id == $id][0]{_id, _rev, siteUrl, website}`, { id });
  if (!doc) {
    console.log(`${id}: document not found — nothing to do.`);
    return null;
  }
  const needsChange = doc.siteUrl !== PRODUCTION_ORIGIN;
  console.log(`${id}: siteUrl = ${JSON.stringify(doc.siteUrl)} | website = ${JSON.stringify(doc.website)}`);
  console.log(needsChange ? `  -> would set siteUrl to "${PRODUCTION_ORIGIN}"` : "  -> already correct, no change needed");
  return { doc, needsChange };
}

async function main() {
  console.log(`Mode: ${APPLY ? "LIVE (--apply passed)" : "DRY RUN (no writes) — pass --apply with a write token to apply"}`);
  console.log(`== siteSettings domain-authority correction — plan ==`);

  for (const id of DOC_IDS) {
    const plan = await planFor(id);
    if (!plan || !plan.needsChange) continue;

    if (!APPLY) {
      console.log(`  Dry run only for ${id} — no writes performed. Requires explicit authorization before --apply.`);
      continue;
    }

    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
    if (!fresh || fresh._rev !== plan.doc._rev) {
      console.error(`ABORTED for ${id}: changed concurrently since the plan was computed — re-run to recompute.`);
      process.exitCode = 1;
      continue;
    }

    await client.patch(id).ifRevisionId(fresh._rev).set({ siteUrl: PRODUCTION_ORIGIN }).commit();
    console.log(`  Applied to ${id}.`);
  }
}

main().catch((error) => {
  console.error("repair-site-settings-domain failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
