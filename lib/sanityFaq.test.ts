import { describe, expect, it } from "vitest";
import { resolveCanonicalFaqGroups } from "./sanityFaq";

function i18n(en: string, da?: string, uk?: string) {
  const entries = [{ _key: "en", language: "en", value: en }];
  if (da !== undefined) entries.push({ _key: "da", language: "da", value: da });
  if (uk !== undefined) entries.push({ _key: "uk", language: "uk", value: uk });
  return entries;
}

describe("resolveCanonicalFaqGroups — missing vs. intentionally-empty canonical page (Task 8)", () => {
  it("canonical page-faq sections is undefined (Sanity unavailable / page not migrated yet): falls back to legacy faqPage.groups", () => {
    const legacy = [{ title: i18n("Events"), items: [{ question: i18n("Q1"), answer: i18n("A1") }] }];
    const result = resolveCanonicalFaqGroups(undefined, legacy, "en");
    expect(result).toEqual([{ title: "Events", items: [{ question: "Q1", answer: "A1", link: undefined }] }]);
  });

  it("canonical page-faq sections is undefined and legacy is also empty/missing: undefined (never an empty array masquerading as intentional)", () => {
    expect(resolveCanonicalFaqGroups(undefined, undefined, "en")).toBeUndefined();
    expect(resolveCanonicalFaqGroups(undefined, [], "en")).toBeUndefined();
  });

  it("canonical page-faq sections exists but has zero \"group-\" sections: empty array, NEVER falls back to legacy content", () => {
    const legacy = [{ title: i18n("Legacy group"), items: [{ question: i18n("Old Q"), answer: i18n("Old A") }] }];
    const result = resolveCanonicalFaqGroups([{ _key: "hero", sectionKey: "hero" }], legacy, "en");
    expect(result).toEqual([]);
  });

  it("canonical page-faq sections exists with real \"group-\" sections: those, in order, never legacy", () => {
    const canonical = [
      { _key: "hero", sectionKey: "hero" },
      { _key: "g1", sectionKey: "group-a", title: i18n("Events"), items: [{ _key: "q0", title: i18n("Q1"), text: i18n("A1") }] },
      { _key: "g2", sectionKey: "group-b", title: i18n("Services"), items: [] },
    ];
    const result = resolveCanonicalFaqGroups(canonical, [{ title: i18n("Ignored legacy group"), items: [] }], "en");
    expect(result).toEqual([
      { title: "Events", items: [{ question: "Q1", answer: "A1", link: undefined }] },
      { title: "Services", items: [] },
    ]);
  });
});

describe("resolveCanonicalFaqGroups — locale fallback", () => {
  const canonical = [
    { _key: "g1", sectionKey: "group-a", title: i18n("Events", "Events (da)"), items: [{ _key: "q0", title: i18n("Q1 en", "Q1 da"), text: i18n("A1 en") }] },
  ];

  it("uses the exact locale's value when present", () => {
    const result = resolveCanonicalFaqGroups(canonical, undefined, "da");
    expect(result?.[0]!.title).toBe("Events (da)");
    expect(result?.[0]!.items[0]!.question).toBe("Q1 da");
  });

  it("falls back to English when the exact locale's value is missing", () => {
    const result = resolveCanonicalFaqGroups(canonical, undefined, "uk");
    expect(result?.[0]!.items[0]!.answer).toBe("A1 en");
  });
});

describe("resolveCanonicalFaqGroups — optional question link (Task 7)", () => {
  const baseItem = { _key: "q0", title: i18n("Q1"), text: i18n("A1") };
  const section = (item: Record<string, unknown>) => [{ _key: "g1", sectionKey: "group-a", title: i18n("Events"), items: [{ ...baseItem, ...item }] }];

  it("both href and localized label present: link is wired", () => {
    const result = resolveCanonicalFaqGroups(section({ href: "/events", label: i18n("See events") }), undefined, "en");
    expect(result?.[0]!.items[0]!.link).toEqual({ href: "/events", label: "See events" });
  });

  it("neither href nor label present: link is undefined, question/answer still render", () => {
    const result = resolveCanonicalFaqGroups(section({}), undefined, "en");
    expect(result?.[0]!.items[0]!.link).toBeUndefined();
    expect(result?.[0]!.items[0]!.question).toBe("Q1");
  });

  it("href present but label missing for this locale: link is undefined (never a raw href rendered as text)", () => {
    const result = resolveCanonicalFaqGroups(section({ href: "/events", label: [] }), undefined, "en");
    expect(result?.[0]!.items[0]!.link).toBeUndefined();
  });

  it("label present but href is whitespace-only: link is undefined", () => {
    const result = resolveCanonicalFaqGroups(section({ href: "   ", label: i18n("See events") }), undefined, "en");
    expect(result?.[0]!.items[0]!.link).toBeUndefined();
  });

  it("one question's missing link never affects a sibling question's own link", () => {
    const items = [
      { _key: "q0", title: i18n("Q1"), text: i18n("A1"), href: "/events", label: i18n("See events") },
      { _key: "q1", title: i18n("Q2"), text: i18n("A2") },
    ];
    const result = resolveCanonicalFaqGroups([{ _key: "g1", sectionKey: "group-a", title: i18n("Events"), items }], undefined, "en");
    expect(result?.[0]!.items[0]!.link).toEqual({ href: "/events", label: "See events" });
    expect(result?.[0]!.items[1]!.link).toBeUndefined();
  });
});
