import { QuickPathsGrid } from "@/app/shared";
import { EventList } from "@/components/EventCard";
import { ServiceCard } from "@/components/Cards";
import { Button, Card, Container, CTASection, HomeHero, Section, SectionHeader, SectionLabel } from "@/components/ui";
import { homeEvents, serviceCards } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { ArrowRight } from "lucide-react";
export const metadata = pageMetadata("/");
export default function Home() {
    const paths = [
        ["Events", "Join dinners, salons and workshops at RORUM.", "/events", "/images/events/mosaic-variants/events-mosaic-3x4-border.jpg"],
        ["Host an Event", "Bring a thoughtful format to the RORUM community.", "/host-an-event", "/images/events/host-event-workshop-quickpath.png"],
        ["Book the Space", "Reserve the room for a meeting, workshop or private gathering.", "/book-the-space", "/images/space/space-1.png"],
        ["Services", "Add catering, styling and hospitality details.", "/services", "/images/services/services-split.png"]
    ];
    return (<>
      <HomeHero label="Copenhagen Event Space" title="A space for people who bring people together" text="Join upcoming events, host your own workshop or gathering, or book Rorum for a private format." image="/images/hero.jpg" video="/videos/home-hero.mp4" actions={<><Button href="/host-an-event">Host an event</Button><Button href="/events" variant="secondary">Explore events</Button><Button href="/book-the-space" variant="secondary">Book the space</Button></>}/>
      <section className="section quick-paths-section">
        <Container>
          <SectionHeader label="Quick paths" title="Start with what you need."/>
          <QuickPathsGrid items={paths}/>
        </Container>
      </section>
      <Section tight>
        <Container>
          <div className="event-section-head">
            <SectionHeader label="Future events" title="Upcoming moments at RORUM."/>
            <Button href="/events" variant="event-all"><span>View all events</span><ArrowRight className="event-all-icon" aria-hidden="true" strokeWidth={1.9}/></Button>
          </div>
          <EventList events={homeEvents} variant="scroll"/>
        </Container>
      </Section>
      <Section>
        <Container>
          <div className="split">
            <Card className="card-pad"><SectionLabel>Host</SectionLabel><h2 className="heading section-title">A home for intimate formats.</h2><p>Workshops, talks, tastings, circles, supper clubs and creative sessions can all be shaped with the RORUM team.</p><Button href="/host-an-event">Plan an event</Button></Card>
            <Card className="card-pad"><SectionLabel>Book</SectionLabel><h2 className="heading section-title">Use the space for focused work.</h2><p>Morning meetings, small team rituals, offsites and content shoots get a calmer setting than a generic rental room.</p><Button href="/book-the-space" variant="secondary">Book the space</Button></Card>
          </div>
        </Container>
      </Section>
      <Section tight>
        <Container>
          <SectionHeader label="Services" title="Food, flowers and the feeling of arrival."/>
          <div className="grid-2">{serviceCards.map((card) => <ServiceCard key={card.title} {...card}/>)}</div>
        </Container>
      </Section>
      <CTASection title="Want to be part of the room?" text="Volunteer, collaborate, facilitate or help shape the next RORUM gathering." href="/volunteer" label="Volunteer with us"/>
    </>);
}
