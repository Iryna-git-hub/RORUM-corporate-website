import type { Rule, ValidationContext } from "sanity";

// Reusable validators for the `{_key, language, value}[]` shape every
// internationalized field uses. Two variants because not every field needs
// the same rule: some visible content must always have all 3 languages,
// while some optional fields are fine empty but, if used at all, must be
// fully trilingual (no half-translated content shipping silently).
const REQUIRED_LANGUAGES = ["en", "da", "uk"];

const LANGUAGE_NAMES: Record<string, string> = { en: "English", da: "Danish", uk: "Ukrainian" };

/** "en" -> "English"; "da, uk" -> "Danish and Ukrainian"; 3 codes -> "English, Danish and Ukrainian". */
function namesFor(codes: string[]): string {
  const names = codes.map((c) => LANGUAGE_NAMES[c] ?? c);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

interface I18nEntry {
  _key?: string;
  language?: string;
  value?: unknown;
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function analyze(entries: I18nEntry[] | undefined | null, requiredLanguages: readonly string[] = REQUIRED_LANGUAGES) {
  const list = entries ?? [];
  const seen = new Map<string, number>();
  const emptyLanguages: string[] = [];
  for (const entry of list) {
    if (!entry?.language) continue;
    seen.set(entry.language, (seen.get(entry.language) ?? 0) + 1);
    if (isEmptyValue(entry.value)) emptyLanguages.push(entry.language);
  }
  const missing = requiredLanguages.filter((lang) => !seen.has(lang));
  const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([lang]) => lang);
  return { missing, emptyLanguages, duplicates };
}

/**
 * All three languages must be present and non-empty. Use on required visible
 * content.
 *
 * `skip`: lets one specific, narrowly-identified case opt out of the
 * requirement entirely (returns valid unconditionally) without weakening it
 * for every other field that reuses this same shape — e.g. Home's hero
 * background media, whose alt text is hidden from Studio (see
 * sanity/schemaTypes/objects/mediaItem.ts) because it's never rendered.
 * Without this, an editor could be blocked from publishing by a required
 * field they can't even see.
 */
export function requireAllLanguages(options?: { skip?: (context: ValidationContext) => boolean }) {
  return (rule: Rule) =>
    rule.custom((value: I18nEntry[] | undefined, context: ValidationContext) => {
      if (options?.skip?.(context)) return true;
      const { missing, emptyLanguages, duplicates } = analyze(value);
      if (duplicates.length) return `There's more than one entry for ${namesFor(duplicates)} — please remove the extra one.`;
      if (missing.length) return `Please add the ${namesFor(missing)} translation${missing.length > 1 ? "s" : ""}.`;
      if (emptyLanguages.length) return `The ${namesFor(emptyLanguages)} text is empty — please fill it in.`;
      return true;
    });
}

/**
 * Either the whole field is empty, or all three languages are present and
 * non-empty. Use on optional content.
 *
 * `skip`: same purpose as `requireAllLanguages`'s — lets one specific,
 * narrowly-identified hidden-field context opt out entirely, so a hidden
 * field's stray/partial leftover data can never block publishing (e.g.
 * contentItem.ts's item-role-hidden title/text fields).
 */
export function allOrNothingLanguages(options?: { skip?: (context: ValidationContext) => boolean }) {
  return (rule: Rule) =>
    rule.custom((value: I18nEntry[] | undefined, context: ValidationContext) => {
      if (options?.skip?.(context)) return true;
      const list = value ?? [];
      if (list.length === 0) return true;
      const { missing, emptyLanguages, duplicates } = analyze(list);
      if (duplicates.length) return `There's more than one entry for ${namesFor(duplicates)} — please remove the extra one.`;
      if (missing.length) return `This field is filled in for some languages but not all — please add the ${namesFor(missing)} translation${missing.length > 1 ? "s" : ""}, or clear the field completely.`;
      if (emptyLanguages.length) return `The ${namesFor(emptyLanguages)} text is empty — please fill it in or clear the field completely.`;
      return true;
    });
}

/**
 * Reads an `event` document's `visibleLocales` ("Show on website languages")
 * field — the single source of truth for which locales that event requires
 * content in. Returns `undefined` when the document isn't an event, or when
 * `visibleLocales` isn't a real, non-empty array (e.g. mid-creation, or a
 * pre-migration document) — callers treat `undefined` as "don't apply
 * event-specific rules here", never as "require nothing" vs "require
 * everything" silently.
 */
export function getEventVisibleLocales(document: unknown): string[] | undefined {
  const doc = document as { _type?: string; visibleLocales?: unknown } | undefined;
  if (doc?._type !== "event") return undefined;
  const locales = doc.visibleLocales;
  return Array.isArray(locales) && locales.every((l) => typeof l === "string") && locales.length > 0
    ? (locales as string[])
    : undefined;
}

/**
 * Event-specific replacement for `requireAllLanguages()`: instead of a fixed
 * en/da/uk requirement, requires exactly the locales selected in that same
 * document's `visibleLocales` field ("Show on website languages") —
 * unselected locales are never required, never validated, and their stored
 * data (if any, e.g. from before a locale was deselected) is left alone.
 *
 * If `visibleLocales` is missing/empty (mid-creation, or a document that
 * predates this field), this returns `true` unconditionally rather than
 * cascading dozens of unexplained errors onto every localized field —
 * `visibleLocales`'s own `min(1)` validation is the single, clear place that
 * error surfaces.
 *
 * `skip`: same purpose as the other two validators' — lets one specific,
 * narrowly-identified hidden-field context opt out entirely.
 */
export function requireSelectedEventLocales(options?: { skip?: (context: ValidationContext) => boolean }) {
  return (rule: Rule) =>
    rule.custom((value: I18nEntry[] | undefined, context: ValidationContext) => {
      if (options?.skip?.(context)) return true;
      const selected = getEventVisibleLocales(context.document);
      if (!selected) return true;

      const list = value ?? [];
      const seen = new Map<string, number>();
      const emptyLanguages: string[] = [];
      for (const entry of list) {
        if (!entry?.language || !selected.includes(entry.language)) continue; // unselected locales are never validated
        seen.set(entry.language, (seen.get(entry.language) ?? 0) + 1);
        if (isEmptyValue(entry.value)) emptyLanguages.push(entry.language);
      }
      const missing = selected.filter((lang) => !seen.has(lang));
      const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([lang]) => lang);

      if (duplicates.length) return `There's more than one entry for ${namesFor(duplicates)} — please remove the extra one.`;
      if (missing.length) {
        const translationWord = missing.length > 1 ? "translations" : "translation";
        const websiteWord = missing.length > 1 ? "websites" : "website";
        return `Please add the ${namesFor(missing)} ${translationWord} because this event is shown on the ${namesFor(missing)} ${websiteWord}.`;
      }
      if (emptyLanguages.length) return `The ${namesFor(emptyLanguages)} text is empty — please fill it in.`;
      return true;
    });
}

