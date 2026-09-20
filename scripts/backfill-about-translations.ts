/**
 * Additive, idempotent DA/UK backfill for the 11 About fields the
 * localization audit found EN-only (see the About Studio Visibility
 * implementation report). Approved exact text — see TARGETS below.
 *
 * Rules, enforced per document, per language, per field independently:
 *   - Never overwrites an existing NON-EMPTY translation. If a language
 *     entry already has a value, it is left untouched and reported.
 *   - Adds a missing language entry (or fills an existing-but-empty one)
 *     with the approved text.
 *   - Touches only the `internationalizedArrayString` array itself for
 *     the 11 named fields — never EN content, media references, actions,
 *     itemKeys, or array order.
 *   - Applies independently to `page-about` and `drafts.page-about`, only
 *     if each currently exists (re-checked immediately before writing).
 *
 * Usage:
 *   npm run sanity:backfill-about-translations:dry-run
 *   npm run sanity:backfill-about-translations
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

interface Target {
  /** Human label for reporting only. */
  label: string;
  /** GROQ-style path to the array field, e.g. `sections[sectionKey=="hero"].items[itemKey=="intro0"].label`. */
  arrayPath: string;
  da: string;
  uk: string;
}

const TARGETS: Target[] = [
  { label: "hero.items[intro0].label", arrayPath: `sections[sectionKey=="hero"].items[itemKey=="intro0"].label`, da: "Vær vært hos RORUM", uk: "Проведіть подію в RORUM" },
  { label: "hero.items[intro1].label", arrayPath: `sections[sectionKey=="hero"].items[itemKey=="intro1"].label`, da: "Deltag i events", uk: "Відвідати події" },
  { label: "statement.items[service0].label", arrayPath: `sections[sectionKey=="statement"].items[itemKey=="service0"].label`, da: "Catering", uk: "Кейтеринг" },
  { label: "statement.items[service1].label", arrayPath: `sections[sectionKey=="statement"].items[itemKey=="service1"].label`, da: "Eventdekoration", uk: "Декор подій" },
  { label: "community.title", arrayPath: `sections[sectionKey=="community"].title`, da: "Fællesskab", uk: "Спільнота" },
  { label: "community.items[community0].label", arrayPath: `sections[sectionKey=="community"].items[itemKey=="community0"].label`, da: "WECODA-medlemskab", uk: "Членство у WECODA" },
  { label: "community.items[community1].label", arrayPath: `sections[sectionKey=="community"].items[itemKey=="community1"].label`, da: "Arbejd med os", uk: "Працюйте з нами" },
  { label: "community.items[community2].label", arrayPath: `sections[sectionKey=="community"].items[itemKey=="community2"].label`, da: "Bliv frivillig hos os", uk: "Станьте волонтером" },
  { label: "hero.media[atmosphere0].alt", arrayPath: `sections[sectionKey=="hero"].media[_key=="atmosphere0"].alt`, da: "Ukrainsk borsjtj med pampusjky tilberedt til en RORUM-sammenkomst", uk: "Український борщ із пампушками, приготований для зустрічі в RORUM" },
  { label: "hero.media[atmosphere1].alt", arrayPath: `sections[sectionKey=="hero"].media[_key=="atmosphere1"].alt`, da: "Varmt RORUM-lokale klargjort til et møde", uk: "Затишна зала RORUM, підготовлена для зустрічі" },
  { label: "hero.media[atmosphere2].alt", arrayPath: `sections[sectionKey=="hero"].media[_key=="atmosphere2"].alt`, da: "Dekoreret bord med blomster og kuverter", uk: "Стіл, прикрашений квітами та сервірований для події" },
];

const LANGS = ["da", "uk"] as const;

interface I18nEntry {
  _key?: string;
  language?: string;
  value?: string;
}
interface RawDoc {
  _id: string;
  _rev: string;
  hero?: { items?: { label?: I18nEntry[] }[]; media?: { alt?: I18nEntry[] }[] };
  statement?: { items?: { label?: I18nEntry[] }[] };
  community?: { title?: I18nEntry[]; items?: { label?: I18nEntry[] }[] };
}

async function fetchDoc(id: string): Promise<RawDoc | null> {
  return client.fetch<RawDoc | null>(
    `*[_id == $id][0]{
      _id, _rev,
      "hero": sections[sectionKey=="hero"][0]{
        "items": items[itemKey in ["intro0","intro1"]]{label},
        "media": media[]{alt}
      },
      "statement": sections[sectionKey=="statement"][0]{"items": items[itemKey in ["service0","service1"]]{label}},
      "community": sections[sectionKey=="community"][0]{title, "items": items[itemKey in ["community0","community1","community2"]]{label}}
    }`,
    { id },
  );
}

/** Reads the current entries array for one target from a freshly-fetched doc, matched by target index order (TARGETS is built to align 1:1 with the projection's shape). */
function currentEntriesFor(doc: RawDoc, targetIndex: number): I18nEntry[] | undefined {
  const order = [
    doc.hero?.items?.[0]?.label, // intro0
    doc.hero?.items?.[1]?.label, // intro1
    doc.statement?.items?.[0]?.label, // service0
    doc.statement?.items?.[1]?.label, // service1
    doc.community?.title, // community.title
    doc.community?.items?.[0]?.label, // community0
    doc.community?.items?.[1]?.label, // community1
    doc.community?.items?.[2]?.label, // community2
    doc.hero?.media?.[0]?.alt, // atmosphere0
    doc.hero?.media?.[1]?.alt, // atmosphere1
    doc.hero?.media?.[2]?.alt, // atmosphere2
  ];
  return order[targetIndex];
}

