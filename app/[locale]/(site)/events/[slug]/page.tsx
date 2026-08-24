import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Container } from "@/components/ui";
import { EventShare } from "@/components/EventShare";
import { JsonLd } from "@/components/JsonLd";
import { events as staticEvents, type RorumEvent } from "@/lib/data";
import { contactDetails } from "@/lib/siteConfig";
import { localizedPageMetadata } from "@/lib/seo";
import { eventJsonLd } from "@/lib/structuredData";
import { getSeoSiteDefaults } from "@/lib/siteSettings";
import { isLocale, localeTags, type Locale } from "@/lib/i18n";
import { sanityEventToRorumEvent, type SanityEventLike } from "@/lib/sanityEvents";
import { isEventVisibleInLocale } from "@/lib/eventVisibility";
import { formatDuration, type EventDuration } from "@/lib/eventDuration";
import { getEventLanguageLabel } from "@/lib/eventLanguage";
import { getUiText } from "@/lib/uiText";
import { compact, pickLabel, pickLabelExact } from "@/lib/sanity-i18n";
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/live";
import { allEventSlugsQuery, eventBySlugQuery } from "@/sanity/queries/events";
import { eventMessagesQuery } from "@/sanity/queries/globals";
import { ArrowRight, CalendarDays, CircleCheckBig, Clock, MapPin, Ticket } from "lucide-react";

const fallbackDescription = "Join us for an intimate gathering at RORUM, designed for people who enjoy thoughtful details, warm atmosphere and meaningful conversation.";
const fallbackExpectations = [
    "A small and welcoming group format",
    "A calm, thoughtfully prepared room",
    "Practical inspiration and hands-on guidance",
    "Time for conversation and questions",
    "Tea, water or simple refreshments"
];
const DEFAULT_DURATION: EventDuration = { value: 2.5, unit: "hours" };

interface EventDetailMessages {
  eventOverviewHeading: string;
  whatToExpectHeading: string;
  practicalDetailsHeading: string;
  shareWithFriendsHeading: string;
  dateLabel: string;
  timeLabel: string;
  locationLabel: string;
  priceLabel: string;
  languageRowLabel: string;
  durationRowLabel: string;
  availabilityRowLabel: string;
  arrivalRowLabel: string;
  ticketProviderRowLabel: string;
  // Exact-locale only (no English fallback baked in) — see
  // `resolveTicketProviderLabel`'s priority chain below, which needs to
  // check this shared translation before falling through to English.
  ticketProviderRowLabelExactLocale?: string;
  soldOutLabel: string;
  ticketComingSoonLabel: string;
  buyTicketLabel: string;
  timeToBeAnnouncedLabel: string;
  spotsLeftOne: string;
  spotsLeftOther: string;
  eventImageAriaSuffix: string;
  shareDefaultText: string;
  linkCopiedMessage: string;
  instagramCopyMessage: string;
}

function defaultEventDetailMessages(locale: Locale): EventDetailMessages {
  return {
    eventOverviewHeading: getUiText("eventOverviewHeading", locale),
    whatToExpectHeading: getUiText("whatToExpectHeading", locale),
    practicalDetailsHeading: getUiText("practicalDetailsHeading", locale),
    shareWithFriendsHeading: getUiText("shareWithFriendsHeading", locale),
    dateLabel: "Date",
    timeLabel: "Time",
    locationLabel: "Location",
    priceLabel: "Price",
    languageRowLabel: "Event language",
    durationRowLabel: "Duration",
    availabilityRowLabel: "Availability",
    arrivalRowLabel: "Arrival",
    // Locale-aware (unlike its siblings above, which rely entirely on
    // Sanity's `eventMessages` doc for da/uk and fall back to English until
    // that data is migrated in): this is the actual fix for "Ticket
    // provider" showing English-only, so it holds correctly even before
    // `npm run sanity:add-ticket-provider-label` has been run against
    // production. Once that migration lands, `pickLabel` below reads the
    // same trilingual text from Sanity instead — this remains only the
    // last-resort default if Sanity is unreachable/unconfigured.
    ticketProviderRowLabel: locale === "da" ? "Billetudbyder" : locale === "uk" ? "Квитковий оператор" : "Ticket provider",
    soldOutLabel: "Sold Out",
    ticketComingSoonLabel: "Ticket link coming soon",
    buyTicketLabel: "Buy Ticket",
    timeToBeAnnouncedLabel: "Time to be announced",
    spotsLeftOne: "spot left",
    spotsLeftOther: "spots left",
    eventImageAriaSuffix: "event image",
    shareDefaultText: "Join this event at RORUM",
    linkCopiedMessage: "Link copied",
    instagramCopyMessage:
      "Event link copied! You can now paste it into Instagram Stories, DMs, or your bio.",
  };
}

