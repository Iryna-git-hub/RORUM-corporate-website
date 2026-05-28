import { InquiryForm } from "@/components/InquiryForm";
import { PackageGrid } from "@/components/Cards";
import { HorizontalGallery } from "@/components/HorizontalGallery";
import { Container, SectionHeader, SectionLabel } from "@/components/ui";
import { packages } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { Coffee, ConciergeBell, CookingPot, Handshake, Monitor, Sofa, Utensils } from "lucide-react";

export const metadata = pageMetadata("/private-meetings");

export default function PrivateMeetingsPage() {
    const galleryImages = [
        "/images/private-meetings/private-meeting-room-7.png",
        "/images/private-meetings/private-meeting-people-1.png",
        "/images/private-meetings/private-meeting-room-3.png",
        "/images/private-meetings/private-meeting-room-10.png",
        "/images/private-meetings/private-meeting-people-3.png",
        "/images/private-meetings/private-meeting-room-1.png",
        "/images/private-meetings/private-meeting-room-8.png",
        "/images/private-meetings/private-meeting-room-5.png",
        "/images/private-meetings/private-meeting-people-2.png",
        "/images/private-meetings/private-meeting-room-11.png",
        "/images/private-meetings/private-meeting-room-2.png",
        "/images/private-meetings/private-meeting-room-6.png",
        "/images/private-meetings/private-meeting-room-9.png",
        "/images/private-meetings/private-meeting-room-4.png"
    ];
    const includedItems = [
        ["Private use of the space", Sofa],
        ["Basic setup: screen, Wi-Fi, tables and chairs", Monitor],
        ["Coffee, tea and water", Coffee],
        ["On-site support and hosting", Handshake],
        ["Simple and thoughtful interior setup", ConciergeBell]
    ];
    const optionalItems = [
        ["Catering", Utensils],
        ["Customized food options", CookingPot]
    ];
    return (<>
      <section className="book-space-hero private-meetings-hero">
        <Container>
          <div className="book-space-hero-copy">
            <SectionLabel>Private meetings</SectionLabel>
            <h1 className="heading">Meetings &amp; Private Events at RORUM</h1>
            <p>RORUM is a small, curated space in central Copenhagen, designed for meetings, workshops, and private events for up to 12 guests. Ideal for small teams, founders, and curated gatherings.</p>
            <p>We offer a calm and well-organized setting, with support before and during your event.</p>
          </div>
          <HorizontalGallery images={galleryImages}/>
        </Container>
      </section>
      <section className="section meeting-includes-section">
        <Container>
          <SectionHeader label="Session details" title="Each session includes" level={3}/>
          <div className="meeting-info-grid">
            <div className="meeting-info-card meeting-info-card-main">
              {includedItems.map(([item, Icon]) => (
                <div className="meeting-info-item" key={item}>
                  <span><Icon aria-hidden="true" strokeWidth={1.8}/></span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
            <div className="meeting-info-card meeting-info-card-optional">
              <h3 className="heading">Optional</h3>
              {optionalItems.map(([item, Icon]) => (
                <div className="meeting-info-item" key={item}>
                  <span><Icon aria-hidden="true" strokeWidth={1.8}/></span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
      <section className="section-tight private-meeting-packages-section">
        <Container>
          <SectionHeader label="Packages" title="Meeting Packages" level={3}/>
          <PackageGrid items={packages.booking}/>
          <div className="meeting-cancellation-policy">
            <p className="meeting-cancellation-title">Cancellation Policy:</p>
            <ul>
              <li>Free cancellation up to 5 working days before</li>
              <li>50% charge if cancelled within 24 hours before the event</li>
              <li>100% charge if cancelled less than 24 hours before</li>
            </ul>
          </div>
        </Container>
      </section>
      <section className="section form-section">
        <Container>
          <div className="split private-meeting-request">
            <div className="private-meeting-request-copy">
              <SectionLabel>Formal private meeting request</SectionLabel>
              <h2 className="heading section-title">Plan your session with us</h2>
              <p>If you would like to plan a session with us, feel free to get in touch.</p>
              <p>We will help you find the right format for your needs.</p>
            </div>
            <InquiryForm
              type="booking"
              title="Private Meeting Request"
              intro="If you would like to plan a session with us, feel free to get in touch. We will help you find the right format for your needs."
              submitLabel="Send Request"
            />
          </div>
        </Container>
      </section>
    </>);
}
