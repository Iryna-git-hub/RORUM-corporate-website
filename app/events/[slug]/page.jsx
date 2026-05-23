import { notFound } from "next/navigation";
import Image from "next/image";
import { Container } from "@/components/ui";
import { EventShare } from "@/components/EventShare";
import { events, siteUrl } from "@/lib/data";
import { ArrowRight, BadgeCheck, CalendarDays, Clock, MapPin, Ticket } from "lucide-react";

const fallbackDescription = "Join us for an intimate gathering at RORUM, designed for people who enjoy thoughtful details, warm atmosphere and meaningful conversation.";
const fallbackLocation = "Buermistersgade 26, Copenhagen";
const fallbackExpectations = [
    "A small and welcoming group format",
    "A calm, thoughtfully prepared room",
    "Practical inspiration and hands-on guidance",
    "Time for conversation and questions",
    "Tea, water or simple refreshments"
];

function getEvent(slug) {
    return events.find((event) => event.slug === slug);
}

function formatFullDate(dateValue) {
    const date = new Date(`${dateValue}T12:00:00`);
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatShortDate(dateValue) {
    const date = new Date(`${dateValue}T12:00:00`);
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatTime(time) {
    return time?.replace("-", "\u2013") ?? "Time to be announced";
}

function getPracticalDetail(event, label) {
    return event.practicalDetails?.find((detail) => detail.label === label)?.value;
}

function TicketButton({ event }) {
    if (event.isSoldOut) {
        return <button className="event-detail-ticket-button is-disabled" type="button" disabled>Sold Out</button>;
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

function DetailRow({ label, value }) {
    if (!value) return null;
    return (
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    );
}

function InfoGridItem({ icon: Icon, label, value, prominent = false }) {
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

export function generateStaticParams() {
    return events.filter((event) => event.slug).map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }) {
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

export default async function EventDetailPage({ params }) {
    const { slug } = await params;
    const event = getEvent(slug);
    if (!event) notFound();

    const fullDate = formatFullDate(event.date);
    const shortDate = formatShortDate(event.date);
    const time = formatTime(event.time);
    const location = event.location ?? fallbackLocation;
    const duration = event.duration ?? getPracticalDetail(event, "Duration") ?? time;
    const language = event.language ?? getPracticalDetail(event, "Language") ?? "English";
    const description = event.longDescription ?? event.fullDescription ?? event.description ?? fallbackDescription;
    const expectations = event.whatToExpect?.length ? event.whatToExpect : fallbackExpectations;

    return (
      <>
        <section className="event-detail-hero" aria-label={`${event.title} event image`}>
          <Image
            className="event-detail-hero-image"
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
                  <h2 className="heading event-detail-section-title">Event Overview</h2>
                  <p>{description}</p>
                  <EventShare title={event.title} text={event.shortDescription ?? "Join this event at RORUM"} url={`${siteUrl}/events/${event.slug}`} />
                </section>

                <section className="event-detail-content-section">
                  <h2 className="heading event-detail-section-title">What to expect</h2>
                  <ul className="event-detail-bullet-list">
                    {expectations.map((item) => (
                      <li key={item}>
                        <BadgeCheck aria-hidden="true" strokeWidth={1.9} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </article>

              <aside className="event-detail-summary-card" aria-label="Practical Details">
                <h2 className="event-detail-practical-title">Practical Details</h2>
                <dl className="event-detail-summary-list">
                  <DetailRow label="Event language" value={language} />
                  <DetailRow label="Duration" value={duration} />
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
