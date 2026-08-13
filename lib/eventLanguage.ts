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
