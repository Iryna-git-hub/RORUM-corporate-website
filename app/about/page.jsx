import Link from "next/link";
import {
  CalendarCheck,
  CalendarPlus,
  ChefHat,
  CircleCheckBig,
  Coffee,
  HandHeart,
  Handshake,
  HeartHandshake,
  MapPin,
  MessagesSquare,
  Sparkles,
  Table2,
  Users,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import {
  Container,
  CTASection,
  Section,
  SectionHeader,
  SectionLabel,
} from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/about");

const pillars = [
  {
    title: "A hosted room",
    text: "RORUM is not only a rental space. The room is prepared, reset and supported so hosts can focus on the people in front of them.",
    icon: HeartHandshake,
  },
  {
    title: "Small by design",
    text: "The scale is intentional: intimate meetings, workshops, dinners and gatherings where people can actually hear each other.",
    icon: Users,
  },
  {
    title: "Food and atmosphere",
    text: "Catering, table styling and decoration can be added when the gathering needs more warmth, rhythm or visual care.",
    icon: Coffee,
  },
  {
    title: "Community with structure",
    text: "Events, membership, volunteering and collaborations give the room a life beyond bookings.",
    icon: Handshake,
  },
];

const principles = [
  [
    "01",
    "Calm first",
    "The space should help guests arrive, settle and understand where they are.",
  ],
  [
    "02",
    "Useful hospitality",
    "Coffee, water, food, layout and timing are treated as part of the experience.",
  ],
  [
    "03",
    "Flexible but not blank",
    "Tables, seating, screen, Wi-Fi and styling options give hosts a clear starting point.",
  ],
  [
    "04",
    "Personal without noise",
    "The room has character, but leaves enough space for each format to feel like its own.",
  ],
];

const formats = [
  ["Public events", CalendarCheck],
  ["Private meetings", Table2],
  ["Workshops", MessagesSquare],
  ["Catering", Coffee],
  ["Event decoration", Sparkles],
  ["Community projects", Handshake],
];

const heroLinks = [
  { href: "/catering", label: "Catering", icon: ChefHat, tone: "red" },
  {
    href: "/event-decoration",
    label: "Event decoration",
    icon: WandSparkles,
    tone: "red",
  },
  {
    href: "/host-an-event",
    label: "Host an event",
    icon: CalendarPlus,
    tone: "green",
  },
  {
    href: "/private-meetings",
    label: "Private meetings",
    icon: UsersRound,
    tone: "green",
  },
  {
    href: "/events",
    label: "Attend events",
    icon: CalendarCheck,
    tone: "green",
  },
];

const communityLinks = [
  { href: "/membership", label: "WECODA Membership", icon: Users },
  { href: "/work-with-us", label: "Work with us", icon: Handshake },
  { href: "/volunteer-with-us", label: "Volunteer with us", icon: HandHeart },
];

export default function AboutPage() {
  return (
    <>
      <section className="service-hero about-hero">
        <Container>
          <div className="about-hero-grid">
            <div className="service-hero-copy">
              <SectionLabel>About</SectionLabel>
              <h1 className="heading">About RORUM</h1>
              <p>
                A small Copenhagen space for meetings, events and carefully
                hosted moments.
              </p>
              <p>
                RORUM is a curated creative and event space in central
                Copenhagen, designed for small teams, founders, facilitators,
                hosts and community-minded guests who want gatherings to feel
                warm, clear and easy to be present in.
              </p>
              <div
                className="about-hero-actions about-services-actions"
                aria-label="RORUM service paths"
              >
                {heroLinks
                  .slice(0, 2)
                  .map(({ href, label, icon: Icon, tone }) => (
                    <Link
                      className={`about-inline-link about-inline-link-${tone}`}
                      href={href}
                      key={href}
                    >
                      <Icon aria-hidden="true" strokeWidth={1.8} />
                      {label}
                    </Link>
                  ))}
              </div>
              <div
                className="about-hero-actions"
                aria-label="RORUM event paths"
              >
                {heroLinks.slice(2).map(({ href, label, icon: Icon, tone }) => (
                  <Link
                    className={`about-inline-link about-inline-link-${tone}`}
                    href={href}
                    key={href}
                  >
                    <Icon aria-hidden="true" strokeWidth={1.8} />
                    {label}
                  </Link>
                ))}
              </div>
              <div className="about-community-block">
                <h2>Community</h2>
                <p>
                  RORUM is also shaped by members, collaborators and people who
                  want to support thoughtful local gatherings.
                </p>
                <div
                  className="about-hero-actions about-community-actions"
                  aria-label="Community paths"
                >
                  {communityLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      className="about-inline-link about-inline-link-white"
                      href={href}
                      key={href}
                    >
                      <Icon aria-hidden="true" strokeWidth={1.8} />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="about-visual-grid" aria-label="RORUM atmosphere">
              <img
                className="about-visual-main"
                src="/images/catering/catering-modern-plates.png"
                alt="Modern catering plates prepared for an event"
              />
              <img
                src="/images/space/space-about-room.png"
                alt="Warm RORUM room prepared for a meeting"
              />
              <img
                src="/images/decoration/decoration-floral-table.png"
                alt="Decorated table with flowers and place settings"
              />
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="about-statement">
            <div>
              <SectionLabel>What RORUM is</SectionLabel>
              <h2 className="heading section-title">
                A room with enough structure to feel simple, and enough warmth
                to feel personal.
              </h2>
            </div>
            <div className="about-statement-copy">
              <p>
                RORUM supports formats where the setting matters: focused
                meetings, workshops, talks, private dinners, community events,
                catering moments and decorated celebrations.
              </p>
              <p>
                The goal is not to make every event look the same. The goal is
                to give each gathering a calm foundation: a room that is ready,
                a layout that makes sense, and practical support before and
                during the event.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <section className="section-tight about-pillars-section">
        <Container>
          <SectionHeader
            label="How it works"
            title="The room, the support and the details work together."
          />
          <div className="about-pillars-grid">
            {pillars.map(({ title, text, icon: Icon }) => (
              <article className="about-pillar" key={title}>
                <Icon aria-hidden="true" strokeWidth={1.8} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <Section tight>
        <Container>
          <div className="about-principles">
            <div className="about-principles-intro">
              <SectionLabel>Experience principles</SectionLabel>
              <h2 className="heading section-title">
                Thoughtful, practical and quietly generous.
              </h2>
              <p>
                These principles shape the way RORUM approaches meetings, hosted
                events, catering, decoration and community collaborations.
              </p>
            </div>
            <div className="about-principles-list">
              {principles.map(([number, title, text]) => (
                <div className="about-principle" key={number}>
                  <span>{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <section className="section about-location-section">
        <Container>
          <div className="about-location-grid">
            <div className="about-location-copy">
              <SectionLabel>Copenhagen context</SectionLabel>
              <h2 className="heading section-title">
                Central, grounded and made for real use.
              </h2>
              <p>
                The space is located at Buermistersgade 26, 1 th, Copenhagen. It
                is designed as a practical setting for people who need a warm
                room, clear communication and a setup that can adapt without
                becoming complicated.
              </p>
              <div className="about-format-tags">
                {formats.map(([format, Icon]) => (
                  <span key={format}>
                    <Icon aria-hidden="true" strokeWidth={1.8} />
                    {format}
                  </span>
                ))}
              </div>
            </div>
            <div className="about-location-card">
              <MapPin aria-hidden="true" strokeWidth={1.8} />
              <h3 className="heading">What the space is suited for</h3>
              <ul>
                <li>
                  <CircleCheckBig aria-hidden="true" strokeWidth={1.9} />
                  Meetings and workshops for up to 12 guests
                </li>
                <li>
                  <CircleCheckBig aria-hidden="true" strokeWidth={1.9} />
                  Small public events and hosted formats
                </li>
                <li>
                  <CircleCheckBig aria-hidden="true" strokeWidth={1.9} />
                  Food, styling and decoration add-ons when needed
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <CTASection
        variant="final"
        className="next-step-section-not-sure"
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
