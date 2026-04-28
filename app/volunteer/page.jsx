import { InquiryForm } from "@/components/InquiryForm";
import { Card, Container, PageHero, Section, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/volunteer");
export default function VolunteerPage() {
    return (<>
      <PageHero label="Volunteer with us" title="Help create generous community moments." text="Volunteer at RORUM events through welcome, light setup, guest flow and warm hospitality support." image="/images/events/meeting.png"/>
      <Section><Container><div className="grid-3">{["Guest welcome", "Room reset", "Event support"].map((item) => <Card key={item} className="card-pad"><h3 className="heading">{item}</h3><p className="muted">Support the small details that help guests feel oriented and cared for.</p></Card>)}</div></Container></Section>
      <Section tight><Container><div className="split"><Card className="card-pad"><SectionLabel>Benefits</SectionLabel><ul className="clean-list"><li>Meet Copenhagen creatives and hosts</li><li>Learn event flow and hospitality basics</li><li>Join selected community gatherings</li></ul></Card><InquiryForm type="volunteer" title="Volunteer application"/></div></Container></Section>
    </>);
}
