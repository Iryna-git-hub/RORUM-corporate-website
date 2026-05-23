import { Container, SectionLabel } from "@/components/ui";

export function LegalPage({ title, subtitle, children }) {
    return (
      <>
        <section className="legal-hero">
          <Container>
            <div className="legal-hero-content">
              <SectionLabel>LEGAL</SectionLabel>
              <h1 className="heading legal-title">{title}</h1>
              <p className="legal-subtitle">{subtitle}</p>
              <p className="legal-updated">Last updated: May 2026</p>
            </div>
          </Container>
        </section>
        <section className="section legal-content-section">
          <Container>
            <div className="policy-content">{children}</div>
          </Container>
        </section>
      </>
    );
}
