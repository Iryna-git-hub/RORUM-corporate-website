import type { CSSProperties } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui";
import { SocialIcon } from "@/components/SocialIcon";
import { contactDetails, socialLinks } from "@/lib/siteConfig";

type BrandColorStyle = CSSProperties & { "--social-brand-color": string };

interface FooterLink {
  href: string;
  label: string;
}

const visitHostLinks: FooterLink[] = [
  { href: "/events", label: "Attend Events" },
  { href: "/host-at-rorum", label: "Host at RORUM" },
];

const serviceLinks: FooterLink[] = [
  { href: "/catering", label: "Catering" },
  { href: "/event-decoration", label: "Decoration" },
];

const communityLinks: FooterLink[] = [
  { href: "/community-membership", label: "WECODA membership" },
  { href: "/volunteer", label: "Volunteer with us" },
  { href: "/work-with-us", label: "Work with us" },
];

const companyLinks: FooterLink[] = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

const legalLinks: FooterLink[] = [
  { href: "/terms", label: "Terms and conditions" },
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/cookie-policy", label: "Cookie policy" },
];

function FooterLinkColumn({ title, links }: { title: string; links: FooterLink[] }) {
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
        <div className="grid grid-cols-[minmax(240px,0.72fr)_minmax(0,1.55fr)] gap-[clamp(28px,4vw,54px)] items-stretch max-[980px]:grid-cols-1 max-[980px]:gap-7">
          <div className="grid content-start gap-2 text-text-primary max-tablet:pl-[clamp(8px,6vw,18px)] max-tablet:pr-[clamp(4px,5vw,12px)]">
            <span className="text-text-primary text-[11px] font-[950] tracking-[0.14em] uppercase mb-2.5">Contact details</span>
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
              <p className="text-[17px] leading-[1.55] font-medium">
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
                  style={{ "--social-brand-color": brandColor } as BrandColorStyle}
                >
                  <SocialIcon icon={icon} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[repeat(4,minmax(120px,1fr))] gap-[clamp(18px,2.4vw,30px)] max-[980px]:grid-cols-2 max-tablet:grid-cols-2 max-tablet:gap-x-5 max-tablet:gap-y-8 max-tablet:items-start max-tablet:pt-1 max-tablet:pl-[clamp(8px,6vw,18px)] max-tablet:pr-[clamp(4px,5vw,12px)]">
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
