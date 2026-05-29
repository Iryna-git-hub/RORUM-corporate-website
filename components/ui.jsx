import Link from "next/link";
import {
  MapPin,
  MessageCircle,
  MessagesSquare,
  Smile,
  Sparkles,
  Users,
  Wine,
} from "lucide-react";

export function Container({ children }) {
  return <div className="container">{children}</div>;
}

export function Section({ children, tight = false }) {
  return (
    <section className={tight ? "section-tight" : "section"}>
      {children}
    </section>
  );
}

export function SectionLabel({ children }) {
  return <span className="label">{children}</span>;
}

export function SectionHeader({ label, title, text, level = 2 }) {
  const HeadingTag = `h${level}`;
  return (
    <div className="section-head">
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      <HeadingTag className="heading section-title">{title}</HeadingTag>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

export function Button({ href, children, variant = "primary" }) {
  const variantClass = variant === "primary" ? "" : variant;
  const className = `btn ${variantClass}`.trim();
  if (!href)
    return (
      <button className={className} type="button">
        {children}
      </button>
    );
  return href.startsWith("http") ? (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

export function Card({ children, className = "", variant = "" }) {
  const variantClass = variant ? `card-${variant}` : "";
  return (
    <div className={`card ${variantClass} ${className}`.trim()}>{children}</div>
  );
}

function TrustIcon({ item }) {
  const normalized = item.toLowerCase();
  const Icon = normalized.includes("guest")
    ? Users
    : normalized.includes("copenhagen")
      ? MapPin
      : normalized.includes("support")
        ? Smile
        : normalized.includes("catering")
          ? Wine
          : Sparkles;
  return <Icon aria-hidden="true" strokeWidth={1.8} />;
}

export function PageHero({
  label,
  title,
  text,
  image = "/images/hero.jpg",
  actions,
}) {
  return (
    <section className="hero">
      <Container>
        <div className="hero-grid">
          <div className="hero-copy">
            <SectionLabel>{label}</SectionLabel>
            <h1 className="heading page-hero-title">{title}</h1>
            <p>{text}</p>
            {actions ? <div className="hero-actions">{actions}</div> : null}
          </div>
          <div
            className="hero-image"
            style={{ backgroundImage: `url(${image})` }}
          >
            <div className="hero-note">
              A warm Copenhagen room for people, ideas, food and thoughtful
              gatherings.
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function HomeHero({
  label,
  title,
  text,
  microcopy,
  trustItems = [],
  image = "/images/hero.jpg",
  video,
  actions,
}) {
  return (
    <section
      className="home-hero-full"
      style={{ backgroundImage: `url(${image})` }}
    >
      {video ? (
        <video
          className="home-hero-video"
          src={video}
          poster={image}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ) : null}
      <div className="home-hero-overlay" />
      <Container>
        <div className="home-hero-copy">
          <SectionLabel>{label}</SectionLabel>
          <h1 className="heading">{title}</h1>
          <p>{text}</p>
          {actions ? <div className="hero-actions">{actions}</div> : null}
          {microcopy ? (
            <p className="home-hero-microcopy">{microcopy}</p>
          ) : null}
        </div>
      </Container>
      {trustItems.length ? (
        <ul className="home-hero-trust" aria-label="RORUM highlights">
          {trustItems.map((item) => (
            <li key={item}>
              <TrustIcon item={item} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function CTASection({
  title,
  text,
  href,
  label,
  eyebrow = "Next step",
  links = [],
  variant = "",
  className = "",
  cardClassName = "",
}) {
  const sectionClass =
    `section-tight next-step-section ${variant ? `next-step-section-${variant}` : ""} ${className}`.trim();
  const cardClass =
    `cta next-step-card ${variant ? `next-step-card-${variant}` : ""} ${cardClassName}`.trim();
  return (
    <section className={sectionClass}>
      <Container>
        <Card className={cardClass}>
          <div className="next-step-copy">
            <SectionLabel>{eyebrow}</SectionLabel>
            <h2 className="heading cta-title">{title}</h2>
            <p>{text}</p>
            {links.length ? (
              <div className="next-step-links" aria-label="Suggested paths">
                {links.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          {variant === "final" ? (
            <div className="final-cta-illustration" aria-hidden="true">
              <MessagesSquare strokeWidth={1.15} />
            </div>
          ) : null}
          <div className="next-step-action">
            <Button href={href}>
              {variant === "final" ? (
                <MessageCircle aria-hidden="true" strokeWidth={1.9} />
              ) : null}
              {label}
            </Button>
          </div>
        </Card>
      </Container>
    </section>
  );
}
