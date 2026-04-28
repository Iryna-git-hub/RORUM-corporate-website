import { FAQAccordion } from "@/components/FAQAccordion";
import { Container, PageHero, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/faq");
export default function FAQPage() {
    return (<>
      <PageHero label="FAQ" title="Practical answers before you write." text="A simple MVP knowledge base for events, hosting, bookings, services and volunteering." image="/images/space/space-1.png"/>
      <Section><Container><FAQAccordion /></Container></Section>
    </>);
}
