import { defineQuery } from "next-sanity";

export const eventsPageQuery = defineQuery(`*[_type == "eventsPage"][0]`);

// Filters by `visibleLocales` in GROQ, BEFORE pagination/slicing happens in
// application code — an event not shown on `$locale`'s website version is
// excluded from the result set entirely, not fetched-then-hidden. A
// document with no `visibleLocales` at all (pre-migration) matches neither
// locale — see scripts/migrate-events-visible-locales.ts, which backfills
// every existing event so none silently disappear.
export const allEventsQuery = defineQuery(`*[_type == "event" && $locale in visibleLocales] | order(date asc)`);

export const eventBySlugQuery = defineQuery(`*[_type == "event" && slug.current == $slug][0]`);

export const allEventSlugsQuery = defineQuery(`*[_type == "event"].slug.current`);

// For the sitemap only: every published event with visibleLocales, so the
// route generator can expand each event into exactly its selected-locale
// URLs (see app/sitemap.ts) — deliberately not locale-filtered here, that
// happens per-URL in the sitemap builder itself.
export const allEventsForSitemapQuery = defineQuery(
  `*[_type == "event" && defined(slug.current)]{"slug": slug.current, visibleLocales}`,
);
