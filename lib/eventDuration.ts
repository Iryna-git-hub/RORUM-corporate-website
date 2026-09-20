import { localeTags, type Locale } from "@/lib/i18n";

export type DurationUnit = "minutes" | "hours";

export interface EventDuration {
  value: number;
  unit: DurationUnit;
}

// Unit words — AI-provided, not yet reviewed by a native speaker (see
// MIGRATION_REPORT.md). Keyed by the CLDR plural category so Ukrainian's
// three-way plural (1 / 2-4 / 5+) renders correctly via Intl.PluralRules
// rather than a hand-rolled (and likely wrong) modulo rule.
const UNIT_WORDS: Record<DurationUnit, Record<Locale, Partial<Record<Intl.LDMLPluralRule, string>>>> = {
  hours: {
    en: { one: "hour", other: "hours" },
    da: { one: "time", other: "timer" },
    uk: { one: "година", few: "години", many: "годин", other: "години" },
  },
  minutes: {
    en: { one: "minute", other: "minutes" },
    da: { one: "minut", other: "minutter" },
    uk: { one: "хвилина", few: "хвилини", many: "хвилин", other: "хвилини" },
  },
};

function formatDurationUnit(value: number, unit: DurationUnit, locale: Locale): string {
  const category = new Intl.PluralRules(localeTags[locale]).select(value);
  const words = UNIT_WORDS[unit][locale];
  return words[category] ?? words.other ?? unit;
}

/** Renders a structured duration as locale-appropriate text, e.g. "2.5 hours" / "2,5 timer" / "2,5 години". */
export function formatDuration(duration: EventDuration | undefined | null, locale: Locale): string | undefined {
  if (!duration || !Number.isFinite(duration.value) || duration.value <= 0) return undefined;
  const number = new Intl.NumberFormat(localeTags[locale]).format(duration.value);
  return `${number} ${formatDurationUnit(duration.value, duration.unit, locale)}`;
}

/** Parses free text like "3 hours" / "2.5 hours" into a structured duration — used only as a legacy-data fallback. */
export function parseDurationText(text: string | undefined | null): EventDuration | undefined {
  const match = text?.trim().match(/^(\d+(?:\.\d+)?)\s*(hour|minute)/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return { value, unit: (match[2] ?? "hour").toLowerCase().startsWith("hour") ? "hours" : "minutes" };
}

function parseTimeToMinutes(timeValue: string | undefined): number | null {
  const match = timeValue?.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Derives a structured duration from a "18:30-21:30"-style time range — used as a legacy-data fallback. */
export function computeDurationFromTimeRange(timeRange: string | undefined | null): EventDuration | undefined {
  const [startTime, endTime] = timeRange?.split(/\s*[-–]\s*/) ?? [];
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null || end <= start) return undefined;
  const totalMinutes = end - start;
  if (totalMinutes % 30 === 0) return { value: totalMinutes / 60, unit: "hours" };
  return { value: totalMinutes, unit: "minutes" };
}
