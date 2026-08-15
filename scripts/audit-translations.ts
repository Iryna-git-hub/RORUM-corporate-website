/**
 * Read-only: walks every document in the dataset, finds every
 * internationalized-array field (the `{_key, language, value}[]` shape used
 * throughout this schema for en/da/uk content), and reports any field that's
 * missing a language, has an empty/whitespace-only value for a language, or
 * has a duplicate language entry. Works against the current schema as-is —
 * no dependency on the page+sections refactor — so it's useful both as a
 * pre-migration gap list and as a regression check after each migration
 * batch (re-run and diff the output).
 *
 * Usage: npm run sanity:audit-translations
 */
import { createClient } from "@sanity/client";

const REQUIRED_LANGUAGES = ["en", "da", "uk"];

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
  _type?: string;
  language?: string;
  value?: unknown;
}

interface Gap {
  docId: string;
  docType: string;
  path: string;
  missing: string[];
  empty: string[];
  duplicates: string[];
}

function isI18nArray(value: unknown): value is I18nEntry[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((v) => v && typeof v === "object" && "_key" in (v as object) && "language" in (v as object))
  );
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function checkEntries(entries: I18nEntry[]) {
  const seen = new Map<string, number>();
  const empty: string[] = [];
  for (const entry of entries) {
    const lang = entry.language;
    if (!lang) continue;
    seen.set(lang, (seen.get(lang) ?? 0) + 1);
    if (isEmptyValue(entry.value)) empty.push(lang);
  }
  const missing = REQUIRED_LANGUAGES.filter((lang) => !seen.has(lang));
  const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([lang]) => lang);
  return { missing, empty, duplicates };
}

function walk(value: unknown, path: string, docId: string, docType: string, gaps: Gap[]) {
  if (value == null) return;

  if (isI18nArray(value)) {
    const { missing, empty, duplicates } = checkEntries(value);
    if (missing.length || empty.length || duplicates.length) {
      gaps.push({ docId, docType, path, missing, empty, duplicates });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      const key =
        item && typeof item === "object" && "_key" in (item as object)
          ? `[${(item as { _key: string })._key}]`
          : `[${i}]`;
      walk(item, `${path}${key}`, docId, docType, gaps);
    });
    return;
  }

  if (typeof value === "object") {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (key.startsWith("_")) continue;
      walk(nested, path ? `${path}.${key}` : key, docId, docType, gaps);
    }
  }
}

async function main() {
  const docs = await client.fetch<{ _id: string; _type: string }[]>(
    `*[!(_id in path("drafts.**")) && !(_type in ["sanity.imageAsset", "sanity.fileAsset"])]`,
  );

  const gaps: Gap[] = [];
  for (const doc of docs) {
    walk(doc, "", doc._id, doc._type, gaps);
  }

  if (!gaps.length) {
    console.log(`Scanned ${docs.length} documents — no translation gaps found.`);
    return;
  }

  console.log(`Scanned ${docs.length} documents — found ${gaps.length} field(s) with gaps:\n`);
  for (const gap of gaps) {
    const parts: string[] = [];
    if (gap.missing.length) parts.push(`missing: ${gap.missing.join(", ")}`);
    if (gap.empty.length) parts.push(`empty: ${gap.empty.join(", ")}`);
    if (gap.duplicates.length) parts.push(`duplicate: ${gap.duplicates.join(", ")}`);
    console.log(`  [${gap.docType}] ${gap.docId} :: ${gap.path}  —  ${parts.join(" | ")}`);
  }

  const byType = gaps.reduce<Record<string, number>>((acc, g) => {
    acc[g.docType] = (acc[g.docType] ?? 0) + 1;
    return acc;
  }, {});
  console.log("\nGaps per document type:");
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
}

main().catch((error) => {
  console.error("audit-translations failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
