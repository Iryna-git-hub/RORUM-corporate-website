// The single source of truth for the Events Listing filter architecture —
// group keys, heading/option itemKeys, each option's stable filter value,
// message-row keys, and the canonical English fallback text for all of the
// above. Both the Next.js frontend (lib/eventFilters.ts) and the Sanity
// Studio input (sanity/components/EventsFiltersInput.tsx) import this same
// module instead of each maintaining its own copy — the exact duplication
// this file replaces (see MIGRATION_REPORT.md's Events Listing follow-up
// for the incident this fixes).
//
// Deliberately dependency-free: no React, no Next.js, no `sanity` package,
// no browser APIs, no server-only code — only readonly constants and
// literal types, so this can be imported unconditionally from anywhere in
// either bundle without pulling in a runtime it doesn't need.
//
// `value` is the STABLE filter value the URL/filtering/comparison logic
// actually uses — for the Language group specifically, `value` is one of
// `event.language`'s own real stored strings ("English"/"Danish"/
// "Ukrainian"), never a website display-locale code (`en`/`da`/`uk`) — see
// lib/eventFilters.ts's own doc comment for why that's a real, distinct
// value domain. Editing a row's manager-facing label (its Sanity `.title`)
// or reordering it can never change `value`.

export type FilterGroupKey = "date" | "language" | "price" | "availability";
/** The 3 groups whose option order is manager-controlled via stored array position — Language is handled separately (see lib/eventFilters.ts's `resolveOrderedEventLanguageOptions`) since its available options also depend on which events are currently loaded, not just what's stored. */
export type OrderableFilterGroupKey = "date" | "price" | "availability";

export interface FilterOptionDefinition {
  /** The Sanity contentItem itemKey this option's label is stored under. */
  itemKey: string;
  /** Canonical English fallback text — used both as Studio's fallback preview label and (via lib/eventFilters.ts) the frontend's code-level default when Sanity is unavailable. */
  label: string;
  /** The stable filter value — untouched by relabeling or reordering. For the Language group, this is one of `event.language`'s own real stored strings. */
  value: string;
}

export interface FilterGroupDefinition {
  groupKey: FilterGroupKey;
  /** Canonical English group-heading fallback text. */
  label: string;
  /** The Sanity contentItem itemKey the group's own heading label is stored under. */
  headingItemKey: string;
  options: readonly FilterOptionDefinition[];
}

export const EVENT_FILTER_GROUPS: readonly FilterGroupDefinition[] = [
  {
    groupKey: "date",
    label: "Date",
    headingItemKey: "dateLabel",
    options: [
      { itemKey: "soonestLabel", label: "Soonest first", value: "soonest" },
      { itemKey: "weekLabel", label: "This week", value: "week" },
      { itemKey: "monthLabel", label: "This month", value: "month" },
    ],
  },
  {
    groupKey: "language",
    label: "Language",
    headingItemKey: "languageLabel",
    options: [
      { itemKey: "languageEnLabel", label: "English", value: "English" },
      { itemKey: "languageDaLabel", label: "Danish", value: "Danish" },
      { itemKey: "languageUkLabel", label: "Ukrainian", value: "Ukrainian" },
    ],
  },
  {
    groupKey: "price",
    label: "Price",
    headingItemKey: "priceLabel",
    options: [
      { itemKey: "priceAscLabel", label: "Price: low to high", value: "price-asc" },
      { itemKey: "priceDescLabel", label: "Price: high to low", value: "price-desc" },
    ],
  },
  {
    groupKey: "availability",
    label: "Availability",
    headingItemKey: "availabilityLabel",
    options: [
      { itemKey: "availableLabel", label: "Available", value: "available" },
      { itemKey: "soldOutLabel", label: "Sold out", value: "sold-out" },
    ],
  },
] as const;

/** Rows outside the 4 groups above — not tied to any one group, shown in Studio as a separate "Filter messages" group. */
export const EVENT_FILTER_MESSAGE_ROWS: readonly { itemKey: string; label: string }[] = [
  { itemKey: "clearFiltersLabel", label: "Clear filters" },
  { itemKey: "emptyStateTitle", label: "Empty-state title" },
  { itemKey: "emptyStateText", label: "Empty-state text" },
] as const;

/** Every reserved filters-section itemKey the Events Listing uses — group headings + options + messages. The full closed set `EventsFiltersInput.tsx` renders and `contentItem.ts`'s "Events filter/empty-state label" role matches. */
export const ALL_EVENT_FILTER_ITEM_KEYS: readonly string[] = [
  ...EVENT_FILTER_GROUPS.flatMap((g) => [g.headingItemKey, ...g.options.map((o) => o.itemKey)]),
  ...EVENT_FILTER_MESSAGE_ROWS.map((m) => m.itemKey),
];

export function getFilterGroup(groupKey: FilterGroupKey): FilterGroupDefinition {
  const group = EVENT_FILTER_GROUPS.find((g) => g.groupKey === groupKey);
  if (!group) throw new Error(`getFilterGroup: unknown groupKey "${groupKey}"`);
  return group;
}
