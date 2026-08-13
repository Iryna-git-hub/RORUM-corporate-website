import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Container } from "@/components/ui";
import { EventShare } from "@/components/EventShare";
import { events as staticEvents, siteUrl, type RorumEvent } from "@/lib/data";
import { contactDetails } from "@/lib/siteConfig";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, localeTags, type Locale } from "@/lib/i18n";
import { sanityEventToRorumEvent, type SanityEventLike } from "@/lib/sanityEvents";
import { formatDuration, type EventDuration } from "@/lib/eventDuration";
import { getEventLanguageLabel } from "@/lib/eventLanguage";
import { getUiText } from "@/lib/uiText";
import { compact } from "@/lib/sanity-i18n";
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/live";
import { allEventSlugsQuery, eventBySlugQuery } from "@/sanity/queries/events";
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

async function getEvent(slug: string, locale: Locale): Promise<RorumEvent | undefined> {
    if (!isSanityConfigured) {
        return staticEvents.find((event) => event.slug === slug);
    }
    const { data: doc } = await sanityFetch({ query: eventBySlugQuery, params: { slug } });
    if (!doc) return staticEvents.find((event) => event.slug === slug);
    return sanityEventToRorumEvent(doc as SanityEventLike, locale);
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
    const formatted = date.toLocaleDateString(localeTags[locale], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
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

function formatTime(time: string | undefined): string {
    return time?.replace("-", "–") ?? "Time to be announced";
}

const ticketButtonBase =
    "group inline-flex items-center justify-center gap-2 w-fit whitespace-nowrap min-h-11.5 border rounded-pill px-6 py-3 text-[12.5px] font-extrabold tracking-[0.04em] uppercase transition-[transform,color,background,border-color] duration-180 ease-[ease] max-lg:w-full";
const ticketArrowClass =
    "w-3.75 h-3.75 text-current shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1";

function TicketButton({ event }: { event: RorumEvent }) {
    if (event.isSoldOut) {
        return (
          <button
            className={`${ticketButtonBase} cursor-not-allowed border-0 bg-[rgba(var(--rgb-brown),0.18)] text-[rgba(var(--rgb-brown),0.58)] shadow-none filter-none transform-none`}
            type="button"
            disabled
          >
            Sold Out
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
            Ticket link coming soon
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
        <span>{event.ticketButtonLabel ?? "Buy Ticket"}</span>
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
function EventDateDisplay({ dateValue, locale }: { dateValue: string; locale: Locale }) {
    const { weekday, monthDay } = formatDateParts(dateValue, locale);
    return (
      <span className="grid leading-tight max-sm:flex max-sm:flex-row max-sm:flex-nowrap max-sm:items-baseline">
        <span>{weekday}</span>
        <span className="hidden max-sm:inline">, </span>
        <span>{monthDay}</span>
      </span>
    );
}

const infoItemGridClass =
    "grid grid-cols-[48px_minmax(0,1fr)] gap-3 items-center min-h-23 px-5 py-4.5 border-r-0 max-lg:min-h-0 max-lg:border-b-0 max-sm:grid-cols-[44px_minmax(0,1fr)] max-sm:p-3.25";

function InfoGridItem({
    icon: Icon,
    label,
    value,
    prominent = false,
}: {
    icon: LucideIcon;
    label: string;
    value: ReactNode;
    prominent?: boolean;
}) {
    return (
      <div className={infoItemGridClass}>
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
    const description = event.longDescription || fallbackDescription;
    const image = event.image ?? "/images/hero.jpg";
    return localizedPageMetadata({
        path: `/events/${event.slug}`,
        locale,
        title: `${event.title} | RORUM`,
        description,
        image,
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

    const fullDate = formatFullDate(event.date, locale);
    const time = formatTime(event.time);
    const location = event.address || contactDetails.shortAddress;
    const duration = formatDuration(event.duration, locale) ?? formatDuration(DEFAULT_DURATION, locale);
    const language = getEventLanguageLabel(event.language, locale) ?? event.language;
    const description = event.longDescription ?? event.fullDescription ?? event.description ?? fallbackDescription;
    const expectations = event.whatToExpect?.length ? event.whatToExpect : fallbackExpectations;
    const imageAlt = event.imageAlt ?? `${event.title} event atmosphere`;
    const availability = event.isSoldOut
        ? <span className="inline-flex items-center w-fit min-h-6.5 px-2.5 py-1.25 rounded-pill text-sm leading-tight font-normal bg-[rgba(var(--rgb-red),0.1)] text-accent">Sold out</span>
        : typeof event.ticketsLeft === "number"
          ? `${event.ticketsLeft} ${event.ticketsLeft === 1 ? "spot" : "spots"} left`
          : null;

    return (
      <>
        <section className="event-detail-hero" aria-label={`${event.title} event image`}>
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
              Relative fr proportions, not fixed px — measured each column
              at ~248px when all 4 were equal (1fr each) at a 1440px
              viewport, then applied the requested deltas as a zero-sum
              redistribution so the row's total width is unchanged: Date
              stays ~248 (reference), Time -15 (233), Price -20 (228), and
              Address absorbs both reductions (+35 → 283) so the full
              street address has room to fit. Because these are `fr` units
              (ratios, not px), the row stays fully fluid at any container
              width — only the *proportions* are fixed, matching what was
              asked for over fragile fixed widths.
            */}
            <div className="grid grid-cols-[248fr_233fr_283fr_228fr_auto] items-stretch gap-0 m-0 border-none bg-white shadow-[0_16px_34px_rgba(var(--rgb-brown),0.09)] max-lg:grid-cols-1 max-sm:p-3.25 max-sm:border-x-0 max-sm:shadow-[0_8px_20px_rgba(var(--rgb-brown),0.06)]">
              <InfoGridItem icon={CalendarDays} label="Date" value={<EventDateDisplay dateValue={event.date} locale={locale} />} />
              <InfoGridItem icon={Clock} label="Time" value={time} />
              <InfoGridItem icon={MapPin} label="Location" value={location} />
              <InfoGridItem icon={Ticket} label="Price" value={event.price} prominent />
              <div className="flex items-center justify-end min-h-23 px-5 py-4.5 border-r-0 min-w-47 max-lg:min-h-0 max-lg:border-b-0 max-sm:p-3.25">
                <TicketButton event={event} />
              </div>
            </div>
          </Container>
        </section>

        <section className="pt-[clamp(42px,6vw,76px)] pb-[clamp(52px,8vw,104px)]">
          <Container>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(280px,340px)] gap-[clamp(28px,5vw,58px)] items-start max-lg:grid-cols-1">
              <article className="grid gap-[clamp(30px,4vw,46px)] min-w-0">
                <section className="grid gap-4 pb-[clamp(28px,4vw,38px)] border-b border-[rgba(var(--rgb-beige),0.48)] last:border-b-0 last:pb-0">
                  <h2 className="m-0 text-[clamp(26px,3vw,38px)] leading-[1.08] font-light">{getUiText("eventOverviewHeading", locale)}</h2>
                  <p className="max-w-[68ch] m-0 text-text-primary text-[17px] leading-[1.75]">{description}</p>
                  <EventShare
                    title={event.title}
                    text={event.longDescription || "Join this event at RORUM"}
                    url={`${siteUrl}/events/${event.slug}`}
                    actions={event.shareActions}
                    heading={getUiText("shareWithFriendsHeading", locale)}
                  />
                </section>

                <section className="grid gap-4 pb-[clamp(28px,4vw,38px)] border-b border-[rgba(var(--rgb-beige),0.48)] last:border-b-0 last:pb-0">
                  <h2 className="m-0 text-[clamp(26px,3vw,38px)] leading-[1.08] font-light">{getUiText("whatToExpectHeading", locale)}</h2>
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
                  {getUiText("practicalDetailsHeading", locale)}
                </h2>
                {/* Date/Time/Price/Address deliberately NOT repeated here — they already appear in the info row above; this block covers what that row doesn't. */}
                <dl className="grid gap-0 mt-2">
                  <DetailRow label="Event language" value={language} />
                  <DetailRow label="Duration" value={duration} />
                  <DetailRow label="Availability" value={availability} />
                  <DetailRow label="Arrival" value={event.arrival} />
                  <DetailRow label={event.ticketProviderInfo.label} value={event.ticketProviderInfo.value} />
                </dl>
              </aside>
            </div>
          </Container>
        </section>
      </>
    );
}
