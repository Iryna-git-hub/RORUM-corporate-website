import { notFound } from "next/navigation";
import { EventList } from "@/components/EventCard";
import { Button, Card, Container, CTASection, PageHero, Section, SectionHeader, SectionLabel } from "@/components/ui";
import { events, siteUrl } from "@/lib/data";

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

    return (<>
      <PageHero label={event.category} title={event.title} text={event.shortDescription} image={event.image ?? "/images/hero.jpg"} actions={ticketHref ? <Button href={ticketHref}>{ticketLabel}</Button> : null}/>
      <Section>
        <Container>
          <div className="split">
            <div className="event-detail-copy">
              <SectionLabel>About this event</SectionLabel>
              <p className="muted">{event.longDescription ?? event.shortDescription}</p>
              {event.included?.length ? (<Card className="card-pad">
                <h3 className="heading">Included</h3>
                <ul className="clean-list">{event.included.map((item) => <li key={item}>{item}</li>)}</ul>
              </Card>) : null}
            </div>
            <Card className="card-pad event-detail-panel">
              <SectionLabel>Event details</SectionLabel>
              <dl className="detail-list">
                <div><dt>Date</dt><dd>{date.toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}</dd></div>
                <div><dt>Time</dt><dd>{event.time}</dd></div>
                <div><dt>Category</dt><dd>{event.category}</dd></div>
                <div><dt>Price</dt><dd>{event.price}</dd></div>
                <div><dt>Language</dt><dd>{event.language}</dd></div>
                {event.host ? <div><dt>Host</dt><dd>{event.host}</dd></div> : null}
                {event.ticketProvider ? <div><dt>Tickets</dt><dd>{event.isSoldOut ? "Sold out" : `Via ${event.ticketProvider}`}</dd></div> : null}
              </dl>
              <div className="hero-actions">
                {ticketHref ? <Button href={ticketHref}>{ticketLabel}</Button> : null}
                {event.calendarUrl ? <Button href={event.calendarUrl} variant="secondary">Add to calendar</Button> : null}
              </div>
              {event.isSoldOut ? <p className="provider">This event is currently sold out. Join the waitlist for updates.</p> : <p className="provider">Tickets via {event.ticketProvider}</p>}
            </Card>
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
