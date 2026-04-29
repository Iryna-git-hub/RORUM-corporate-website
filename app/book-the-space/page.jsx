import { InquiryForm } from "@/components/InquiryForm";
import { PackageCard } from "@/components/Cards";
import { HorizontalGallery } from "@/components/HorizontalGallery";
import { Card, Container, Section, SectionLabel } from "@/components/ui";
import { packages } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/book-the-space");
export default function BookSpacePage() {
    const galleryImages = [
        "/images/space/space-1.png",
        "/images/space/space-2.png",
        "/images/events/meeting.png",
        "/images/events/workshop.png",
        "/images/catering/catering-1.png",
        "/images/catering/catering-2.png",
        "/images/decoration/decoration-1.png",
        "/images/decoration/decoration-2.png",
        "/images/hero.jpg"
    ];
    return (<>
      <section className="book-space-hero">
        <Container>
          <div className="book-space-hero-copy">
            <SectionLabel>Book the space</SectionLabel>
            <h1 className="heading">A calm room for focused gatherings.</h1>
            <p className="muted">Use RORUM for meetings, private workshops, planning days, photography, content and intimate celebrations.</p>
          </div>
          <HorizontalGallery images={galleryImages}/>
        </Container>
      </section>
      <Section><Container><div className="section-head"><SectionLabel>Use cases</SectionLabel><h3 className="heading">Flexible without feeling blank.</h3></div><div className="grid-3">{["Team session", "Creative production", "Private gathering"].map((item) => <Card key={item} className="card-pad"><h3 className="heading">{item}</h3><p className="muted">A refined environment with modular tables, warm light and optional hospitality.</p></Card>)}</div></Container></Section>
      <Section tight><Container><div className="section-head"><SectionLabel>Packages</SectionLabel><h3 className="heading">Morning, afternoon or full day.</h3></div><div className="grid-3">{packages.booking.map((item) => <PackageCard key={item.title} {...item}/>)}</div></Container></Section>
      <Section><Container><div className="split"><Card className="card-pad"><SectionLabel>Included and policy</SectionLabel><ul className="clean-list"><li>Tables, seating and simple room reset</li><li>Coffee, tea and food add-ons by request</li><li>Indicative cancellation policy for MVP: confirmed during quote</li></ul></Card><InquiryForm type="booking" title="Space booking inquiry"/></div></Container></Section>
    </>);
}
