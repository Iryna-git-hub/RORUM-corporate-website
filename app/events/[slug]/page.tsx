import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Container } from "@/components/ui";
import { EventShare } from "@/components/EventShare";
import { events, siteUrl, type RorumEvent } from "@/lib/data";
import { ArrowRight, CalendarDays, CircleCheckBig, Clock, MapPin, Ticket } from "lucide-react";

const fallbackDescription = "Join us for an intimate gathering at RORUM, designed for people who enjoy thoughtful details, warm atmosphere and meaningful conversation.";
const fallbackLocation = "Buermistersgade 26, Copenhagen";
const fallbackExpectations = [
    "A small and welcoming group format",
    "A calm, thoughtfully prepared room",
    "Practical inspiration and hands-on guidance",
    "Time for conversation and questions",
    "Tea, water or simple refreshments"
];

function getEvent(slug: string): RorumEvent | undefined {
    return events.find((event) => event.slug === slug);
}

function formatFullDate(dateValue: string): string {
    const date = new Date(`${dateValue}T12:00:00`);
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatShortDate(dateValue: string): string {
    const date = new Date(`${dateValue}T12:00:00`);
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatTime(time: string | undefined): string {
    return time?.replace("-", "–") ?? "Time to be announced";
}

function formatDurationFromHours(hours: number): string | null {
    if (!Number.isFinite(hours) || hours <= 0) return null;
    const rounded = Math.round(hours * 2) / 2;
    if (rounded === 1) return "1 hour";
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} hours`;
}

function parseTimeToMinutes(timeValue: string | undefined): number | null {
    const match = timeValue?.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
}

function calculateDuration(startTime: string | undefined, endTime: string | undefined): string | null {
    const start = parseTimeToMinutes(startTime);
    const end = parseTimeToMinutes(endTime);
    if (start === null || end === null || end <= start) return null;
    return formatDurationFromHours((end - start) / 60);
}

function getDurationFromTimeRange(timeRange: string | undefined): string | null {
    const [startTime, endTime] = timeRange?.split(/\s*[-–]\s*/) ?? [];
    return calculateDuration(startTime, endTime);
}

function getEventDuration(event: RorumEvent): string {
    return event.duration
        ?? calculateDuration(event.startTime, event.endTime)
        ?? getDurationFromTimeRange(event.time)
        ?? getPracticalDetail(event, "Duration")
        ?? "2.5 hours";
}

function getPracticalDetail(event: RorumEvent, label: string): string | undefined {
    return event.practicalDetails?.find((detail) => detail.label === label)?.value;
}

const ticketButtonBase =
    "group inline-flex items-center justify-center gap-2 w-fit whitespace-nowrap min-h-11.5 border rounded-pill px-6 py-3 text-[12.5px] font-extrabold tracking-[0.04em] uppercase transition-[transform,color,background,border-color] duration-180 ease-[ease] max-[980px]:w-full";
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
        <span>Buy Ticket</span>
        <ArrowRight className={ticketArrowClass} aria-hidden="true" strokeWidth={1.9} />
      </a>
    );
}

function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
    if (!value) return null;
    return (
      <div className="grid grid-cols-[minmax(116px,0.42fr)_minmax(0,1fr)] gap-4.5 items-start py-3.75 border-b border-[rgba(var(--rgb-beige),0.34)] first:pt-0 last:border-b-0 max-tablet:grid-cols-1 max-tablet:gap-1.25">
        <dt className="text-light-green text-[11px] leading-[1.35] font-[850] tracking-[0.08em] uppercase">{label}</dt>
        <dd className="m-0 text-text-primary text-sm font-medium leading-[1.5]">{value}</dd>
      </div>
    );
}

const infoItemGridClass =
    "grid grid-cols-[48px_minmax(0,1fr)] gap-3 items-center min-h-23 px-5 py-4.5 border-r-0 max-[980px]:min-h-0 max-[980px]:border-b-0 max-tablet:grid-cols-[44px_minmax(0,1fr)] max-tablet:p-3.25";

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
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-none bg-[rgba(var(--rgb-light-green),0.12)] text-light-green max-tablet:w-11 max-tablet:h-11">
          <Icon aria-hidden="true" strokeWidth={1.85} className="w-6.5 h-6.5 text-current max-tablet:w-5.75 max-tablet:h-5.75" />
        </span>
        <div>
          <dt className="sr-only">{label}</dt>
          <dd
            className={
              prominent
                ? "text-light-green text-[clamp(1.05rem,1.45vw,1.25rem)] leading-[1.25] font-semibold"
                : "m-0 text-text-primary text-[15.5px] leading-[1.35] font-medium max-tablet:text-[15px]"
            }
          >
            {value}
          </dd>
        </div>
      </div>
    );
}

export function generateStaticParams(): { slug: string }[] {
    return events.filter((event) => event.slug).map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const event = getEvent(slug);
    if (!event) return {};
    const title = `${event.title} | RORUM`;
    const description = event.shortDescription ?? fallbackDescription;
    const image = event.image ?? "/images/hero.jpg";
    return {
        title,
        description,
        alternates: { canonical: `${siteUrl}/events/${event.slug}` },
        openGraph: {
            title,
            description,
            url: `${siteUrl}/events/${event.slug}`,
            siteName: "RORUM",
            images: [{ url: `${siteUrl}${image}`, width: 1200, height: 630, alt: event.title }],
            locale: "en_US",
            type: "article"
        }
    };
}

export default async function EventDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const event = getEvent(slug);
    if (!event) notFound();

    const fullDate = formatFullDate(event.date);
    const shortDate = formatShortDate(event.date);
    const time = formatTime(event.time);
    const location = event.location ?? fallbackLocation;
    const duration = getEventDuration(event);
    const language = event.language ?? getPracticalDetail(event, "Language") ?? "English";
    const description = event.longDescription ?? event.fullDescription ?? event.description ?? fallbackDescription;
    const expectations = event.whatToExpect?.length ? event.whatToExpect : fallbackExpectations;
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
            alt={`${event.title} event atmosphere`}
            fill
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(var(--rgb-dark-brown),0.34)_0%,rgba(var(--rgb-light-green),0.58)_100%),linear-gradient(90deg,rgba(var(--rgb-light-green),0.68)_0%,rgba(var(--rgb-brown),0.26)_62%,rgba(var(--rgb-dark-brown),0.44)_100%)]" />
          <Container>
            <div className="grid gap-3 max-w-[780px] text-cream max-tablet:justify-items-start max-tablet:text-left">
              <time
                dateTime={event.date}
                className="text-gold text-[clamp(12px,1.1vw,15px)] font-extrabold tracking-[0.08em] uppercase"
              >
                {fullDate}
              </time>
              <h1 className="font-heading font-medium text-white m-0 max-w-[18ch] text-5xl leading-[1.3] tracking-normal max-tablet:max-w-[13ch] max-tablet:text-[clamp(1.9rem,8vw,2.6rem)]">
                {event.title}
              </h1>
            </div>
          </Container>
        </section>

        <section className="relative z-2 -mt-11 p-0 max-tablet:-mt-7" aria-label="Event information">
          <Container>
            <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_auto] items-stretch gap-0 m-0 border-none bg-white shadow-[0_16px_34px_rgba(var(--rgb-brown),0.09)] max-[980px]:grid-cols-1 max-tablet:p-3.25 max-tablet:border-x-0 max-tablet:shadow-[0_8px_20px_rgba(var(--rgb-brown),0.06)]">
              <InfoGridItem icon={CalendarDays} label="Date" value={shortDate} />
              <InfoGridItem icon={Clock} label="Time" value={time} />
              <InfoGridItem icon={MapPin} label="Location" value={location} />
              <InfoGridItem icon={Ticket} label="Price" value={event.price} prominent />
              <div className="flex items-center justify-end min-h-23 px-5 py-4.5 border-r-0 min-w-47 max-[980px]:min-h-0 max-[980px]:border-b-0 max-tablet:p-3.25">
                <TicketButton event={event} />
              </div>
            </div>
          </Container>
        </section>

        <section className="pt-[clamp(42px,6vw,76px)] pb-[clamp(52px,8vw,104px)]">
          <Container>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(280px,340px)] gap-[clamp(28px,5vw,58px)] items-start max-[980px]:grid-cols-1">
              <article className="grid gap-[clamp(30px,4vw,46px)] min-w-0">
                <section className="grid gap-4 pb-[clamp(28px,4vw,38px)] border-b border-[rgba(var(--rgb-beige),0.48)] last:border-b-0 last:pb-0">
                  <h2 className="m-0 text-[clamp(26px,3vw,38px)] leading-[1.08] font-light">Event overview</h2>
                  <p className="max-w-[68ch] m-0 text-text-primary text-[17px] leading-[1.75]">{description}</p>
                  <EventShare title={event.title} text={event.shortDescription ?? "Join this event at RORUM"} url={`${siteUrl}/events/${event.slug}`} />
                </section>

                <section className="grid gap-4 pb-[clamp(28px,4vw,38px)] border-b border-[rgba(var(--rgb-beige),0.48)] last:border-b-0 last:pb-0">
                  <h2 className="m-0 text-[clamp(26px,3vw,38px)] leading-[1.08] font-light">What to expect</h2>
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
                className="sticky top-26 grid gap-5 p-[clamp(22px,2.6vw,30px)] border-none rounded-none bg-white shadow-[0_12px_30px_rgba(var(--rgb-brown),0.06)] max-[980px]:static max-[980px]:order-first"
                aria-label="Practical details"
              >
                <h2 className="m-0 pb-3 border-b border-[rgba(var(--rgb-beige),0.34)] text-text-primary font-body text-[17px] font-extrabold tracking-normal leading-tight uppercase">
                  Practical details
                </h2>
                <dl className="grid gap-0 mt-2">
                  <DetailRow label="Event language" value={language} />
                  <DetailRow label="Duration" value={duration} />
                  <DetailRow label="Availability" value={availability} />
                  <DetailRow label="Arrival" value="Please arrive 5-10 minutes before the event begins." />
                  <DetailRow label="Ticket provider" value={event.ticketProvider ?? "Billetto"} />
                </dl>
              </aside>
            </div>
          </Container>
        </section>
      </>
    );
}
