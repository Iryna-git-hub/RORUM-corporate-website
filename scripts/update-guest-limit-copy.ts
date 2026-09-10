/**
 * Phase 7 (2026-09-09): RORUM's room holds up to 12 guests, not 30. The
 * booking form's guest-count `max` + client validation are now 12 (see
 * components/InquiryForm.tsx); this brings the localized out-of-range
 * validation message in `formMessages.guestsRangeMessage` in line.
 *
 * ONLY `guestsRangeMessage` is touched, and ONLY when its current value
 * still references "30" (idempotent — safe to re-run). Full document backup
 * + `ifRevisionId` guard. Published + draft handled the same way.
 *
 * Usage:
 *   npm run sanity:update-guest-limit-copy:dry-run
 *   npm run sanity:update-guest-limit-copy -- --apply
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

const NEW_VALUES: Record<string, string> = {
  en: "Please enter a whole number between 1 and 12.",
  da: "Indtast venligst et helt tal mellem 1 og 12.",
  uk: "Будь ласка, введіть ціле число від 1 до 12.",
};

interface I18nEntry { _key: string; _type?: string; language?: string; value?: string }
interface FormMessagesDoc { _id: string; _rev: string; guestsRangeMessage?: I18nEntry[] }

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"} | write token: ${TOKEN ? "present" : "ABSENT"}`);
  if (APPLY && !TOKEN) { console.error("--apply needs SANITY_API_WRITE_TOKEN."); process.exit(1); }

  const ts = Date.now();
  const backupDir = join(process.cwd(), "scripts", "backups");

  for (const id of ["formMessages", "drafts.formMessages"]) {
    const doc = await client.fetch<FormMessagesDoc | null>(`*[_id == $id][0]`, { id });
    if (!doc) { console.log(`\n${id}: not present — skipping.`); continue; }
    const current = doc.guestsRangeMessage ?? [];
    const needsUpdate = current.some((e) => (e.value ?? "").includes("30")) || current.length < 3;
    console.log(`\n=== ${id} (rev ${doc._rev}) ===`);
    for (const e of current) console.log(`  now  ${e.language}: ${e.value}`);
    if (!needsUpdate) { console.log("  already updated — nothing to do."); continue; }

    const next: I18nEntry[] = (["en", "da", "uk"] as const).map((lang) => ({
      _key: lang, _type: "internationalizedArrayStringValue", language: lang, value: NEW_VALUES[lang]!,
    }));
    for (const e of next) console.log(`  ->   ${e.language}: ${e.value}`);
    if (!APPLY) continue;

    mkdirSync(backupDir, { recursive: true });
    writeFileSync(join(backupDir, `guest-limit-copy-${id.replace(/[^a-z-]/gi, "_")}-${ts}.json`), JSON.stringify(doc, null, 2));

    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
    if (!fresh || fresh._rev !== doc._rev) { console.error(`  ABORT ${id}: changed concurrently.`); process.exitCode = 1; continue; }
    await client.patch(id).ifRevisionId(fresh._rev).set({ guestsRangeMessage: next }).commit();
    console.log("  applied.");
  }
  console.log("\nDone. Re-run `npm run sanity:audit-validation`.");
}

main().catch((e) => { console.error("update-guest-limit-copy failed:", e instanceof Error ? e.message : e); process.exit(1); });
