import { describe, expect, it } from "vitest";
import { EVENT_FILTER_GROUPS, EVENT_FILTER_MESSAGE_KEYS, resolveEventFilterLabels, resolveEventLanguageLabels, resolveEventsEmptyStateText, resolveOrderedFilterOptions } from "./eventFilters";
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

describe("EVENT_FILTER_GROUPS / EVENT_FILTER_MESSAGE_KEYS — stable structure", () => {
  it("defines exactly the 4 groups in the documented order, each with a heading + its options", () => {
    expect(EVENT_FILTER_GROUPS.map((g) => g.groupKey)).toEqual(["date", "language", "price", "availability"]);
  });

  it("the language group's 3 options are the languageXxLabel keys, in En/Da/Uk order", () => {
    const languageGroup = EVENT_FILTER_GROUPS.find((g) => g.groupKey === "language")!;
    expect(languageGroup.optionKeys).toEqual(["languageEnLabel", "languageDaLabel", "languageUkLabel"]);
  });

  it("message keys are exactly clearFiltersLabel/emptyStateTitle/emptyStateText", () => {
    expect(EVENT_FILTER_MESSAGE_KEYS).toEqual(["clearFiltersLabel", "emptyStateTitle", "emptyStateText"]);
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

describe("resolveEventLanguageLabels — CMS override vs. hardcoded fallback, stable filter value untouched", () => {
  const fallbackLabel = (value: string) => (value === "English" ? "English (fallback)" : value === "Danish" ? "Danish (fallback)" : "Ukrainian (fallback)");

  it("no filtersSection at all: every value uses the fallback function", () => {
    const result = resolveEventLanguageLabels(undefined, "en", fallbackLabel);
    expect(result).toEqual({ English: "English (fallback)", Danish: "Danish (fallback)", Ukrainian: "Ukrainian (fallback)" });
  });

  it("a configured languageEnLabel overrides only the English display name", () => {
    const section = filtersSection([{ itemKey: "languageEnLabel", title: "Engelsk (custom)" }]);
    const result = resolveEventLanguageLabels(section, "en", fallbackLabel);
    expect(result.English).toBe("Engelsk (custom)");
    expect(result.Danish).toBe("Danish (fallback)");
  });

  it("the returned object's keys are always the real event.language values (English/Danish/Ukrainian) — editing a label never changes these", () => {
    const section = filtersSection([
      { itemKey: "languageEnLabel", title: "X" },
      { itemKey: "languageDaLabel", title: "Y" },
      { itemKey: "languageUkLabel", title: "Z" },
    ]);
    const result = resolveEventLanguageLabels(section, "en", fallbackLabel);
    expect(Object.keys(result).sort()).toEqual(["Danish", "English", "Ukrainian"]);
  });

  it("all 3 configured: all 3 override, none falls back", () => {
    const section = filtersSection([
      { itemKey: "languageEnLabel", title: "Engelsk" },
      { itemKey: "languageDaLabel", title: "Dansk" },
      { itemKey: "languageUkLabel", title: "Українська (custom)" },
    ]);
    const result = resolveEventLanguageLabels(section, "en", fallbackLabel);
    expect(result).toEqual({ English: "Engelsk", Danish: "Dansk", Ukrainian: "Українська (custom)" });
  });
});
