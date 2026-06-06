import { FAQAccordion } from "@/components/FAQAccordion";
import { Container, Section, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/faq");
export default function FAQPage() {
    return (<>
      <section className="faq-hero">
        <Container>
          <SectionLabel>FAQ</SectionLabel>
          <h1 className="heading faq-title">Frequently asked questions</h1>
        </Container>
      </section>
      <Section><Container><FAQAccordion /></Container></Section>
    </>);
}
