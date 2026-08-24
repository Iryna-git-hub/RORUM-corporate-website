/**
 * Proposed repair for the live `socialLinks` LinkedIn entry (`_key`
 * "d0d8654a20c0"), found via the official `sanity documents validate`
 * engine:
 *   1. `label` has only an "en" entry ("linkedin", lowercase) — missing
 *      da/uk, which `socialLink.ts`'s new `requireAllLanguages()`
 *      validation (this session's Contact work) now requires. Proposed:
 *      "LinkedIn" (capitalized, matching the existing Instagram/Facebook
 *      entries' own convention of using the untranslated platform name
 *      verbatim in all 3 languages — a proper noun, not editorial copy).
 *   2. `href` is `"https:/linkedin.com"` — a single slash after the
 *      scheme. Confirmed NOT functionally broken (the WHATWG URL parsing
 *      algorithm — the same one browsers use — normalizes this to
 *      "https://linkedin.com/" automatically; `new URL("https:/linkedin.com").href`
 *      === "https://linkedin.com/" in Node), which is also why Sanity's own
 *      `uri()` validator does not flag it as invalid. Proposed anyway, for
 *      data hygiene/consistency with every other stored href on the site
 *      (which all use the conventional double-slash form): normalize to
 *      "https://linkedin.com".
 *
 * NEITHER correction is applied by default — this script only prints the
 * exact planned change and requires `--apply` (in addition to a real write
 * token) to write anything, on top of the project's standard dry-run
 * default. This is a live-content correction to a real manager's data, not
 * a schema/code fix, and needs explicit authorization per this project's
 * standing rule for that class of change.
 *
 * Usage:
 *   npm run sanity:repair-social-links:dry-run
 *   npm run sanity:repair-social-links -- --apply   (only after authorization)
 */
import { createClient } from "@sanity/client";

const APPLY = process.argv.includes("--apply") && Boolean(process.env.SANITY_API_WRITE_TOKEN);

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

const TARGET_KEY = "d0d8654a20c0";
const PROPOSED_LABEL = { en: "LinkedIn", da: "LinkedIn", uk: "LinkedIn" };
const PROPOSED_HREF = "https://linkedin.com";

interface I18nEntry {
  _key: string;
  language?: string;
  value?: string;
}
interface SocialLink {
  _key: string;
  icon?: string;
  href?: string;
  label?: I18nEntry[];
}
interface SocialLinksDoc {
  _id: string;
  _rev: string;
  links?: SocialLink[];
}

async function planFor(id: string) {
  const doc = await client.fetch<SocialLinksDoc | null>(`*[_id == $id][0]{_id, _rev, links}`, { id });
  if (!doc) {
    console.log(`\n${id}: document not found — skipped.`);
    return;
  }
  const link = doc.links?.find((l) => l._key === TARGET_KEY);
  if (!link) {
    console.log(`\n${id}: no link with _key "${TARGET_KEY}" — skipped.`);
    return;
  }

  console.log(`\n${id} — link _key="${TARGET_KEY}" (icon: ${link.icon}):`);
  const currentEn = link.label?.find((e) => e.language === "en")?.value;
  console.log(`  label.en: current="${currentEn}" -> proposed unchanged; WOULD ADD da="${PROPOSED_LABEL.da}", uk="${PROPOSED_LABEL.uk}"`);
  console.log(`  href: current="${link.href}" -> proposed="${PROPOSED_HREF}" (functionally equivalent per WHATWG URL normalization — cosmetic-only change)`);

  if (!APPLY) return;

  const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
  if (!fresh || fresh._rev !== doc._rev) {
    console.error(`  ABORTED (${id}): changed concurrently — re-run to recompute.`);
    process.exitCode = 1;
    return;
  }

  const daEntry: I18nEntry = { _key: "da", language: "da", value: PROPOSED_LABEL.da };
  const ukEntry: I18nEntry = { _key: "uk", language: "uk", value: PROPOSED_LABEL.uk };
  await client
    .patch(id)
    .ifRevisionId(fresh._rev)
    .set({ [`links[_key=="${TARGET_KEY}"].href`]: PROPOSED_HREF })
    .insert("after", `links[_key=="${TARGET_KEY}"].label[-1]`, [daEntry, ukEntry])
    .commit();
  console.log("  Applied.");
}

async function main() {
  console.log(`Mode: ${APPLY ? "LIVE (--apply passed)" : "DRY RUN (no writes) — pass --apply with a write token to apply"}`);
  console.log("== socialLinks LinkedIn entry repair — plan ==");
  for (const id of ["socialLinks", "drafts.socialLinks"]) {
    await planFor(id);
  }
  console.log(APPLY ? "\nLive repair complete." : "\nDry run only — no writes performed. Requires explicit authorization before --apply.");
}

main().catch((error) => {
  console.error("repair-social-links failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
