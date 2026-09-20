/**
 * Seeds page-contact's hero section with the 3 reserved "contactDetail-*"
 * display-order rows (Address, Phone, Email, in that order) — the presence/
 * order signal ContactDetailsOrderInput.tsx and lib/sanityContact.ts's
 * resolveContactDetailOrder() read (see contentItem.ts's "Contact detail
 * display row" role). No content is written to these rows — they carry
 * only `_key`/`itemKey`; the underlying facts stay in `contactInfo`.
 *
 * Only runs if the hero section has ZERO contactDetail-* rows yet — a
 * document that already has some (e.g. re-run after a partial manual edit)
 * is left untouched, never re-added or reordered.
 *
 * Usage:
 *   npm run sanity:migrate-contact-details:dry-run
 *   npm run sanity:migrate-contact-details
 */
import { createClient } from "@sanity/client";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

const DETAIL_KEYS = ["address", "phone", "email"] as const;
const DOC_IDS = ["page-contact", "drafts.page-contact"];

interface Section {
  _key: string;
  sectionKey?: string;
  items?: { _key?: string; itemKey?: string }[];
}
interface ContactDoc {
  _id: string;
  _rev: string;
  sections?: Section[];
}

async function migrateDoc(id: string) {
  const doc = await client.fetch<ContactDoc | null>(`*[_id == $id][0]{_id, _rev, sections}`, { id });
  if (!doc) {
    console.log(`\n${id}: document not found — skipped.`);
    return;
  }

  const hero = doc.sections?.find((s) => s.sectionKey === "hero");
  if (!hero) {
    console.log(`\n${id}: no hero section found — skipped (unexpected shape, needs manual review).`);
    return;
  }

  const existing = (hero.items ?? []).filter((i) => i.itemKey?.startsWith("contactDetail-"));
  console.log(`\n${id}: hero section "${hero._key}" — ${existing.length} contactDetail-* row(s) already present.`);
  if (existing.length > 0) {
    console.log("  Already has contact-detail rows — left untouched.");
    return;
  }

  const toInsert = DETAIL_KEYS.map((key) => ({ _key: `contactDetail-${key}`, _type: "contentItem" as const, itemKey: `contactDetail-${key}` }));
  console.log(`  Would insert ${toInsert.length} row(s), in order: ${DETAIL_KEYS.join(" -> ")}.`);

  if (DRY_RUN) return;

  const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
  if (!fresh || fresh._rev !== doc._rev) {
    console.error(`  ABORTED (${id}): changed concurrently — re-run to recompute.`);
    process.exitCode = 1;
    return;
  }

  await client
    .patch(id)
    .ifRevisionId(fresh._rev)
    .insert("after", `sections[_key=="${hero._key}"].items[-1]`, toInsert)
    .commit();
  console.log("  Applied.");
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log("== Contact details display-order seed (Task 4) — plan ==");
  for (const id of DOC_IDS) {
    await migrateDoc(id);
  }
  console.log(DRY_RUN ? "\nDry run only — no writes performed." : "\nLive migration complete.");
}

main().catch((error) => {
  console.error("migrate-contact-details-order failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
