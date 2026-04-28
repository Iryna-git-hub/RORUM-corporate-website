import { EventCard } from "@/components/EventCard";
import { Button, Container, CTASection, PageHero, Section, SectionLabel } from "@/components/ui";
import { events } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/events");
export default function EventsPage() {
    return (<>
      <PageHero label="Events" title="Gatherings at RORUM." text="Browse upcoming dinners, salons and workshops shaped for a warm Copenhagen room." image="/images/events/workshop.png" actions={<Button href="/host-an-event" variant="secondary">Host your own event</Button>}/>
      <Section>
        <Container>
          <div className="section-head"><SectionLabel>Upcoming</SectionLabel><h2 className="heading">Upcoming moments at RORUM.</h2><p className="muted">Find community dinners, creative workshops and intimate gatherings shaped for the room.</p></div>
          <div className="grid-3">{events.map((event) => <EventCard key={event.title} event={event}/>)}</div>
        </Container>
      </Section>
      <CTASection title="Have a format for the room?" text="Send a hosting inquiry and we will explore audience, timing and setup together." href="/host-an-event" label="Host an event"/>
    </>);
}
