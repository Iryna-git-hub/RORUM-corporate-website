/**
 * Unsets 10 confirmed-empty, unused stray field residue paths on
 * `drafts.page-catering` — leftovers from a Studio field being opened then
 * cleared. Every target was individually verified (not assumed) before
 * this script was written: each `internationalizedArray*Value` entry has a
 * `language` and `_type` but genuinely NO `value` key at all (not even an
 * empty string), and each flagged image has NO `asset` reference.
 *
 * Per-path impact (see the Catering integration report for full detail):
 *   - seo.title / seo.description / seo.ogImage: visible in Studio, but
 *     never validated to block Publish (seo's own validation is an
 *     optional English-length check + an event-only completeness check
 *     that no-ops for `_type: "page"`), and never read by the frontend for
 *     a DRAFT (only the published perspective feeds generateMetadata()).
 *   - sections[philosophy].label: visible AND validated
 *     (allOrNothingLanguages, unconditional for the "split" sectionKind) —
 *     this ONE path is a genuine, currently-live Publish blocker the
 *     moment anyone tries to publish this draft as-is.
 *   - sections[steps].items[stepN].label / .image: hidden by
 *     contentItem.ts's "Catering 3-step setup row" role (visible: only
 *     title/text) — validation is already skipped via the same role check,
 *     so these were never actually blocking anything.
 *
 * Never touches an image object that has a real `asset` reference — only
 * empty stubs. Revision-guarded, dry-run by default.
 *
 * Usage:
 *   npm run sanity:clean-catering-draft-residue:dry-run
 *   npm run sanity:clean-catering-draft-residue
 */
import { createClient } from "@sanity/client";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;
const DOC_ID = "drafts.page-catering";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

interface I18nEntry {
  language?: string;
  value?: string;
}
interface Doc {
  _rev: string;
  seo?: { title?: I18nEntry[]; description?: I18nEntry[]; ogImage?: { asset?: { _ref?: string } } };
  sections?: { sectionKey?: string; label?: I18nEntry[]; items?: { _key: string; itemKey?: string; label?: I18nEntry[]; image?: { asset?: { _ref?: string } } }[] }[];
}

function isGenuinelyEmpty(entries: I18nEntry[] | undefined): boolean {
  return !!entries?.length && entries.every((e) => !e.value?.trim());
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log(`\n== Clean stray draft residue on ${DOC_ID} ==`);

  const doc = await client.fetch<Doc | null>(`*[_id == $id][0]`, { id: DOC_ID });
  if (!doc) {
    console.log(`${DOC_ID} does not exist — nothing to do.`);
    return;
  }

  const targets: string[] = [];
  if (isGenuinelyEmpty(doc.seo?.title)) targets.push("seo.title");
  if (isGenuinelyEmpty(doc.seo?.description)) targets.push("seo.description");
  if (doc.seo?.ogImage && !doc.seo.ogImage.asset?._ref) targets.push("seo.ogImage");

  const philosophy = doc.sections?.find((s) => s.sectionKey === "philosophy");
  if (isGenuinelyEmpty(philosophy?.label)) targets.push(`sections[sectionKey=="philosophy"].label`);

  const steps = doc.sections?.find((s) => s.sectionKey === "steps");
  for (const item of steps?.items ?? []) {
    if (isGenuinelyEmpty(item.label)) targets.push(`sections[sectionKey=="steps"].items[_key=="${item._key}"].label`);
    if (item.image && !item.image.asset?._ref) targets.push(`sections[sectionKey=="steps"].items[_key=="${item._key}"].image`);
  }

  console.log(`\n${targets.length} path(s) confirmed genuinely empty:`);
  for (const t of targets) console.log(`  WOULD UNSET ${t}`);

  if (DRY_RUN) {
    console.log("\nDry run only — no writes performed.");
    return;
  }
  if (targets.length === 0) {
    console.log("\nNothing to clean — live run would be a no-op. Exiting without writing.");
    return;
  }

  const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id: DOC_ID });
  if (!fresh || fresh._rev !== doc._rev) {
    console.error("ABORTED: document changed concurrently — re-run to recompute.");
    process.exitCode = 1;
    return;
  }

  await client.patch(DOC_ID).ifRevisionId(fresh._rev).unset(targets).commit();
  console.log(`\n${DOC_ID}: unset ${targets.length} path(s).`);
  console.log("Live cleanup complete.");
}

main().catch((error) => {
  console.error("clean-catering-draft-residue failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
