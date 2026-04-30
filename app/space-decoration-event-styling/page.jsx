import { EditorialCard, ImageGallery } from "@/components/Cards";
import { InquiryForm } from "@/components/InquiryForm";
import { Container, PageHero, Section, SectionHeader } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/space-decoration-event-styling");
export default function DecorationPage() {
    return (<>
      <PageHero label="Decoration and styling" title="Small details that change the room." text="Table setup, florals, seasonal decoration and atmosphere styling for events that should feel personal and considered." image="/images/decoration/decoration-1.png"/>
      <Section><Container><div className="grid-4">{["Table setup", "Florals", "Seasonal decoration", "Atmosphere styling"].map((item) => <EditorialCard key={item} title={item} text="A calm visual layer built around your gathering."/>)}</div></Container></Section>
      <Section tight><Container><SectionHeader label="Gallery" title="Editorial but approachable."/><ImageGallery images={["/images/decoration/decoration-1.png", "/images/decoration/decoration-2.png", "/images/catering/catering-1.png"]}/></Container></Section>
      <Section><Container><InquiryForm type="decoration" title="Decoration and styling inquiry"/></Container></Section>
    </>);
}
