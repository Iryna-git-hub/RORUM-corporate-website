import { EventList } from "@/components/EventCard";
import { Button, Container, CTASection, PageHero, Section, SectionHeader } from "@/components/ui";
import { events } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/events");
export default function EventsPage() {
    return (<>
      <PageHero label="Events" title="Gatherings at RORUM." text="Browse upcoming dinners, salons and workshops shaped for a warm Copenhagen room." image="/images/events/workshop.png" actions={<Button href="/host-an-event" variant="secondary">Host your own event</Button>}/>
      <Section>
        <Container>
          <SectionHeader label="Upcoming" title="Upcoming moments at RORUM." text="Find community dinners, creative workshops and intimate gatherings shaped for the room."/>
          <EventList events={events}/>
        </Container>
      </Section>
      <CTASection title="Have a format for the room?" text="Send a hosting inquiry and we will explore audience, timing and setup together." href="/host-an-event" label="Host an event"/>
    </>);
}
