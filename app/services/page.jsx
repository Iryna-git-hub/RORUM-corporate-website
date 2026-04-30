import { ServiceCard } from "@/components/Cards";
import { Container, PageHero, Section, SectionHeader } from "@/components/ui";
import { serviceCards } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/services");
export default function ServicesPage() {
    return (<>
      <PageHero label="Services" title="Hospitality details for better events." text="Add food, drinks, table atmosphere and styling so your gathering feels complete from arrival to goodbye." image="/images/catering/catering-1.png"/>
      <Section><Container><SectionHeader label="Choose a service" title="Two focused offers for the MVP."/><div className="grid-2">{serviceCards.map((card) => <ServiceCard key={card.title} {...card}/>)}</div></Container></Section>
    </>);
}
