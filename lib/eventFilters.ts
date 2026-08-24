// Pure resolver for the Events listing's filter UI — separates the STABLE
// filter value (what the URL/comparison logic actually uses — untouched by
// any of this) from the localized, manager-facing LABEL (what Sanity's
// page-events.filters section stores) and from display ORDER. Group/itemKey/
// value structure comes from shared/eventFilterDefinitions.ts — the one
// module both this file and sanity/components/EventsFiltersInput.tsx import,
// so the two can never drift out of sync the way they briefly did (see
// MIGRATION_REPORT.md's Events Listing follow-up for the incident this
// replaces: a hardcoded `languageOptions` sort in EventsClientPage.tsx
// silently overrode the manager's own stored Language order).
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
import { getEventLanguageLabel } from "@/lib/eventLanguage";
import { getFilterGroup, type OrderableFilterGroupKey } from "@/shared/eventFilterDefinitions";

export type { OrderableFilterGroupKey };

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
 * stable strings from shared/eventFilterDefinitions.ts, completely
 * unaffected by reordering or relabeling.
 *
 * `filtersSection` missing, or none of this group's known itemKeys present
 * yet (Sanity unavailable / not yet migrated): falls back to the group's own
 * canonical default order. Any known key that exists in the schema but is
 * unexpectedly absent from storage (shouldn't happen once migrated — see
 * scripts/migrate-events-filter-labels.ts) is appended at the end rather
 * than silently dropped, so a filter option can never disappear from the UI
 * due to a data gap.
 */
export function resolveOrderedFilterOptions(
  filtersSection: RawPageSection | undefined,
  locale: Locale,
  groupKey: OrderableFilterGroupKey,
): { value: string; label: string }[] {
  const group = getFilterGroup(groupKey);
  const optionItemKeys = group.options.map((o) => o.itemKey);
  const storedKeysInOrder = (filtersSection?.items ?? [])
    .map((item) => item.itemKey)
    .filter((key): key is string => typeof key === "string" && optionItemKeys.includes(key));
  const missingKnownKeys = optionItemKeys.filter((k) => !storedKeysInOrder.includes(k));
  const orderedKeys = storedKeysInOrder.length > 0 ? [...storedKeysInOrder, ...missingKnownKeys] : optionItemKeys;

  return orderedKeys.map((itemKey) => ({
    value: group.options.find((o) => o.itemKey === itemKey)!.value,
    label: filterField(filtersSection, itemKey, locale, defaultEventFilterLabels[itemKey as keyof EventFilterLabels] ?? ""),
  }));
}

export function resolveEventsEmptyStateText(filtersSection: RawPageSection | undefined, locale: Locale, fallback: EventsEmptyStateText): EventsEmptyStateText {
  return {
    title: filterField(filtersSection, "emptyStateTitle", locale, fallback.title),
    text: filterField(filtersSection, "emptyStateText", locale, fallback.text),
  };
}

const LANGUAGE_GROUP = getFilterGroup("language");
/** The Language group's option itemKeys, in canonical (default/fallback) order. */
const CANONICAL_LANGUAGE_ORDER: readonly string[] = LANGUAGE_GROUP.options.map((o) => o.value);
const LANGUAGE_ITEM_KEY_BY_VALUE = new Map(LANGUAGE_GROUP.options.map((o) => [o.value, o.itemKey]));

/**
 * The Language filter's options, in the manager's own stored order,
 * restricted to the languages actually present among the currently loaded
 * events — `value` is always one of `event.language`'s own real stored
 * strings ("English"/"Danish"/"Ukrainian"), never a website display-locale
 * code, and is completely unaffected by relabeling or reordering.
 *
 * This is the fix for a real bug (Events Listing Studio follow-up):
 * `EventsClientPage.tsx` previously derived its own `languageOptions` via
 * `Array.from(new Set(...)).sort((a, b) => a.localeCompare(b))` — an
 * alphabetical sort that silently overrode whatever order the manager set
 * via EventsFiltersInput.tsx's own Move up/down controls for these 3 rows,
 * even though the Sanity array itself reordered correctly. `events/page.tsx`
 * now calls this instead, server-side, passing the resolved `{value,label}[]`
 * straight through — `EventsClientPage.tsx` no longer computes or sorts
 * this list itself.
 *
 * Order resolution:
 *   1. Rows the manager has stored, in their own stored order (only the
 *      languageEnLabel/languageDaLabel/languageUkLabel rows count).
 *   2. Any of the 3 known rows genuinely missing from storage — appended
 *      at the end in canonical (English/Danish/Ukrainian) order, matching
 *      `resolveOrderedFilterOptions`'s own "never silently drop" policy.
 *   3. If NONE of the 3 known rows are stored yet (Sanity unavailable / not
 *      migrated), the canonical order is used outright.
 *   4. The full known-order list is then filtered down to only the values
 *      present in `availableEventLanguages` — an available value that isn't
 *      one of the 3 known ones (unexpected/legacy `event.language` data) is
 *      appended afterward, sorted alphabetically for a deterministic (not
 *      arbitrary-insertion-order-dependent) result.
 */
export function resolveOrderedEventLanguageOptions(
  filtersSection: RawPageSection | undefined,
  locale: Locale,
  availableEventLanguages: readonly string[],
): { value: string; label: string }[] {
  const optionItemKeys = LANGUAGE_GROUP.options.map((o) => o.itemKey);
  const storedItemKeysInOrder = (filtersSection?.items ?? [])
    .map((item) => item.itemKey)
    .filter((key): key is string => typeof key === "string" && optionItemKeys.includes(key));
  const storedValuesInOrder = storedItemKeysInOrder.map((itemKey) => LANGUAGE_GROUP.options.find((o) => o.itemKey === itemKey)!.value);
  const missingKnownValues = CANONICAL_LANGUAGE_ORDER.filter((v) => !storedValuesInOrder.includes(v));
  const knownOrder = storedValuesInOrder.length > 0 ? [...storedValuesInOrder, ...missingKnownValues] : CANONICAL_LANGUAGE_ORDER;

  const availableKnown = knownOrder.filter((v) => availableEventLanguages.includes(v));
  const availableUnknown = availableEventLanguages.filter((v) => !knownOrder.includes(v)).sort((a, b) => a.localeCompare(b));
  const finalOrder = [...availableKnown, ...availableUnknown];

  return finalOrder.map((value) => {
    const itemKey = LANGUAGE_ITEM_KEY_BY_VALUE.get(value);
    const label = itemKey
      ? filterField(filtersSection, itemKey, locale, getEventLanguageLabel(value, locale) ?? value)
      : (getEventLanguageLabel(value, locale) ?? value);
    return { value, label };
  });
}
