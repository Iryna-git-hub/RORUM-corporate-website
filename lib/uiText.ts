import type { Locale } from "@/lib/i18n";

// Fixed, small-vocabulary UI chrome text that isn't per-event Sanity
// content (section headings, the footer's "View on map" link, the developer
// credit) — centralized here in the same Record<Key, Record<Locale,string>>
// shape as lib/eventLanguage.ts's EVENT_LANGUAGE_LABELS, so call sites do
// one `getUiText(key, locale)` lookup instead of scattering
// `locale === "da" ? ... : ...` checks through JSX. AI-provided
// translations, not yet reviewed by a native speaker — same disclosure as
// every other translation in this project (see MIGRATION_REPORT.md).
export type UiTextKey =
  | "eventOverviewHeading"
  | "whatToExpectHeading"
  | "practicalDetailsHeading"
  | "shareWithFriendsHeading"
  | "viewOnMap"
  | "developedBy";

const UI_TEXT: Record<UiTextKey, Record<Locale, string>> = {
  eventOverviewHeading: { en: "Event Overview", da: "Oversigt over arrangementet", uk: "Огляд події" },
  whatToExpectHeading: { en: "What to Expect", da: "Hvad du kan forvente", uk: "Чого очікувати" },
  practicalDetailsHeading: { en: "Practical Details", da: "Praktiske oplysninger", uk: "Практична інформація" },
  shareWithFriendsHeading: { en: "Share with Friends", da: "Del med venner", uk: "Поділитися з друзями" },
  viewOnMap: { en: "View on map", da: "Se på kortet", uk: "Відкрити на карті" },
  developedBy: { en: "Developed by", da: "Udviklet af", uk: "Розроблено" },
};

export function getUiText(key: UiTextKey, locale: Locale): string {
  return UI_TEXT[key][locale];
}
