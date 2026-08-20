import type { RorumEvent } from "@/lib/data";
import type { Locale } from "@/lib/i18n";

/**
 * The single, authoritative check for whether an event should appear on a
 * given locale's website version — driven by that event's own
 * `visibleLocales` field ("Show on website languages" in Studio). Used
 * consistently by the Home event strip, Events listing, Event Detail
 * (404 when false), and the sitemap, so the rule can never drift between
 * call sites.
 *
 * A missing/empty `visibleLocales` is treated as NOT visible (strict
 * default) — matches `sanity/queries/events.ts`'s `allEventsQuery`, which
 * excludes any document with no matching `visibleLocales` entry the same
 * way. Real Sanity events all have `visibleLocales` after
 * scripts/migrate-events-visible-locales.ts backfills every pre-existing
 * document; this only matters for a brand-new draft that hasn't set the
 * (required) field yet.
 */
export function isEventVisibleInLocale(event: Pick<RorumEvent, "visibleLocales">, locale: Locale): boolean {
  return Array.isArray(event.visibleLocales) && event.visibleLocales.includes(locale);
}
