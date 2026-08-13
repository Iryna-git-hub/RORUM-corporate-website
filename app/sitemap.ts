import type { MetadataRoute } from "next";
import { events, pages, siteUrl } from "@/lib/data";
import { locales, localeTags, localizedHref } from "@/lib/i18n";

function languageAlternates(path: string) {
  return Object.fromEntries(locales.map((l) => [localeTags[l], `${siteUrl}${localizedHref(path, l)}`]));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = pages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${siteUrl}${localizedHref(page.href, locale)}`,
      lastModified: new Date(),
      changeFrequency: (page.href === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: page.href === "/" ? 1 : 0.7,
      alternates: { languages: languageAlternates(page.href) },
    })),
  );

  // Event detail pages weren't in the sitemap at all before locale routing
  // — a pre-existing gap, fixed here while this file was already being
  // touched for the locale-alternates work.
  const eventPages: MetadataRoute.Sitemap = events.flatMap((event) => {
    const path = `/events/${event.slug}`;
    return locales.map((locale) => ({
      url: `${siteUrl}${localizedHref(path, locale)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: languageAlternates(path) },
    }));
  });

  return [...staticPages, ...eventPages];
}
