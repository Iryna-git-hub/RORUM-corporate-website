import { describe, expect, it } from "vitest";
import {
  buildNewLocaleEntries,
  hasMeaningfulPortableText,
  mergeFormattedDescription,
  planEventMigration,
  planLocaleMigration,
  splitIntoParagraphs,
  textToBlocks,
  type LocaleBodyEntry,
  type LocaleTextEntry,
} from "./eventFormattedDescriptionMigration";

const old = (language: string, value: string): LocaleTextEntry => ({ language, value });
const formatted = (language: string, text: string): LocaleBodyEntry => ({
  language,
  value: textToBlocks(text),
});

describe("event formatted-description migration", () => {
  it.each(["en", "da", "uk"] as const)("migrates %s only into the same locale", (locale) => {
    const plan = planLocaleMigration(locale, [old(locale, `${locale} source`)], []);
    expect(plan.status).toBe("needs-migration");
    if (plan.status === "needs-migration") expect(plan.blocks[0]?.children[0]?.text).toBe(`${locale} source`);
  });

  it("turns one paragraph into one valid normal Portable Text block", () => {
    expect(textToBlocks("  One paragraph.  ")).toEqual([
      {
        _key: "paragraph-1",
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [{ _key: "paragraph-1-span-1", _type: "span", text: "One paragraph.", marks: [] }],
      },
    ]);
  });

  it("preserves blank-line-separated paragraphs and intentional line breaks", () => {
    expect(splitIntoParagraphs("First\nline two\n\n  Second\r\n\r\nThird ")).toEqual([
      "First\nline two",
      "Second",
      "Third",
    ]);
    expect(textToBlocks("First\n\nSecond")).toHaveLength(2);
  });

  it("never overwrites an existing non-empty formatted locale", () => {
    expect(planLocaleMigration("en", [old("en", "Legacy")], [formatted("en", "Editor rich text")])).toEqual({
      locale: "en",
      status: "already-has-formatted",
    });
  });

  it("does not treat empty or malformed Portable Text blocks as meaningful", () => {
    expect(hasMeaningfulPortableText([{ _type: "block", children: [] }])).toBe(false);
    expect(hasMeaningfulPortableText([{ _type: "block", children: [{ _type: "span", text: "  " }] }])).toBe(false);
    expect(planLocaleMigration("en", [old("en", "Legacy")], [{ language: "en", value: [{ _type: "block", children: [] }] }])).toMatchObject({
      locale: "en",
      status: "needs-migration",
    });
  });

  it("creates nothing for whitespace-only source", () => {
    expect(planLocaleMigration("en", [old("en", " \n\n \t")], [])).toEqual({
      locale: "en",
      status: "no-source-content",
    });
  });

  it("migrates only missing locales on a partially formatted event", () => {
    const plan = planEventMigration(
      ["en", "da", "uk"],
      [old("en", "English"), old("da", "Dansk"), old("uk", "Ukrainian")],
      [formatted("da", "Existing Danish")],
    );
    expect(plan.needsMigration.map((entry) => entry.locale)).toEqual(["en", "uk"]);
    expect(plan.alreadyHasFormatted).toEqual(["da"]);
  });

  it("is idempotent after applying the planned locale entries", () => {
    const source = [old("en", "English"), old("da", "Dansk")];
    const first = planEventMigration(["en", "da"], source, []);
    const second = planEventMigration(["en", "da"], source, buildNewLocaleEntries(first.needsMigration));
    expect(second.needsMigration).toEqual([]);
  });

  it("preserves source in a hidden locale", () => {
    const plan = planEventMigration(["en"], [old("en", "English"), old("uk", "Dormant Ukrainian")], []);
    expect(plan.needsMigration.map((entry) => entry.locale)).toEqual(["en", "uk"]);
  });

  it("does not contaminate locales", () => {
    const plan = planEventMigration(["en", "da", "uk"], [old("da", "Kun dansk")], []);
    expect(plan.needsMigration).toHaveLength(1);
    expect(plan.needsMigration[0]?.locale).toBe("da");
    expect(plan.noSourceContent).toEqual(["en", "uk"]);
  });

  it("handles empty arrays safely", () => {
    expect(planEventMigration([], [], [])).toEqual({
      needsMigration: [],
      alreadyHasFormatted: [],
      noSourceContent: ["en", "da", "uk"],
    });
  });

  it("replaces empty target rows while preserving non-target and unknown rows exactly", () => {
    const existing = [
      { _key: "en-old", language: "en", value: [] },
      { _key: "da", language: "da", value: textToBlocks("Existing Danish") },
      { _key: "mystery", language: "fr", value: [{ untouched: true }] },
    ];
    const plan = planEventMigration(["en"], [old("en", "English")], existing);
    const merged = mergeFormattedDescription(existing, plan.needsMigration);
    expect(merged.filter((entry) => entry.language === "en")).toHaveLength(1);
    expect(merged.find((entry) => entry.language === "da")).toBe(existing[1]);
    expect(merged.find((entry) => entry.language === "fr")).toBe(existing[2]);
  });
});
