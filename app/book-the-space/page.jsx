import { InquiryForm } from "@/components/InquiryForm";
import { PackageCard } from "@/components/Cards";
import { Card, Container, PageHero, Section, SectionLabel } from "@/components/ui";
import { packages } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/book-the-space");
export default function BookSpacePage() {
    return (<>
      <PageHero label="Book the space" title="A calm room for focused gatherings." text="Use RORUM for meetings, private workshops, planning days, photography, content and intimate celebrations." image="/images/space/space-1.png"/>
      <Section><Container><div className="section-head"><SectionLabel>Use cases</SectionLabel><h2 className="heading">Flexible without feeling blank.</h2></div><div className="grid-3">{["Team session", "Creative production", "Private gathering"].map((item) => <Card key={item} className="card-pad"><h3 className="heading">{item}</h3><p className="muted">A refined environment with modular tables, warm light and optional hospitality.</p></Card>)}</div></Container></Section>
      <Section tight><Container><div className="section-head"><SectionLabel>Packages</SectionLabel><h2 className="heading">Morning, afternoon or full day.</h2></div><div className="grid-3">{packages.booking.map((item) => <PackageCard key={item.title} {...item}/>)}</div></Container></Section>
      <Section><Container><div className="split"><Card className="card-pad"><SectionLabel>Included and policy</SectionLabel><ul className="clean-list"><li>Tables, seating and simple room reset</li><li>Coffee, tea and food add-ons by request</li><li>Indicative cancellation policy for MVP: confirmed during quote</li></ul></Card><InquiryForm type="booking" title="Space booking inquiry"/></div></Container></Section>
    </>);
}
