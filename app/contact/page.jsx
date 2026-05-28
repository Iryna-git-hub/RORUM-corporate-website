import { ContactForm } from "@/components/ContactForm";
import { contactDetails, socialLinks } from "@/components/Footer";
import { Container, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { Mail, MapPin, Phone } from "lucide-react";

export const metadata = pageMetadata("/contact");

const mapQuery = encodeURIComponent(contactDetails.address);

export default function ContactPage() {
    return (<>
      <section className="contact-page-hero">
        <Container>
          <div className="contact-page-grid">
            <div className="contact-page-info">
              <div className="contact-page-info-inner">
                <SectionLabel>Contact</SectionLabel>
                <h1 className="heading contact-page-title">Contact Us</h1>
                <div className="contact-page-copy">
                  <h2>We are here for you</h2>
                  <p className="contact-page-intro">More info about events, requesting a meeting room, collaboration, catering, event decoration, and practical details, please feel free to get in touch with us.</p>
                </div>
                <div className="contact-detail-list">
                  <p><MapPin aria-hidden="true" strokeWidth={1.8}/><span>{contactDetails.address}</span></p>
                  <p><Phone aria-hidden="true" strokeWidth={1.8}/><a href={`tel:${contactDetails.phone.replace(/\s/g, "")}`}>{contactDetails.phone}</a></p>
                  <p><Mail aria-hidden="true" strokeWidth={1.8}/><a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a></p>
                </div>
                <div className="contact-follow">
                  <h2>Follow us</h2>
                </div>
                <div className="contact-socials" aria-label="Social links">
                  {socialLinks.map(({ href, label, mark }) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>
                      <span aria-hidden="true">{mark}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="contact-page-map-wrap" id="map" aria-label="RORUM location map">
              <iframe
                title="RORUM location on Google Maps"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </Container>
      </section>
      <section className="contact-form-section" aria-label="Contact form">
        <Container>
          <div className="contact-page-form-wrap">
            <ContactForm/>
          </div>
        </Container>
      </section>
    </>);
}