async function getEventMessages(locale: Locale): Promise<EventDetailMessages> {
  const defaults = defaultEventDetailMessages(locale);
  if (!isSanityConfigured) return defaults;
  const { data: doc } = await sanityFetch({ query: eventMessagesQuery });
  if (!doc) return defaults;
  const labels = doc.labels;
  return {
    eventOverviewHeading: pickLabel(labels, "eventOverviewHeading", locale, defaults.eventOverviewHeading),
    whatToExpectHeading: pickLabel(labels, "whatToExpectHeading", locale, defaults.whatToExpectHeading),
    practicalDetailsHeading: pickLabel(labels, "practicalDetailsHeading", locale, defaults.practicalDetailsHeading),
    shareWithFriendsHeading: pickLabel(labels, "shareWithFriendsHeading", locale, defaults.shareWithFriendsHeading),
    dateLabel: pickLabel(labels, "dateLabel", locale, defaults.dateLabel),
    timeLabel: pickLabel(labels, "timeLabel", locale, defaults.timeLabel),
    locationLabel: pickLabel(labels, "locationLabel", locale, defaults.locationLabel),
    priceLabel: pickLabel(labels, "priceLabel", locale, defaults.priceLabel),
    languageRowLabel: pickLabel(labels, "languageRowLabel", locale, defaults.languageRowLabel),
    durationRowLabel: pickLabel(labels, "durationRowLabel", locale, defaults.durationRowLabel),
    availabilityRowLabel: pickLabel(labels, "availabilityRowLabel", locale, defaults.availabilityRowLabel),
    arrivalRowLabel: pickLabel(labels, "arrivalRowLabel", locale, defaults.arrivalRowLabel),
    ticketProviderRowLabel: pickLabel(labels, "ticketProviderRowLabel", locale, defaults.ticketProviderRowLabel),
    ticketProviderRowLabelExactLocale: pickLabelExact(labels, "ticketProviderRowLabel", locale),
    soldOutLabel: pickLabel(labels, "soldOutLabel", locale, defaults.soldOutLabel),
    ticketComingSoonLabel: pickLabel(labels, "ticketComingSoonLabel", locale, defaults.ticketComingSoonLabel),
    buyTicketLabel: pickLabel(labels, "buyTicketLabel", locale, defaults.buyTicketLabel),
    timeToBeAnnouncedLabel: pickLabel(labels, "timeToBeAnnouncedLabel", locale, defaults.timeToBeAnnouncedLabel),
    spotsLeftOne: pickLabel(labels, "spotsLeftOne", locale, defaults.spotsLeftOne),
    spotsLeftOther: pickLabel(labels, "spotsLeftOther", locale, defaults.spotsLeftOther),
    eventImageAriaSuffix: pickLabel(labels, "eventImageAriaSuffix", locale, defaults.eventImageAriaSuffix),
    shareDefaultText: pickLabel(labels, "shareDefaultText", locale, defaults.shareDefaultText),
    linkCopiedMessage: pickLabel(labels, "linkCopiedMessage", locale, defaults.linkCopiedMessage),
    instagramCopyMessage: pickLabel(labels, "instagramCopyMessage", locale, defaults.instagramCopyMessage),
  };
}

// Returns `undefined` both when no event exists at this slug AND when one
// exists but isn't shown on `locale`'s website version (its own
// `visibleLocales` doesn't include this locale) — both callers (
// generateMetadata and the page component below) already treat "no event"
// as 404/empty-metadata, so a locale-unsupported event and a nonexistent
// one are handled identically, correctly, with no separate branch needed.
// Never renders English (or any other locale's) content as a fallback for
// an unsupported locale.
async function getEvent(slug: string, locale: Locale): Promise<RorumEvent | undefined> {
    if (!isSanityConfigured) {
        return staticEvents.find((event) => event.slug === slug);
    }
    const { data: doc } = await sanityFetch({ query: eventBySlugQuery, params: { slug } });
    if (!doc) return staticEvents.find((event) => event.slug === slug);
    const event = sanityEventToRorumEvent(doc as SanityEventLike, locale);
    return isEventVisibleInLocale(event, locale) ? event : undefined;
}

