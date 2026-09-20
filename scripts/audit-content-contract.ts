/**
 * READ-ONLY. Validates a page content contract (lib/content-contracts/*)
 * against the live "page" document it describes: document availability,
 * required-field completeness, and EN/DA/UK localization gaps for every
 * `sections[sectionKey=="X"].field` entry the contract declares.
 *
 * This never writes anything — `perspective: "published"`, no write token,
 * safe to run against production at any time. It does NOT prove a field is
 * rendered correctly (that's the Playwright content-assertion spec); it
 * proves the *data* a connected field would need is present and complete.
 *
 * Usage: npm run sanity:audit-contract -- home
 */
import { createClient } from "@sanity/client";
import { homeContract } from "@/lib/content-contracts/home";
import { aboutContract } from "@/lib/content-contracts/about";
import type { ContentContractEntry, PageContentContract } from "@/lib/content-contracts/types";

const CONTRACTS: Record<string, PageContentContract> = {
  home: homeContract,
  about: aboutContract,
};

const REQUIRED_LANGUAGES = ["en", "da", "uk"];

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  useCdn: false,
  perspective: "published", // read-only, production-safe: never drafts, never a write token
});

interface RawSection {
  sectionKey?: string;
  label?: { language?: string; value?: string }[];
  title?: { language?: string; value?: string }[];
  text?: { language?: string; value?: string }[];
}

interface LocalizationGap {
  page: string;
  section: string;
  field: string;
  fieldPath: string;
  missing: string[];
  empty: string[];
  severity: "high" | "medium" | "low";
  recommendedAction: string;
}

/** Parses `sections[sectionKey=="hero"].title` -> { sectionKey: "hero", field: "title" }. Returns null for entries this validator can't mechanically check (collapsed/multi-field/cross-document entries). */
function parseSimpleSectionField(sanityPath: string): { sectionKey: string; field: "label" | "title" | "text" } | null {
  const m = sanityPath.match(/^sections\[sectionKey=="([a-zA-Z]+)"\]\.(label|title|text)$/);
  if (!m) return null;
  return { sectionKey: m[1]!, field: m[2] as "label" | "title" | "text" };
}

function checkI18nCompleteness(entries: { language?: string; value?: string }[] | undefined): { missing: string[]; empty: string[] } {
  const present = new Map<string, string | undefined>();
  for (const e of entries ?? []) {
    if (e.language) present.set(e.language, e.value);
  }
  const missing = REQUIRED_LANGUAGES.filter((l) => !present.has(l));
  const empty = REQUIRED_LANGUAGES.filter((l) => present.has(l) && !present.get(l)?.trim());
  return { missing, empty };
}

async function checkDocumentAvailability(contract: PageContentContract) {
  console.log(`\n== Document availability: ${contract.documentId} (${contract.documentType}) ==`);
  const docs = await client.fetch<{ _id: string; _type: string; pageKey?: string }[]>(
    `*[_id == $id || (_type == $type && pageKey == $pageKey)]{_id, _type, pageKey}`,
    { id: contract.documentId, type: contract.documentType, pageKey: contract.pageKey },
  );
  if (docs.length === 0) {
    console.log(`  FAIL: no publicly-readable document found for id "${contract.documentId}".`);
    return false;
  }
  if (docs.length > 1) {
    console.log(`  FAIL: ${docs.length} documents match (expected exactly 1) — possible duplicate: ${docs.map((d) => d._id).join(", ")}`);
    return false;
  }
  const doc = docs[0]!;
  const ok = doc._id === contract.documentId && doc._type === contract.documentType && doc.pageKey === contract.pageKey;
  console.log(`  ${ok ? "OK" : "FAIL"}: _id=${doc._id} _type=${doc._type} pageKey=${doc.pageKey ?? "(none)"}`);
  return ok;
}

async function checkLocalization(contract: PageContentContract): Promise<LocalizationGap[]> {
  const sections = await client.fetch<RawSection[]>(
    `*[_id == $id][0].sections[]{sectionKey, label, title, text}`,
    { id: contract.documentId },
  );
  const sectionByKey = new Map(sections.map((s) => [s.sectionKey, s]));
  const gaps: LocalizationGap[] = [];

  for (const entry of contract.entries) {
    if (entry.fieldType !== "i18nString" && entry.fieldType !== "i18nText") continue;
    const parsed = parseSimpleSectionField(entry.sanityPath);
    if (!parsed) continue; // combined/collapsed entries are documented, not mechanically checked here

    const section = sectionByKey.get(parsed.sectionKey);
    const { missing, empty } = checkI18nCompleteness(section?.[parsed.field]);
    if (!missing.length && !empty.length) continue;

    gaps.push({
      page: contract.pageKey,
      section: parsed.sectionKey,
      field: entry.fieldPurpose,
      fieldPath: entry.sanityPath,
      missing,
      empty,
      severity: entry.required ? "high" : missing.length === REQUIRED_LANGUAGES.length ? "low" : "medium",
      recommendedAction: entry.required
        ? "Required field — add the missing translation(s) before relying on this locale in production."
        : "Optional field — add translations when available; frontend currently falls back to English (pickLocalized) or a hardcoded default.",
    });
  }
  return gaps;
}

function printClassificationSummary(contract: PageContentContract) {
  console.log(`\n== Static classification summary (from the contract, ${contract.entries.length} entries) ==`);
  const byClass = new Map<string, ContentContractEntry[]>();
  for (const e of contract.entries) {
    if (!byClass.has(e.classification)) byClass.set(e.classification, []);
    byClass.get(e.classification)!.push(e);
  }
  for (const [cls, list] of [...byClass.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${cls}: ${list.length}`);
  }
  const disconnected = byClass.get("disconnected") ?? [];
  if (disconnected.length) {
    console.log("\n  Disconnected fields (editable in Studio, no frontend effect):");
    for (const e of disconnected) {
      console.log(`    - [${e.sectionKey}] ${e.fieldPurpose}  (${e.sanityPath})`);
    }
  }
}

async function main() {
  const key = process.argv[2] ?? "home";
  const contract = CONTRACTS[key];
  if (!contract) {
    console.error(`No contract registered for "${key}". Known: ${Object.keys(CONTRACTS).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const docOk = await checkDocumentAvailability(contract);

  console.log(`\n== Localization completeness (EN/DA/UK) ==`);
  const gaps = docOk ? await checkLocalization(contract) : [];
  if (!gaps.length) {
    console.log("  No localization gaps found among the mechanically-checkable entries.");
  } else {
    console.log(`  ${gaps.length} field(s) with gaps:\n`);
    console.log("  page      section              field                                  missing        empty   severity  action");
    for (const g of gaps) {
      console.log(
        `  ${g.page.padEnd(9)} ${g.section.padEnd(20)} ${g.field.slice(0, 38).padEnd(38)} ${(g.missing.join(",") || "-").padEnd(14)} ${(g.empty.join(",") || "-").padEnd(7)} ${g.severity.padEnd(9)} ${g.recommendedAction}`,
      );
    }
  }

  printClassificationSummary(contract);
}

main().catch((error) => {
  console.error("audit-content-contract failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
