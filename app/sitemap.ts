import type { MetadataRoute } from "next";
import { events, pages, siteUrl } from "@/lib/data";
import { locales, localeTags, localizedHref, isLocale, type Locale } from "@/lib/i18n";
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/live";
import { allEventsForSitemapQuery } from "@/sanity/queries/events";

// Metadata-route files (sitemap.ts included) are statically generated at
// build time like any other page, with no revalidation by default — without
// this, the sitemap would only ever reflect events published/deleted at the
// last build. Matches the events listing page's own `revalidate = 60`
// (same rationale: no revalidation webhook is configured for this project,
// see that file's comment — this is Next's built-in time-based ISR, not a
// webhook or Netlify hook).
export const revalidate = 60;

function languageAlternates(path: string, forLocales: readonly Locale[] = locales) {
  return Object.fromEntries(forLocales.map((l) => [localeTags[l], `${siteUrl}${localizedHref(path, l)}`]));
}

/**
 * Published Sanity `event` documents are the authoritative source for
 * event sitemap entries — `sanityFetch` reads the same published-only
 * perspective the rest of the public site uses, so drafts are already
 * excluded without extra filtering. Each event expands into a URL only for
 * the locales listed in its own `visibleLocales` ("Show on website
 * languages"): a deselected or unmigrated (no `visibleLocales` at all)
 * locale never gets a sitemap entry. Falls back to the hardcoded static
 * `events` array (all 3 locales, unchanged) only when Sanity itself isn't
 * configured — the same fallback tier every other Events code path uses.
 */
async function getEventSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  if (!isSanityConfigured) {
    return events.flatMap((event) => {
      const path = `/events/${event.slug}`;
      return locales.map((locale) => ({
        url: `${siteUrl}${localizedHref(path, locale)}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: { languages: languageAlternates(path) },
      }));
    });
  }

  const { data } = await sanityFetch({ query: allEventsForSitemapQuery });
  return (data ?? []).flatMap((event) => {
    if (!event.slug) return [];
    const path = `/events/${event.slug}`;
    const eventLocales = (event.visibleLocales ?? []).map(String).filter(isLocale);
    if (!eventLocales.length) return []; // unpublished-for-every-locale / not yet migrated — no sitemap entry
    return eventLocales.map((locale) => ({
      url: `${siteUrl}${localizedHref(path, locale)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: languageAlternates(path, eventLocales) },
    }));
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = pages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${siteUrl}${localizedHref(page.href, locale)}`,
      lastModified: new Date(),
      changeFrequency: (page.href === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: page.href === "/" ? 1 : 0.7,
      alternates: { languages: languageAlternates(page.href) },
    })),
  );

  const eventPages = await getEventSitemapEntries();

  return [...staticPages, ...eventPages];
}