// Danish and Ukrainian weekday/date strings come back lowercase from
// `Intl`/`toLocaleDateString` (correct for those languages' own
// orthography in running text, but wrong as a standalone label here) — this
// uppercases only the first character, using locale-aware case mapping
// (`toLocaleUpperCase`, not a plain `.toUpperCase()`), rather than CSS
// `text-transform: capitalize` (which would title-case every word and can
// mishandle non-Latin scripts).
function capitalizeFirst(text: string, locale: Locale): string {
    if (!text) return text;
    return text.charAt(0).toLocaleUpperCase(localeTags[locale]) + text.slice(1);
}

function formatFullDate(dateValue: string, locale: Locale): string {
    const date = new Date(`${dateValue}T12:00:00`);
    const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
    if (locale === "uk") {
        // uk-UA's Intl output appends a trailing literal " р." (short for
        // "рік", i.e. "year") after the year, e.g. "субота, 16 серпня 2026
        // р." — correct in running prose, but not wanted as a standalone
        // label here. formatToParts lets us drop just that literal token
        // (rather than a blind string replace, which risks also stripping a
        // legitimate "р" from the weekday/month name, e.g. "серпня").
        const parts = new Intl.DateTimeFormat(localeTags[locale], options).formatToParts(date);
        const formatted = parts
            .filter((part) => !(part.type === "literal" && part.value.trim() === "р."))
            .map((part) => part.value)
            .join("")
            .trim();
        return capitalizeFirst(formatted, locale);
    }
    const formatted = date.toLocaleDateString(localeTags[locale], options);
    return capitalizeFirst(formatted, locale);
}

/** Weekday and month/day as separate strings, locale-aware — used by `EventDateDisplay` to control exactly where the responsive line break falls. */
function formatDateParts(dateValue: string, locale: Locale): { weekday: string; monthDay: string } {
    const date = new Date(`${dateValue}T12:00:00`);
    const tag = localeTags[locale];
    return {
        weekday: capitalizeFirst(date.toLocaleDateString(tag, { weekday: "long" }), locale),
        monthDay: date.toLocaleDateString(tag, { month: "long", day: "numeric" }),
    };
}

function formatTime(time: string | undefined, timeToBeAnnouncedLabel: string): string {
    return time?.replace("-", "–") ?? timeToBeAnnouncedLabel;
}

/** Non-empty after trimming, else `undefined` — a whitespace-only translation counts as not present. */
function nonEmpty(value: string | undefined | null): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
}

/**
 * Resolves the Ticket Provider row's label with this exact priority:
 *   1. This event's own translation for the current locale.
 *   2. The shared `eventMessages` translation for the current locale.
 *   3. This event's own English translation.
 *   4. The shared `eventMessages` English translation.
 *   5. The code-level locale-aware default.
 *
 * Steps 1 and 2 use exact-locale-only lookups (`labelExactLocale` /
 * `ticketProviderRowLabelExactLocale`, both built on `pickExactLocalized` —
 * see lib/sanity-i18n.ts) specifically so a missing DA/UK *event*
 * translation checks the *shared* DA/UK translation before ever reaching
 * English.
 *
 * Step 3 deliberately uses `labelEnglish`, NOT the plain `label` field:
 * `label` (via `pickLocalized`) ends in a hardcoded `"Ticket provider"`
 * literal when Sanity has neither the current locale nor English, so using
 * it here would make step 3 *always* return something non-empty — which
 * would permanently short-circuit past steps 4/5 (the shared label and the
 * locale-aware code default) for any event untranslated in both the
 * current locale and English, silently reintroducing the exact
 * "English regardless of locale" bug this whole chain exists to fix.
 * `labelEnglish` has no such hardcoded tail; it's `undefined` when this
 * event truly has no English translation, letting steps 4/5 run.
 * `messages.ticketProviderRowLabel` (step 4/5) is safe to use as-is: its
 * own internal fallback ends in `defaults.ticketProviderRowLabel`, which
 * *is* locale-aware (see `defaultEventDetailMessages`), not hardcoded
 * English.
 */
function resolveTicketProviderLabel(event: RorumEvent, messages: EventDetailMessages): string {
    return (
        nonEmpty(event.ticketProviderInfo.labelExactLocale) ??
        nonEmpty(messages.ticketProviderRowLabelExactLocale) ??
        nonEmpty(event.ticketProviderInfo.labelEnglish) ??
        messages.ticketProviderRowLabel
    );
}

