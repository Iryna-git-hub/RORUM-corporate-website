import type { CSSProperties } from "react";
import { LocaleLink as Link } from "@/components/LocaleLink";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui";
import { SocialIcon } from "@/components/SocialIcon";
import { contactDetails, socialLinks } from "@/lib/siteConfig";
import { getUiText } from "@/lib/uiText";
import type { Locale } from "@/lib/i18n";

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

const legalLinksFallback: FooterLink[] = [
  { href: "/terms", label: "Terms and conditions" },
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/cookie-policy", label: "Cookie policy" },
];

const staticColumns = [
  { title: "Visit & host", links: visitHostLinks },
  { title: "Services", links: serviceLinks },
  { title: "Community", links: communityLinks },
  { title: "Company", links: companyLinks },
];

function FooterLinkColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav className="grid content-start gap-2" aria-label={title}>
      <span className="text-text-primary text-[11px] font-[950] tracking-[0.14em] uppercase mb-2.5">{title}</span>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="w-fit text-light-green text-base leading-[1.45] font-medium transition-[color,transform] duration-180 ease-[ease] hover:text-cta-red-hover hover:translate-x-0.5 hover:no-underline focus-visible:text-cta-red-hover focus-visible:translate-x-0.5 focus-visible:no-underline"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

const footerContactRowClass =
  "flex items-center gap-2.25 w-fit m-0 text-text-primary text-[17px] leading-[1.55] font-medium";
const footerContactIconWrapClass =
  "w-8.5 h-8.5 inline-flex items-center justify-center rounded-full bg-[rgba(var(--rgb-light-green),0.1)] text-light-green flex-none leading-none overflow-visible";
const footerContactIconClass = "w-4.5 h-4.5 text-light-green flex-none block overflow-visible";

export function Footer({
  columns = staticColumns,
  legalLinks = legalLinksFallback,
  copyrightText = "© 2026 RORUM. All rights reserved.",
  contactDetailsLabel = "Contact details",
  locale = "en",
}: {
  columns?: { title: string; links: FooterLink[] }[];
  legalLinks?: FooterLink[];
  copyrightText?: string;
  contactDetailsLabel?: string;
  locale?: Locale;
}) {
  return (
    <footer className="border-t border-t-[rgba(var(--rgb-beige),0.48)] bg-white text-text-primary font-medium pt-[clamp(44px,6vw,72px)] pb-7 max-sm:pb-6">
      <Container>
        <div className="grid grid-cols-[minmax(240px,0.72fr)_minmax(0,1.55fr)] gap-[clamp(28px,4vw,54px)] items-stretch max-lg:grid-cols-1 max-lg:gap-7">
          <div className="grid content-start gap-2 text-text-primary max-sm:pl-[clamp(8px,6vw,18px)] max-sm:pr-[clamp(4px,5vw,12px)]">
            <span className="text-text-primary text-[11px] font-[950] tracking-[0.14em] uppercase mb-2.5">{contactDetailsLabel}</span>
            <div className="grid gap-2.25 mt-1 mb-2.5 max-w-[34ch]">
              <p className={footerContactRowClass}>
                <span className={footerContactIconWrapClass} aria-hidden="true">
                  <MapPin aria-hidden="true" strokeWidth={1.8} className={footerContactIconClass} />
                </span>
                {contactDetails.address}
              </p>
              <Link
                className="flex items-center gap-2.25 w-fit mt-0.5 ml-[43px] text-light-green text-sm leading-[1.35] hover:text-red focus-visible:text-red hover:no-underline focus-visible:no-underline"
                href={contactDetails.mapHref}
              >
                {getUiText("viewOnMap", locale)}
              </Link>
              <p className={footerContactRowClass}>
                <span className={footerContactIconWrapClass} aria-hidden="true">
                  <Phone aria-hidden="true" strokeWidth={1.8} className={footerContactIconClass} />
                </span>
                {contactDetails.phone}
              </p>
              <a
                className={`${footerContactRowClass} hover:text-red focus-visible:text-red hover:no-underline focus-visible:no-underline`}
                href={`mailto:${contactDetails.email}`}
              >
                <span className={footerContactIconWrapClass} aria-hidden="true">
                  <Mail aria-hidden="true" strokeWidth={1.8} className={footerContactIconClass} />
                </span>
                {contactDetails.email}
              </a>
            </div>
            <div className="flex items-center gap-2.5 mt-2" aria-label="Social links">
              {socialLinks.map(({ href, label, icon, brandColor }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-9.5 h-9.5 inline-flex items-center justify-center border-0 rounded-full bg-[var(--social-brand-color,var(--color-light-green))] text-white transition-[color,transform] duration-180 ease-[ease] hover:-translate-y-px hover:brightness-[1.08] hover:saturate-[1.05] hover:no-underline focus-visible:-translate-y-px focus-visible:brightness-[1.08] focus-visible:saturate-[1.05] focus-visible:no-underline"
                  style={{ "--social-brand-color": brandColor } as BrandColorStyle}
                >
                  <SocialIcon icon={icon} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[repeat(4,minmax(120px,1fr))] gap-[clamp(18px,2.4vw,30px)] max-lg:grid-cols-2 max-sm:grid-cols-2 max-sm:gap-x-5 max-sm:gap-y-8 max-sm:items-start max-sm:pt-1 max-sm:pl-[clamp(8px,6vw,18px)] max-sm:pr-[clamp(4px,5vw,12px)]">
            {columns.map((column) => (
              <FooterLinkColumn key={column.title} title={column.title} links={column.links} />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-x-6 gap-y-3.5 border-t border-t-[rgba(var(--rgb-light-green),0.22)] mt-[clamp(34px,5vw,54px)] pt-4.5 text-text-primary text-[13px] font-medium max-sm:pl-[clamp(18px,6vw,28px)] max-sm:pr-[clamp(14px,5vw,22px)] max-sm:grid max-sm:justify-stretch max-sm:pt-5.5">
          <span>{copyrightText}</span>
          <nav className="flex flex-wrap gap-x-4.5 gap-y-3 max-sm:gap-x-3.5 max-sm:gap-y-2" aria-label="Legal links">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-text-primary hover:text-red focus-visible:text-red hover:no-underline focus-visible:no-underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <span>
            {getUiText("developedBy", locale)}{" "}
            <a
              className="text-text-primary no-underline hover:text-red focus-visible:text-red"
              href="https://irynadev.netlify.app"
              target="_blank"
              rel="noreferrer"
            >
              Irina Dev
            </a>
          </span>
        </div>
      </Container>
    </footer>
  );
}
