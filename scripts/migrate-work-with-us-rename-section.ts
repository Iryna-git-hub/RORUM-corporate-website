/**
 * Finishes the Work With Us "no CV wording anywhere" cleanup that
 * scripts/migrate-work-with-us-application-form.ts started:
 *
 *  1. Renames the section's technical `sectionKey` field from the legacy
 *     "cvUploadForm" to "applyForm". The section's own array `_key` is left
 *     unchanged (Sanity's internal item identity, never read by any code —
 *     `lib/sanity-sections.ts`'s `getSection()` matches on the `sectionKey`
 *     FIELD, not `_key`, so this is safe and doesn't touch item identity).
 *  2. Sets the section's own `title` field (EN/DA/UK "Apply Form" /
 *     "Ansøgningsformular" / "Форма заявки") so Studio's section-list
 *     preview shows a clean manager-facing name instead of falling back to
 *     the raw technical key (see pageSection.ts's own `prepare()`: it shows
 *     `title ?? sectionKey` — this section's `title` INPUT stays hidden in
 *     Studio by design, same as every other field-scoped-to-items section on
 *     this site, but the stored value still drives the list preview).
 *  3. Renames the hero section's `cvUploadCta` item's `itemKey` field to
 *     `applyCta` (the CTA button that used to read "Send your CV").
 *  4. Adds 3 new content items — `fullNamePlaceholder`, `emailPlaceholder`,
 *     `phonePlaceholder` — with EN/DA/UK example-style placeholder text
 *     (e.g. "e.g. Anna Jensen" / "f.eks. Anna Jensen" / "напр. Анна
 *     Іваненко") so Full name/Email/Phone show a real input EXAMPLE instead
 *     of repeating the field label. Danish/Ukrainian are newly authored for
 *     this migration (no existing equivalent copy elsewhere to reuse).
 *
 * Safety:
 *  - Backs up each document's full current state to scripts/backups/ before
 *    writing anything.
 *  - Idempotent: if the section's `sectionKey` is already "applyForm", the
 *    whole document is treated as already migrated and skipped.
 *  - `ifRevisionId`-guarded: re-fetches the revision immediately before
 *    writing and aborts that document if it changed since the plan was
 *    computed.
 *  - Migrates the published document AND its draft (if one exists)
 *    independently — this project's established convention — never invokes
 *    Publish.
 *
 * Usage:
 *   npm run sanity:migrate-work-with-us-rename-section:dry-run   (default-safe: prints a plan, writes nothing)
 *   npm run sanity:migrate-work-with-us-rename-section -- --apply
 */
import { createClient } from "@sanity/client";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { tri } from "./lib/sanityImportUtils";

const APPLY = process.argv.includes("--apply") && Boolean(process.env.SANITY_API_WRITE_TOKEN);
const DOC_IDS = ["page-work-with-us", "drafts.page-work-with-us"] as const;
const OLD_SECTION_KEY = "cvUploadForm";
const NEW_SECTION_KEY = "applyForm";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

interface ContentItem {
  _key: string;
  itemKey?: string;
}
interface Section {
  _key: string;
  sectionKey?: string;
  items?: ContentItem[];
}
interface PageDoc {
  _id: string;
  _rev: string;
  sections?: Section[];
}

const NEW_PLACEHOLDER_ITEMS: { itemKey: string; en: string; da: string; uk: string }[] = [
  { itemKey: "fullNamePlaceholder", en: "e.g. Anna Jensen", da: "f.eks. Anna Jensen", uk: "напр. Анна Іваненко" },
  { itemKey: "emailPlaceholder", en: "e.g. anna@example.com", da: "f.eks. anna@example.com", uk: "напр. anna@example.com" },
  { itemKey: "phonePlaceholder", en: "e.g. +45 12 34 56 78", da: "f.eks. +45 12 34 56 78", uk: "напр. +45 12 34 56 78" },
];

const SECTION_TITLE = tri("Apply Form", "Ansøgningsformular", "Форма заявки");

function backup(id: string, doc: PageDoc) {
  const backupDir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const filepath = path.join(backupDir, `${id.replace(/[/.]/g, "_")}-rename-section-${Date.now()}.json`);
  writeFileSync(filepath, JSON.stringify({ createdAt: new Date().toISOString(), purpose: "Pre-migration backup before renaming Work With Us's cvUploadForm section to applyForm", id, document: doc }, null, 2));
  console.log(`  Backed up ${id} to ${filepath}`);
}

