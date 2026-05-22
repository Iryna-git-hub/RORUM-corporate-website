import { InquiryForm } from "@/components/InquiryForm";
import { EditorialCard, PackageGrid } from "@/components/Cards";
import { HorizontalGallery } from "@/components/HorizontalGallery";
import { Card, Container, Section, SectionHeader, SectionLabel } from "@/components/ui";
import { packages } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/private-events");

export default function PrivateEventsPage() {
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
            <SectionLabel>Private events</SectionLabel>
            <h1 className="heading">A calm room for focused gatherings.</h1>
            <p>Use RORUM for meetings, private workshops, planning days, photography, content and intimate celebrations.</p>
          </div>
          <HorizontalGallery images={galleryImages}/>
        </Container>
      </section>
      <Section><Container><SectionHeader label="Use cases" title="Flexible without feeling blank." level={3}/><div className="grid-3">{["Team session", "Creative production", "Private gathering"].map((item) => <EditorialCard key={item} title={item} text="A refined environment with modular tables, warm light and optional hospitality."/>)}</div></Container></Section>
      <Section tight><Container><SectionHeader label="Packages" title="Morning, afternoon or full day." level={3}/><PackageGrid items={packages.booking}/></Container></Section>
      <Section><Container><div className="split"><Card className="card-pad"><SectionLabel>Included and policy</SectionLabel><ul className="clean-list"><li>Tables, seating and simple room reset</li><li>Coffee, tea and food add-ons by request</li><li>Indicative cancellation policy for MVP: confirmed during quote</li></ul></Card><InquiryForm type="booking" title="Private event inquiry"/></div></Container></Section>
    </>);
}
