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

/**
 * The single, authoritative "is this event still upcoming?" rule — an event
 * is upcoming for the WHOLE of its own calendar day (an event happening
 * today never disappears mid-afternoon), and past from the first moment of
 * the following day. Compared in the runtime's local time, which on the
 * server is the deploy region and on the client is the visitor's own clock.
 *
 * Used by BOTH the Home "Upcoming events" strip and the Events listing so a
 * past event can never appear in one but not the other (Phase 3). The event
 * DETAIL route (`/events/[slug]`) deliberately does NOT apply this — a
 * historical event URL stays reachable and indexable; only the current/
 * upcoming *lists* hide it.
 *
 * A missing/unparseable `date` is treated as NOT upcoming (same strict
 * default as `isEventVisibleInLocale` for a missing `visibleLocales`).
 */
export function isUpcomingEvent(event: Pick<RorumEvent, "date">, now: Date = new Date()): boolean {
  if (!event.date) return false;
  const endOfEventDay = new Date(`${event.date}T23:59:59`);
  if (Number.isNaN(endOfEventDay.getTime())) return false;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return endOfEventDay.getTime() >= startOfToday.getTime();
}
