import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button, Container, Section, SectionHeader, SectionLabel } from "@/components/ui";

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
    note
}) {
    return (<section className={`editorial-feature ${reversed ? "editorial-feature-reversed" : ""}`}>
      <Container>
        <div className="editorial-feature-grid">
          <div className="editorial-feature-copy">
            <SectionLabel>{eyebrow}</SectionLabel>
            <h2 className="heading section-title">{title}</h2>
            <p>{description}</p>
            {features.length ? (<ul className="editorial-feature-list">
                {features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>) : null}
            {note ? <p className="editorial-feature-note">{note}</p> : null}
            <Button href={ctaHref}>{ctaLabel}</Button>
          </div>
          <div className="editorial-feature-media" role="img" aria-label={imageAlt} style={{ backgroundImage: `url(${image})` }}/>
        </div>
      </Container>
    </section>);
}

export function ServicesTeaserSection({ services }) {
    return (<Section>
      <Container>
        <SectionHeader
          label="Services"
          title="Services for thoughtful gatherings"
          text="From food to atmosphere, RORUM can support events both inside our space and at selected external locations."
        />
        <div className="services-teaser-grid">
          {services.map((service) => (<article className="services-teaser-card" key={service.title}>
            <div className="services-teaser-media" style={{ backgroundImage: `url(${service.image})` }}/>
            <div className="services-teaser-copy">
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <Link className="services-teaser-link" href={service.href}>
                <span>{service.cta}</span>
                <ArrowRight aria-hidden="true" strokeWidth={1.9}/>
              </Link>
            </div>
          </article>))}
        </div>
      </Container>
    </Section>);
}

export function CommunityTeaserSection() {
    const links = [
        { href: "/community-membership", label: "Membership" },
        { href: "/work-with-us", label: "Work with us" },
        { href: "/volunteer", label: "Volunteer with us" }
    ];

    return (<Section tight>
      <Container>
        <div className="community-teaser">
          <div>
            <SectionLabel>Community</SectionLabel>
            <h2 className="heading section-title">More than a space</h2>
          </div>
          <p>RORUM is a place for events, ideas and meaningful connections. Join our community, collaborate with us or become part of the team behind the experiences.</p>
          <div className="community-teaser-links">
            {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          </div>
        </div>
      </Container>
    </Section>);
}