// `max-sm:w-full` (not `max-lg:`): the CTA is meant to keep its intrinsic,
// non-wrapping width in both the wide single-row layout (>=1280px) and the
// narrower 2-column desktop/tablet layout (640-1279px, where it shares a
// row with Price) — only true mobile's stacked layout (<640px) wants the
// full-width button.
const ticketButtonBase =
    "group inline-flex items-center justify-center gap-2 w-fit whitespace-nowrap min-h-11.5 border rounded-pill px-6 py-3 text-[12.5px] font-extrabold tracking-[0.04em] uppercase transition-[transform,color,background,border-color] duration-180 ease-[ease] max-sm:w-full";
const ticketArrowClass =
    "w-3.75 h-3.75 text-current shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1";

function TicketButton({ event, messages }: { event: RorumEvent; messages: EventDetailMessages }) {
    if (event.isSoldOut) {
        return (
          <button
            className={`${ticketButtonBase} cursor-not-allowed border-0 bg-[rgba(var(--rgb-brown),0.18)] text-[rgba(var(--rgb-brown),0.58)] shadow-none filter-none transform-none`}
            type="button"
            disabled
          >
            {messages.soldOutLabel}
          </button>
        );
    }

    if (!event.ticketUrl) {
        return (
          <button
            className={`${ticketButtonBase} cursor-not-allowed border-0 bg-[rgba(var(--rgb-beige),0.5)] text-[rgba(var(--rgb-brown),0.62)] shadow-none filter-none transform-none`}
            type="button"
            disabled
          >
            {messages.ticketComingSoonLabel}
          </button>
        );
    }

    return (
      <a
        className={`${ticketButtonBase} border-light-green bg-light-green text-white hover:border-dark-green hover:bg-dark-green hover:text-white hover:-translate-y-px`}
        href={event.ticketUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>{event.ticketButtonLabel ?? messages.buyTicketLabel}</span>
        <ArrowRight className={ticketArrowClass} aria-hidden="true" strokeWidth={1.9} />
      </a>
    );
}

function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
    if (!value) return null;
    return (
      <div className="grid grid-cols-[minmax(116px,0.42fr)_minmax(0,1fr)] gap-4.5 items-start py-3.75 border-b border-[rgba(var(--rgb-beige),0.34)] first:pt-0 last:border-b-0 max-sm:grid-cols-1 max-sm:gap-1.25">
        <dt className="text-light-green text-[11px] leading-[1.35] font-[850] tracking-[0.08em] uppercase">{label}</dt>
        <dd className="m-0 text-text-primary text-sm font-medium leading-[1.5]">{value}</dd>
      </div>
    );
}

// Desktop (default): `grid` stacks each child on its own row, so weekday and
// month/day render as two intentional lines with no in-between text — the
// comma stays `hidden` so nothing appears where the break is. Mobile
// (`max-sm:`): the container becomes a `flex` row instead, and the comma
// switches to `inline`, joining everything back onto one line ("Wednesday,
// August 19"). Same two strings either way — only the CSS layout changes.
// `whitespace-nowrap` on both spans: `monthDay` ("15 травня") must never
// split its numeric day from its month name (the failure mode this guards
// against — see the task's own "Do not allow: П'ятниця / 15 / травня"
// example); `weekday` is always one word in en/da/uk so nowrap is a no-op
// today, kept only for defensiveness against a future locale where it
// isn't.
function EventDateDisplay({ dateValue, locale }: { dateValue: string; locale: Locale }) {
    const { weekday, monthDay } = formatDateParts(dateValue, locale);
    return (
      <span className="grid leading-tight max-sm:flex max-sm:flex-row max-sm:flex-nowrap max-sm:items-baseline">
        <span className="whitespace-nowrap">{weekday}</span>
        <span className="hidden max-sm:inline">, </span>
        <span className="whitespace-nowrap">{monthDay}</span>
      </span>
    );
}

// Every real address in this dataset (and the site's own default
// `contactDetails.shortAddress`) has the shape "<street> <number>,
// <floor/apartment>, <city>" — comma-separated, not just one comma
// (splitting at the *first* comma would wrongly cut the street off from its
// own floor/apartment suffix). The city is reliably the last segment; any
// segment(s) between the street and the city are the floor/apartment
// notation. An address with only one segment (no comma) or two (no
// floor/apartment segment) degrades gracefully — `floor` is simply absent.
function formatAddressParts(address: string): { street: string; floor: string | null; city: string | null } {
    const segments = address.split(",").map((s) => s.trim()).filter(Boolean);
    if (segments.length < 2) return { street: address, floor: null, city: null };
    return {
        street: segments[0]!,
        floor: segments.length > 2 ? segments.slice(1, -1).join(", ") : null,
        city: segments[segments.length - 1]!,
    };
}

