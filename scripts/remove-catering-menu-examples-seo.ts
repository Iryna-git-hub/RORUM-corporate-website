/**
 * Removes the `seo` block from `page-catering-menu-examples`.
 *
 * Root cause: an earlier pass (scripts/repair-catering-seo.ts) seeded real,
 * non-empty title/description/ogImage values onto this document's `seo`
 * field and reported it "connected." Tracing generateMetadata() in
 * app/[locale]/(site)/catering/page.tsx shows that's wrong: Catering Menu
 * Examples is an in-page overlay, never its own route — only ONE
 * generateMetadata() call exists for the whole /catering surface, and it
 * reads exclusively from `page-catering`'s own `seo` (via `newPage.seo`).
 * `page-catering-menu-examples.seo` has zero code paths reading it. Leaving
 * real-looking, non-empty SEO content there is actively misleading (a
 * manager could reasonably believe editing it changes something), so it's
 * removed rather than left as visible-but-inert — see page.ts's `seo`
 * field, now hidden specifically on this document.
 *
 * `page-catering`'s own `seo` (the one real, connected block) is completely
 * untouched by this script.
 *
 * Idempotent: does nothing if `seo` is already unset.
 *
 * Usage:
 *   npm run sanity:remove-catering-menu-seo:dry-run
 *   npm run sanity:remove-catering-menu-seo
 */
import { createClient } from "@sanity/client";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;
const DOC_ID = "page-catering-menu-examples";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log(`\n== Remove misleading seo block from ${DOC_ID} ==`);

  const doc = await client.fetch<{ _id: string; _rev: string; seo?: unknown } | null>(`*[_id == $id][0]{_id, _rev, seo}`, { id: DOC_ID });
  if (!doc) {
    console.error(`ABORTED: ${DOC_ID} not found.`);
    process.exitCode = 1;
    return;
  }
  if (!doc.seo) {
    console.log("seo is already unset — nothing to do.");
    return;
  }

  console.log("Current seo block is non-empty — WOULD UNSET seo.");
  if (DRY_RUN) {
    console.log("\nDry run only — no writes performed.");
    return;
  }

  const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id: DOC_ID });
  if (!fresh || fresh._rev !== doc._rev) {
    console.error(`ABORTED: ${DOC_ID} changed concurrently — re-run to recompute.`);
    process.exitCode = 1;
    return;
  }

  await client.patch(DOC_ID).ifRevisionId(fresh._rev).unset(["seo"]).commit();
  console.log(`\n${DOC_ID}: seo unset.`);
  console.log("Live removal complete.");
}

main().catch((error) => {
  console.error("remove-catering-menu-examples-seo failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
