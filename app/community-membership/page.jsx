import {
  BadgeCheck,
  BriefcaseBusiness,
  Handshake,
  HeartHandshake,
  Lightbulb,
  Megaphone,
  Presentation,
  Scale,
} from "lucide-react";
import Image from "next/image";
import { Container, FAQInlinePrompt, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/community-membership");

const wecodaFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSeYRUem8RxNrDUDCvaCl2pMJ3fPWCkIJDNVlZ0G4574vrUDpA/viewform?usp=header";

const membershipWeekMedia = [
  {
    type: "image",
    src: "/images/membership-week/members-balloon-arch.png",
    alt: "WECODA members celebrating in the garden by a green and white balloon arch",
    featured: true,
  },
  {
    type: "video",
    src: "/videos/membership-week/members-week-01.mp4",
    label: "Muted video from the WECODA membership gathering",
  },
  {
    type: "image",
    src: "/images/membership-week/members-table-laughing.jpg",
    alt: "WECODA members smiling around a garden table",
  },
  {
    type: "image",
    src: "/images/membership-week/garden-table-catering.png",
    alt: "Catering table prepared for a WECODA member gathering",
  },
  {
    type: "video",
    src: "/videos/membership-week/members-week-02.mp4",
    label: "Muted video of members gathering outdoors",
  },
  {
    type: "image",
    src: "/images/membership-week/members-long-table.jpg",
    alt: "WECODA members seated at a long outdoor table",
  },
  {
    type: "image",
    src: "/images/membership-week/members-group-garden.jpg",
    alt: "Group portrait of WECODA members in the garden",
  },
  {
    type: "image",
    src: "/images/membership-week/members-portrait.png",
    alt: "Two WECODA members smiling at the gathering",
  },
];

const benefits = [
  {
    text: "meaningful networking and collaboration opportunities",
    icon: Handshake,
  },
  {
    text: "education and mentorship from practitioners",
    icon: Presentation,
  },
  {
    text: "financial and legal consultations (accounting, taxes, business structure)",
    icon: Scale,
  },
  {
    text: "support and promotion of your brand",
    icon: Megaphone,
  },
  {
    text: "partnerships and a strong entrepreneurial environment",
    icon: BriefcaseBusiness,
  },
  {
    text: "participation in exhibitions and curated events",
    icon: BadgeCheck,
  },
  {
    text: "access to RORUM space in central Copenhagen",
    icon: Lightbulb,
  },
  {
    text: "focus on mental well-being, balance, and sustainable growth",
    icon: HeartHandshake,
  },
];

function WecodaCtaLink({ children, className = "btn" }) {
  return (
    <a
      className={className}
      href={wecodaFormUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

export default function CommunityMembershipPage() {
  return (
    <>
      <section className="wecoda-hero">
        <Container>
          <div className="wecoda-hero-copy">
            <SectionLabel>Membership and community</SectionLabel>
            <h1 className="heading">Membership &amp; Community</h1>
            <div className="wecoda-hero-intro-grid">
              <div className="wecoda-hero-media wecoda-hero-logo-media">
                <Image
                  src="/images/membership-week/wecoda-logo.jpg"
                  alt="WECODA Women Entrepreneurs Commerce and Development Association logo"
                  width={220}
                  height={191}
                  priority
                />
              </div>
              <div className="wecoda-hero-text">
                <p>
                  At RORUM, we believe that growth happens in the right
                  environment — through people, shared ideas, and meaningful
                  connections.
                </p>
                <p>
                  That’s why we collaborate with WECODA (Women Entrepreneurs
                  Commerce &amp; Development Association) — a community for
                  women entrepreneurs and ambitious individuals who seek growth,
                  real results, and strong support systems.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-tight wecoda-network-section">
        <Container>
          <div className="wecoda-network-block">
            <p>WECODA is more than a network.</p>
            <p>
              It is a space where ideas evolve into partnerships, and
              connections turn into real opportunities.
            </p>
          </div>
        </Container>
      </section>

      <section className="section-tight wecoda-ecosystem-section">
        <Container>
          <p>
            Together, RORUM and WECODA create an ecosystem where business,
            creativity, and community come together.
          </p>
        </Container>
      </section>

      <section className="section wecoda-membership-week-section">
        <Container>
          <div className="wecoda-membership-week-grid">
            {membershipWeekMedia.map((item) => (
              <figure
                className={`wecoda-membership-week-item ${
                  item.featured ? "wecoda-membership-week-item-featured" : ""
                }`}
                key={item.src}
              >
                {item.type === "video" ? (
                  <video
                    src={item.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    aria-label={item.label}
                  />
                ) : (
                  <img src={item.src} alt={item.alt} loading="lazy" />
                )}
              </figure>
            ))}
          </div>
        </Container>
      </section>

      <section className="section wecoda-benefits-section">
        <Container>
          <h2 className="heading section-title">
            What you gain through WECODA:
          </h2>
          <div className="wecoda-benefits-grid">
            {benefits.map(({ text, icon: Icon }) => (
              <article className="wecoda-benefit-card" key={text}>
                <Icon aria-hidden="true" strokeWidth={1.7} />
                <p>— {text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section wecoda-final-section">
        <Container>
          <div className="wecoda-final-panel">
            <p className="wecoda-closing-statement">
              Most importantly — a sense of clarity, direction, and support on
              your journey.
            </p>
            <div className="wecoda-final-row">
              <div className="wecoda-final-copy">
                <p className="wecoda-final-label">
                  Join the WECODA community:
                </p>
                <p className="wecoda-final-note">
                  Membership is currently free. Terms may be subject to change
                  in the future.
                </p>
                <FAQInlinePrompt />
              </div>
              <WecodaCtaLink>Join WECODA</WecodaCtaLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
