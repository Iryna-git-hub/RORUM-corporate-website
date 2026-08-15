import type { Rule } from "sanity";

// Reusable validators for the `{_key, language, value}[]` shape every
// internationalized field uses. Two variants because not every field needs
// the same rule: some visible content must always have all 3 languages,
// while some optional fields are fine empty but, if used at all, must be
// fully trilingual (no half-translated content shipping silently).
const REQUIRED_LANGUAGES = ["en", "da", "uk"];

interface I18nEntry {
  _key?: string;
  language?: string;
  value?: unknown;
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function analyze(entries: I18nEntry[] | undefined | null) {
  const list = entries ?? [];
  const seen = new Map<string, number>();
  const emptyLanguages: string[] = [];
  for (const entry of list) {
    if (!entry?.language) continue;
    seen.set(entry.language, (seen.get(entry.language) ?? 0) + 1);
    if (isEmptyValue(entry.value)) emptyLanguages.push(entry.language);
  }
  const missing = REQUIRED_LANGUAGES.filter((lang) => !seen.has(lang));
  const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([lang]) => lang);
  return { missing, emptyLanguages, duplicates };
}

/** All three languages must be present and non-empty. Use on required visible content. */
export function requireAllLanguages() {
  return (rule: Rule) =>
    rule.custom((value: I18nEntry[] | undefined) => {
      const { missing, emptyLanguages, duplicates } = analyze(value);
      if (duplicates.length) return `Duplicate language entries: ${duplicates.join(", ")}.`;
      if (missing.length) return `Missing translation for: ${missing.join(", ")}.`;
      if (emptyLanguages.length) return `Empty value for: ${emptyLanguages.join(", ")}.`;
      return true;
    });
}

/** Either the whole field is empty, or all three languages are present and non-empty. Use on optional content. */
export function allOrNothingLanguages() {
  return (rule: Rule) =>
    rule.custom((value: I18nEntry[] | undefined) => {
      const list = value ?? [];
      if (list.length === 0) return true;
      const { missing, emptyLanguages, duplicates } = analyze(list);
      if (duplicates.length) return `Duplicate language entries: ${duplicates.join(", ")}.`;
      if (missing.length) return `If any language is filled in, all three are required — missing: ${missing.join(", ")}.`;
      if (emptyLanguages.length) return `Empty value for: ${emptyLanguages.join(", ")}.`;
      return true;
    });
}
