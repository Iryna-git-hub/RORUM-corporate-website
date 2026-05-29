import { QuickPathsGrid } from "@/app/shared";
import { EventList } from "@/components/EventCard";
import {
  CommunityTeaserSection,
  EditorialFeatureSection,
  ServicesTeaserSection,
} from "@/components/HomeEditorialSections";
import {
  Button,
  Container,
  CTASection,
  HomeHero,
  Section,
  SectionHeader,
} from "@/components/ui";
import { homeEvents } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { ArrowRight } from "lucide-react";
export const metadata = pageMetadata("/");
export default function Home() {
  const paths = [
    [
      "Events",
      "Join dinners, salons and workshops at RORUM.",
      "/events",
      "/images/events/mosaic-variants/events-mosaic-3x4-border.jpg",
    ],
    [
      "Host an Event",
      "Bring a thoughtful format to the RORUM community.",
      "/host-an-event",
      "/images/events/host-event-workshop-quickpath.png",
    ],
    [
      "Private Meetings",
      "Plan a hosted meeting, workshop or private gathering.",
      "/private-meetings",
      "/images/space/space-1.png",
    ],
    [
      "Services",
      "Add catering, styling and hospitality details.",
      "/services",
      "/images/services/services-split.png",
    ],
  ];
  const services = [
    {
      title: "Catering",
      text: "Fresh, simple and elegant catering for meetings, private gatherings, workshops and special moments.",
      cta: "Explore catering",
      href: "/catering",
      image: "/images/catering/catering-1.png",
    },
    {
      title: "Event decoration",
      text: "Flowers, table styling, candles and visual details designed to create a warm and memorable atmosphere.",
      cta: "Explore decoration",
      href: "/space-decoration-event-styling",
      image: "/images/decoration/decoration-1.png",
    },
  ];
  return (
    <>
      <HomeHero
        label="Copenhagen event space"
        title="A Copenhagen space for meaningful gatherings"
        text="Host public events and private meetings in a calm, thoughtfully prepared space with support from the RORUM team."
        trustItems={[
          "4–15 guests",
          "Central Copenhagen",
          "On-site support",
          "Catering & decoration available",
        ]}
        image="/images/hero.jpg"
        video="/videos/home-hero.mp4"
        actions={
          <>
            <Button href="/host-an-event">Host an Event</Button>
            <Button href="/events" variant="secondary">
              Explore Events
            </Button>
            <Button href="/private-meetings" variant="secondary">
              Private Meetings
            </Button>
          </>
        }
      />
      <section className="section quick-paths-section">
        <Container>
          <SectionHeader
            label="Quick paths"
            title="Start with what you need."
          />
          <QuickPathsGrid items={paths} />
        </Container>
      </section>
      <Section tight>
        <Container>
          <div className="event-section-head">
            <SectionHeader
              label="Future events"
              title="Upcoming events at RORUM."
            />
            <Button href="/events" variant="event-all">
              <span>View all events</span>
              <ArrowRight
                className="event-all-icon"
                aria-hidden="true"
                strokeWidth={1.9}
              />
            </Button>
          </div>
          <EventList events={homeEvents} variant="scroll" />
        </Container>
      </Section>
      <EditorialFeatureSection
        eyebrow="FOR HOSTS & FACILITATORS"
        title="Host an event at RORUM"
        description="A calm, intimate space in central Copenhagen for workshops, classes, circles, networking events and community gatherings. Designed for facilitators, teachers, creatives and hosts who want to bring people together in a thoughtful setting."
        features={[
          "4-15 guests",
          "Flexible setup",
          "On-site support",
          "Tea & water included",
        ]}
        ctaLabel="Host an event"
        ctaHref="/host-an-event"
        image="/images/events/host-event-workshop-quickpath.png"
        imageAlt="Workshop gathering around a table at RORUM"
      />
      <EditorialFeatureSection
        eyebrow="PRIVATE & CORPORATE GATHERINGS"
        title="Private meetings"
        description="Plan a focused meeting, workshop or private gathering in a hosted space with a warm atmosphere, simple setup and thoughtful support throughout your session. Ideal for teams, founders and intimate groups of up to 12 guests."
        features={[
          "Up to 12 guests",
          "Screen & Wi-Fi",
          "Coffee, tea & water",
          "Optional catering",
        ]}
        ctaLabel="Plan a Private Meeting"
        ctaHref="/private-meetings"
        image="/images/events/private-meetings.png"
        imageAlt="Small private meeting in the RORUM room"
        reversed
      />
      <ServicesTeaserSection services={services} />
      <CommunityTeaserSection />
      <CTASection
        variant="final"
        eyebrow="NOT SURE WHERE TO START?"
        title="Let's shape your idea together"
        text="Whether you are planning a workshop, private session, community gathering, catering request or event styling idea — tell us what you have in mind, and we'll help you find the right format."
        href="/contact"
        label="Let's Talk"
        links={[
          { href: "/host-an-event", label: "Host an Event" },
          { href: "/private-meetings", label: "Private Meetings" },
          { href: "/catering", label: "Catering" },
          {
            href: "/space-decoration-event-styling",
            label: "Event Decoration",
          },
        ]}
      />
    </>
  );
}
