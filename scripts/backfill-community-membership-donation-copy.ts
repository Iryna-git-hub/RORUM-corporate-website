/**
 * Phase A4 (2026-09-09): populate the Community Membership localized fields
 * that were empty in Sanity and therefore rendered the page's hardcoded
 * English fallback on /da and /uk.
 *
 * Every field gets EN + DA + UK. The EN value is the EXACT current frontend
 * fallback string (verbatim from community-membership/page.tsx's `fallback`
 * object / WecodaDonationSection defaults), so nothing the visitor sees on the
 * English site changes — Sanity simply becomes the source instead of the code
 * literal. DA/UK are new, concise translations of that same English.
 *
 * `allOrNothing` i18n validation means a field can't hold DA+UK without EN, so
 * EN is written alongside — this is still "adding missing values", not
 * rewriting approved copy (there was no stored value before).
 *
 * Targets (page-community-membership, published + draft if present):
 *   donation.label / .title / .text
 *   donation.items[scanText/scanSubtext/orText/bankTransferText/bankDetailsTitle].title
 *   donation.items[supportText].text
 *   intro.label / .title
 *   gallery.label / .title
 *   benefits.label   (newly wired to Sanity this task)
 *
 * NOT touched: bank row VALUES (single-source, never localized), bank row
 * LABELS (already en/da/uk from Part 32), every already-populated field.
 *
 * Usage:
 *   npm run sanity:backfill-cm-donation-copy:dry-run
 *   npm run sanity:backfill-cm-donation-copy -- --apply
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

type Tri = { en: string; da: string; uk: string };

// field kind: "string" -> internationalizedArrayStringValue, "text" -> ...TextValue
type Target =
  | { kind: "section"; sectionKey: string; field: "label" | "title" | "text"; type: "string" | "text"; tri: Tri }
  | { kind: "item"; sectionKey: string; itemKey: string; field: "title" | "text"; type: "string" | "text"; tri: Tri };

const TARGETS: Target[] = [
  // ── donation section ──────────────────────────────────────────────────
  {
    kind: "section", sectionKey: "donation", field: "label", type: "string",
    tri: { en: "Donation", da: "Donation", uk: "Пожертва" },
  },
  {
    kind: "section", sectionKey: "donation", field: "title", type: "string",
    tri: { en: "Support the WECODA Community", da: "Støt WECODA-fællesskabet", uk: "Підтримайте спільноту WECODA" },
  },
  {
    kind: "section", sectionKey: "donation", field: "text", type: "text",
    tri: {
      en: "Your support helps WECODA organise educational programmes, community events, international collaborations, and new opportunities for women.",
      da: "Din støtte hjælper WECODA med at arrangere uddannelsesprogrammer, fællesskabsarrangementer, internationale samarbejder og nye muligheder for kvinder.",
      uk: "Ваша підтримка допомагає WECODA організовувати освітні програми, громадські події, міжнародну співпрацю та нові можливості для жінок.",
    },
  },
  // ── donation message rows ─────────────────────────────────────────────
  {
    kind: "item", sectionKey: "donation", itemKey: "scanText", field: "title", type: "string",
    tri: { en: "Scan to donate", da: "Scan for at donere", uk: "Скануйте, щоб зробити внесок" },
  },
  {
    kind: "item", sectionKey: "donation", itemKey: "scanSubtext", field: "title", type: "string",
    tri: { en: "Fast, secure and easy.", da: "Hurtigt, sikkert og nemt.", uk: "Швидко, безпечно та просто." },
  },
  {
    kind: "item", sectionKey: "donation", itemKey: "orText", field: "title", type: "string",
    tri: { en: "OR", da: "ELLER", uk: "АБО" },
  },
  {
    kind: "item", sectionKey: "donation", itemKey: "bankTransferText", field: "title", type: "string",
    tri: {
      en: "Prefer bank transfer? See our bank details on the right.",
      da: "Foretrækker du bankoverførsel? Se vores bankoplysninger til højre.",
      uk: "Бажаєте банківський переказ? Перегляньте наші банківські реквізити праворуч.",
    },
  },
  {
    kind: "item", sectionKey: "donation", itemKey: "bankDetailsTitle", field: "title", type: "string",
    tri: { en: "Bank Details", da: "Bankoplysninger", uk: "Банківські реквізити" },
  },
  {
    kind: "item", sectionKey: "donation", itemKey: "supportText", field: "text", type: "text",
    tri: {
      en: "RORUM proudly supports WECODA by providing a welcoming space for community events, learning, and collaboration.",
      da: "RORUM støtter stolt WECODA ved at tilbyde et imødekommende rum til fællesskabsarrangementer, læring og samarbejde.",
      uk: "RORUM з гордістю підтримує WECODA, надаючи гостинний простір для громадських подій, навчання та співпраці.",
    },
  },
  // ── intro section ────────────────────────────────────────────────────
  {
    kind: "section", sectionKey: "intro", field: "label", type: "string",
    tri: { en: "WECODA community", da: "WECODA-fællesskab", uk: "Спільнота WECODA" },
  },
  {
    kind: "section", sectionKey: "intro", field: "title", type: "string",
    tri: {
      en: "Connecting Women Who Inspire, Build and Lead.",
      da: "Vi forbinder kvinder, der inspirerer, bygger og leder.",
      uk: "Об'єднуємо жінок, які надихають, будують і ведуть за собою.",
    },
  },
  // ── gallery section ─────────────────────────────────────────────────
  {
    kind: "section", sectionKey: "gallery", field: "label", type: "string",
    tri: { en: "Gallery", da: "Galleri", uk: "Галерея" },
  },
  {
    kind: "section", sectionKey: "gallery", field: "title", type: "string",
    tri: { en: "WECODA Community Meetings", da: "WECODA-fællesskabsmøder", uk: "Зустрічі спільноти WECODA" },
  },
  // ── benefits section (label newly wired to Sanity) ──────────────────
  {
    kind: "section", sectionKey: "benefits", field: "label", type: "string",
    tri: { en: "Membership Benefits", da: "Medlemsfordele", uk: "Переваги членства" },
  },
];

interface I18nEntry { _key: string; _type?: string; language?: string; value?: string }
interface Item { _key: string; itemKey?: string; title?: I18nEntry[]; text?: I18nEntry[] }
interface Section { _key: string; sectionKey?: string; label?: I18nEntry[]; title?: I18nEntry[]; text?: I18nEntry[]; items?: Item[] }
interface PageDoc { _id: string; _rev: string; sections?: Section[] }

const typeName = (t: "string" | "text") => (t === "text" ? "internationalizedArrayTextValue" : "internationalizedArrayStringValue");
const hasAny = (e: I18nEntry[] | undefined) => (e ?? []).some((x) => x.value?.trim());

interface Patch { path: string; entries: I18nEntry[]; label: string }

function buildPatches(doc: PageDoc): Patch[] {
  const patches: Patch[] = [];
  for (const t of TARGETS) {
    const section = (doc.sections ?? []).find((s) => s.sectionKey === t.sectionKey);
    if (!section) continue;
    let current: I18nEntry[] | undefined;
    let path: string;
    let label: string;
    if (t.kind === "section") {
      current = section[t.field];
      path = `sections[_key=="${section._key}"].${t.field}`;
      label = `${t.sectionKey}.${t.field}`;
    } else {
      const item = (section.items ?? []).find((i) => i.itemKey === t.itemKey);
      if (!item) continue;
      current = item[t.field];
      path = `sections[_key=="${section._key}"].items[_key=="${item._key}"].${t.field}`;
      label = `${t.sectionKey}/${t.itemKey}.${t.field}`;
    }
    if (hasAny(current)) {
      console.log(`  SKIP (already populated): ${label}`);
      continue;
    }
    const entries: I18nEntry[] = (["en", "da", "uk"] as const).map((lang) => ({
      _key: lang, _type: typeName(t.type), language: lang, value: t.tri[lang],
    }));
    patches.push({ path, entries, label });
  }
  return patches;
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"} | write token: ${TOKEN ? "present" : "ABSENT"}`);
  if (APPLY && !TOKEN) { console.error("--apply needs SANITY_API_WRITE_TOKEN."); process.exit(1); }

  const ts = Date.now();
  const backupDir = join(process.cwd(), "scripts", "backups");

  for (const id of ["page-community-membership", "drafts.page-community-membership"]) {
    const doc = await client.fetch<PageDoc | null>(`*[_id == $id][0]`, { id });
    if (!doc) { console.log(`\n${id}: not present — skipping.`); continue; }
    console.log(`\n=== ${id} (rev ${doc._rev}) ===`);
    const patches = buildPatches(doc);
    if (!patches.length) { console.log("  nothing to do."); continue; }
    for (const p of patches) console.log(`  + ${p.label}  ->  en/da/uk`);

    if (!APPLY) continue;

    mkdirSync(backupDir, { recursive: true });
    writeFileSync(join(backupDir, `cm-donation-copy-${id.replace(/[^a-z-]/gi, "_")}-${ts}.json`), JSON.stringify(doc, null, 2));

    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
    if (!fresh || fresh._rev !== doc._rev) { console.error(`  ABORT ${id}: changed concurrently. Re-run.`); process.exitCode = 1; continue; }
    // Every target was verified empty/absent (hasAny === false), so setting
    // the whole 3-entry array is a clean create — no existing value is lost.
    let tx = client.transaction();
    for (const p of patches) {
      tx = tx.patch(id, (patch) => patch.ifRevisionId(fresh._rev).set({ [p.path]: p.entries }));
    }
    await tx.commit();
    console.log(`  applied ${patches.length} field(s).`);
  }
  console.log("\nDone. Re-run `npm run sanity:audit-validation` + `npm run sanity:audit-sections`.");
}

main().catch((e) => { console.error("backfill-community-membership-donation-copy failed:", e instanceof Error ? e.message : e); process.exit(1); });
