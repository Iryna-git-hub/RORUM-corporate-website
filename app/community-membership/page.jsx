import { EditorialCard } from "@/components/Cards";
import { Button, Card, Container, CTASection, PageHero, Section, SectionHeader, SectionLabel } from "@/components/ui";
import { communityPillars, membershipAudiences, membershipBenefits } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/community-membership");

export default function CommunityMembershipPage() {
    return (<>
      <PageHero label="Community membership" title="A practical creative community around the room." text="Join RORUM for events, useful introductions, shared hosting opportunities and grounded creative support in Copenhagen." image="/images/events/meeting.png" actions={<Button href="/contact">Join the Community</Button>}/>
      <Section>
        <Container>
          <div className="split">
            <Card className="card-pad">
              <SectionLabel>Mission</SectionLabel>
              <h2 className="heading section-title">Connection with a practical shape.</h2>
              <p className="muted">RORUM community membership is for people who want to meet through real formats: workshops, dinners, salons, volunteering, collaboration and shared creative work.</p>
            </Card>
            <Card className="card-pad">
              <SectionLabel>WECODA</SectionLabel>
              <p className="muted">RORUM is connected to WECODA as a practical community pathway: a way to support people in creating, hosting, learning and finding useful relationships around a physical space.</p>
              <p className="provider">Membership is currently free. Terms may change in the future.</p>
            </Card>
          </div>
        </Container>
      </Section>
      <Section tight>
        <Container>
          <SectionHeader label="Benefits" title="What membership supports."/>
          <div className="grid-3">{membershipBenefits.map((benefit) => <EditorialCard key={benefit} title={benefit}/>)}</div>
        </Container>
      </Section>
      <Section>
        <Container>
          <SectionHeader label="Community rhythm" title="Connect, create, grow."/>
          <div className="grid-3">{communityPillars.map((item) => <EditorialCard key={item.title} title={item.title} text={item.text}/>)}</div>
        </Container>
      </Section>
      <Section tight>
        <Container>
          <div className="split">
            <Card className="card-pad">
              <SectionLabel>Who it is for</SectionLabel>
              <ul className="clean-list">{membershipAudiences.map((item) => <li key={item}>{item}</li>)}</ul>
            </Card>
            <Card className="card-pad">
              <SectionLabel>Start here</SectionLabel>
              <p className="muted">Come to an event, volunteer for a room moment, or share the kind of collaboration you want to build with RORUM.</p>
              <div className="hero-actions">
                <Button href="/events" variant="secondary">View Events</Button>
                <Button href="/volunteer" variant="secondary">Volunteer With Us</Button>
                <Button href="/work-with-us" variant="secondary">Work With Us</Button>
              </div>
            </Card>
          </div>
        </Container>
      </Section>
      <CTASection title="Join the RORUM community." text="Membership is currently free and built around events, support and practical creative connection." href="/contact" label="Join the Community"/>
    </>);
}
