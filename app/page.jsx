import { CardsGrid } from "@/app/shared";
import { EventCard } from "@/components/EventCard";
import { ServiceCard } from "@/components/Cards";
import { Button, Card, Container, CTASection, HomeHero, Section, SectionLabel } from "@/components/ui";
import { events, serviceCards } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/");
export default function Home() {
    const paths = [
        ["Events", "Join dinners, salons and workshops at RORUM.", "/events", "/images/events/meeting.png"],
        ["Host an Event", "Bring a thoughtful format to the RORUM community.", "/host-an-event", "/images/events/workshop.png"],
        ["Book the Space", "Reserve the room for a meeting, workshop or private gathering.", "/book-the-space", "/images/space/space-1.png"],
        ["Services", "Add catering, styling and hospitality details.", "/services", "/images/catering/catering-1.png"]
    ];
    return (<>
      <HomeHero label="Copenhagen Event Space" title="A space for people who bring people together" text="Join upcoming events, host your own workshop or gathering, or book Rorum for a private format." image="/images/hero.jpg" video="/videos/home-hero.mp4" actions={<><Button href="/host-an-event">Host an event</Button><Button href="/events" variant="secondary">Explore events</Button><Button href="/book-the-space" variant="secondary">Book the space</Button></>}/>
      <section className="section quick-paths-section">
        <Container>
          <div className="section-head"><SectionLabel>Quick paths</SectionLabel><h2 className="heading">Start with what you need.</h2></div>
          <CardsGrid items={paths}/>
        </Container>
      </section>
      <Section tight>
        <Container>
          <div className="section-head"><SectionLabel>Featured events</SectionLabel><h2 className="heading">Upcoming moments at RORUM.</h2></div>
          <div className="grid-3">{events.map((event) => <EventCard key={event.title} event={event}/>)}</div>
        </Container>
      </Section>
      <Section>
        <Container>
          <div className="split">
            <Card className="card-pad"><SectionLabel>Host</SectionLabel><h2 className="heading">A home for intimate formats.</h2><p className="muted">Workshops, talks, tastings, circles, supper clubs and creative sessions can all be shaped with the RORUM team.</p><Button href="/host-an-event">Plan an event</Button></Card>
            <Card className="card-pad"><SectionLabel>Book</SectionLabel><h2 className="heading">Use the space for focused work.</h2><p className="muted">Morning meetings, small team rituals, offsites and content shoots get a calmer setting than a generic rental room.</p><Button href="/book-the-space" variant="secondary">Book the space</Button></Card>
          </div>
        </Container>
      </Section>
      <Section tight>
        <Container>
          <div className="section-head"><SectionLabel>Services</SectionLabel><h2 className="heading">Food, flowers and the feeling of arrival.</h2></div>
          <div className="grid-2">{serviceCards.map((card) => <ServiceCard key={card.title} {...card}/>)}</div>
        </Container>
      </Section>
      <CTASection title="Want to be part of the room?" text="Volunteer, collaborate, facilitate or help shape the next RORUM gathering." href="/volunteer" label="Volunteer with us"/>
    </>);
}