/**
 * Sibling of `requireSelectedEventLocales()` for genuinely OPTIONAL
 * per-event fields that have a real, sensible fallback when empty (ticket
 * button label override, ticket-provider label/value override, event SEO) —
 * same relationship as `allOrNothingLanguages()` is to `requireAllLanguages()`
 * elsewhere in this file. Empty is always fine, regardless of which locales
 * are selected. But a field that HAS been started must be complete for every
 * SELECTED locale (not all 3) — a half-filled-in override for a locale the
 * event isn't even shown in is never required, but a half-filled-in override
 * for a locale it IS shown in should be finished or cleared, not left
 * silently partial.
 */
/**
 * Sibling of `requireSelectedEventLocales()` for a field nested inside a
 * `shareSettings[]` item (the "Display label" on each Share With Friends
 * action): that label is real rendered content (the action's accessible
 * screen-reader name) only when the action is actually `enabled` on this
 * event, so the requirement must read `enabled` off the array item itself
 * (`context.parent`), not off the document.
 *
 * - `enabled: true` (or missing, since it defaults to `true`): the label
 *   must be present and non-empty for every locale selected in
 *   `visibleLocales` — same rule as `requireSelectedEventLocales()`.
 * - `enabled: false`: a missing/empty label for a selected locale never
 *   blocks publishing (the action isn't shown, so its label is never read).
 * - Duplicate entries for the same language are always invalid, enabled or
 *   not — that's a structural/data-integrity problem, not a content gap.
 * - Locales NOT selected in `visibleLocales` are never validated either way.
 */
export function requireSelectedEventLocalesForShareAction() {
  return (rule: Rule) =>
    rule.custom((value: I18nEntry[] | undefined, context: ValidationContext) => {
      const selected = getEventVisibleLocales(context.document);
      if (!selected) return true;

      const list = value ?? [];
      const seen = new Map<string, number>();
      const emptyLanguages: string[] = [];
      for (const entry of list) {
        if (!entry?.language || !selected.includes(entry.language)) continue;
        seen.set(entry.language, (seen.get(entry.language) ?? 0) + 1);
        if (isEmptyValue(entry.value)) emptyLanguages.push(entry.language);
      }
      const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([lang]) => lang);
      if (duplicates.length) return `There's more than one entry for ${namesFor(duplicates)} — please remove the extra one.`;

      const parent = context.parent as { enabled?: boolean } | undefined;
      if (parent?.enabled === false) return true;

      const missing = selected.filter((lang) => !seen.has(lang));
      if (missing.length) {
        const translationWord = missing.length > 1 ? "translations" : "translation";
        const websiteWord = missing.length > 1 ? "websites" : "website";
        return `Please add the ${namesFor(missing)} ${translationWord} because this event is shown on the ${namesFor(missing)} ${websiteWord} and this share action is enabled.`;
      }
      if (emptyLanguages.length) return `The ${namesFor(emptyLanguages)} text is empty — please fill it in.`;
      return true;
    });
}

export function allOrNothingForSelectedEventLocales(options?: { skip?: (context: ValidationContext) => boolean }) {
  return (rule: Rule) =>
    rule.custom((value: I18nEntry[] | undefined, context: ValidationContext) => {
      if (options?.skip?.(context)) return true;
      const selected = getEventVisibleLocales(context.document);
      if (!selected) return true;

      const relevant = (value ?? []).filter((e) => e?.language && selected.includes(e.language));
      if (relevant.length === 0) return true; // fully empty (for the selected locales) is fine

      const seen = new Map<string, number>();
      const emptyLanguages: string[] = [];
      for (const entry of relevant) {
        seen.set(entry.language!, (seen.get(entry.language!) ?? 0) + 1);
        if (isEmptyValue(entry.value)) emptyLanguages.push(entry.language!);
      }
      const missing = selected.filter((lang) => !seen.has(lang));
      const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([lang]) => lang);

      if (duplicates.length) return `There's more than one entry for ${namesFor(duplicates)} — please remove the extra one.`;
      if (missing.length) {
        const translationWord = missing.length > 1 ? "translations" : "translation";
        return `This field is filled in for some of the event's website languages but not all — please add the ${namesFor(missing)} ${translationWord}, or clear the field completely.`;
      }
      if (emptyLanguages.length) return `The ${namesFor(emptyLanguages)} text is empty — please fill it in or clear the field completely.`;
      return true;
    });
}
