import { EventList } from "@/components/EventCard";
import { Container, CTASection, SectionHeader } from "@/components/ui";
import { events } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/events");
export default function EventsPage() {
    return (<>
      <section className="section events-page-section">
        <Container>
          <SectionHeader title="Upcoming events at RORUM." text="Find community workshops, creative salons and intimate gatherings shaped for the room." level={1}/>
          <EventList events={events}/>
        </Container>
      </section>
      <CTASection variant="host" title="Have a format for the room?" text="Send a hosting inquiry and we will explore audience, timing and setup together." href="/host-an-event" label="Host an event"/>
    </>);
}
