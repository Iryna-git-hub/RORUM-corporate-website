import { InquiryForm } from "@/components/InquiryForm";
import { Card, Container, PageHero, Section, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/work-with-us");
export default function WorkWithUsPage() {
    return (<>
      <PageHero label="Work with us" title="Collaborate with the RORUM ecosystem." text="For facilitators, chefs, photographers, stylists, producers and community partners interested in paid work or creative collaborations." image="/images/space/space-2.png"/>
      <Section><Container><div className="section-head"><SectionLabel>Collaboration types</SectionLabel><h2 className="heading">Bring a useful craft to the room.</h2></div><div className="grid-3">{["Facilitation", "Food and hospitality", "Creative production"].map((item) => <Card key={item} className="card-pad"><h3 className="heading">{item}</h3><p className="muted">Share your experience, links and the kind of collaboration you imagine.</p></Card>)}</div></Container></Section>
      <Section tight><Container><InquiryForm type="work" title="Work with us application" showPortfolio/></Container></Section>
    </>);
}
