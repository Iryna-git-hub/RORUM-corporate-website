import { ServiceCard } from "@/components/Cards";
import { Container, PageHero, Section, SectionLabel } from "@/components/ui";
import { serviceCards } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/services");
export default function ServicesPage() {
    return (<>
      <PageHero label="Services" title="Hospitality details for better events." text="Add food, drinks, table atmosphere and styling so your gathering feels complete from arrival to goodbye." image="/images/catering/catering-1.png"/>
      <Section><Container><div className="section-head"><SectionLabel>Choose a service</SectionLabel><h2 className="heading">Two focused offers for the MVP.</h2></div><div className="grid-2">{serviceCards.map((card) => <ServiceCard key={card.title} {...card}/>)}</div></Container></Section>
    </>);
}
