import { EditorialCard } from "@/components/Cards";
import { Button, Card, Container, PageHero, Section, SectionHeader, SectionLabel } from "@/components/ui";
import { aboutValues } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/about");

export default function AboutPage() {
    return (<>
      <PageHero label="About RORUM" title="A small Copenhagen room for thoughtful gatherings." text="RORUM is a curated ground-floor creative and event space for workshops, meetings, private events, catering, styling and community moments." image="/images/space/space-2.png"/>
      <Section>
        <Container>
          <div className="split about-editorial">
            <div className="about-image" style={{ backgroundImage: "url(/images/hero.jpg)" }}/>
            <Card className="card-pad">
              <SectionLabel>Story</SectionLabel>
              <h2 className="heading section-title">Built for people who bring people together.</h2>
              <p>RORUM gives Copenhagen hosts, facilitators, teams and creative communities a warm room with enough structure to feel easy and enough character to feel personal.</p>
              <p>The space supports workshops, meetings, private events, content days, catering, space decoration and intimate community formats.</p>
            </Card>
          </div>
        </Container>
      </Section>
      <Section tight>
        <Container>
          <SectionHeader label="Values" title="How the room should feel."/>
          <div className="grid-3">{aboutValues.map((value) => <EditorialCard key={value.title} title={value.title} text={value.text}/>)}</div>
        </Container>
      </Section>
      <Section>
        <Container>
          <Card className="card-pad">
            <SectionLabel>Copenhagen context</SectionLabel>
            <h2 className="heading section-title">Grounded, accessible and close to real use.</h2>
            <p>RORUM is designed as a practical ground-floor setting: easy to arrive in, easy to reset and warm enough for both professional and community-led formats.</p>
            <div className="hero-actions">
              <Button href="/events" variant="secondary">View Events</Button>
              <Button href="/host-an-event">Host an Event</Button>
              <Button href="/private-events" variant="secondary">Private Events</Button>
            </div>
          </Card>
        </Container>
      </Section>
    </>);
}
