/**
 * Removes obsolete rows from the shared `formMessages` singleton's
 * `extraLabels` array — keys nothing in the codebase reads anymore, but
 * which would otherwise sit silently visible (and editable-looking) in
 * Studio's "Additional shared labels" list forever, since `extraLabels`'
 * `key` field is Studio-`readOnly` (the site owner could never remove a row
 * herself — only a script can).
 *
 * Two unrelated cleanups share this one script because they're the same
 * kind of residue and touch the same document:
 *
 * 1. **7 Work With Us CV-upload rows** — fileRequiredMessage,
 *    fileTypeMessage, fileSizeMessage, uploadCvLabel, removeFileLabel,
 *    shortMessageLabel, submitCvLabel (full EN/DA/UK CV wording: "Upload
 *    your CV", "Submit CV", "Please upload your CV.", etc.). Seeded by
 *    scripts/migrate-phase3a-content.ts back when Work With Us was a
 *    CV-upload form. That architecture was removed by
 *    scripts/migrate-work-with-us-application-form.ts (replaced the modal
 *    with a fully text-based application form) and the section itself was
 *    renamed cvUploadForm -> applyForm by
 *    scripts/migrate-work-with-us-rename-section.ts — but neither of those
 *    scripts ever touched `formMessages`.
 * 2. **applicationSentLabel** ("Application Sent" / "Ansøgning sendt" /
 *    "Заявку надіслано") — seeded by the same migrate-phase3a-content.ts
 *    pass, for a submit-button post-success label state
 *    `VolunteerApplicationForm` no longer renders (its button now shows only
 *    `sendingLabel`/`sendApplicationLabel`; success is communicated by the
 *    shared success dialog/content instead). Unrelated to the CV cleanup —
 *    it just happened to be caught by the same later audit.
 *
 * Nothing in the codebase reads any of these 8 keys anymore
 * (lib/sanityForms.ts's ResolvedFormMessages/resolveFormMessages dropped
 * the corresponding fields).
 *
 * Safety:
 *  - Backs up the full current `formMessages` document to scripts/backups/
 *    before writing anything.
 *  - Idempotent: only unsets rows that are actually present; if none of
 *    the keys exist, the document is skipped entirely.
 *  - `ifRevisionId`-guarded: re-fetches the revision immediately before
 *    writing and aborts if it changed since the plan was computed.
 *  - Only the published `formMessages` document exists in production today
 *    (no `drafts.formMessages`) — both ids are still checked defensively.
 *  - Reads the document back after writing and prints the remaining
 *    `extraLabels` keys for a final sanity check.
 *
 * Usage:
 *   npm run sanity:migrate-remove-cv-form-messages:dry-run   (default-safe: prints a plan, writes nothing)
 *   npm run sanity:migrate-remove-cv-form-messages -- --apply
 */
import { createClient } from "@sanity/client";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply") && Boolean(process.env.SANITY_API_WRITE_TOKEN);
const DOC_IDS = ["formMessages", "drafts.formMessages"] as const;

const OBSOLETE_KEYS = [
  "fileRequiredMessage",
  "fileTypeMessage",
  "fileSizeMessage",
  "uploadCvLabel",
  "removeFileLabel",
  "shortMessageLabel",
  "submitCvLabel",
  "applicationSentLabel",
] as const;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

interface KeyedStringRow {
  _key: string;
  key?: string | null;
}
interface FormMessagesDoc {
  _id: string;
  _rev: string;
  extraLabels?: KeyedStringRow[] | null;
}

function backup(id: string, doc: FormMessagesDoc) {
  const backupDir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const filepath = path.join(backupDir, `${id.replace(/[/.]/g, "_")}-remove-cv-labels-${Date.now()}.json`);
  writeFileSync(
    filepath,
    JSON.stringify({ createdAt: new Date().toISOString(), purpose: "Pre-migration backup before removing obsolete CV-upload extraLabels rows", id, document: doc }, null, 2),
  );
  console.log(`  Backed up ${id} to ${filepath}`);
}

async function planFor(id: string) {
  const doc = await client.fetch<FormMessagesDoc | null>(`*[_id == $id][0]{_id, _rev, extraLabels[]{_key, key}}`, { id });
  if (!doc) {
    console.log(`${id}: document not found — nothing to do.`);
    return null;
  }
  const rows = doc.extraLabels ?? [];
  const toRemove = rows.filter((r) => OBSOLETE_KEYS.includes(r.key as (typeof OBSOLETE_KEYS)[number]));
  if (!toRemove.length) {
    console.log(`${id}: none of the 7 obsolete CV keys present — already clean, skipping.`);
    return null;
  }
  console.log(`${id}: rev=${doc._rev} — plan:`);
  console.log(`  remove ${toRemove.length} extraLabels row(s): ${toRemove.map((r) => r.key).join(", ")}`);
  return { doc, toRemove };
}

async function main() {
  console.log(`Mode: ${APPLY ? "LIVE (--apply passed)" : "DRY RUN (no writes) — pass --apply with a write token to apply"}`);
  console.log("== formMessages: remove obsolete Work With Us CV-upload extraLabels rows — plan ==");

  for (const id of DOC_IDS) {
    const plan = await planFor(id);
    if (!plan) continue;

    if (!APPLY) {
      console.log(`  Dry run only for ${id} — no writes performed.`);
      continue;
    }

    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
    if (!fresh || fresh._rev !== plan.doc._rev) {
      console.error(`ABORTED for ${id}: changed concurrently since the plan was computed — re-run to recompute.`);
      process.exitCode = 1;
      continue;
    }

    backup(id, plan.doc);

    await client
      .patch(id)
      .ifRevisionId(fresh._rev)
      .unset(plan.toRemove.map((r) => `extraLabels[_key=="${r._key}"]`))
      .commit();

    console.log(`  Applied removal to ${id}.`);

    const after = await client.fetch<FormMessagesDoc | null>(`*[_id == $id][0]{_id, extraLabels[]{key}}`, { id });
    console.log(`  Read-back: ${id}'s remaining extraLabels keys: ${(after?.extraLabels ?? []).map((r) => r.key).join(", ") || "(none)"}`);
    const stillObsolete = (after?.extraLabels ?? []).filter((r) => OBSOLETE_KEYS.includes(r.key as (typeof OBSOLETE_KEYS)[number]));
    if (stillObsolete.length) {
      console.error(`  WARNING: ${stillObsolete.length} obsolete key(s) still present after write: ${stillObsolete.map((r) => r.key).join(", ")}`);
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error("migrate-remove-cv-form-messages failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
