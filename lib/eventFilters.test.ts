import { describe, expect, it } from "vitest";
import { resolveEventFilterLabels, resolveEventsEmptyStateText, resolveOrderedEventLanguageOptions, resolveOrderedFilterOptions } from "./eventFilters";
import { EVENT_FILTER_GROUPS, EVENT_FILTER_MESSAGE_ROWS } from "@/shared/eventFilterDefinitions";
import { defaultEventFilterLabels } from "@/components/EventFilters";
import { defaultEventsEmptyStateText } from "@/components/EventsPaginatedList";
import type { RawPageSection } from "./sanity-sections";

function i18n(en: string) {
  return [{ _key: "en", language: "en", value: en }];
}

function filtersSection(items: { itemKey: string; title: string }[]): RawPageSection {
  return {
    _key: "filters",
    items: items.map((i) => ({ _key: i.itemKey, itemKey: i.itemKey, title: i18n(i.title) })),
  } as unknown as RawPageSection;
}

describe("shared/eventFilterDefinitions.ts — imported here as the canonical structure, not redefined (architecture fix)", () => {
  it("defines exactly the 4 groups in the documented order, each with a heading + its options", () => {
    expect(EVENT_FILTER_GROUPS.map((g) => g.groupKey)).toEqual(["date", "language", "price", "availability"]);
  });

  it("the language group's 3 options carry their own stable event.language value, in canonical En/Da/Uk order", () => {
    const languageGroup = EVENT_FILTER_GROUPS.find((g) => g.groupKey === "language")!;
    expect(languageGroup.options.map((o) => ({ itemKey: o.itemKey, value: o.value }))).toEqual([
      { itemKey: "languageEnLabel", value: "English" },
      { itemKey: "languageDaLabel", value: "Danish" },
      { itemKey: "languageUkLabel", value: "Ukrainian" },
    ]);
  });

  it("message rows are exactly clearFiltersLabel/emptyStateTitle/emptyStateText", () => {
    expect(EVENT_FILTER_MESSAGE_ROWS.map((m) => m.itemKey)).toEqual(["clearFiltersLabel", "emptyStateTitle", "emptyStateText"]);
  });
});

describe("resolveEventFilterLabels — missing page vs. configured labels", () => {
  it("filtersSection undefined: falls back to defaultEventFilterLabels entirely", () => {
    expect(resolveEventFilterLabels(undefined, "en")).toEqual(defaultEventFilterLabels);
  });

  it("a configured label overrides its own default only — every other label stays at its own default", () => {
    const section = filtersSection([{ itemKey: "dateLabel", title: "Custom Date Heading" }]);
    const result = resolveEventFilterLabels(section, "en");
    expect(result.dateLabel).toBe("Custom Date Heading");
    expect(result.priceLabel).toBe(defaultEventFilterLabels.priceLabel);
  });

  it("all 12 EventFilterLabels keys are configurable independently", () => {
    const keys = Object.keys(defaultEventFilterLabels) as (keyof typeof defaultEventFilterLabels)[];
    const section = filtersSection(keys.map((k) => ({ itemKey: k, title: `Value for ${k}` })));
    const result = resolveEventFilterLabels(section, "en");
    for (const key of keys) {
      expect(result[key], key).toBe(`Value for ${key}`);
    }
  });
});

describe("resolveEventsEmptyStateText", () => {
  it("falls back to the caller-supplied default when unset", () => {
    expect(resolveEventsEmptyStateText(undefined, "en", defaultEventsEmptyStateText)).toEqual(defaultEventsEmptyStateText);
  });

  it("reads emptyStateTitle/emptyStateText independently", () => {
    const section = filtersSection([{ itemKey: "emptyStateTitle", title: "Nothing here" }]);
    const result = resolveEventsEmptyStateText(section, "en", defaultEventsEmptyStateText);
    expect(result.title).toBe("Nothing here");
    expect(result.text).toBe(defaultEventsEmptyStateText.text);
  });
});

describe("resolveOrderedFilterOptions — manager-controlled order is real, stable value is untouched (Section 9)", () => {
  it("no filtersSection: falls back to the group's own canonical default order", () => {
    const result = resolveOrderedFilterOptions(undefined, "en", "date");
    expect(result.map((o) => o.value)).toEqual(["soonest", "week", "month"]);
  });

  it("stored order is respected — the manager's Move up/down choices actually change what's returned, not just cosmetic", () => {
    const section = filtersSection([
      { itemKey: "monthLabel", title: "This month" },
      { itemKey: "soonestLabel", title: "Soonest first" },
      { itemKey: "weekLabel", title: "This week" },
    ]);
    const result = resolveOrderedFilterOptions(section, "en", "date");
    expect(result.map((o) => o.value)).toEqual(["month", "soonest", "week"]);
  });

  it("each option's stable value is always the fixed string the filtering logic expects, regardless of label text or order", () => {
    const section = filtersSection([{ itemKey: "priceDescLabel", title: "Custom high-to-low text" }, { itemKey: "priceAscLabel", title: "Custom low-to-high text" }]);
    const result = resolveOrderedFilterOptions(section, "en", "price");
    expect(result).toEqual([
      { value: "price-desc", label: "Custom high-to-low text" },
      { value: "price-asc", label: "Custom low-to-high text" },
    ]);
  });

  it("a known key missing from storage (shouldn't happen once migrated) is appended at the end, never silently dropped", () => {
    const section = filtersSection([{ itemKey: "soldOutLabel", title: "Sold out" }]);
    const result = resolveOrderedFilterOptions(section, "en", "availability");
    expect(result.map((o) => o.value)).toEqual(["sold-out", "available"]);
  });

  it("items belonging to a DIFFERENT group are ignored when resolving this group's order", () => {
    const section = filtersSection([
      { itemKey: "dateLabel", title: "Date" },
      { itemKey: "weekLabel", title: "This week" },
      { itemKey: "soonestLabel", title: "Soonest first" },
    ]);
    const result = resolveOrderedFilterOptions(section, "en", "date");
    expect(result.map((o) => o.value)).toEqual(["week", "soonest", "month"]);
  });
});

