import Link from "next/link";
import { HandHelping, MapPin, Sparkles, Users, Wine } from "lucide-react";

export function Container({ children }) {
    return <div className="container">{children}</div>;
}

export function Section({ children, tight = false }) {
    return <section className={tight ? "section-tight" : "section"}>{children}</section>;
}

export function SectionLabel({ children }) {
    return <span className="label">{children}</span>;
}

export function SectionHeader({ label, title, text, level = 2 }) {
    const HeadingTag = `h${level}`;
    return (<div className="section-head">
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      <HeadingTag className="heading section-title">{title}</HeadingTag>
      {text ? <p>{text}</p> : null}
    </div>);
}

export function Button({ href, children, variant = "primary" }) {
    const variantClass = variant === "primary" ? "" : variant;
    const className = `btn ${variantClass}`.trim();
    if (!href) return <button className={className} type="button">{children}</button>;
    return href.startsWith("http") ? <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a> : <Link className={className} href={href}>{children}</Link>;
}

export function Card({ children, className = "", variant = "" }) {
    const variantClass = variant ? `card-${variant}` : "";
    return <div className={`card ${variantClass} ${className}`.trim()}>{children}</div>;
}

function TrustIcon({ item }) {
    const normalized = item.toLowerCase();
    const Icon = normalized.includes("guest") ? Users
        : normalized.includes("copenhagen") ? MapPin
          : normalized.includes("support") ? HandHelping
            : normalized.includes("catering") ? Wine
              : Sparkles;
    return <Icon aria-hidden="true" strokeWidth={1.8}/>;
}

export function PageHero({ label, title, text, image = "/images/hero.jpg", actions }) {
    return (<section className="hero">
      <Container>
        <div className="hero-grid">
          <div className="hero-copy">
            <SectionLabel>{label}</SectionLabel>
            <h1 className="heading page-hero-title">{title}</h1>
            <p>{text}</p>
            {actions ? <div className="hero-actions">{actions}</div> : null}
          </div>
          <div className="hero-image" style={{ backgroundImage: `url(${image})` }}>
            <div className="hero-note">A warm Copenhagen room for people, ideas, food and thoughtful gatherings.</div>
          </div>
        </div>
      </Container>
    </section>);
}

export function HomeHero({ label, title, text, microcopy, trustItems = [], image = "/images/hero.jpg", video, actions }) {
    return (<section className="home-hero-full" style={{ backgroundImage: `url(${image})` }}>
      {video ? <video className="home-hero-video" src={video} poster={image} autoPlay muted loop playsInline aria-hidden="true"/> : null}
      <div className="home-hero-overlay"/>
      <Container>
        <div className="home-hero-copy">
          <SectionLabel>{label}</SectionLabel>
          <h1 className="heading">{title}</h1>
          <p>{text}</p>
          {actions ? <div className="hero-actions">{actions}</div> : null}
          {microcopy ? <p className="home-hero-microcopy">{microcopy}</p> : null}
        </div>
      </Container>
      {trustItems.length ? (<ul className="home-hero-trust" aria-label="RORUM highlights">
          {trustItems.map((item) => <li key={item}><TrustIcon item={item}/><span>{item}</span></li>)}
        </ul>) : null}
    </section>);
}

export function CTASection({ title, text, href, label }) {
    return (<Section tight>
      <Container>
        <Card className="cta">
          <div>
            <SectionLabel>Next step</SectionLabel>
            <h2 className="heading cta-title">{title}</h2>
            <p>{text}</p>
          </div>
          <Button href={href}>{label}</Button>
        </Card>
      </Container>
    </Section>);
}
