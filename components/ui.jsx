import Link from "next/link";
export function Container({ children }) {
    return <div className="container">{children}</div>;
}
export function Section({ children, tight = false }) {
    return <section className={tight ? "section-tight" : "section"}>{children}</section>;
}
export function SectionLabel({ children }) {
    return <span className="label">{children}</span>;
}
export function Button({ href, children, variant = "primary" }) {
    const className = `btn ${variant === "secondary" ? "secondary" : ""} ${variant === "plum" ? "plum" : ""}`;
    return href.startsWith("http") ? <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a> : <Link className={className} href={href}>{children}</Link>;
}
export function Card({ children, className = "" }) {
    return <div className={`card ${className}`}>{children}</div>;
}
export function PageHero({ label, title, text, image = "/images/hero.jpg", actions }) {
    return (<section className="hero">
      <Container>
        <div className="hero-grid">
          <div className="hero-copy">
            <SectionLabel>{label}</SectionLabel>
            <h1 className="heading">{title}</h1>
            <p className="muted">{text}</p>
            {actions ? <div className="hero-actions">{actions}</div> : null}
          </div>
          <div className="hero-image" style={{ backgroundImage: `url(${image})` }}>
            <div className="hero-note muted">A warm Copenhagen room for people, ideas, food and thoughtful gatherings.</div>
          </div>
        </div>
      </Container>
    </section>);
}
export function HomeHero({ label, title, text, image = "/images/hero.jpg", actions }) {
    return (<section className="home-hero-full" style={{ backgroundImage: `url(${image})` }}>
      <div className="home-hero-overlay"/>
      <Container>
        <div className="home-hero-copy">
          <SectionLabel>{label}</SectionLabel>
          <h1 className="heading">{title}</h1>
          <p>{text}</p>
          {actions ? <div className="hero-actions">{actions}</div> : null}
        </div>
      </Container>
    </section>);
}
export function CTASection({ title, text, href, label }) {
    return (<Section tight>
      <Container>
        <Card className="cta">
          <div>
            <SectionLabel>Next step</SectionLabel>
            <h2 className="heading">{title}</h2>
            <p className="muted">{text}</p>
          </div>
          <Button href={href}>{label}</Button>
        </Card>
      </Container>
    </Section>);
}
