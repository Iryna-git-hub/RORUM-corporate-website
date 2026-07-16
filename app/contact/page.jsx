import { ContactForm } from "@/components/ContactForm";
import { SocialIcon } from "@/components/SocialIcon";
import { Container, FAQInlinePrompt, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { contactDetails, socialLinks } from "@/lib/siteConfig";
import { Mail, MapPin, Phone } from "lucide-react";

export const metadata = pageMetadata("/contact");

const mapQuery = encodeURIComponent(contactDetails.mapQueryAddress);

export default function ContactPage() {
  return (
    <>
      <section className="contact-page-hero">
        <Container>
          <div className="contact-page-grid">
            <div className="contact-page-info">
              <div className="contact-page-info-inner">
                <SectionLabel>Contact</SectionLabel>
                <h1 className="heading contact-page-title sr-only">
                  Contact us
                </h1>
                <div className="contact-page-copy">
                  <h2>We are here for you</h2>
                  <p className="contact-page-intro">
                    For more information about events, hosting a gathering at
                    RORUM, collaborations, catering, event decoration, or
                    practical details, please feel free to get in touch with us.
                  </p>
                </div>
                <div className="contact-detail-list">
                  <p>
                    <span className="contact-detail-icon" aria-hidden="true">
                      <MapPin aria-hidden="true" strokeWidth={1.8} />
                    </span>
                    <span>{contactDetails.address}</span>
                  </p>
                  <p>
                    <span className="contact-detail-icon" aria-hidden="true">
                      <Phone aria-hidden="true" strokeWidth={1.8} />
                    </span>
                    <a href={contactDetails.phoneHref}>
                      {contactDetails.phone}
                    </a>
                  </p>
                  <p>
                    <span className="contact-detail-icon" aria-hidden="true">
                      <Mail aria-hidden="true" strokeWidth={1.8} />
                    </span>
                    <a href={`mailto:${contactDetails.email}`}>
                      {contactDetails.email}
                    </a>
                  </p>
                </div>
                <div className="contact-follow">
                  <h2>Follow us</h2>
                </div>
                <div className="contact-socials" aria-label="Social links">
                  {socialLinks.map(({ href, label, icon, brandColor }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      style={{ "--social-brand-color": brandColor }}
                    >
                      <SocialIcon icon={icon} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div
              className="contact-page-map-wrap"
              aria-label="RORUM location map"
            >
              <div className="contact-page-form-wrap">
                <ContactForm />
              </div>
              <FAQInlinePrompt
                question="Looking for a quick answer first?"
                label="Read FAQ before sending a message"
              />
            </div>
          </div>
        </Container>
      </section>
      <section className="contact-map-section" aria-label="RORUM location map">
        <div className="contact-map-full" id="contact-map">
          <iframe
            title="RORUM location on Google Maps"
            src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  );
}