async function planForDoc(docId: string) {
  const doc = await fetchDoc(docId);
  if (!doc) {
    console.log(`Document: ${docId} — does not currently exist, skipping.`);
    return null;
  }
  console.log(`\nDocument: ${docId} (_rev ${doc._rev})`);

  const toAdd: { target: Target; lang: "da" | "uk"; existingKey?: string }[] = [];
  const skippedNonEmpty: { target: Target; lang: "da" | "uk"; value: string }[] = [];

  TARGETS.forEach((target, i) => {
    const entries = currentEntriesFor(doc, i) ?? [];
    console.log(`  - ${target.label}`);
    for (const lang of LANGS) {
      const entry = entries.find((e) => e.language === lang);
      const current = entry?.value?.trim();
      if (current) {
        skippedNonEmpty.push({ target, lang, value: current });
        console.log(`      ${lang}: already has a value ("${current}") — SKIP, not overwritten.`);
      } else {
        toAdd.push({ target, lang, existingKey: entry?._key });
        console.log(`      ${lang}: ${entry ? "empty entry present" : "no entry"} -> WOULD ADD "${target[lang]}".`);
      }
    }
  });

  return { doc, toAdd, skippedNonEmpty };
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log("\n== About translation backfill (DA/UK) — plan ==");

  const docIds = ["page-about", "drafts.page-about"];
  const plans: { docId: string; plan: Awaited<ReturnType<typeof planForDoc>> }[] = [];
  for (const docId of docIds) {
    plans.push({ docId, plan: await planForDoc(docId) });
  }

  const totalToAdd = plans.reduce((n, p) => n + (p.plan?.toAdd.length ?? 0), 0);
  const totalSkipped = plans.reduce((n, p) => n + (p.plan?.skippedNonEmpty.length ?? 0), 0);
  console.log(`\n== Summary ==`);
  console.log(`  ${totalToAdd} language-entry addition(s) needed across ${plans.filter((p) => p.plan).length} existing document(s).`);
  if (totalSkipped) {
    console.log(`  ${totalSkipped} already-populated entry(ies) found and preserved (not part of the approved plan, reported for review):`);
    for (const { docId, plan } of plans) {
      for (const s of plan?.skippedNonEmpty ?? []) {
        console.log(`    - [${docId}] ${s.target.label}.${s.lang} = "${s.value}"`);
      }
    }
  }

  if (DRY_RUN) {
    console.log("\nDry run only — no writes performed.");
    return;
  }
  if (totalToAdd === 0) {
    console.log("\nNothing to add — live run would be a no-op. Exiting without writing.");
    return;
  }

  // Revision safety check: re-fetch immediately before writing.
  for (const { docId, plan } of plans) {
    if (!plan) continue;
    const fresh = await fetchDoc(docId);
    if (!fresh) {
      console.error(`\nABORTED: ${docId} no longer exists (it did moments ago). No writes performed for this document.`);
      process.exitCode = 1;
      return;
    }
    if (fresh._rev !== plan.doc._rev) {
      console.error(`\nABORTED: ${docId} changed (_rev ${plan.doc._rev} -> ${fresh._rev}) between dry-run and live-run. No writes performed. Re-run and review before trying again.`);
      process.exitCode = 1;
      return;
    }
  }

  console.log("\nRevision check passed — no concurrent changes detected. Committing...\n");

  // One independent, revision-guarded commit per language-entry addition,
  // awaited in sequence — NOT batched onto a single shared patch object. A
  // batched version of this (one .patch(docId) reused across multiple
  // .append() calls to different array paths, then a single .commit())
  // was tried first and silently dropped every operation except the very
  // last one — only the final append survived in the committed document,
  // confirmed by a direct post-commit re-read. Committing separately
  // trades a few extra API calls for the guarantee that every addition
  // actually persists. Each commit also carries `ifRevisionId`, chained
  // from the previous commit's result, so a genuine concurrent edit
  // between two of these commits aborts the remaining ones for that
  // document with a clear error instead of silently racing it.
  for (const { docId, plan } of plans) {
    if (!plan || plan.toAdd.length === 0) continue;
    let committed = 0;
    let currentRev = plan.doc._rev;
    for (const { target, lang, existingKey } of plan.toAdd) {
      const value = target[lang];
      const patch = client.patch(docId).ifRevisionId(currentRev);
      if (existingKey) {
        patch.set({ [`${target.arrayPath}[_key=="${existingKey}"].value`]: value });
      } else {
        patch.setIfMissing({ [target.arrayPath]: [] }).append(target.arrayPath, [
          { _key: lang, _type: "internationalizedArrayStringValue", language: lang, value },
        ]);
      }
      try {
        const result = await patch.commit({ autoGenerateArrayKeys: true });
        currentRev = (result as { _rev: string })._rev;
        committed++;
      } catch (error) {
        console.error(`\nABORTED mid-document: ${docId} changed concurrently after ${committed}/${plan.toAdd.length} planned additions. Remaining additions for this document were NOT applied. Re-run the dry-run to see what's left.`);
        console.error(`  (${error instanceof Error ? error.message : error})`);
        break;
      }
    }
    console.log(`${docId}: added ${committed} language entry(ies) (${plan.toAdd.length} planned).`);
  }

  console.log("\nLive migration complete.");
}

main().catch((error) => {
  console.error("backfill-about-translations failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
