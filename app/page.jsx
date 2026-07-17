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
import {
  ArrowRight,
  HandHeart,
  HeartHandshake,
  MapPin,
  MessagesSquare,
  SlidersHorizontal,
  Users,
} from "lucide-react";

export const metadata = pageMetadata("/");
export default function Home() {
  const paths = [
    [
      "Attend Events",
      "Discover workshops, conversations, and community experiences in the heart of Copenhagen.",
      "/events",
      "/images/events/attend-events-quickpath.png",
    ],
    [
      "Host at RORUM",
      "A warm and flexible Copenhagen venue for workshops, meetings, and community gatherings of up to 12 guests.",
      "/host-at-rorum",
      "/images/private-meetings/private-meeting-room-9.png",
    ],
    [
      "Catering",
      "Fresh, simple and elegant catering for meetings, private gatherings, workshops and special moments.",
      "/catering",
      "/images/catering/catering-1.png",
    ],
    [
      "Event Decoration",
      "Flowers, table styling, candles and visual details designed to create a warm and memorable atmosphere.",
      "/event-decoration",
      "/images/decoration/decoration-1.png",
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
      href: "/event-decoration",
      image: "/images/decoration/decoration-1.png",
    },
  ];
  return (
    <>
      <HomeHero
        label="Copenhagen event space"
        title="A Copenhagen space for meaningful gatherings"
        text="Attend events or host your own gathering in a calm, thoughtfully prepared space with support from the RORUM team."
        trustItems={[
          "Up to 12 guests",
          "Central Copenhagen",
          "On-site support",
          "Catering & decoration available",
        ]}
        image="/images/hero.jpg"
        video="/videos/home-hero.mp4"
        actions={
          <>
            <Button href="/host-at-rorum">
              Host at RORUM
              <ArrowRight
                className="button-arrow"
                aria-hidden="true"
                strokeWidth={1.9}
              />
            </Button>
            <Button href="/events" variant="secondary">
              Attend Events
              <ArrowRight
                className="button-arrow"
                aria-hidden="true"
                strokeWidth={1.9}
              />
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
              label="What's on"
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
        eyebrow="Meaningful Gatherings"
        title="Attend Events"
        intro="Join meaningful gatherings at RORUM."
        description="Discover workshops, conversations, and community experiences in the heart of Copenhagen."
        features={[
          "Small-group experiences",
          "Up to 12 participants",
          "Central Copenhagen",
          "Community-focused",
        ]}
        featureIcons={[MessagesSquare, Users, MapPin, HeartHandshake]}
        ctaLabel="Attend Events"
        ctaHref="/events"
        image="/images/events/host-event-workshop-quickpath.png"
        imageAlt="Workshop gathering around a table at RORUM"
      />
      <EditorialFeatureSection
        eyebrow="Your Gathering"
        title="Host at RORUM"
        intro="Host your gathering at RORUM."
        description="A warm and flexible Copenhagen venue for workshops, meetings, and community gatherings of up to 12 guests."
        features={[
          "Up to 12 guests",
          "Flexible room setup",
          "Central Copenhagen",
          "On-site support",
        ]}
        featureIcons={[Users, SlidersHorizontal, MapPin, HandHeart]}
        ctaLabel="Host at RORUM"
        ctaHref="/host-at-rorum"
        image="/images/events/private-meetings.png"
        imageAlt="Small hosted meeting in the RORUM room"
        reversed
      />
      <ServicesTeaserSection services={services} />
      <CommunityTeaserSection />
      <CTASection
        variant="final"
        className="next-step-section-not-sure"
        eyebrow="Not sure where to start?"
        title="Let's shape your idea together"
        text="Whether you are planning a workshop, private session, community gathering, catering request or event styling idea — tell us what you have in mind, and we'll help you find the right format."
        href="/contact"
        label="Let's talk"
        faqQuestion="Have questions before you choose a format?"
        faqLabel="Read FAQ"
        links={[
          { href: "/events", label: "Attend Events" },
          { href: "/host-at-rorum", label: "Host at RORUM" },
          { href: "/catering", label: "Catering" },
          {
            href: "/event-decoration",
            label: "Event decoration",
          },
        ]}
      />
    </>
  );
}
