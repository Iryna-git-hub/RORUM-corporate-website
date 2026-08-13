import { defaultLocale, type Locale } from "@/lib/i18n";

// Loosely typed on purpose: sanity.types.ts's TypeGen output makes every
// field of an internationalizedArray*Value optional (it can't know our
// import scripts always populate `language`/`value`), so this accepts that
// looser shape rather than fighting it with casts at every call site.
export interface I18nEntry<T> {
  _key: string;
  _type?: string;
  language?: string;
  value?: T;
}

/**
 * Resolves one language's value from a Sanity internationalized-array
 * field. Falls back to English when the requested locale's translation
 * doesn't exist for this field yet — the schema only requires `en` at
 * publish time, so da/uk can be filled in gradually without breaking pages
 * that render before a specific string is translated.
 */
export function pickLocalized<T>(
  entries: I18nEntry<T>[] | undefined | null,
  locale: Locale,
): T | undefined {
  if (!entries?.length) return undefined;
  return (
    entries.find((e) => e.language === locale)?.value ?? entries.find((e) => e.language === defaultLocale)?.value
  );
}

export function pickLocalizedOr<T>(entries: I18nEntry<T>[] | undefined | null, locale: Locale, fallback: T): T {
  return pickLocalized(entries, locale) ?? fallback;
}

/**
 * Drops null/undefined entries. Prefer this over
 * `.filter((v): v is string => Boolean(v))` after mapping a list of
 * `pickLocalized()` results — TypeGen's `StegaString` branded type isn't
 * assignable to a plain `string` type predicate, but `NonNullable<T>` is
 * always a valid narrowing of `T`, so this sidesteps that without a cast.
 */
export function compact<T>(arr: (T | undefined | null)[]): NonNullable<T>[] {
  return arr.filter((v): v is NonNullable<T> => v !== undefined && v !== null);
}
