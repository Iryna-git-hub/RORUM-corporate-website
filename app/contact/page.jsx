import { InquiryForm } from "@/components/InquiryForm";
import { Container, PageHero, Section, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("/contact");
export default function ContactPage() {
    return (<>
      <PageHero label="Contact" title="Let us know what you are planning." text="For event questions, booking requests, collaborations and practical details, send a note and the RORUM team will reply." image="/images/hero.jpg"/>
      <Section>
        <Container>
          <div className="split">
            <InquiryForm type="contact" title="Contact RORUM"/>
            <div className="card">
              <div className="card-pad">
                <SectionLabel>Details</SectionLabel>
                <h2 className="heading">Copenhagen, Denmark</h2>
                <p className="muted">Email: hello@rorum.dk<br />Instagram: @rorum_space<br />Address: Copenhagen location placeholder for MVP</p>
              </div>
              <div className="map-placeholder">Map placeholder</div>
            </div>
          </div>
        </Container>
      </Section>
    </>);
}
