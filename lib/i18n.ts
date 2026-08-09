// Locale constants and path helpers. English is unprefixed (preserves every
// existing URL and its accumulated SEO value); Danish and Ukrainian are
// prefixed (`/da/...`, `/uk/...`).
//
// NOT YET ACTIVATED: the App Router's `app/` tree has not been restructured
// into `app/[locale]/...` in this task — see MIGRATION_REPORT.md's
// localization-routing section for exactly why (it's a high-risk structural
// change touching every one of the 15 routes this project's Tailwind
// migration just finished validating pixel-for-pixel, and doing it safely
// requires the same per-route visual-regression rigor that migration used —
// not something to rush in the time remaining alongside everything else this
// task covers) and the precise, reviewed plan for doing it next. These
// helpers are written against that plan now so activating it is a routing
// change, not a redesign of how locale-awareness works.

export const locales = ["en", "da", "uk"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Builds the locale-prefixed href for an internal path. English gets no
 * prefix (`/events` stays `/events`); other locales get one (`/da/events`).
 */
export function localizedHref(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return normalized;
  return `/${locale}${normalized}`;
}

/**
 * Strips a known locale prefix off a pathname, returning the locale-neutral
 * path plus which locale (if any) was present — used by the language
 * switcher to re-target the *same* page in another language rather than
 * bouncing to that language's home page.
 */
export function splitLocaleFromPath(pathname: string): { locale: Locale; path: string } {
  const [, maybeLocale, ...rest] = pathname.split("/");
  if (maybeLocale && isLocale(maybeLocale)) {
    return { locale: maybeLocale, path: `/${rest.join("/")}` || "/" };
  }
  return { locale: defaultLocale, path: pathname || "/" };
}

export const localeLabels: Record<Locale, string> = {
  en: "English",
  da: "Dansk",
  uk: "Українська",
};

/** BCP 47 tag for `<html lang>` / `hreflang`. */
export const localeTags: Record<Locale, string> = {
  en: "en",
  da: "da",
  uk: "uk",
};
