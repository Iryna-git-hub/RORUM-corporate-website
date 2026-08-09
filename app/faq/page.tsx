import { FAQAccordion } from "@/components/FAQAccordion";
import { Container, Section, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/faq");

export default function FAQPage() {
  return (
    <>
      <section className="bg-cream pt-[clamp(46px,7vw,86px)] pb-[clamp(24px,4vw,42px)]">
        <Container>
          <SectionLabel>FAQ</SectionLabel>
          <h1 className="font-heading font-medium text-text-primary tracking-[-0.03em] text-5xl leading-[1.02] max-w-none mt-4 mb-0">
            Frequently asked questions
          </h1>
        </Container>
      </section>
      <Section>
        <Container>
          <FAQAccordion />
        </Container>
      </Section>
    </>
  );
}
