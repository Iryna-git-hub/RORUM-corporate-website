// Pure decision/conversion logic for the one-time migration of `event`
// documents' plain-text `longDescription` (internationalizedArrayText) into
// the new rich-text `formattedDescription`
// (internationalizedArrayBodyPortableText) — see
// sanity/schemaTypes/documents/event.ts. Kept here, not inline in
// scripts/migrate-event-formatted-description.ts, so it can be unit-tested
// without any Sanity I/O — same separation vitest.config.ts documents for
// lib/**/*.test.ts ("plain-function unit tests ... that need no DOM/component
// rendering at all").
//
// Paragraph splitting is centralized in lib/portableText.ts so migration,
// import and fallback data all preserve the same blank-line paragraph model.
export type Locale = "en" | "da" | "uk";

import {
  hasMeaningfulPortableText,
  plainTextToPortableText,
  splitPlainTextParagraphs,
  type PortableTextBlock,
} from "./portableText";

export type { PortableTextBlock } from "./portableText";
export { hasMeaningfulPortableText } from "./portableText";

export interface LocaleTextEntry {
  language?: string;
  value?: string;
}

export interface LocaleBodyEntry {
  _key?: string;
  _type?: string;
  language?: string;
  value?: unknown[];
}

const WEBSITE_LOCALES: readonly Locale[] = ["en", "da", "uk"];

/** Same paragraph-split rule used by all plain-text-to-Portable-Text conversion. */
export function splitIntoParagraphs(text: string): string[] {
  return splitPlainTextParagraphs(text);
}

/**
 * Converts one locale's plain-text `longDescription` into `normal`-style
 * Portable Text blocks, one per blank-line-separated paragraph. No headings,
 * lists or marks are ever invented — that would be guessing at structure the
 * plain text never expressed.
 */
export function textToBlocks(text: string): PortableTextBlock[] {
  return plainTextToPortableText(text);
}

export type LocaleMigrationDecision =
  | { locale: Locale; status: "already-has-formatted" }
  | { locale: Locale; status: "no-source-content" }
  | { locale: Locale; status: "needs-migration"; blocks: PortableTextBlock[] };

/**
 * Decides what to do for ONE locale of ONE event:
 *
 * - `already-has-formatted`: `formattedDescription` already holds real
 *   (non-empty) content for this locale — NEVER overwritten, regardless of
 *   what `longDescription` holds.
 * - `no-source-content`: no usable `longDescription` text for this locale
 *   (missing, empty, whitespace-only, or paragraph-splitting yields zero
 *   blocks) — left empty and reported, never guessed at.
 * - `needs-migration`: `formattedDescription` is empty for this locale AND
 *   `longDescription` has real text — carries the converted blocks to write.
 */
export function planLocaleMigration(
  locale: Locale,
  longDescriptionEntries: LocaleTextEntry[] | undefined | null,
  formattedDescriptionEntries: LocaleBodyEntry[] | undefined | null,
): LocaleMigrationDecision {
  const alreadyFormatted = (formattedDescriptionEntries ?? []).some(
    (entry) => entry.language === locale && hasMeaningfulPortableText(entry.value),
  );
  if (alreadyFormatted) return { locale, status: "already-has-formatted" };

  const sourceText = (longDescriptionEntries ?? []).find((entry) => entry.language === locale)?.value?.trim();
  if (!sourceText) return { locale, status: "no-source-content" };

  const blocks = textToBlocks(sourceText);
  if (blocks.length === 0) return { locale, status: "no-source-content" };

  return { locale, status: "needs-migration", blocks };
}

export interface EventMigrationPlan {
  needsMigration: { locale: Locale; blocks: PortableTextBlock[] }[];
  alreadyHasFormatted: Locale[];
  noSourceContent: Locale[];
}

/**
 * Runs `planLocaleMigration` across every supported website locale. This is
 * deliberately broader than `visibleLocales`: dormant translated content
 * must survive even when a manager has temporarily hidden that locale.
 */
export function planEventMigration(
  _visibleLocales: string[] | undefined | null,
  longDescriptionEntries: LocaleTextEntry[] | undefined | null,
  formattedDescriptionEntries: LocaleBodyEntry[] | undefined | null,
): EventMigrationPlan {
  const plan: EventMigrationPlan = { needsMigration: [], alreadyHasFormatted: [], noSourceContent: [] };

  for (const locale of WEBSITE_LOCALES) {
    const decision = planLocaleMigration(locale, longDescriptionEntries, formattedDescriptionEntries);
    if (decision.status === "already-has-formatted") plan.alreadyHasFormatted.push(locale);
    else if (decision.status === "no-source-content") plan.noSourceContent.push(locale);
    else plan.needsMigration.push({ locale: decision.locale, blocks: decision.blocks });
  }

  return plan;
}

/**
 * Builds ONE combined array of `internationalizedArrayBodyPortableTextValue`
 * entries covering every locale in `needsMigration`. This must be committed
 * as a single patch per event — `formattedDescription`'s
 * `allOrNothingForSelectedEventLocales()` validation blocks publishing if an
 * event ends up with SOME but not ALL of its `visibleLocales` populated, so
 * writing locales one patch at a time for the same event could leave it in a
 * blocked intermediate state. See scripts/migrate-event-formatted-description.ts.
 */
export function buildNewLocaleEntries(
  needsMigration: EventMigrationPlan["needsMigration"],
): LocaleBodyEntry[] {
  return needsMigration.map(({ locale, blocks }) => ({
    _key: locale,
    _type: "internationalizedArrayBodyPortableTextValue",
    language: locale,
    value: blocks,
  }));
}

/** Replaces only locale rows being migrated and preserves every other row byte-for-byte. */
export function mergeFormattedDescription(
  existing: LocaleBodyEntry[] | undefined | null,
  needsMigration: EventMigrationPlan["needsMigration"],
): LocaleBodyEntry[] {
  const migrated = new Set(needsMigration.map((entry) => entry.locale));
  return [
    ...(existing ?? []).filter((entry) => !entry.language || !migrated.has(entry.language as Locale)),
    ...buildNewLocaleEntries(needsMigration),
  ];
}
