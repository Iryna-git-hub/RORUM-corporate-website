// Shared between scripts/import-content.ts and scripts/import-images.ts —
// kept in one place so the two scripts can never silently disagree on how a
// document id is derived (which would break `import-images.ts`'s ability to
// find the document `import-content.ts` already created).
import { createHash } from "node:crypto";

export function deterministicId(prefix: string, naturalKey: string): string {
  const hash = createHash("sha1").update(naturalKey).digest("hex").slice(0, 12);
  return `${prefix}-${hash}`;
}

export type Locale = "en" | "da" | "uk";

// `language` is the v5 format's canonical language identifier (see
// sanity-plugin-internationalized-array's `migrateToLanguageField`); `_key`
// only needs to be unique within the array, so a fixed locale code is fine
// and keeps re-running this script's document construction deterministic.
export function localizedString(locale: Locale, value: string | undefined | null) {
  if (value === undefined || value === null) return [];
  return [{ _key: locale, _type: "internationalizedArrayStringValue", language: locale, value }];
}

export function localizedText(locale: Locale, value: string | undefined | null) {
  if (value === undefined || value === null) return [];
  return [{ _key: locale, _type: "internationalizedArrayTextValue", language: locale, value }];
}

export function en(value: string | undefined | null) {
  return localizedString("en", value);
}

export function enText(value: string | undefined | null) {
  return localizedText("en", value);
}

/** Merges one field's per-locale entries (e.g. `[...en(x), ...da(x), ...uk(x)]`) into one array, dropping empty ones. */
export function mergeLocales<T>(...entries: T[][]): T[] {
  return entries.flat();
}

let blockKeyCounter = 0;
function nextKey(prefix: string): string {
  blockKeyCounter += 1;
  return `${prefix}${blockKeyCounter.toString(36)}`;
}

interface PortableTextBlock {
  _key: string;
  _type: "block";
  style: "normal" | "h2";
  listItem?: "bullet";
  level?: number;
  markDefs: unknown[];
  children: { _key: string; _type: "span"; text: string; marks: string[] }[];
}

/** One paragraph or heading block for a `bodyPortableText` field. */
export function block(text: string, style: "normal" | "h2" = "normal"): PortableTextBlock {
  return {
    _key: nextKey("blk"),
    _type: "block",
    style,
    markDefs: [],
    children: [{ _key: nextKey("span"), _type: "span", text, marks: [] }],
  };
}

/** One bullet-list-item block for a `bodyPortableText` field. */
export function bulletBlock(text: string): PortableTextBlock {
  return { ...block(text), listItem: "bullet", level: 1 };
}

export function localizedBody(locale: Locale, blocks: PortableTextBlock[] | undefined | null) {
  if (!blocks || blocks.length === 0) return [];
  return [
    { _key: locale, _type: "internationalizedArrayBodyPortableTextValue", language: locale, value: blocks },
  ];
}

export function enBody(blocks: PortableTextBlock[] | undefined | null) {
  return localizedBody("en", blocks);
}

// --- Tri-locale builders (en + da + uk in one call) — used by
// scripts/import-translations.ts, which owns the full trilingual content
// for each field and reconstructs it wholesale rather than patching one
// language in at a time. ---

export function tri(enValue: string, daValue: string, ukValue: string) {
  return mergeLocales(
    localizedString("en", enValue),
    localizedString("da", daValue),
    localizedString("uk", ukValue),
  );
}

export function triText(enValue: string, daValue: string, ukValue: string) {
  return mergeLocales(localizedText("en", enValue), localizedText("da", daValue), localizedText("uk", ukValue));
}

export function triBullet(key: string, enValue: string, daValue: string, ukValue: string) {
  return { _key: key, _type: "bulletText", text: tri(enValue, daValue, ukValue) };
}

export function triBulletParagraph(key: string, enValue: string, daValue: string, ukValue: string) {
  return { _key: key, _type: "bulletParagraph", text: triText(enValue, daValue, ukValue) };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * One `bulletText` array item (see sanity/schemaTypes/objects/bulletText.ts)
 * for a plain bulleted list — e.g. an event's "what's included". `key` must
 * be unique within the array but is NOT a language code; the item's own
 * `_key` and its `text` field's internal language `_key` are deliberately
 * different concerns (this is exactly the distinction the schema's earlier
 * `array of internationalizedArrayString` design conflated — see
 * MIGRATION_REPORT.md's Sanity section).
 */
export function bullet(key: string, value: string) {
  return { _key: key, _type: "bulletText", text: en(value) };
}

/** Same as `bullet()`, for `bulletParagraph` array items (longer text). */
export function bulletParagraph(key: string, value: string) {
  return { _key: key, _type: "bulletParagraph", text: enText(value) };
}
