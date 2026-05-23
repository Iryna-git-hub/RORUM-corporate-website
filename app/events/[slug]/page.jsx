import { notFound } from "next/navigation";
import Link from "next/link";
import { EventList } from "@/components/EventCard";
import { Button, Card, Container, CTASection, PageHero, Section, SectionHeader, SectionLabel } from "@/components/ui";
import { events, siteUrl } from "@/lib/data";
import { ArrowLeft } from "lucide-react";

function getEvent(slug) {
    return events.find((event) => event.slug === slug);
}

export function generateStaticParams() {
    return events.filter((event) => event.slug).map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const event = getEvent(slug);
    if (!event) return {};
    const title = `${event.title} | RORUM`;
    const description = event.shortDescription;
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
    const date = new Date(`${event.date}T12:00:00`);
    const relatedEvents = (event.relatedEventSlugs ?? []).map((slug) => getEvent(slug)).filter(Boolean);
    const ticketLabel = event.isSoldOut ? "Join waitlist" : "Book ticket";
    const ticketHref = event.isSoldOut ? event.waitlistUrl : event.ticketUrl;
    const formattedDate = date.toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" });
    const whatToExpect = event.whatToExpect ?? event.included ?? [
        "Small group format",
        "Guided experience",
        "Warm RORUM atmosphere",
        "Tea & refreshments",
        "Time for conversation"
    ];
    const practicalDetails = event.practicalDetails ?? [
        { label: "Address", value: event.location ?? "Buermistersgade 26, 1 th, Copenhagen" },
        { label: "Arrival", value: "Please arrive 5-10 minutes before the event begins." },
        { label: "Duration", value: event.duration ?? event.time },
        { label: "Language", value: event.language },
        { label: "Tickets", value: event.isSoldOut ? "Join the waitlist for updates" : event.ticketProvider ? `Purchased externally via ${event.ticketProvider}` : "Available on request" }
    ];

    return (<>
      <PageHero label={event.category} title={event.title} text={event.shortDescription} image={event.image ?? "/images/hero.jpg"} actions={ticketHref ? <Button href={ticketHref}>{ticketLabel}</Button> : null}/>
      <Section>
        <Container>
          <Link className="event-back-link" href="/events"><ArrowLeft aria-hidden="true" strokeWidth={1.9}/>Back to Events</Link>
          <div className="event-detail-layout">
            <div className="event-detail-copy">
              <SectionLabel>About this event</SectionLabel>
              <p>{event.longDescription ?? event.shortDescription}</p>
              {whatToExpect.length ? (<div className="event-expect-section">
                <h2 className="heading event-subtitle">What to expect</h2>
                <div className="event-expect-chips">
                  {whatToExpect.map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>) : null}
              {event.host ? (<div className="event-hosted-by">
                <h2 className="heading event-subtitle">Hosted by</h2>
                <p>{event.host}</p>
              </div>) : null}
            </div>
            <Card className="card-pad event-detail-panel">
              <SectionLabel>Event details</SectionLabel>
              <dl className="detail-list">
                <div><dt>Date</dt><dd>{formattedDate}</dd></div>
                <div><dt>Time</dt><dd>{event.time}</dd></div>
                <div><dt>Location</dt><dd>{event.location ?? "Buermistersgade 26, 1 th, Copenhagen"}</dd></div>
                <div><dt>Price</dt><dd>{event.price}</dd></div>
                <div><dt>Language</dt><dd>{event.language}</dd></div>
                {event.ticketProvider ? <div><dt>Tickets</dt><dd>{event.isSoldOut ? "Sold out" : `Via ${event.ticketProvider}`}</dd></div> : null}
              </dl>
              <div className="hero-actions">
                {ticketHref ? <Button href={ticketHref}>{ticketLabel}</Button> : null}
                {event.calendarUrl ? <Button href={event.calendarUrl} variant="secondary">Add to calendar</Button> : null}
              </div>
              {event.isSoldOut ? <p className="provider">This event is currently sold out. Join the waitlist for updates.</p> : <p className="provider">Tickets via {event.ticketProvider}</p>}
            </Card>
          </div>
          {practicalDetails.length ? (<div className="event-practical-section">
            <h2 className="heading event-subtitle">Practical details</h2>
            <dl className="event-practical-list">
              {practicalDetails.map((detail) => <div key={detail.label}>
                <dt>{detail.label}</dt>
                <dd>{detail.value}</dd>
              </div>)}
            </dl>
          </div>) : null}
          <div className="event-ticket-cta">
            <div>
              <SectionLabel>Tickets</SectionLabel>
              <h2 className="heading event-subtitle">{event.isSoldOut ? "Join the waitlist" : "Ready to join us?"}</h2>
            </div>
            <div className="event-ticket-actions">
              {ticketHref ? <Button href={ticketHref}>{ticketLabel}</Button> : null}
              <Link className="event-back-link" href="/events"><ArrowLeft aria-hidden="true" strokeWidth={1.9}/>Back to Events</Link>
            </div>
          </div>
        </Container>
      </Section>
      {relatedEvents.length ? (<Section tight>
        <Container>
          <SectionHeader label="Related events" title="More moments at RORUM."/>
          <EventList events={relatedEvents}/>
        </Container>
      </Section>) : null}
      <CTASection title="Want to host your own event?" text="Bring your workshop, dinner, talk or community format to RORUM and we will explore the setup together." href="/host-an-event" label="Host an event"/>
    </>);
}
