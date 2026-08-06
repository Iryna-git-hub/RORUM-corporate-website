import type { CSSProperties } from "react";
import { ContactForm } from "@/components/ContactForm";
import { SocialIcon } from "@/components/SocialIcon";
import { Container, FAQInlinePrompt, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { contactDetails, socialLinks } from "@/lib/siteConfig";
import { Mail, MapPin, Phone } from "lucide-react";

type BrandColorStyle = CSSProperties & { "--social-brand-color": string };

export const metadata = pageMetadata("/contact");

const mapQuery = encodeURIComponent(contactDetails.mapQueryAddress);

export default function ContactPage() {
  return (
    <>
      <section className="contact-page-hero bg-cream p-[65px_0_clamp(42px,7vw,88px)] max-tablet:p-[38px_0_42px]">
        <Container>
          <div className="contact-page-grid grid grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)] gap-[clamp(26px,5vw,64px)] items-start max-[980px]:grid-cols-1">
            <div className="contact-page-info grid items-start min-h-full">
              <div className="contact-page-info-inner grid gap-5 content-start max-w-[650px] max-[980px]:max-w-[760px]">
                <SectionLabel>Contact</SectionLabel>
                <h1 className="heading contact-page-title sr-only m-0 max-w-[12ch] text-[3rem] leading-[0.98] font-medium max-tablet:text-[clamp(2rem,10vw,3.2rem)] max-[980px]:max-w-[14ch]">
                  Contact us
                </h1>
                <div className="contact-page-copy grid gap-2">
                  <h2>We are here for you</h2>
                  <p className="contact-page-intro m-0 max-w-[56ch] text-text-primary text-[1rem] leading-[1.65]">
                    For more information about events, hosting a gathering at
                    RORUM, collaborations, catering, event decoration, or
                    practical details, please feel free to get in touch with us.
                  </p>
                </div>
                <div className="contact-detail-list grid gap-3">
                  <p>
                    <span className="contact-detail-icon inline-flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(var(--rgb-red),0.1)] text-red leading-[1]" aria-hidden="true">
                      <MapPin aria-hidden="true" strokeWidth={1.8} />
                    </span>
                    <span>{contactDetails.address}</span>
                  </p>
                  <p>
                    <span className="contact-detail-icon inline-flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(var(--rgb-red),0.1)] text-red leading-[1]" aria-hidden="true">
                      <Phone aria-hidden="true" strokeWidth={1.8} />
                    </span>
                    <a href={contactDetails.phoneHref}>
                      {contactDetails.phone}
                    </a>
                  </p>
                  <p>
                    <span className="contact-detail-icon inline-flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(var(--rgb-red),0.1)] text-red leading-[1]" aria-hidden="true">
                      <Mail aria-hidden="true" strokeWidth={1.8} />
                    </span>
                    <a href={`mailto:${contactDetails.email}`}>
                      {contactDetails.email}
                    </a>
                  </p>
                </div>
                <div className="contact-follow grid gap-2">
                  <h2>Follow us</h2>
                </div>
                <div
                  className="contact-socials flex flex-wrap gap-[10px] mt-1"
                  aria-label="Social links"
                >
                  {socialLinks.map(({ href, label, icon, brandColor }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      style={{ "--social-brand-color": brandColor } as BrandColorStyle}
                    >
                      <SocialIcon icon={icon} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div
              className="contact-page-map-wrap grid items-start min-h-full"
              aria-label="RORUM location map"
            >
              <div className="contact-page-form-wrap w-full mb-4">
                <ContactForm />
              </div>
              <FAQInlinePrompt
                question="Have questions?"
                label="Read FAQ"
              />
            </div>
          </div>
        </Container>
      </section>
      <section
        className="contact-map-section bg-white"
        aria-label="RORUM location map"
      >
        <div
          className="contact-map-full w-full min-h-[clamp(360px,34vw,520px)] scroll-mt-[78px] bg-white overflow-hidden max-[980px]:min-h-[clamp(320px,54vw,430px)] max-[980px]:scroll-mt-[68px]"
          id="contact-map"
        >
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
