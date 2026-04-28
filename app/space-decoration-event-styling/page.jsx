import { ImageGrid } from "@/components/Cards";
import { InquiryForm } from "@/components/InquiryForm";
import { Card, Container, PageHero, Section, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/space-decoration-event-styling");
export default function DecorationPage() {
    return (<>
      <PageHero label="Decoration and styling" title="Small details that change the room." text="Table setup, florals, seasonal decoration and atmosphere styling for events that should feel personal and considered." image="/images/decoration/decoration-1.png"/>
      <Section><Container><div className="grid-4">{["Table setup", "Florals", "Seasonal decoration", "Atmosphere styling"].map((item) => <Card key={item} className="card-pad"><h3 className="heading">{item}</h3><p className="muted">A calm visual layer built around your gathering.</p></Card>)}</div></Container></Section>
      <Section tight><Container><div className="section-head"><SectionLabel>Gallery</SectionLabel><h2 className="heading">Editorial but approachable.</h2></div><ImageGrid images={["/images/decoration/decoration-1.png", "/images/decoration/decoration-2.png", "/images/catering/catering-1.png"]}/></Container></Section>
      <Section><Container><InquiryForm type="decoration" title="Decoration and styling inquiry"/></Container></Section>
    </>);
}
