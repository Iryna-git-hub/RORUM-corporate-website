import Link from "next/link";
import {
  CalendarCheck,
  CalendarPlus,
  ChefHat,
  Coffee,
  HandHeart,
  Handshake,
  HeartHandshake,
  Users,
  WandSparkles,
} from "lucide-react";
import { Container, CTASection, Section, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/about");

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
    "The space has character, but leaves enough space for each format to feel like its own.",
  ],
];

const introLinks = [
  { href: "/host-at-rorum", label: "Host at RORUM", icon: CalendarPlus },
  { href: "/events", label: "Attend Events", icon: CalendarCheck },
];

const serviceLinks = [
  { href: "/catering", label: "Catering", icon: ChefHat },
  {
    href: "/event-decoration",
    label: "Event Decoration",
    icon: WandSparkles,
  },
];

const communityLinks = [
  { href: "/membership", label: "WECODA membership", icon: Users },
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
                RORUM is a curated creative and event space in central
                Copenhagen, designed for small teams, founders, facilitators,
                hosts and community-minded guests who want gatherings to feel
                warm, clear and easy to be present in.
              </p>
              <div
                className="about-hero-actions"
                aria-label="RORUM event paths"
              >
                {introLinks.map(({ href, label, icon: Icon }) => (
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
              <div className="about-community-block">
                <h2>Services</h2>
                <p>
                  Our catering and decoration services are available off-site
                  and can be brought to your chosen location.
                </p>
                <div
                  className="about-hero-actions about-services-actions"
                  aria-label="RORUM service paths"
                >
                  {serviceLinks.map(({ href, label, icon: Icon }) => (
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
                src="/images/about/about-room-borscht.png"
                alt="Ukrainian borscht with pampushky prepared for a RORUM gathering"
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

      <Section tight>
        <Container>
          <div className="about-principles">
            <div className="about-principles-intro">
              <SectionLabel>Experience principles</SectionLabel>
              <h2 className="heading section-title">
                Thoughtful and practical
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

      <CTASection
        variant="final"
        className="next-step-section-not-sure"
        eyebrow="NOT SURE WHERE TO START?"
        title="Let's shape your idea together"
        text="Whether you are planning a workshop, private session, community gathering, catering request or event styling idea — tell us what you have in mind, and we'll help you find the right format."
        href="/contact"
        label="Let's talk"
        faqQuestion="Still have practical questions?"
        faqLabel="Read FAQ"
        links={[
          { href: "/events", label: "Attend Events" },
          { href: "/host-at-rorum", label: "Host at RORUM" },
          { href: "/catering", label: "Catering" },
          {
            href: "/space-decoration-event-styling",
            label: "Event decoration",
          },
        ]}
      />
    </>
  );
}
