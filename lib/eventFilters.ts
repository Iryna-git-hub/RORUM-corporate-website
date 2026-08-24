// Pure resolver for the Events listing's filter UI — separates the STABLE
// filter value (what the URL/comparison logic actually uses — untouched by
// any of this) from the localized, manager-facing LABEL (what Sanity's
// page-events.filters section stores) and from display ORDER (fixed by
// EVENT_FILTER_GROUPS below, matching sanity/components/EventsFiltersInput.tsx's
// own group order — the two are kept in sync by hand, not shared code,
// since a Studio component can't import from this Next-specific lib/ file).
//
// Editing a label in Studio can never change what a filter option actually
// matches: `soonest`/`week`/`month`/`price-asc`/`price-desc`/`available`/
// `sold-out` (components/EventFilters.tsx's own option `value`s) and
// `event.language`'s own 3 stored strings ("English"/"Danish"/"Ukrainian")
// are unaffected by anything here — only the TEXT shown next to them can
// be edited.
import type { Locale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/sanity-i18n";
import { getItem, type RawPageSection } from "@/lib/sanity-sections";
import { defaultEventFilterLabels, type EventFilterLabels } from "@/components/EventFilters";
import type { EventsEmptyStateText } from "@/components/EventsPaginatedList";
import { eventLanguageOptions, type EventLanguageOption } from "@/lib/eventLanguage";

/**
 * The 4 semantic filter groups, in the exact order the public dropdown row
 * and the Studio editor both render them — `headingKey` is the group's own
 * CMS row (its `.title` is the group heading shown as the dropdown
 * trigger's label); `optionKeys` are that group's options, in stored/
 * displayed order. The Language group is a special case: its 3 "options"
 * aren't independent optionKeys read directly — they resolve the display
 * name for each of `event.language`'s 3 possible stored values (see
 * `resolveEventLanguageLabels` below), since the actual dropdown options
 * are computed at runtime from which languages the currently-loaded events
 * actually use, not from a fixed Sanity list.
 */
export const EVENT_FILTER_GROUPS = [
  { groupKey: "date", headingKey: "dateLabel", optionKeys: ["soonestLabel", "weekLabel", "monthLabel"] },
  { groupKey: "language", headingKey: "languageLabel", optionKeys: ["languageEnLabel", "languageDaLabel", "languageUkLabel"] },
  { groupKey: "price", headingKey: "priceLabel", optionKeys: ["priceAscLabel", "priceDescLabel"] },
  { groupKey: "availability", headingKey: "availabilityLabel", optionKeys: ["availableLabel", "soldOutLabel"] },
] as const;

/** Rows outside the 4 groups above — shown in Studio as a separate "Filter messages" group. */
export const EVENT_FILTER_MESSAGE_KEYS = ["clearFiltersLabel", "emptyStateTitle", "emptyStateText"] as const;

/** itemKey -> the STABLE filter value `components/EventFilters.tsx`'s own `EventDateFilter`/`EventPriceFilter`/`EventAvailabilityFilter` types use. Editing a label (the CMS row's `.title`) never touches this mapping. */
const OPTION_VALUE_BY_ITEM_KEY: Record<string, string> = {
  soonestLabel: "soonest",
  weekLabel: "week",
  monthLabel: "month",
  priceAscLabel: "price-asc",
  priceDescLabel: "price-desc",
  availableLabel: "available",
  soldOutLabel: "sold-out",
};

export type OrderableFilterGroupKey = "date" | "price" | "availability";

/** Every reserved filters-section itemKey this page uses, group headings + options + messages — the full closed set `EventsFiltersInput.tsx` renders and `contentItem.ts`'s "Events filter/empty-state label" role matches. */
export const ALL_EVENT_FILTER_ITEM_KEYS = [
  ...EVENT_FILTER_GROUPS.flatMap((g) => [g.headingKey, ...g.optionKeys]),
  ...EVENT_FILTER_MESSAGE_KEYS,
] as const;

function filterField(filtersSection: RawPageSection | undefined, key: string, locale: Locale, fallbackValue: string): string {
  return pickLocalized(getItem(filtersSection, key)?.title, locale) ?? fallbackValue;
}

/** Same shape/fallback behavior `app/[locale]/(site)/events/page.tsx`'s own inline `filterField()` loop produced — extracted here so it's independently testable. */
export function resolveEventFilterLabels(filtersSection: RawPageSection | undefined, locale: Locale): EventFilterLabels {
  return {
    dateLabel: filterField(filtersSection, "dateLabel", locale, defaultEventFilterLabels.dateLabel),
    languageLabel: filterField(filtersSection, "languageLabel", locale, defaultEventFilterLabels.languageLabel),
    priceLabel: filterField(filtersSection, "priceLabel", locale, defaultEventFilterLabels.priceLabel),
    availabilityLabel: filterField(filtersSection, "availabilityLabel", locale, defaultEventFilterLabels.availabilityLabel),
    soonestLabel: filterField(filtersSection, "soonestLabel", locale, defaultEventFilterLabels.soonestLabel),
    weekLabel: filterField(filtersSection, "weekLabel", locale, defaultEventFilterLabels.weekLabel),
    monthLabel: filterField(filtersSection, "monthLabel", locale, defaultEventFilterLabels.monthLabel),
    priceAscLabel: filterField(filtersSection, "priceAscLabel", locale, defaultEventFilterLabels.priceAscLabel),
    priceDescLabel: filterField(filtersSection, "priceDescLabel", locale, defaultEventFilterLabels.priceDescLabel),
    availableLabel: filterField(filtersSection, "availableLabel", locale, defaultEventFilterLabels.availableLabel),
    soldOutLabel: filterField(filtersSection, "soldOutLabel", locale, defaultEventFilterLabels.soldOutLabel),
    clearFiltersLabel: filterField(filtersSection, "clearFiltersLabel", locale, defaultEventFilterLabels.clearFiltersLabel),
  };
}

/**
 * The Date/Price/Availability group's options, in the manager's own stored
 * order (via `EventsFiltersInput.tsx`'s Move up/down — see that file), each
 * with its resolved localized label — `value` is always one of the fixed
 * stable strings above, completely unaffected by reordering or relabeling.
 *
 * `filtersSection` missing, or none of this group's known itemKeys present
 * yet (Sanity unavailable / not yet migrated): falls back to the group's own
 * canonical default order (`EVENT_FILTER_GROUPS`). Any known key that
 * exists in the schema but is unexpectedly absent from storage (shouldn't
 * happen once migrated — see scripts/migrate-events-filter-labels.ts) is
 * appended at the end rather than silently dropped, so a filter option can
 * never disappear from the UI due to a data gap.
 */
export function resolveOrderedFilterOptions(
  filtersSection: RawPageSection | undefined,
  locale: Locale,
  groupKey: OrderableFilterGroupKey,
): { value: string; label: string }[] {
  const group = EVENT_FILTER_GROUPS.find((g) => g.groupKey === groupKey)!;
  const storedKeysInOrder = (filtersSection?.items ?? [])
    .map((item) => item.itemKey)
    .filter((key): key is string => typeof key === "string" && (group.optionKeys as readonly string[]).includes(key));
  const missingKnownKeys = group.optionKeys.filter((k) => !storedKeysInOrder.includes(k));
  const orderedKeys = storedKeysInOrder.length > 0 ? [...storedKeysInOrder, ...missingKnownKeys] : group.optionKeys;

  return orderedKeys.map((itemKey) => ({
    value: OPTION_VALUE_BY_ITEM_KEY[itemKey]!,
    label: filterField(filtersSection, itemKey, locale, defaultEventFilterLabels[itemKey as keyof EventFilterLabels] ?? ""),
  }));
}

export function resolveEventsEmptyStateText(filtersSection: RawPageSection | undefined, locale: Locale, fallback: EventsEmptyStateText): EventsEmptyStateText {
  return {
    title: filterField(filtersSection, "emptyStateTitle", locale, fallback.title),
    text: filterField(filtersSection, "emptyStateText", locale, fallback.text),
  };
}

const OPTION_KEY_BY_LANGUAGE: Record<EventLanguageOption, string> = {
  English: "languageEnLabel",
  Danish: "languageDaLabel",
  Ukrainian: "languageUkLabel",
};

/**
 * The manager-editable display name for each of `event.language`'s 3
 * possible stored values, in the site's current display locale — CMS-
 * sourced when the corresponding `languageXxLabel` row is filled in,
 * otherwise falling back to `lib/eventLanguage.ts`'s existing hardcoded
 * table (unchanged, still used as-is by the Event Detail page, which this
 * Events-Listing-scoped task does not touch). `event.language`'s own
 * stored strings are never read from here — this only supplies display
 * text for whichever values the caller already has.
 */
export function resolveEventLanguageLabels(
  filtersSection: RawPageSection | undefined,
  locale: Locale,
  fallbackLabel: (value: EventLanguageOption, locale: Locale) => string | undefined,
): Record<EventLanguageOption, string> {
  const result = {} as Record<EventLanguageOption, string>;
  for (const value of eventLanguageOptions) {
    const itemKey = OPTION_KEY_BY_LANGUAGE[value];
    result[value] = pickLocalized(getItem(filtersSection, itemKey)?.title, locale) ?? fallbackLabel(value, locale) ?? value;
  }
  return result;
}
