/**
 * Idempotent cleanup for stray, valueless i18n entries found live across the
 * `event` document set by scripts/audit-events-i18n.ts. None of the fields
 * touched here are validation-blocking today (seo/ticketButtonLabel/
 * whatToExpect/arrival/ticketProviderInfo carry no completeness validation
 * in sanity/schemaTypes/documents/event.ts) — this is Task 8's "partially
 * populated and unused" cleanup class, not a hidden-but-validated fix: a
 * Studio residue entry (an editor clicked into a field, typed nothing, left
 * a `{_key, language}` row with no `value`) that clutters the audit and
 * would otherwise sit there indefinitely.
 *
 * Rule-based, not a hardcoded per-document list (unlike
 * repair-home-about-validation.ts's 4 fixed targets) — this pattern recurs
 * across ~10 different event documents (2 obvious test/demo events plus
 * several real published events), so every `event` document is checked
 * uniformly:
 *
 *   - WHOLE_FIELD_TARGETS (seo.title, seo.description, seo.ogImage.alt,
 *     ticketButtonLabel, whatToExpect, arrival, ticketProviderInfo.value):
 *     unset the ENTIRE field, but only when every existing entry has no
 *     trimmed value — i.e. the field holds zero real content in any
 *     language. If even one entry has real text, the field is left
 *     completely alone (this is what protects genuine translation gaps,
 *     e.g. image.alt/longDescription/title having only an English value,
 *     from ever being touched — those fields are not in this list at all).
 *   - ticketProviderInfo.label: per-entry, not whole-field — removes only
 *     the individual stray/valueless array items (matched by `_key`),
 *     preserving any entries that hold real text. Needed because this field
 *     can (and did, on one draft) hold a stray empty "en" duplicate
 *     alongside 3 real, valid en/da/uk entries — unsetting the whole array
 *     would have destroyed real data.
 *
 * Never touches `title`, `longDescription`, or `image.alt` — real content-
 * completeness gaps found there by the audit (missing da/uk translations)
 * are reported, not guessed at or invented (Task 8's explicit "no guessing"
 * rule) and are NOT in either target list above.
 *
 * Also covers `page-events`/`drafts.page-events`'s `seo.title`/`.description`/
 * `.ogImage.alt` (same shared `seo` object type, same valueless-only rule) —
 * added after a live human editor's Studio session left 3 stray entries
 * there mid-way through this project's work, scoped to exactly these 2 ids.
 *
 * Usage:
 *   npm run sanity:repair-events:dry-run
 *   npm run sanity:repair-events
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
  _key?: string;
  language?: string;
  value?: string;
}

const WHOLE_FIELD_TARGETS: { path: string; groqPath: string }[] = [
  { path: "seo.title", groqPath: "seo.title" },
  { path: "seo.description", groqPath: "seo.description" },
  { path: "seo.ogImage.alt", groqPath: "seo.ogImage.alt" },
  { path: "ticketButtonLabel", groqPath: "ticketButtonLabel" },
  { path: "whatToExpect", groqPath: "whatToExpect" },
  { path: "arrival", groqPath: "arrival" },
  { path: "ticketProviderInfo.value", groqPath: "ticketProviderInfo.value" },
];

interface RawEvent {
  _id: string;
  _rev: string;
  seo?: { title?: I18nEntry[]; description?: I18nEntry[]; ogImage?: { alt?: I18nEntry[] } };
  ticketButtonLabel?: I18nEntry[];
  whatToExpect?: I18nEntry[];
  arrival?: I18nEntry[];
  ticketProviderInfo?: { label?: I18nEntry[]; value?: I18nEntry[] };
}

interface PlannedOp {
  docId: string;
  path: string;
  reason: string;
}

function fieldValue(doc: RawEvent, groqPath: string): I18nEntry[] | undefined {
  switch (groqPath) {
    case "seo.title":
      return doc.seo?.title;
    case "seo.description":
      return doc.seo?.description;
    case "seo.ogImage.alt":
      return doc.seo?.ogImage?.alt;
    case "ticketButtonLabel":
      return doc.ticketButtonLabel;
    case "whatToExpect":
      return doc.whatToExpect;
    case "arrival":
      return doc.arrival;
    case "ticketProviderInfo.value":
      return doc.ticketProviderInfo?.value;
    default:
      return undefined;
  }
}

function isAllValueless(entries: I18nEntry[] | undefined): boolean {
  if (!entries || entries.length === 0) return false; // already unset — nothing to do
  return entries.every((e) => !e.value?.trim());
}

function planForEvent(doc: RawEvent): PlannedOp[] {
  const ops: PlannedOp[] = [];

  for (const target of WHOLE_FIELD_TARGETS) {
    const entries = fieldValue(doc, target.groqPath);
    if (isAllValueless(entries)) {
      ops.push({
        docId: doc._id,
        path: target.path,
        reason: `${entries!.length} entry(ies), none hold a real value — stray Studio residue`,
      });
    }
  }

  const labelEntries = doc.ticketProviderInfo?.label ?? [];
  const strayLabelEntries = labelEntries.filter((e) => !e.value?.trim() && e._key);
  // Only remove a stray entry when a REAL entry for that same language also
  // exists (otherwise it's a genuine, if lonely, empty field — leave it;
  // Studio's own validation already tolerates a fully-empty array here).
  for (const stray of strayLabelEntries) {
    const hasRealSibling = labelEntries.some((e) => e !== stray && e.language === stray.language && e.value?.trim());
    if (hasRealSibling) {
      ops.push({
        docId: doc._id,
        path: `ticketProviderInfo.label[_key=="${stray._key}"]`,
        reason: `stray valueless duplicate "${stray.language}" entry alongside a real "${stray.language}" entry`,
      });
    }
  }

  return ops;
}

async function fetchAllEvents(): Promise<RawEvent[]> {
  return client.fetch<RawEvent[]>(
    `*[_type == "event"] | order(_id asc){
      _id, _rev,
      "seo": seo{title, description, "ogImage": ogImage{alt}},
      ticketButtonLabel, whatToExpect, arrival,
      "ticketProviderInfo": ticketProviderInfo{label, value}
    }`,
  );
}

// page-events (the Events listing page document) shares the same `seo`
// object shape as `event` — reuses the identical whole-field-if-all-
// valueless rule via the same `doc.seo` shape, just with a narrower target
// list (no ticketButtonLabel/whatToExpect/arrival/ticketProviderInfo — those
// don't exist on `page`). Scoped to exactly these 2 ids, not every `page`
// document site-wide.
async function fetchPageEventsDocs(): Promise<RawEvent[]> {
  const docs = await client.fetch<{ _id: string; _rev: string; seo?: RawEvent["seo"] }[]>(
    `*[_id in ["page-events", "drafts.page-events"]]{
      _id, _rev, "seo": seo{title, description, "ogImage": ogImage{alt}}
    }`,
  );
  return docs.map((d) => ({ _id: d._id, _rev: d._rev, seo: d.seo }));
}

function planForPageEvents(doc: RawEvent): PlannedOp[] {
  const ops: PlannedOp[] = [];
  for (const target of WHOLE_FIELD_TARGETS) {
    if (!target.path.startsWith("seo.")) continue; // page-events only has seo.*
    const entries = fieldValue(doc, target.groqPath);
    if (isAllValueless(entries)) {
      ops.push({ docId: doc._id, path: target.path, reason: `${entries!.length} entry(ies), none hold a real value — stray Studio residue` });
    }
  }
  return ops;
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log("\n== Events stray-data repair — plan ==");

  const eventDocs = await fetchAllEvents();
  const pageEventsDocs = await fetchPageEventsDocs();
  const allOps: PlannedOp[] = [];

  for (const doc of eventDocs) {
    const ops = planForEvent(doc);
    if (ops.length) {
      console.log(`\n${doc._id}:`);
      for (const op of ops) console.log(`  WOULD UNSET ${op.path} (${op.reason})`);
      allOps.push(...ops);
    }
  }

  for (const doc of pageEventsDocs) {
    const ops = planForPageEvents(doc);
    if (ops.length) {
      console.log(`\n${doc._id}:`);
      for (const op of ops) console.log(`  WOULD UNSET ${op.path} (${op.reason})`);
      allOps.push(...ops);
    }
  }

  const docs = [...eventDocs, ...pageEventsDocs];
  console.log(`\n== Summary ==`);
  console.log(`  ${allOps.length} unset operation(s) planned across ${new Set(allOps.map((o) => o.docId)).size} document(s) (out of ${docs.length} document(s) checked: ${eventDocs.length} event(s) + ${pageEventsDocs.length} page-events).`);

  if (DRY_RUN) {
    console.log("\nDry run only — no writes performed.");
    return;
  }
  if (allOps.length === 0) {
    console.log("\nNothing to unset — live run would be a no-op. Exiting without writing.");
    return;
  }

  const docIdsToWrite = [...new Set(allOps.map((o) => o.docId))];
  for (const docId of docIdsToWrite) {
    const opsForDoc = allOps.filter((o) => o.docId === docId);

    // Re-fetch immediately before writing — abort this document's write if
    // it changed since planning (concurrent-edit safety), same pattern as
    // repair-home-about-validation.ts.
    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id: docId });
    if (!fresh) {
      console.error(`\nABORTED: ${docId} no longer exists. No writes performed for this document.`);
      process.exitCode = 1;
      continue;
    }

    try {
      await client
        .patch(docId)
        .ifRevisionId(fresh._rev)
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
  console.error("repair-events-validation failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
