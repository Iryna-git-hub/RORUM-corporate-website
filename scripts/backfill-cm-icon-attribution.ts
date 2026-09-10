/**
 * Phase 10 (2026-09-09): the Community Membership "Membership icons designed
 * by Freepik from Flaticon." line was a hardcoded English sentence in
 * community-membership/page.tsx. It is now read from the `benefits` section's
 * `text` field (localized), with `{freepik}` / `{flaticon}` placeholders that
 * the frontend replaces with the real attribution links (URLs stay in code —
 * see BenefitsAttribution in that page). This backfills EN + DA + UK.
 *
 * EN = the exact English sentence the page rendered before (as a template),
 * so nothing changes for English visitors. `benefits.text` is currently
 * empty on the published doc (verified); this is a clean create.
 *
 * Full backup + `ifRevisionId` guard. Published + draft if present.
 *
 * Usage:
 *   npm run sanity:backfill-cm-icon-attribution:dry-run
 *   npm run sanity:backfill-cm-icon-attribution -- --apply
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

const ATTRIBUTION: Record<string, string> = {
  en: "Membership icons designed by {freepik} from {flaticon}.",
  da: "Medlemsikoner designet af {freepik} fra {flaticon}.",
  uk: "Іконки членства розроблені {freepik} з {flaticon}.",
};

interface I18nEntry { _key: string; _type?: string; language?: string; value?: string }
interface Section { _key: string; sectionKey?: string; text?: I18nEntry[] }
interface PageDoc { _id: string; _rev: string; sections?: Section[] }

const hasAny = (e: I18nEntry[] | undefined) => (e ?? []).some((x) => x.value?.trim());

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"} | write token: ${TOKEN ? "present" : "ABSENT"}`);
  if (APPLY && !TOKEN) { console.error("--apply needs SANITY_API_WRITE_TOKEN."); process.exit(1); }

  const ts = Date.now();
  const backupDir = join(process.cwd(), "scripts", "backups");

  for (const id of ["page-community-membership", "drafts.page-community-membership"]) {
    const doc = await client.fetch<PageDoc | null>(`*[_id == $id][0]`, { id });
    if (!doc) { console.log(`\n${id}: not present — skipping.`); continue; }
    const section = (doc.sections ?? []).find((s) => s.sectionKey === "benefits");
    if (!section) { console.log(`\n${id}: no benefits section — skipping.`); continue; }
    console.log(`\n=== ${id} (rev ${doc._rev}) ===`);
    if (hasAny(section.text)) { console.log("  benefits.text already populated — nothing to do."); continue; }

    const entries: I18nEntry[] = (["en", "da", "uk"] as const).map((lang) => ({
      _key: lang, _type: "internationalizedArrayTextValue", language: lang, value: ATTRIBUTION[lang]!,
    }));
    for (const e of entries) console.log(`  + benefits.text ${e.language}: ${e.value}`);
    if (!APPLY) continue;

    mkdirSync(backupDir, { recursive: true });
    writeFileSync(join(backupDir, `cm-icon-attribution-${id.replace(/[^a-z-]/gi, "_")}-${ts}.json`), JSON.stringify(doc, null, 2));

    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
    if (!fresh || fresh._rev !== doc._rev) { console.error(`  ABORT ${id}: changed concurrently.`); process.exitCode = 1; continue; }
    await client
      .patch(id)
      .ifRevisionId(fresh._rev)
      .set({ [`sections[_key=="${section._key}"].text`]: entries })
      .commit();
    console.log("  applied.");
  }
  console.log("\nDone. Re-run `npm run sanity:audit-validation` + `npm run sanity:audit-sections`.");
}

main().catch((e) => { console.error("backfill-cm-icon-attribution failed:", e instanceof Error ? e.message : e); process.exit(1); });
