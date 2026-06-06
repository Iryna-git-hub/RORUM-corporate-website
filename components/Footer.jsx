import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui";
import { SocialIcon } from "@/components/SocialIcon";
import { contactDetails, socialLinks } from "@/lib/siteConfig";

const visitHostLinks = [
  { href: "/events", label: "Events" },
  { href: "/host-an-event", label: "Host an event" },
  { href: "/private-meetings", label: "Private meetings" },
];

const serviceLinks = [
  { href: "/catering", label: "Catering" },
  { href: "/event-decoration", label: "Event decoration" },
];

const communityLinks = [
  { href: "/membership", label: "WECODA membership" },
  { href: "/work-with-us", label: "Work with us" },
  { href: "/volunteer-with-us", label: "Volunteer with us" },
];

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

const legalLinks = [
  { href: "/terms", label: "Terms and conditions" },
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/cookie-policy", label: "Cookie policy" },
];

function FooterLinkColumn({ title, links }) {
  return (
    <nav className="footer-links" aria-label={title}>
      <span>{title}</span>
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <Container>
        <div className="footer-main">
          <div className="footer-brand">
            <Image
              className="footer-logo"
              src="/logos/rorum-creative-event-space.png"
              alt="RORUM Creative & Event Space"
              width={264}
              height={58}
            />
            <div className="footer-contact-stack">
              <p>
                <span className="footer-contact-icon" aria-hidden="true">
                  <MapPin aria-hidden="true" strokeWidth={1.8} />
                </span>
                {contactDetails.address}
              </p>
              <Link className="footer-map-link" href={contactDetails.mapHref}>
                View on map
              </Link>
              <p className="footer-phone-line">
                <span className="footer-contact-icon" aria-hidden="true">
                  <Phone aria-hidden="true" strokeWidth={1.8} />
                </span>
                {contactDetails.phone}
              </p>
              <a href={`mailto:${contactDetails.email}`}>
                <span className="footer-contact-icon" aria-hidden="true">
                  <Mail aria-hidden="true" strokeWidth={1.8} />
                </span>
                {contactDetails.email}
              </a>
            </div>
            <div className="footer-socials" aria-label="Social links">
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

          <div className="footer-columns">
            <FooterLinkColumn title="Visit & host" links={visitHostLinks} />
            <FooterLinkColumn title="Services" links={serviceLinks} />
            <FooterLinkColumn title="Community" links={communityLinks} />
            <FooterLinkColumn title="Company" links={companyLinks} />
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 RORUM. All rights reserved.</span>
          <nav className="footer-legal" aria-label="Legal links">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <span>
            Developed by{" "}
            <a
              href="https://irynadev.netlify.app"
              target="_blank"
              rel="noreferrer"
            >
              irynadev
            </a>
          </span>
        </div>
      </Container>
    </footer>
  );
}
