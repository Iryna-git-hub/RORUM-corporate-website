import { describe, expect, it } from "vitest";
import { eventMatchesLanguage, flattenAvailableEventLanguages, getEventLanguageCodes, getEventLanguagesLabel, normalizeEventLanguages } from "./eventLanguage";

describe("event language arrays", () => {
  it("de-dupes and drops unrecognized values, leaving valid arrays untouched", () => {
    expect(normalizeEventLanguages(["English", "Ukrainian", "English", "French"])).toEqual(["English", "Ukrainian"]);
    expect(normalizeEventLanguages(["Danish"])).toEqual(["Danish"]);
  });

  it("treats missing/empty input as no languages, never throws", () => {
    expect(normalizeEventLanguages(undefined)).toEqual([]);
    expect(normalizeEventLanguages(null)).toEqual([]);
    expect(normalizeEventLanguages([])).toEqual([]);
  });

  it("renders one, two, or all three localized labels", () => {
    expect(getEventLanguagesLabel(["English"], "en")).toBe("English");
    expect(getEventLanguagesLabel(["English", "Ukrainian"], "da")).toBe("Engelsk, Ukrainsk");
    expect(getEventLanguagesLabel(["English", "Danish", "Ukrainian"], "en")).toBe("English, Danish, Ukrainian");
    expect(getEventLanguagesLabel(["English", "Danish", "Ukrainian"], "uk")).toBe("Англійська, Данська, Українська");
  });

  it("matches every language membership of a multilingual event", () => {
    const values = ["English", "Ukrainian"];
    expect(eventMatchesLanguage(values, "English")).toBe(true);
    expect(eventMatchesLanguage(values, "Ukrainian")).toBe(true);
    expect(eventMatchesLanguage(values, "Danish")).toBe(false);
    expect(eventMatchesLanguage(values, "all")).toBe(true);
  });

  it("flattens all event languages into listing options in first-seen order", () => {
    expect(flattenAvailableEventLanguages([
      { language: ["English", "Ukrainian"] },
      { language: ["Danish", "English"] },
    ])).toEqual(["English", "Ukrainian", "Danish"]);
  });
});

describe("getEventLanguageCodes — BCP-47 codes for JSON-LD inLanguage", () => {
  it("maps each of the 3 known languages to its own BCP-47 code", () => {
    expect(getEventLanguageCodes(["English"])).toEqual(["en"]);
    expect(getEventLanguageCodes(["Danish"])).toEqual(["da"]);
    expect(getEventLanguageCodes(["Ukrainian"])).toEqual(["uk"]);
  });

  it("maps multiple languages in the same order, no dedupe/re-sort of its own", () => {
    expect(getEventLanguageCodes(["Ukrainian", "English"])).toEqual(["uk", "en"]);
  });

  it("an empty array produces an empty array, never a fabricated default", () => {
    expect(getEventLanguageCodes([])).toEqual([]);
  });

  it("drops an unrecognized/legacy value instead of guessing a code for it", () => {
    expect(getEventLanguageCodes(["English", "Klingon"])).toEqual(["en"]);
  });
});
