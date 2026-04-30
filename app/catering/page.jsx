import { EditorialCard, ImageGallery } from "@/components/Cards";
import { InquiryForm } from "@/components/InquiryForm";
import { Container, PageHero, Section, SectionHeader } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/catering");
export default function CateringPage() {
    return (<>
      <PageHero label="Catering" title="Seasonal food for intimate hosting." text="Coffee, breakfast, lunch boards, sweet pauses and evening bites that fit the rhythm of the room." image="/images/catering/catering-2.png"/>
      <Section><Container><div className="grid-3">{["Coffee and breakfast", "Lunch boards", "Evening bites and drinks"].map((item) => <EditorialCard key={item} title={item} text="Simple, generous and easy to serve during events."/>)}</div></Container></Section>
      <Section tight><Container><SectionHeader label="Examples" title="Warm, unfussy, photogenic."/><ImageGallery images={["/images/catering/catering-1.png", "/images/catering/catering-2.png", "/images/hero.jpg"]}/></Container></Section>
      <Section><Container><InquiryForm type="catering" title="Catering inquiry"/></Container></Section>
    </>);
}