async function planFor(id: string) {
  const doc = await client.fetch<PageDoc | null>(`*[_id == $id][0]{_id, _rev, sections}`, { id });
  if (!doc) {
    console.log(`${id}: document not found — nothing to do.`);
    return null;
  }
  const applySection = doc.sections?.find((s) => s.sectionKey === NEW_SECTION_KEY);
  if (applySection) {
    console.log(`${id}: sectionKey already "${NEW_SECTION_KEY}" — already migrated, skipping.`);
    return null;
  }
  const oldSection = doc.sections?.find((s) => s.sectionKey === OLD_SECTION_KEY);
  if (!oldSection) {
    console.log(`${id}: no section with sectionKey "${OLD_SECTION_KEY}" found — nothing to do.`);
    return null;
  }
  const heroSection = doc.sections?.find((s) => s.sectionKey === "hero");
  const hasOldCta = heroSection?.items?.some((i) => i.itemKey === "cvUploadCta") ?? false;
  const existingPlaceholderKeys = new Set((oldSection.items ?? []).map((i) => i.itemKey));
  const missingPlaceholders = NEW_PLACEHOLDER_ITEMS.filter((p) => !existingPlaceholderKeys.has(p.itemKey));

  console.log(`${id}: rev=${doc._rev} — plan:`);
  console.log(`  rename section _key="${oldSection._key}" sectionKey: "${OLD_SECTION_KEY}" -> "${NEW_SECTION_KEY}"`);
  console.log(`  set section title (EN/DA/UK): "Apply Form" / "Ansøgningsformular" / "Форма заявки"`);
  console.log(`  rename hero item itemKey: "cvUploadCta" -> "applyCta"${hasOldCta ? "" : " (not found — skip)"}`);
  console.log(`  add placeholders: ${missingPlaceholders.map((p) => p.itemKey).join(", ") || "(none — already present)"}`);

  return { doc, oldSection, heroSection, hasOldCta, missingPlaceholders };
}

async function main() {
  console.log(`Mode: ${APPLY ? "LIVE (--apply passed)" : "DRY RUN (no writes) — pass --apply with a write token to apply"}`);
  console.log("== Work With Us: rename cvUploadForm -> applyForm, add example placeholders — plan ==");

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

    const tx = client.transaction();

    tx.patch(id, (p) =>
      p
        .ifRevisionId(fresh._rev)
        .set({
          [`sections[_key=="${plan.oldSection._key}"].sectionKey`]: NEW_SECTION_KEY,
          [`sections[_key=="${plan.oldSection._key}"].title`]: SECTION_TITLE,
        }),
    );

    if (plan.hasOldCta && plan.heroSection) {
      tx.patch(id, (p) =>
        p.ifRevisionId(fresh._rev).set({ [`sections[_key=="${plan.heroSection!._key}"].items[itemKey=="cvUploadCta"].itemKey`]: "applyCta" }),
      );
    }

    // One .patch() per distinct insert — chaining multiple .insert() calls on
    // one Patch object silently keeps only the last (this project's own
    // established fix — see scripts/backfill-seo-copy.ts /
    // scripts/migrate-host-additional-services.ts). Inserted under the OLD
    // section key path — the sectionKey rename above and this insert are two
    // patches in the SAME transaction/commit, so by the time this insert is
    // evaluated the section is still addressable by its unchanged `_key`.
    for (const item of plan.missingPlaceholders) {
      tx.patch(id, (p) =>
        p.ifRevisionId(fresh._rev).insert("after", `sections[_key=="${plan.oldSection._key}"].items[-1]`, [
          { _key: item.itemKey, _type: "contentItem", itemKey: item.itemKey, title: tri(item.en, item.da, item.uk) },
        ]),
      );
    }

    await tx.commit();
    console.log(`  Applied migration to ${id}.`);

    const after = await client.fetch<PageDoc | null>(`*[_id == $id][0]{_id, sections}`, { id });
    const afterSection = after?.sections?.find((s) => s.sectionKey === NEW_SECTION_KEY);
    const afterHero = after?.sections?.find((s) => s.sectionKey === "hero");
    console.log(
      `  Read-back: ${id}'s section is now sectionKey="${afterSection?.sectionKey}" with ${afterSection?.items?.length ?? 0} item(s): ${(afterSection?.items ?? []).map((i) => i.itemKey).join(", ")}`,
    );
    console.log(`  Read-back: hero items: ${(afterHero?.items ?? []).map((i) => i.itemKey).join(", ")}`);
  }
}

main().catch((error) => {
  console.error("migrate-work-with-us-rename-section failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
