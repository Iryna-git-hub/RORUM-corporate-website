import type { MetadataRoute } from "next";
import { events, pages } from "@/lib/data";
import { locales, localeTags, localizedHref, isLocale, type Locale } from "@/lib/i18n";
import { getSeoSiteDefaults } from "@/lib/siteSettings";
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetchStatic } from "@/sanity/lib/live";
import { allEventsForSitemapQuery } from "@/sanity/queries/events";
import { pagesUpdatedAtQuery } from "@/sanity/queries/page";

// `pages`' own `href` (lib/data.ts) -> the `pageKey`/legalPage `pageKey`
// pagesUpdatedAtQuery reports — same map sanity/components/SeoObjectInput.tsx
// uses in the other direction (route -> pageKey) for its preview URL, kept
// separate/duplicated on purpose since that file must not import from this
// Next-specific route file (Studio is a separately bundled app).
const ROUTE_TO_PAGE_KEY: Record<string, string> = {
  "/": "home",
  "/events": "events",
  "/host-at-rorum": "hostAtRorum",
  "/catering": "catering",
  "/event-decoration": "eventDecoration",
  "/community-membership": "communityMembership",
  "/volunteer": "volunteer",
  "/work-with-us": "workWithUs",
  "/about": "about",
  "/contact": "contact",
  "/faq": "faq",
  "/terms": "terms",
  "/privacy-policy": "privacy-policy",
  "/cookie-policy": "cookie-policy",
};

// Metadata-route files (sitemap.ts included) are statically generated at
// build time like any other page, with no revalidation by default — without
// this, the sitemap would only ever reflect events published/deleted at the
// last build. Matches the events listing page's own `revalidate = 60`
// (same rationale: no revalidation webhook is configured for this project,
// see that file's comment — this is Next's built-in time-based ISR, not a
// webhook or Netlify hook).
export const revalidate = 60;

function languageAlternates(siteUrl: string, path: string, forLocales: readonly Locale[] = locales) {
  const defaultLocale = forLocales.includes("en") ? "en" : (locales.find((l) => forLocales.includes(l)) ?? forLocales[0]);
  return {
    ...Object.fromEntries(forLocales.map((l) => [localeTags[l], `${siteUrl}${localizedHref(path, l)}`])),
    ...(defaultLocale ? { "x-default": `${siteUrl}${localizedHref(path, defaultLocale)}` } : {}),
  };
}

// Build-time-safe: only used when Sanity is unavailable (see
// getEventSitemapEntries/sitemap below) — `new Date()` there is
// intentional, not the "recomputed every request" problem this file's own
// history flagged, since the whole branch only runs when there is no real
// `_updatedAt` to report at all.
const BUILD_FALLBACK_DATE = new Date();

/**
 * Published Sanity `event` documents are the authoritative source for
 * event sitemap entries — `sanityFetchStatic` pins the read to the published
 * perspective (a sitemap runs at build time / on ISR revalidate, with no
 * request scope, and must never list draft URLs). Each event expands into a URL only for
 * the locales listed in its own `visibleLocales` ("Show on website
 * languages"): a deselected or unmigrated (no `visibleLocales` at all)
 * locale never gets a sitemap entry. Falls back to the hardcoded static
 * `events` array (all 3 locales, unchanged) only when Sanity itself isn't
 * configured — the same fallback tier every other Events code path uses.
 * `lastModified` uses each event's own `_updatedAt` — not `new Date()`
 * recomputed on every sitemap regeneration, which would make every event
 * look freshly changed on every crawl regardless of whether it actually was.
 */
async function getEventSitemapEntries(siteUrl: string): Promise<MetadataRoute.Sitemap> {
  if (!isSanityConfigured) {
    return events.flatMap((event) => {
      const path = `/events/${event.slug}`;
      return locales.map((locale) => ({
        url: `${siteUrl}${localizedHref(path, locale)}`,
        lastModified: BUILD_FALLBACK_DATE,
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: { languages: languageAlternates(siteUrl, path) },
      }));
    });
  }

  const { data } = await sanityFetchStatic({ query: allEventsForSitemapQuery });
  return (data ?? []).flatMap((event) => {
    if (!event.slug) return [];
    const path = `/events/${event.slug}`;
    const eventLocales = (event.visibleLocales ?? []).map(String).filter(isLocale);
    if (!eventLocales.length) return []; // unpublished-for-every-locale / not yet migrated — no sitemap entry
    const lastModified = event._updatedAt ? new Date(event._updatedAt) : BUILD_FALLBACK_DATE;
    return eventLocales.map((locale) => ({
      url: `${siteUrl}${localizedHref(path, locale)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: languageAlternates(siteUrl, path, eventLocales) },
    }));
  });
}

/**
 * `lastModified` for the 14 static routes uses each backing `page`/
 * `legalPage` document's own `_updatedAt` (via `pagesUpdatedAtQuery`) — a
 * route with no matching document yet (Sanity unavailable, or the document
 * hasn't been created) falls back to the same build-time-safe static date
 * every other "Sanity unavailable" tier in this project uses, never
 * `new Date()` recomputed on every regeneration.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ siteUrl }, updatedAtByPageKey] = await Promise.all([
    getSeoSiteDefaults(),
    isSanityConfigured
      ? sanityFetchStatic({ query: pagesUpdatedAtQuery }).then(({ data }) => {
          const map = new Map<string, string>();
          for (const doc of data ?? []) {
            if (doc.pageKey && doc._updatedAt) map.set(doc.pageKey, doc._updatedAt);
          }
          return map;
        })
      : Promise.resolve(new Map<string, string>()),
  ]);

  const staticPages: MetadataRoute.Sitemap = pages.flatMap((page) => {
    const pageKey = ROUTE_TO_PAGE_KEY[page.href];
    const updatedAt = pageKey ? updatedAtByPageKey.get(pageKey) : undefined;
    const lastModified = updatedAt ? new Date(updatedAt) : BUILD_FALLBACK_DATE;
    return locales.map((locale) => ({
      url: `${siteUrl}${localizedHref(page.href, locale)}`,
      lastModified,
      changeFrequency: (page.href === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: page.href === "/" ? 1 : 0.7,
      alternates: { languages: languageAlternates(siteUrl, page.href) },
    }));
  });

  const eventPages = await getEventSitemapEntries(siteUrl);

  return [...staticPages, ...eventPages];
}