// Two independent `nowrap` rules, not one:
//  - The OUTER line (street + floor/apartment) is `nowrap` from `sm:` up
//    (this file's desktop-first convention: unprefixed = wide default,
//    `max-sm:` carves out the mobile exception) — every non-mobile tier
//    (the wide single-row layout above `xl`, and the narrower desktop/
//    tablet 2-column layout between `sm` and `xl`) gives the address its
//    own full-width row/column with comfortably more room than the
//    address text needs, so nowrap holds everywhere except true mobile
//    (<640px), where it's allowed to wrap so a long street name can't
//    force horizontal overflow on a narrow phone.
//  - The `floor` segment alone (e.g. "1 th") additionally gets its own,
//    UNCONDITIONAL `nowrap` span — floor/apartment notation must never
//    split internally at *any* width, including where the outer line above
//    is already wrapping on mobile. It's short enough (a word or two) that
//    forcing it never to break carries no realistic overflow risk on its
//    own, unlike the full street line.
function EventAddressDisplay({ address }: { address: string }) {
    const { street, floor, city } = formatAddressParts(address);
    if (!city) return <>{address}</>;
    return (
      <span className="grid leading-tight">
        <span className="whitespace-nowrap max-sm:whitespace-normal">
          {street}
          {floor ? (
            <>
              , <span className="whitespace-nowrap">{floor}</span>
            </>
          ) : null}
          ,
        </span>
        <span>{city}</span>
      </span>
    );
}

// `min-w-0`: without it, this div (a grid item of the outer info-row grid
// in both its wide single-row and narrower 2-column arrangements) defaults
// to `min-width: auto`, which for a grid item resolves to its content's
// intrinsic minimum — and several of its descendants are deliberately
// `whitespace-nowrap` (day+month, time range, price, address street line),
// so that intrinsic minimum is their full unwrapped width. That would let
// content force its outer grid track wider than the `minmax()` floor
// specifies (or spill into a neighboring column) instead of the column
// simply sizing to its floor. `min-w-0` here, combined with this element's
// own inner `minmax(0,1fr)` text column just below, is what actually lets
// the outer grid's `minmax(floor, …fr)` floors govern column width.
const infoItemGridClass =
    "grid grid-cols-[48px_minmax(0,1fr)] gap-3 items-center min-h-23 px-5 py-4.5 border-r-0 min-w-0 max-xl:min-h-0 max-xl:border-b-0 max-sm:grid-cols-[44px_minmax(0,1fr)] max-sm:p-3.25";

function InfoGridItem({
    icon: Icon,
    label,
    value,
    prominent = false,
    className = "",
}: {
    icon: LucideIcon;
    label: string;
    value: ReactNode;
    prominent?: boolean;
    className?: string;
}) {
    return (
      <div className={`${infoItemGridClass} ${className}`.trim()}>
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-none bg-[rgba(var(--rgb-light-green),0.12)] text-light-green max-sm:w-11 max-sm:h-11">
          <Icon aria-hidden="true" strokeWidth={1.85} className="w-6.5 h-6.5 text-current max-sm:w-5.75 max-sm:h-5.75" />
        </span>
        <div>
          <dt className="sr-only">{label}</dt>
          <dd
            className={
              prominent
                ? "text-light-green text-[clamp(1.05rem,1.45vw,1.25rem)] leading-[1.25] font-semibold"
                : "m-0 text-text-primary text-[15.5px] leading-[1.35] font-medium max-sm:text-[15px]"
            }
          >
            {value}
          </dd>
        </div>
      </div>
    );
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
    if (!isSanityConfigured) {
        return staticEvents.filter((event) => event.slug).map((event) => ({ slug: event.slug }));
    }
    const { data: slugs } = await sanityFetch({ query: allEventSlugsQuery });
    const resolved = compact(slugs ?? []);
    return resolved.length ? resolved.map((slug) => ({ slug })) : staticEvents.map((event) => ({ slug: event.slug }));
}

