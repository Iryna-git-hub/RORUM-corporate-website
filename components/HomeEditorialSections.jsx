import Link from "next/link";
import {
  ArrowRight,
  Coffee,
  HandHeart,
  SlidersHorizontal,
  UtensilsCrossed,
  Users,
  Wifi,
  Wrench,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeader,
  SectionLabel,
} from "@/components/ui";

export function EditorialFeatureSection({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  image,
  imageAlt,
  features = [],
  reversed = false,
  note,
}) {
  const hostFeatureIcons = [Users, SlidersHorizontal, HandHeart, Coffee];
  const privateFeatureIcons = [Users, Wifi, Coffee, UtensilsCrossed];
  const featureIcons = reversed ? privateFeatureIcons : hostFeatureIcons;
  return (
    <section
      className={`editorial-feature ${reversed ? "editorial-feature-reversed" : ""}`}
    >
      <Container>
        <div className="editorial-feature-grid">
          <div className="editorial-feature-copy">
            <SectionLabel>{eyebrow}</SectionLabel>
            <h2 className="heading section-title">{title}</h2>
            <p>{description}</p>
            {features.length ? (
              <ul className="editorial-feature-list">
                {features.map((feature, index) => {
                  const FeatureIcon = featureIcons[index] ?? Wrench;
                  return (
                    <li key={feature}>
                      <FeatureIcon aria-hidden="true" strokeWidth={1.9} />
                      <span>{feature}</span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {note ? <p className="editorial-feature-note">{note}</p> : null}
            <Link className="btn editorial-feature-btn" href={ctaHref}>
              <span>{ctaLabel}</span>
              <ArrowRight aria-hidden="true" strokeWidth={1.9} />
            </Link>
          </div>
          <div
            className="editorial-feature-media"
            role="img"
            aria-label={imageAlt}
            style={{ backgroundImage: `url(${image})` }}
          />
        </div>
      </Container>
    </section>
  );
}

export function ServicesTeaserSection({ services }) {
  return (
    <Section>
      <Container>
        <SectionHeader
          label="Services"
          title="Services for thoughtful gatherings"
        />
        <div className="services-teaser-grid">
          {services.map((service) => (
            <Link
              className="services-teaser-card"
              href={service.href}
              aria-label={service.cta ?? service.title}
              key={service.title}
            >
              <div className="services-teaser-media">
                <span
                  className="services-teaser-media-image"
                  style={{ backgroundImage: `url(${service.image})` }}
                  aria-hidden="true"
                />
              </div>
              <div className="services-teaser-copy">
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <span className="services-teaser-link">
                  <span>{service.cta}</span>
                  <ArrowRight aria-hidden="true" strokeWidth={1.9} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function CommunityTeaserSection() {
  const links = [
    { href: "/community-membership", label: "WECODA membership" },
    { href: "/work-with-us", label: "Work with us" },
    { href: "/volunteer", label: "Volunteer with us" },
  ];

  return (
    <section className="section-tight community-section">
      <Container>
        <div className="community-teaser">
          <div>
            <SectionLabel>Community</SectionLabel>
            <h2 className="heading section-title">More than a space</h2>
          </div>
          <p>
            RORUM is a place for events, ideas and meaningful connections. Join
            our community, collaborate with us or become part of the team behind
            the experiences.
          </p>
          <div className="community-teaser-links">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
