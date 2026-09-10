/**
 * Phase C1 + C2 (2026-09-09): unset two proven-obsolete "unknown field" values
 * that Studio surfaces as "Unknown field found" warnings (never blocking, but
 * confusing and dead weight against the free-plan attribute cap).
 *
 * C1 — `event.host` (35 documents): NOT in `sanity/schemaTypes/documents/event.ts`;
 *      grep-verified that no frontend/lib/query code reads `event.host` (every
 *      `.host` / "host" hit is `variant="host"` on CTASection, unrelated).
 *      Superseded — event hosting is implicit (RORUM). Unset only `host`.
 *
 * C2 — `formMessages.privacyConsentLabel`: NOT in
 *      `sanity/schemaTypes/singletons/formMessages.ts` (which defines
 *      `privacyConsentPrefixText` + `privacyConsentRequiredMessage`); the
 *      frontend reads `messages.privacyConsentPrefixText` (components/PrivacyConsent.tsx),
 *      never `privacyConsentLabel`. The old single full-sentence label was
 *      split into a prefix + a Privacy Policy link. Unset only `privacyConsentLabel`.
 *
 * Full document backups written before any write; every patch revision-guarded.
 * No other field is touched. Draft copies handled the same way when present.
 *
 * Usage:
 *   npm run sanity:remove-legacy-unknown-fields:dry-run
 *   npm run sanity:remove-legacy-unknown-fields -- --apply
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

interface Doc { _id: string; _rev: string; _type: string }

async function unsetField(groqSelector: string, field: string, ts: number, backupDir: string) {
  console.log(`\n=== unset "${field}" on ${groqSelector} ===`);
  const docs = await client.fetch<Doc[]>(`*[${groqSelector}]`);
  if (!docs.length) { console.log("  no documents carry this field — nothing to do."); return; }
  console.log(`  ${docs.length} document(s) carry .${field}: ${docs.map((d) => d._id).join(", ")}`);

  if (!APPLY) return;

  mkdirSync(backupDir, { recursive: true });
  writeFileSync(join(backupDir, `legacy-unknown-${field}-${ts}.json`), JSON.stringify(docs, null, 2));

  for (const d of docs) {
    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id: d._id });
    if (!fresh || fresh._rev !== d._rev) { console.error(`  ABORT ${d._id}: changed concurrently. Skipping.`); process.exitCode = 1; continue; }
    await client.patch(d._id).ifRevisionId(fresh._rev).unset([field]).commit();
    console.log(`  unset ${field} on ${d._id}`);
  }
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"} | write token: ${TOKEN ? "present" : "ABSENT"}`);
  if (APPLY && !TOKEN) { console.error("--apply needs SANITY_API_WRITE_TOKEN."); process.exit(1); }
  const ts = Date.now();
  const backupDir = join(process.cwd(), "scripts", "backups");
  await unsetField(`_type == "event" && defined(host)`, "host", ts, backupDir);
  await unsetField(`_type == "formMessages" && defined(privacyConsentLabel)`, "privacyConsentLabel", ts, backupDir);
  console.log("\nDone. Re-run the audits + reload an Event in Studio to confirm no 'Unknown field' warning.");
}

main().catch((e) => { console.error("remove-legacy-unknown-fields failed:", e instanceof Error ? e.message : e); process.exit(1); });
