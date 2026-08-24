import type { Metadata } from "next";
import { locales, localeTags, localizedHref, type Locale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/sanity-i18n";
import { getSeoSiteDefaults } from "@/lib/siteSettings";
import { resolveSeoField, EMERGENCY_SEO_DESCRIPTION, EMERGENCY_SEO_TITLE } from "@/shared/seoResolution";

const ogLocaleTags: Record<Locale, string> = { en: "en_US", da: "da_DK", uk: "uk_UA" };

const STATIC_FALLBACK_IMAGE = "/images/hero.jpg";

/** Strips a trailing " | RORUM" (or any " | <suffix>") brand separator — used only to derive a concise image-alt fallback from an already-suffixed title, never to build the title itself. */
function deriveConciseAlt(title: string): string {
  return title.split(" | ")[0]?.trim() || title;
}

/**
 * One shared resolver for every public route's `generateMetadata()`.
 * Builds `<title>`, description, canonical, hreflang/x-default, Open Graph
 * and Twitter Card metadata from values the CALLER has already resolved
 * through its own precedence chain (`seo.title ?? page's own approved
 * fallback`, same pattern every route already used before this) — this
 * function's own job is layering the deepest safety-net tier
 * (`siteSettings.defaultSeo`, then a bare static string) UNDERNEATH
 * whatever the caller supplied, and building the full Metadata object
 * consistently everywhere so no route accumulates its own drift.
 *
 * `title`/`description` are never re-suffixed or altered here — a value the
 * caller passes in (whether it came from a manager's `seo.title` override or
 * from the page's own hardcoded fallback constant) is treated as the
 * complete, final string. Only `siteSettings.defaultSeo`'s own stored value
 * (also manager-authored) or the single hardcoded emergency string below can
 * ever appear un-suffixed — this function itself never appends "| RORUM".
 */
export async function localizedPageMetadata({
  path,
  locale,
  title,
  description,
  image,
  imageAlt,
  alternateLocales = locales,
}: {
  path: string;
  locale: Locale;
  /** Already resolved by the caller: non-empty `seo.title` override, else the page's own approved fallback (which may already include "| RORUM"). */
  title: string;
  /** Already resolved by the caller, same shape as `title`. */
  description: string;
  /** Already resolved by the caller: `seo.ogImage` URL, else a meaningful page/event image URL, else absent — either a relative local path or an already-absolute Sanity CDN URL. */
  image?: string;
  /** Already resolved by the caller: localized `seo.ogImage.alt`, else the reused image's own localized alt, else absent. */
  imageAlt?: string;
  /**
   * Which locales this exact page/URL actually exists in — defaults to
   * every site locale (unchanged behavior for every page except Event
   * Detail). An Event Detail page passes its own event's `visibleLocales`
   * here so `alternates.languages`/`x-default` never advertises an
   * hreflang URL for a locale that 404s for this specific event.
   */
  alternateLocales?: readonly Locale[];
}): Promise<Metadata> {
  const siteDefaults = await getSeoSiteDefaults();
  const siteUrl = siteDefaults.siteUrl;

  // The one shared precedence rule (shared/seoResolution.ts's
  // resolveSeoField) — `title`/`description` here are already the caller's
  // own resolved documentOverride/documentContent/pageDefault tier (see this
  // function's own doc comment); only the deepest two tiers, siteDefault and
  // emergencyDefault, are added here.
  const resolvedTitle = resolveSeoField([
    { source: "pageDefault", value: title },
    { source: "siteDefault", value: pickLocalized(siteDefaults.title, locale) },
    { source: "emergencyDefault", value: EMERGENCY_SEO_TITLE },
  ]).value;
  const resolvedDescription = resolveSeoField([
    { source: "pageDefault", value: description },
    { source: "siteDefault", value: pickLocalized(siteDefaults.description, locale) },
    { source: "emergencyDefault", value: EMERGENCY_SEO_DESCRIPTION },
  ]).value;
  const resolvedImageInput = image || siteDefaults.image || STATIC_FALLBACK_IMAGE;
  // `image` is either a relative local path ("/images/hero.jpg") or an
  // already-absolute Sanity CDN URL (urlForImage(...).url()) — concatenating
  // siteUrl onto an absolute URL unconditionally would silently produce a
  // broken, doubled-up string, so only relative paths get siteUrl prefixed.
  const imageUrl = /^https?:\/\//.test(resolvedImageInput) ? resolvedImageInput : `${siteUrl}${resolvedImageInput}`;
  const resolvedAlt = imageAlt?.trim() || pickLocalized(siteDefaults.imageAlt, locale) || deriveConciseAlt(resolvedTitle);

  // `x-default` should point at an alternate that actually exists — prefer
  // English when it's one of the available locales, otherwise the first
  // available one (stable: `locales`' own declared order).
  const defaultLocale = alternateLocales.includes("en")
    ? "en"
    : (locales.find((l) => alternateLocales.includes(l)) ?? locale);
  const otherAlternateLocales = alternateLocales.filter((l) => l !== locale).map((l) => ogLocaleTags[l]);

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: `${siteUrl}${localizedHref(path, locale)}`,
      languages: {
        ...Object.fromEntries(alternateLocales.map((l) => [localeTags[l], `${siteUrl}${localizedHref(path, l)}`])),
        "x-default": `${siteUrl}${localizedHref(path, defaultLocale)}`,
      },
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: `${siteUrl}${localizedHref(path, locale)}`,
      siteName: "RORUM",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: resolvedAlt }],
      locale: ogLocaleTags[locale],
      ...(otherAlternateLocales.length ? { alternateLocale: otherAlternateLocales } : {}),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [{ url: imageUrl, alt: resolvedAlt }],
    },
  };
}