// Stays at its default `true`: a brand-new event created in Sanity between
// deploys should render on-demand rather than 404 until the next build.
// (This alone used to be insufficient — see the `dynamicParams` comment in
// app/[locale]/layout.tsx for the ancestor-segment bug that broke this.)

// Once rendered, a specific event's page is cached until the next build
// unless revalidated — an editor correcting a field (e.g. re-uploading the
// banner image) on an already-published event wouldn't see it reflected
// without this. Matches the events listing page's revalidate window; see
// its comment for why no revalidation webhook is configured for this
// project instead.
export const revalidate = 60;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
    const { locale: rawLocale, slug } = await params;
    const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
    const event = await getEvent(slug, locale);
    if (!event) return {};
    const title = event.seo?.title || `${event.title} | RORUM`;
    // Deliberately NOT falling back to the page-level `fallbackDescription`
    // constant here (that stays reserved for the page BODY's own separate
    // description variable below) — an empty result here correctly falls
    // through to `localizedPageMetadata`'s own siteDefault/emergencyDefault
    // tiers instead, matching the documented 4-tier Event SEO precedence
    // (documentOverride -> documentContent -> siteDefault -> emergencyDefault)
    // with no extra page-level tier in between.
    const description = event.seo?.description || event.longDescription || "";
    const image = event.seo?.ogImageUrl || event.image || "/images/hero.jpg";
    const imageAlt = event.seo?.ogImageAlt || event.imageAlt || undefined;
    // Only advertise hreflang alternates for locales this event is actually
    // shown on — an alternate pointing at a locale that itself 404s for
    // this event would mislead search engines about which URLs exist.
    const alternateLocales = (event.visibleLocales ?? []).filter(isLocale);
    return localizedPageMetadata({
        path: `/events/${event.slug}`,
        locale,
        title,
        description,
        image,
        ...(imageAlt ? { imageAlt } : {}),
        ...(alternateLocales.length ? { alternateLocales } : {}),
    });
}

