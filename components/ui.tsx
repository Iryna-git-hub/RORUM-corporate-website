import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleHelp,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Smile,
  Sparkles,
  Users,
  Wine,
} from "lucide-react";

export function Container({ children }: { children: ReactNode }) {
  return <div className="container">{children}</div>;
}

export function Section({
  children,
  tight = false,
}: {
  children: ReactNode;
  tight?: boolean;
}) {
  return (
    <section className={tight ? "section-tight" : "section"}>
      {children}
    </section>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <span className="label">{children}</span>;
}

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingTagName = `h${HeadingLevel}`;

export function SectionHeader({
  label,
  title,
  text,
  level = 2,
}: {
  label?: string;
  title: ReactNode;
  text?: string;
  level?: HeadingLevel;
}) {
  // `level` is restricted to 1-6 above, so this is always a valid heading tag.
  const HeadingTag = `h${level}` as HeadingTagName;
  return (
    <div className="section-head">
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      <HeadingTag className="heading section-title">{title}</HeadingTag>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "red"
  | "ghost"
  | "plum"
  | "icon"
  | "event-all";

export function Button({
  href,
  children,
  variant = "primary",
}: {
  href?: string;
  children: ReactNode;
  variant?: ButtonVariant;
}) {
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

// NOTE: variant generates a `card-{variant}` class, but no CSS rule exists
// for any of "editorial" | "service" | "package" | "event" today (verified
// against globals.css) — this hook is currently a no-op. Kept as-is (not a
// TS/Tailwind migration concern) but flagged here for future cleanup.
export type CardVariant = "editorial" | "service" | "package" | "event" | "";

export function Card({
  children,
  className = "",
  variant = "",
}: {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
}) {
  const variantClass = variant ? `card-${variant}` : "";
  return (
    <div className={`card ${variantClass} ${className}`.trim()}>{children}</div>
  );
}

function TrustIcon({ item }: { item: string }) {
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
}: {
  label?: string;
  title: ReactNode;
  text?: string;
  image?: string;
  actions?: ReactNode;
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
}: {
  label?: string;
  title: ReactNode;
  text?: string;
  microcopy?: string;
  trustItems?: string[];
  image?: string;
  video?: string;
  actions?: ReactNode;
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

export function FAQInlinePrompt({
  href = "/faq",
  // NOTE (pre-existing, not introduced by this migration): `question` and
  // `label` are accepted here for compatibility with CTASection's call site
  // (which passes faqQuestion/faqLabel) but are not actually rendered below
  // — the component always shows the hardcoded "Questions?" / "Read our
  // FAQs" copy. This means the custom per-page question text authored in
  // app/page.jsx, app/events/page.jsx and app/about/page.jsx is currently
  // silently dropped. Flagged for a follow-up decision; behavior preserved
  // as-is for this migration.
  question,
  label,
}: {
  href?: string;
  question?: string;
  label?: string;
}) {
  void question;
  void label;
  return (
    <p className="faq-inline-prompt">
      <span>Questions?</span>
      <Link className="faq-inline-prompt-link" href={href}>
        <span>Read our FAQs</span>
        <ArrowRight
          className="button-arrow"
          aria-hidden="true"
          strokeWidth={1.9}
        />
      </Link>
    </p>
  );
}

export interface CTALink {
  href: string;
  label: string;
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
  faqQuestion = "",
  faqLabel = "Read FAQ",
}: {
  title: ReactNode;
  text?: string;
  href?: string;
  label?: ReactNode;
  eyebrow?: string;
  links?: CTALink[];
  variant?: "final" | "host" | "";
  className?: string;
  cardClassName?: string;
  faqQuestion?: string;
  faqLabel?: string;
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
            {faqQuestion ? (
              <FAQInlinePrompt question={faqQuestion} label={faqLabel} />
            ) : null}
          </div>
        </Card>
      </Container>
    </section>
  );
}

export function FAQHelpStrip({
  title = "Questions before booking?",
  text = "Find answers about hosting at RORUM, catering, events and practical details before you send a request.",
  href = "/faq",
  label = "Read FAQ",
  className = "",
}: {
  title?: string;
  text?: string;
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <section
      className={`section-tight faq-help-strip-section ${className}`.trim()}
    >
      <Container>
        <div className="faq-help-strip">
          <div className="faq-help-icon" aria-hidden="true">
            <CircleHelp strokeWidth={1.7} />
          </div>
          <div className="faq-help-copy">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="heading">{title}</h2>
            <p>{text}</p>
          </div>
          <div className="faq-help-action">
            <Button href={href} variant="secondary">
              <span>{label}</span>
              <ArrowRight
                className="button-arrow"
                aria-hidden="true"
                strokeWidth={1.9}
              />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
