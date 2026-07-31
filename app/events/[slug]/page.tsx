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

function TicketButton({ event }: { event: RorumEvent }) {
    if (event.isSoldOut) {
        return <button className="event-detail-ticket-button is-disabled is-sold-out" type="button" disabled>Sold Out</button>;
    }

    if (!event.ticketUrl) {
        return <button className="event-detail-ticket-button is-disabled" type="button" disabled>Ticket link coming soon</button>;
    }

    return (
      <a className="event-detail-ticket-button" href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
        <span>Buy Ticket</span>
        <ArrowRight className="button-arrow" aria-hidden="true" strokeWidth={1.9} />
      </a>
    );
}

function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
    if (!value) return null;
    return (
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    );
}

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
      <div className={prominent ? "event-detail-info-item event-detail-info-price" : "event-detail-info-item"}>
        <span className="event-detail-info-icon">
          <Icon aria-hidden="true" strokeWidth={1.85} />
        </span>
        <div>
          <dt className="sr-only">{label}</dt>
          <dd>{value}</dd>
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
        ? <span className="event-availability-pill is-sold-out">Sold out</span>
        : typeof event.ticketsLeft === "number"
          ? `${event.ticketsLeft} ${event.ticketsLeft === 1 ? "spot" : "spots"} left`
          : null;

    return (
      <>
        <section className="event-detail-hero" aria-label={`${event.title} event image`}>
          <Image
            className={event.isSoldOut ? "event-detail-hero-image is-sold-out" : "event-detail-hero-image"}
            src={event.image ?? "/images/hero.jpg"}
            alt={`${event.title} event atmosphere`}
            fill
            sizes="100vw"
            priority
          />
          <div className="event-detail-hero-overlay" />
          <Container>
            <div className="event-detail-hero-copy">
              <time dateTime={event.date}>{fullDate}</time>
              <h1 className="heading event-detail-hero-title">{event.title}</h1>
            </div>
          </Container>
        </section>

        <section className="event-detail-info-bar" aria-label="Event information">
          <Container>
            <div className="event-detail-info-grid">
              <InfoGridItem icon={CalendarDays} label="Date" value={shortDate} />
              <InfoGridItem icon={Clock} label="Time" value={time} />
              <InfoGridItem icon={MapPin} label="Location" value={location} />
              <InfoGridItem icon={Ticket} label="Price" value={event.price} prominent />
              <div className="event-detail-info-action">
                <TicketButton event={event} />
              </div>
            </div>
          </Container>
        </section>

        <section className="section event-detail-main-section">
          <Container>
            <div className="event-detail-template-grid">
              <article className="event-detail-content">
                <section className="event-detail-content-section">
                  <h2 className="heading event-detail-section-title">Event overview</h2>
                  <p>{description}</p>
                  <EventShare title={event.title} text={event.shortDescription ?? "Join this event at RORUM"} url={`${siteUrl}/events/${event.slug}`} />
                </section>

                <section className="event-detail-content-section">
                  <h2 className="heading event-detail-section-title">What to expect</h2>
                  <ul className="event-detail-bullet-list">
                    {expectations.map((item) => (
                      <li key={item}>
                        <CircleCheckBig aria-hidden="true" strokeWidth={1.9} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </article>

              <aside className="event-detail-summary-card" aria-label="Practical details">
                <h2 className="event-detail-practical-title">Practical details</h2>
                <dl className="event-detail-summary-list">
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
