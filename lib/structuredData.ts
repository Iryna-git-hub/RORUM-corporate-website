// JSON-LD builders (Section 15) — deliberately narrow. Each function only
// ever emits fields that can be proven from real, already-displayed
// content (the same data the visible page renders) — never a fabricated
// price, availability, rating, opening hours, address or coordinate. Where
// a genuine field can't be reliably derived (e.g. an event's free-text
// "18:30-21:30" time range doesn't always parse cleanly), it's simply
// omitted rather than guessed.

export interface OrganizationJsonLdInput {
  siteUrl: string;
  name: string;
  logoUrl: string;
}

export function organizationJsonLd({ siteUrl, name, logoUrl }: OrganizationJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: siteUrl,
    logo: logoUrl,
  };
}

export function websiteJsonLd({ siteUrl, name }: { siteUrl: string; name: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: siteUrl,
  };
}

/** Parses a manager-typed "HH:MM" or "HH:MM-HH:MM" time-range string — returns undefined for anything that doesn't cleanly match, rather than guessing. */
function parseTimeRange(time: string): { start?: string; end?: string } {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(?:[-–—]\s*(\d{1,2}):(\d{2}))?/);
  if (!match) return {};
  const [, sh, sm, eh, em] = match;
  const start = `${sh!.padStart(2, "0")}:${sm}`;
  const end = eh && em ? `${eh.padStart(2, "0")}:${em}` : undefined;
  return { start, end };
}

export interface EventJsonLdInput {
  siteUrl: string;
  path: string;
  name: string;
  description?: string;
  date: string;
  time: string;
  image?: string;
  address: string;
  isSoldOut: boolean;
  ticketUrl?: string;
  organizerName: string;
}

/**
 * Only the fields Section 15 explicitly allows — `name`, localized
 * `description`, `startDate`/`endDate` (only when the stored date/time can
 * be parsed with real confidence — see `parseTimeRange`), `eventStatus`,
 * `eventAttendanceMode` (always "OfflineEventAttendanceMode" — every RORUM
 * event is held at the physical venue, never announced as online), `image`,
 * `location` (the event's own real, already-displayed address — not a
 * fabricated one), `organizer`, and `offers.url` (the real ticket link,
 * when set — never a fabricated price or availability count, which Section
 * 15 explicitly forbids inventing).
 */
export function eventJsonLd(input: EventJsonLdInput) {
  const { start, end } = parseTimeRange(input.time);
  const startDate = start ? `${input.date}T${start}:00` : input.date;
  const endDate = end ? `${input.date}T${end}:00` : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    startDate,
    ...(endDate ? { endDate } : {}),
    // Always "Scheduled" — this project has no cancelled/postponed/
    // rescheduled event tracking to draw a different value from; a
    // sold-out event is still scheduled (see `offers.availability` below
    // for the actual sold-out signal).
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${input.siteUrl}${input.path}`,
    ...(input.image ? { image: input.image } : {}),
    location: {
      "@type": "Place",
      name: "RORUM",
      address: input.address,
    },
    organizer: {
      "@type": "Organization",
      name: input.organizerName,
      url: input.siteUrl,
    },
    ...(input.ticketUrl ? { offers: { "@type": "Offer", url: input.ticketUrl, availability: input.isSoldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock" } } : {}),
  };
}