describe("resolveOrderedEventLanguageOptions — the manager's stored order is real authority (fixes the alphabetical-sort bug)", () => {
  function languageSection(itemKeysInOrder: string[]): RawPageSection {
    return filtersSection(itemKeysInOrder.map((itemKey) => ({ itemKey, title: itemKey })));
  }

  it("stored order English/Danish/Ukrainian renders in that exact order when all 3 are available", () => {
    const section = languageSection(["languageEnLabel", "languageDaLabel", "languageUkLabel"]);
    const result = resolveOrderedEventLanguageOptions(section, "en", ["English", "Danish", "Ukrainian"]);
    expect(result.map((o) => o.value)).toEqual(["English", "Danish", "Ukrainian"]);
  });

  it("stored order Ukrainian/English/Danish renders in that exact order — proves the manager's own Move up/down choice is the real authority, not a hardcoded/alphabetical one", () => {
    const section = languageSection(["languageUkLabel", "languageEnLabel", "languageDaLabel"]);
    const result = resolveOrderedEventLanguageOptions(section, "en", ["English", "Danish", "Ukrainian"]);
    expect(result.map((o) => o.value)).toEqual(["Ukrainian", "English", "Danish"]);
  });

  it("only languages actually present among the currently loaded events are returned — a stored-but-unavailable language is omitted", () => {
    const section = languageSection(["languageUkLabel", "languageEnLabel", "languageDaLabel"]);
    const result = resolveOrderedEventLanguageOptions(section, "en", ["English"]);
    expect(result.map((o) => o.value)).toEqual(["English"]);
  });

  it("available English+Ukrainian (Danish not loaded) follow their own relative stored order, skipping the absent one", () => {
    const section = languageSection(["languageUkLabel", "languageEnLabel", "languageDaLabel"]);
    const result = resolveOrderedEventLanguageOptions(section, "en", ["English", "Ukrainian"]);
    expect(result.map((o) => o.value)).toEqual(["Ukrainian", "English"]);
  });

  it("editing a label never changes its stable value — value is always the real event.language string, label is whatever's stored", () => {
    const section: RawPageSection = filtersSection([{ itemKey: "languageEnLabel", title: "Custom English Label Text" }]);
    const result = resolveOrderedEventLanguageOptions(section, "en", ["English"]);
    expect(result).toEqual([{ value: "English", label: "Custom English Label Text" }]);
  });

  it("returned values are always the real event.language strings (\"English\"/\"Danish\"/\"Ukrainian\") — the same values used as URL query params — never a translated or locale-code form", () => {
    const section = languageSection(["languageEnLabel", "languageDaLabel", "languageUkLabel"]);
    const result = resolveOrderedEventLanguageOptions(section, "uk", ["English", "Danish", "Ukrainian"]);
    expect(result.map((o) => o.value)).toEqual(["English", "Danish", "Ukrainian"]);
  });

  it("an unrecognized event.language value (unexpected/legacy data) is appended deterministically (alphabetically) after every known one", () => {
    const section = languageSection(["languageDaLabel", "languageEnLabel"]);
    const result = resolveOrderedEventLanguageOptions(section, "en", ["Danish", "English", "Zzz-Legacy", "Aaa-Legacy"]);
    expect(result.map((o) => o.value)).toEqual(["Danish", "English", "Aaa-Legacy", "Zzz-Legacy"]);
  });

  it("an unrecognized value's own label falls back to itself (no crash, no invented translation)", () => {
    const result = resolveOrderedEventLanguageOptions(undefined, "en", ["Klingon"]);
    expect(result).toEqual([{ value: "Klingon", label: "Klingon" }]);
  });

  it("no filtersSection at all (Sanity unavailable): canonical order (English/Danish/Ukrainian) is used, filtered to what's available, with the existing hardcoded lib/eventLanguage.ts labels", () => {
    const result = resolveOrderedEventLanguageOptions(undefined, "en", ["Ukrainian", "English"]);
    expect(result.map((o) => o.value)).toEqual(["English", "Ukrainian"]);
    expect(result.map((o) => o.label)).toEqual(["English", "Ukrainian"]);
  });

  it("filtersSection exists but has NONE of the 3 known language rows stored yet: canonical order is used, not an arbitrary one", () => {
    const section = filtersSection([{ itemKey: "dateLabel", title: "Date" }]);
    const result = resolveOrderedEventLanguageOptions(section, "en", ["Ukrainian", "Danish", "English"]);
    expect(result.map((o) => o.value)).toEqual(["English", "Danish", "Ukrainian"]);
  });

  it("a known row missing from storage (2 of 3 stored) is appended in canonical position, never dropped", () => {
    const section = languageSection(["languageUkLabel"]);
    const result = resolveOrderedEventLanguageOptions(section, "en", ["English", "Danish", "Ukrainian"]);
    // Ukrainian is stored (first); English/Danish are missing from storage,
    // appended afterward in canonical (English, then Danish) order.
    expect(result.map((o) => o.value)).toEqual(["Ukrainian", "English", "Danish"]);
  });

  it("no available languages at all: returns an empty array, never a fabricated default", () => {
    const section = languageSection(["languageEnLabel"]);
    expect(resolveOrderedEventLanguageOptions(section, "en", [])).toEqual([]);
  });
});
