import type { Locale } from "@/lib/i18n";

// The language an EVENT is conducted in — a different concept from the
// website's own display locale (`Locale`). Stored as one of these 3 fixed
// English words on the `event.language` Sanity field (unchanged since
// before this file existed — see sanity/schemaTypes/documents/event.ts's
// `options.list`), so this is a display-only lookup, not a schema value.
export const eventLanguageOptions = ["English", "Danish", "Ukrainian"] as const;
export type EventLanguageOption = (typeof eventLanguageOptions)[number];

// Language *names*, not editorial copy — low-ambiguity, but still AI-provided
// and not yet reviewed by a native speaker (see MIGRATION_REPORT.md).
const EVENT_LANGUAGE_LABELS: Record<EventLanguageOption, Record<Locale, string>> = {
  English: { en: "English", da: "Engelsk", uk: "Англійська" },
  Danish: { en: "Danish", da: "Dansk", uk: "Данська" },
  Ukrainian: { en: "Ukrainian", da: "Ukrainsk", uk: "Українська" },
};

/** Resolves an event's language value to its name in the site's current display locale. */
export function getEventLanguageLabel(value: string | undefined | null, locale: Locale): string | undefined {
  if (!value) return undefined;
  return EVENT_LANGUAGE_LABELS[value as EventLanguageOption]?.[locale] ?? value;
}

// The `event.language` scalar→array rollout (see MIGRATION_REPORT.md) is
// complete: production has been migrated and independently re-verified to
// contain zero scalar values (every document is either an array or has the
// field unset), the Sanity schema field itself is `array of string` with a
// checkbox-grid `options.list` (sanity/schemaTypes/documents/event.ts), so
// Studio's own UI cannot produce a scalar, and every code path that used to
// hand this function a bare string (lib/sanityEvents.ts's own default
// fallback) has been changed to pass an array instead. There is no longer a
// legitimate path that produces a scalar here, so this only accepts
// `string[] | undefined | null` — dropping the scalar branch is a genuine
// simplification, not just cosmetic.
//
// This still filters out anything that isn't one of the 3 known language
// names (and de-dupes), so a malformed/unexpected array item is dropped
// rather than crashing or leaking through — e.g. if a future out-of-band
// script ever wrote a raw scalar via a direct API mutation (bypassing
// Studio's own publish-time validation), it would now simply be treated as
// invalid input and dropped, the same as any other unrecognized value,
// rather than silently wrapped into an array.
export function normalizeEventLanguages(value: readonly string[] | undefined | null): string[] {
  const source = Array.isArray(value) ? value : [];
  return Array.from(new Set(source.filter((item): item is EventLanguageOption =>
    typeof item === "string" && (eventLanguageOptions as readonly string[]).includes(item),
  )));
}

export function getEventLanguagesLabel(values: readonly string[], locale: Locale): string {
  return values.map((value) => getEventLanguageLabel(value, locale) ?? value).join(", ");
}

export function eventMatchesLanguage(values: readonly string[], selectedLanguage: string): boolean {
  return selectedLanguage === "all" || values.includes(selectedLanguage);
}

/** Flatten event language arrays for listing filters without changing first-seen order. */
export function flattenAvailableEventLanguages(events: readonly { language: readonly string[] }[]): string[] {
  return Array.from(new Set(events.flatMap((event) => event.language).filter(Boolean)));
}

/** BCP-47 codes for JSON-LD's `inLanguage` (schema.org Event) — not a translation, just the standard tag for each of the 3 stored language names. */
const EVENT_LANGUAGE_BCP47: Record<EventLanguageOption, string> = {
  English: "en",
  Danish: "da",
  Ukrainian: "uk",
};

/** Maps an event's resolved language names to their BCP-47 codes, for JSON-LD's `inLanguage`. Unrecognized values are dropped, never guessed. */
export function getEventLanguageCodes(values: readonly string[]): string[] {
  return values
    .map((value) => EVENT_LANGUAGE_BCP47[value as EventLanguageOption])
    .filter((code): code is string => Boolean(code));
}