export default async function EventDetailPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { locale: rawLocale, slug } = await params;
    const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
    const event = await getEvent(slug, locale);
    if (!event) notFound();
    const messages = await getEventMessages(locale);
    const { siteUrl } = await getSeoSiteDefaults();

    const fullDate = formatFullDate(event.date, locale);
    const time = formatTime(event.time, messages.timeToBeAnnouncedLabel);
    const location = event.address || contactDetails.shortAddress;
    const duration = formatDuration(event.duration, locale) ?? formatDuration(DEFAULT_DURATION, locale);
    const language = getEventLanguageLabel(event.language, locale) ?? event.language;
    const description = event.longDescription ?? event.fullDescription ?? event.description ?? fallbackDescription;
    const expectations = event.whatToExpect?.length ? event.whatToExpect : fallbackExpectations;
    const imageAlt = event.imageAlt ?? `${event.title} ${messages.eventImageAriaSuffix}`;
    const availability = event.isSoldOut
        ? <span className="inline-flex items-center w-fit min-h-6.5 px-2.5 py-1.25 rounded-pill text-sm leading-tight font-normal bg-[rgba(var(--rgb-red),0.1)] text-accent">{messages.soldOutLabel}</span>
        : typeof event.ticketsLeft === "number"
          ? `${event.ticketsLeft} ${event.ticketsLeft === 1 ? messages.spotsLeftOne : messages.spotsLeftOther}`
          : null;
    const structuredDataImage = event.image ? (/^https?:\/\//.test(event.image) ? event.image : `${siteUrl}${event.image}`) : undefined;

    return (
      <>
        <JsonLd
          data={eventJsonLd({
            siteUrl,
            path: `/events/${event.slug}`,
            name: event.title,
            description: event.longDescription || undefined,
            date: event.date,
            time: event.time,
            image: structuredDataImage,
            address: location,
            isSoldOut: event.isSoldOut,
            ticketUrl: event.ticketUrl || undefined,
            organizerName: "RORUM",
          })}
        />
        <section className="event-detail-hero" aria-label={`${event.title} ${messages.eventImageAriaSuffix}`}>
          <Image
            className={
              event.isSoldOut
                ? "object-cover grayscale-[70%] saturate-[60%] brightness-[0.85]"
                : "object-cover"
            }
            src={event.image ?? "/images/hero.jpg"}
            alt={imageAlt}
            fill
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(var(--rgb-dark-brown),0.34)_0%,rgba(var(--rgb-light-green),0.58)_100%),linear-gradient(90deg,rgba(var(--rgb-light-green),0.68)_0%,rgba(var(--rgb-brown),0.26)_62%,rgba(var(--rgb-dark-brown),0.44)_100%)]" />
          <Container className="relative z-1">
            <div className="grid gap-3 max-w-[780px] text-cream max-sm:justify-items-start max-sm:text-left">
              <time
                dateTime={event.date}
                className="text-gold text-[clamp(12px,1.1vw,15px)] font-extrabold tracking-[0.08em] uppercase"
              >
                {fullDate}
              </time>
              <h1 className="font-heading font-medium text-white m-0 w-full text-5xl leading-[1.3] tracking-normal max-sm:max-w-[13ch] max-sm:text-[clamp(1.9rem,8vw,2.6rem)]">
                {event.title}
              </h1>
            </div>
          </Container>
        </section>

        <section className="relative z-2 -mt-11 p-0 max-sm:-mt-7" aria-label="Event information">
          <Container>
            {/*
              Three tiers, not two — content-aware `minmax(floor, Nfr)`
              columns (same idiom as DetailRow's/InfoGridItem's own inner
              two-column grids) at the wide tier, an intermediate 2-column
              arrangement, then the original single-column mobile stack:

              - `xl:` and up (>=1280px; Container is capped at 1180px, so
                nothing gets wider from here): the full 5-column row. Each
                floor below is that column's real measured worst-case
                content width (rendered in the site's own fonts — see
                scripts/_tmp-measure-info-grid.ts, run against live Sanity
                event data) plus its fixed 100px chrome (48px icon + 12px
                gap + 40px horizontal padding — see `infoItemGridClass`),
                plus a small safety margin:
                  Date   215px = 106.5px longest uk "day month" ("28
                         листопада") + 100 + ~8. Weekday never dominates
                         (86px max) since day+month is longer in all 3
                         locales.
                  Time   205px = 96px longest uk range ("09:30–12:00") + 100
                         + ~9.
                  Address 310px = 194.5px longest real stored address's
                         street+floor line (uk font renders it widest) + 100
                         + ~15.
                  Price  200px = 86px "1,250 kr." (uk, `prominent`'s larger
                         20px/600 font) + 100 + ~14 — sized for a 4-digit
                         amount per the task, not today's actual "95 kr."
                floor sum (930px) + the widest real CTA label ("Купити
                квиток", ~230px incl. its own padding) = ~1160px, comfortably
                under the 1180px cap even before the small fr-share top-up
                below — this is *why* xl (1280px) is the wide-row
                threshold: it's the smallest named breakpoint whose 1180px
                capped Container width covers that real minimum content
                width with a safety margin, not an arbitrary device size.
                fr-shares (1.1 / 1 / 1.5 / 1) split what little leftover
                space remains beyond the floors — Address gets the largest
                single share (it's explicitly "the widest column"), but
                because the floors already track real content closely and
                Container never exceeds 1180px, there's rarely more than a
                few dozen leftover px to distribute, so no column balloons
                the way a large fr-share on a small floor could.
              - `sm:` to `<xl` (640–1279px, "narrow desktop/tablet"): 5
                columns would compress below their floors here, so this
                switches to 2 columns instead — Date+Time share row 1,
                Address (see `col-span-2` below) gets its own full-width
                row 2, Price+CTA share row 3. Every item still has far more
                room per column here (>=~300px) than any floor above
                requires.
              - `<sm` (<640px, mobile): unchanged single-column stack.

              `min-w-0` on every InfoGridItem (see its definition) is what
              lets these floors actually govern column width instead of
              nowrap content's intrinsic min-size forcing tracks wider; the
              CTA cell deliberately has no `min-w-0` — `auto` columns are
              supposed to size to their (also nowrap) content, unshrunk.
            */}
            <div className="grid grid-cols-[minmax(215px,1.1fr)_minmax(205px,1fr)_minmax(310px,1.5fr)_minmax(200px,1fr)_auto] items-stretch gap-0 m-0 border-none bg-white shadow-[0_16px_34px_rgba(var(--rgb-brown),0.09)] max-xl:grid-cols-2 max-sm:grid-cols-1 max-sm:p-3.25 max-sm:border-x-0 max-sm:shadow-[0_8px_20px_rgba(var(--rgb-brown),0.06)]">
              <InfoGridItem icon={CalendarDays} label={messages.dateLabel} value={<EventDateDisplay dateValue={event.date} locale={locale} />} />
              <InfoGridItem icon={Clock} label={messages.timeLabel} value={<span className="whitespace-nowrap">{time}</span>} />
              <InfoGridItem
                icon={MapPin}
                label={messages.locationLabel}
                value={<EventAddressDisplay address={location} />}
                className="max-xl:col-span-2 max-sm:col-span-1"
              />
              <InfoGridItem icon={Ticket} label={messages.priceLabel} value={<span className="whitespace-nowrap">{event.price}</span>} prominent />
              <div className="flex items-center justify-end min-h-23 px-5 py-4.5 border-r-0 min-w-47 max-xl:min-h-0 max-xl:border-b-0 max-sm:p-3.25">
                <TicketButton event={event} messages={messages} />
              </div>
            </div>
          </Container>
        </section>

        <section className="pt-[clamp(42px,6vw,76px)] pb-[clamp(52px,8vw,104px)]">
          <Container>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(280px,340px)] gap-[clamp(28px,5vw,58px)] items-start max-lg:grid-cols-1">
              <article className="grid gap-[clamp(30px,4vw,46px)] min-w-0">
                <section className="grid gap-4 pb-[clamp(28px,4vw,38px)] border-b border-[rgba(var(--rgb-beige),0.48)] last:border-b-0 last:pb-0">
                  <h2 className="m-0 text-[clamp(26px,3vw,38px)] leading-[1.08] font-light">{messages.eventOverviewHeading}</h2>
                  <p className="max-w-[68ch] m-0 text-text-primary text-[17px] leading-[1.75]">{description}</p>
                  <EventShare
                    title={event.title}
                    text={event.longDescription || messages.shareDefaultText}
                    url={`${siteUrl}/events/${event.slug}`}
                    actions={event.shareActions}
                    heading={messages.shareWithFriendsHeading}
                    linkCopiedMessage={messages.linkCopiedMessage}
                    instagramCopyMessage={messages.instagramCopyMessage}
                  />
                </section>

                <section className="grid gap-4 pb-[clamp(28px,4vw,38px)] border-b border-[rgba(var(--rgb-beige),0.48)] last:border-b-0 last:pb-0">
                  <h2 className="m-0 text-[clamp(26px,3vw,38px)] leading-[1.08] font-light">{messages.whatToExpectHeading}</h2>
                  <ul className="grid gap-4 m-0 p-0 list-none">
                    {expectations.map((item) => (
                      <li key={item} className="grid grid-cols-[25px_minmax(0,1fr)] gap-3.25 items-start text-text-primary font-normal leading-[1.65]">
                        <CircleCheckBig aria-hidden="true" strokeWidth={1.9} className="w-5.5 h-5.5 text-gold translate-y-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </article>

              <aside
                className="sticky top-26 grid gap-5 p-[clamp(22px,2.6vw,30px)] border-none rounded-none bg-white shadow-[0_12px_30px_rgba(var(--rgb-brown),0.06)] max-lg:static max-lg:order-first"
                aria-label="Practical details"
              >
                <h2 className="m-0 pb-3 border-b border-[rgba(var(--rgb-beige),0.34)] text-text-primary font-body text-[17px] font-extrabold tracking-normal leading-tight uppercase">
                  {messages.practicalDetailsHeading}
                </h2>
                {/* Date/Time/Price/Address deliberately NOT repeated here — they already appear in the info row above; this block covers what that row doesn't. */}
                <dl className="grid gap-0 mt-2">
                  <DetailRow label={messages.languageRowLabel} value={language} />
                  <DetailRow label={messages.durationRowLabel} value={duration} />
                  <DetailRow label={messages.availabilityRowLabel} value={availability} />
                  <DetailRow label={messages.arrivalRowLabel} value={event.arrival} />
                  {/* Label: `resolveTicketProviderLabel`'s 5-tier priority
                      (this event's own translation for the exact locale,
                      then the shared label's exact-locale translation, then
                      each of those in English, then the code default) — an
                      editor's per-event override in Studio takes effect,
                      but a locale an editor hasn't translated yet still
                      shows the shared label instead of silently falling to
                      English. Value: always the per-event field — a
                      provider name (e.g. "Billetto") isn't something the
                      shared label could ever supply. */}
                  <DetailRow label={resolveTicketProviderLabel(event, messages)} value={event.ticketProviderInfo.value} />
                </dl>
              </aside>
            </div>
          </Container>
        </section>
      </>
    );
}
