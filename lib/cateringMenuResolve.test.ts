// Unit tests for the exact data-state distinction the Catering integration
// report's "stale hardcoded resurrection" fix depends on: a MISSING
// document falls back to hardcoded content, but a document that EXISTS
// with zero (or fewer) categories is respected as genuinely empty/smaller
// — it must never resurrect `lib/cateringMenu.ts`'s hardcoded categories.
// Pure-function test, no live Sanity fetch, no component rendering — the
// exact 5 states the task requires: 6 categories, 1 category, 0
// categories, document missing, and (documented, not exercised here since
// it's handled entirely by an earlier `!isSanityConfigured` early return
// that never calls this function) Sanity unavailable.
import { describe, expect, it } from "vitest";
import { resolveCateringMenuCategories } from "./cateringMenuResolve";
import type { CateringMenuCategory } from "./cateringMenu";
import type { RawPage, RawPageSection } from "./sanity-sections";

const FALLBACK: CateringMenuCategory[] = [
  { id: "ukrainian", title: "Ukrainian (fallback)", navLabel: "UA", description: "fb desc", featuredItems: [{ name: "Fallback dish", description: "fb", image: "/fb.png", alt: "fb" }] },
  { id: "danish", title: "Danish (fallback)", navLabel: "DK", description: "fb desc", featuredItems: [] },
];

function categorySection(sectionKey: string, titleEn: string, dishCount = 1): RawPageSection {
  return {
    _key: sectionKey,
    sectionKey,
    sectionKind: "menuCategory",
    title: [{ _key: "en", language: "en", value: titleEn }],
    label: [{ _key: "en", language: "en", value: titleEn.slice(0, 3) }],
    items: Array.from({ length: dishCount }, (_, i) => ({
      _key: `dish${i}`,
      itemKey: `dish${i}`,
      title: [{ _key: "en", language: "en", value: `${titleEn} dish ${i}` }],
      text: [{ _key: "en", language: "en", value: "desc" }],
    })),
  };
}

function pageWithCategories(sections: RawPageSection[]): RawPage {
  return { _id: "page-catering-menu-examples", pageKey: "cateringMenuExamples", sections };
}

describe("resolveCateringMenuCategories — document missing -> emergency fallback", () => {
  it("newMenuPage undefined returns the hardcoded fallback categories, unmodified", () => {
    const result = resolveCateringMenuCategories(undefined, "en", FALLBACK);
    expect(result).toEqual(FALLBACK);
  });

  it("newMenuPage null (same as undefined for this function) also returns the fallback", () => {
    const result = resolveCateringMenuCategories(null, "en", FALLBACK);
    expect(result).toEqual(FALLBACK);
  });
});

describe("resolveCateringMenuCategories — document exists: category count is respected exactly, never padded/replaced by fallback", () => {
  it("6 categories: all 6 returned, in order, none from the fallback", () => {
    const sections = Array.from({ length: 6 }, (_, i) => categorySection(`cat${i}`, `Category ${i}`));
    const result = resolveCateringMenuCategories(pageWithCategories(sections), "en", FALLBACK);
    expect(result).toHaveLength(6);
    expect(result.map((c) => c.id)).toEqual(["cat0", "cat1", "cat2", "cat3", "cat4", "cat5"]);
    expect(result.some((c) => c.title.includes("fallback"))).toBe(false);
  });

  it("1 category: exactly 1 returned, not padded with fallback categories to fill out the list", () => {
    const result = resolveCateringMenuCategories(pageWithCategories([categorySection("solo", "Solo Category")]), "en", FALLBACK);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("solo");
    expect(result[0]!.title).toBe("Solo Category");
  });

  it("0 categories (intentionally emptied by the manager): returns [] — the hardcoded menu (lib/cateringMenu.ts) NEVER reappears", () => {
    const result = resolveCateringMenuCategories(pageWithCategories([]), "en", FALLBACK);
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
    // Explicit proof, not just an empty-array check: no fallback identity/title leaked through.
    expect(result.some((c) => c.id === "ukrainian" || c.id === "danish")).toBe(false);
  });

  it("0 categories: also true when the document has OTHER sections (banner/closing) but zero menuCategory-kind ones", () => {
    const sections: RawPageSection[] = [
      { _key: "banner", sectionKey: "banner", sectionKind: "hero", title: [{ _key: "en", language: "en", value: "Banner" }] },
      { _key: "closing", sectionKey: "closing", sectionKind: "cta", title: [{ _key: "en", language: "en", value: "Closing" }] },
    ];
    const result = resolveCateringMenuCategories(pageWithCategories(sections), "en", FALLBACK);
    expect(result).toEqual([]);
  });
});

describe("resolveCateringMenuCategories — deleting one category only removes that one", () => {
  it("removing 1 of 3 categories leaves exactly the other 2, never falling back", () => {
    const three = [categorySection("a", "A"), categorySection("b", "B"), categorySection("c", "C")];
    const withThree = resolveCateringMenuCategories(pageWithCategories(three), "en", FALLBACK);
    expect(withThree).toHaveLength(3);

    const twoRemaining = [categorySection("a", "A"), categorySection("c", "C")]; // "b" deleted
    const withTwo = resolveCateringMenuCategories(pageWithCategories(twoRemaining), "en", FALLBACK);
    expect(withTwo.map((c) => c.id)).toEqual(["a", "c"]);
    expect(withTwo).toHaveLength(2);
  });
});

describe("resolveCateringMenuCategories — dish content resolves from the category, not the fallback, when categories exist", () => {
  it("dish name/description come from the real section data", () => {
    const result = resolveCateringMenuCategories(pageWithCategories([categorySection("x", "X", 2)]), "en", FALLBACK);
    expect(result[0]!.featuredItems).toHaveLength(2);
    expect(result[0]!.featuredItems[0]!.name).toBe("X dish 0");
    expect(result[0]!.featuredItems[1]!.name).toBe("X dish 1");
  });

  it("locale-specific: falls back to English within a category's own content when a translation is missing (not the global fallback categories)", () => {
    const section = categorySection("y", "Y", 1);
    const result = resolveCateringMenuCategories(pageWithCategories([section]), "da", FALLBACK);
    // No `da` title was set on this fixture -> pickLocalized falls through
    // to English (the localization system's own behavior), never to
    // FALLBACK's "Danish (fallback)"/"Ukrainian (fallback)" categories.
    expect(result[0]!.title).toBe("Y");
  });
});
