/**
 * Idempotent cleanup for the exact stray, hidden-but-validated data found
 * live in drafts.page-home / drafts.page-about this pass (published
 * page-home/page-about are already clean — re-checked immediately before
 * any write, never assumed):
 *
 *   - drafts.page-home: sections[closingCta].items[link0/link1/link2]
 *     .title / .text / .image — the "Closing CTA suggested-path link" item
 *     role (contentItem.ts's ITEM_ROLE_RULES) only shows/reads href+label
 *     for these items; title/text/image are Studio-hidden and read by no
 *     frontend code, yet held a partial en="" entry that fails
 *     allOrNothingLanguages()/imageWithAlt's validation.
 *   - drafts.page-about: sections[hero].items[intro0].title / .text /
 *     .image — identical pattern, hidden by the "About hero intro link"
 *     role.
 *   - drafts.page-home: sections[eventsStrip].text — force-hidden by
 *     pageSection.ts's SECTION_FIELD_FORCE_HIDDEN (event cards render from
 *     separate `event` documents, never from this field) but held a single
 *     valueless `en` entry.
 *
 * Rules, enforced per document, per item, per field, independently:
 *   - `title`/`text`: unset only if the array has entries (an already-empty
 *     array is left alone — nothing to clean up).
 *   - `image`: if a real asset is uploaded (image.asset._ref present), only
 *     `.image.alt` is unset (preserves a possibly-meaningful photo — Task
 *     4D "preserve complete meaningful data"); otherwise the whole `image`
 *     field is unset (an image object with no asset is not meaningful data
 *     to keep).
 *   - Never touches href/label (the fields these item roles actually use),
 *     never touches published page-home/page-about (already confirmed
 *     clean), never touches any other section/item/document.
 *   - Idempotent: a second run (dry or live) after a successful live run
 *     reports 0 planned changes.
 *
 * Usage:
 *   npm run sanity:repair-home-about:dry-run
 *   npm run sanity:repair-home-about
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

interface I18nEntry {
  language?: string;
  value?: string;
}
interface ItemSnapshot {
  title?: I18nEntry[];
  text?: I18nEntry[];
  image?: { asset?: { _ref?: string }; alt?: I18nEntry[] };
}

interface Target {
  docId: string;
  label: string;
  sectionKey: string;
  itemKey: string;
}

const TARGETS: Target[] = [
  { docId: "drafts.page-home", label: "closingCta.items[link0]", sectionKey: "closingCta", itemKey: "link0" },
  { docId: "drafts.page-home", label: "closingCta.items[link1]", sectionKey: "closingCta", itemKey: "link1" },
  { docId: "drafts.page-home", label: "closingCta.items[link2]", sectionKey: "closingCta", itemKey: "link2" },
  { docId: "drafts.page-about", label: "hero.items[intro0]", sectionKey: "hero", itemKey: "intro0" },
];

interface SectionFieldTarget {
  docId: string;
  sectionKey: string;
  field: "label" | "title" | "text";
}

const SECTION_FIELD_TARGETS: SectionFieldTarget[] = [
  { docId: "drafts.page-home", sectionKey: "eventsStrip", field: "text" },
];

async function fetchDocRev(docId: string): Promise<string | null> {
  const doc = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id: docId });
  return doc?._rev ?? null;
}

async function fetchItem(docId: string, sectionKey: string, itemKey: string): Promise<ItemSnapshot | null> {
  return client.fetch<ItemSnapshot | null>(
    `*[_id == $docId][0].sections[sectionKey == $sectionKey][0].items[itemKey == $itemKey][0]{title, text, image{asset, alt}}`,
    { docId, sectionKey, itemKey },
  );
}

interface PlannedOp {
  docId: string;
  label: string;
  path: string;
  reason: string;
}

function planForItem(docId: string, target: Target, item: ItemSnapshot | null): PlannedOp[] {
  const ops: PlannedOp[] = [];
  const base = `sections[sectionKey=="${target.sectionKey}"].items[itemKey=="${target.itemKey}"]`;
  if (!item) return ops;

  if (item.title && item.title.length > 0) {
    ops.push({ docId, label: target.label, path: `${base}.title`, reason: `has ${item.title.length} stray entry(ies), field is Studio-hidden and unread` });
  }
  if (item.text && item.text.length > 0) {
    ops.push({ docId, label: target.label, path: `${base}.text`, reason: `has ${item.text.length} stray entry(ies), field is Studio-hidden and unread` });
  }
  if (item.image) {
    if (item.image.asset?._ref) {
      if (item.image.alt && item.image.alt.length > 0) {
        ops.push({ docId, label: target.label, path: `${base}.image.alt`, reason: "has a real image asset (preserved) but stray alt entries on a hidden, unread field" });
      }
    } else {
      ops.push({ docId, label: target.label, path: `${base}.image`, reason: "image object has no uploaded asset — not meaningful data, field is Studio-hidden and unread" });
    }
  }
  return ops;
}

async function fetchSectionField(docId: string, sectionKey: string, field: "label" | "title" | "text"): Promise<I18nEntry[] | null> {
  return client.fetch<I18nEntry[] | null>(
    `*[_id == $docId][0].sections[sectionKey == $sectionKey][0][$field]`,
    { docId, sectionKey, field },
  );
}

function planForSectionField(docId: string, target: SectionFieldTarget, value: I18nEntry[] | null): PlannedOp[] {
  const label = `${target.sectionKey}.${target.field}`;
  if (!value || value.length === 0) return [];
  return [
    {
      docId,
      label,
      path: `sections[sectionKey=="${target.sectionKey}"].${target.field}`,
      reason: `has ${value.length} stray entry(ies), field is Studio-hidden and unread`,
    },
  ];
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log("\n== Home/About hidden-field stray-data repair — plan ==");

  const docIds = [...new Set([...TARGETS.map((t) => t.docId), ...SECTION_FIELD_TARGETS.map((t) => t.docId)])];

  const allOps: PlannedOp[] = [];
  for (const docId of docIds) {
    const rev = await fetchDocRev(docId);
    if (!rev) {
      console.log(`\nDocument: ${docId} — does not currently exist, skipping.`);
      continue;
    }
    console.log(`\nDocument: ${docId} (_rev ${rev})`);

    for (const target of TARGETS.filter((t) => t.docId === docId)) {
      const item = await fetchItem(docId, target.sectionKey, target.itemKey);
      if (!item) {
        console.log(`  - ${target.label}: item not found (nothing to do).`);
        continue;
      }
      const ops = planForItem(docId, target, item);
      if (!ops.length) {
        console.log(`  - ${target.label}: already clean.`);
      } else {
        for (const op of ops) console.log(`  - ${target.label}: WOULD UNSET ${op.path} (${op.reason})`);
      }
      allOps.push(...ops);
    }

    for (const target of SECTION_FIELD_TARGETS.filter((t) => t.docId === docId)) {
      const value = await fetchSectionField(docId, target.sectionKey, target.field);
      const ops = planForSectionField(docId, target, value);
      const label = `${target.sectionKey}.${target.field}`;
      if (!ops.length) {
        console.log(`  - ${label}: already clean.`);
      } else {
        for (const op of ops) console.log(`  - ${label}: WOULD UNSET ${op.path} (${op.reason})`);
      }
      allOps.push(...ops);
    }
  }

  console.log(`\n== Summary ==`);
  console.log(`  ${allOps.length} unset operation(s) planned across ${docIds.length} document(s).`);

  if (DRY_RUN) {
    console.log("\nDry run only — no writes performed.");
    return;
  }
  if (allOps.length === 0) {
    console.log("\nNothing to unset — live run would be a no-op. Exiting without writing.");
    return;
  }

  // Revision-guarded, one-commit-per-document (all that document's unsets
  // batched into a single patch) — batching multiple .unset() paths into one
  // commit is safe (unlike backfill-about-translations.ts's .append() case,
  // .unset() doesn't have the same silent-drop failure mode), but each
  // document's commit is still independent and revision-checked so a
  // concurrent edit to one document never blocks or corrupts another.
  for (const docId of docIds) {
    const opsForDoc = allOps.filter((o) => o.docId === docId);
    if (!opsForDoc.length) continue;

    const freshRev = await fetchDocRev(docId);
    if (!freshRev) {
      console.error(`\nABORTED: ${docId} no longer exists (it did moments ago). No writes performed for this document.`);
      process.exitCode = 1;
      continue;
    }

    try {
      await client
        .patch(docId)
        .ifRevisionId(freshRev)
        .unset(opsForDoc.map((o) => o.path))
        .commit();
      console.log(`${docId}: unset ${opsForDoc.length} field(s).`);
    } catch (error) {
      console.error(`\nABORTED: ${docId} changed concurrently, or the patch failed. No changes were applied for this document.`);
      console.error(`  (${error instanceof Error ? error.message : error})`);
      process.exitCode = 1;
    }
  }

  console.log("\nLive migration complete.");
}

main().catch((error) => {
  console.error("repair-home-about-validation failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
