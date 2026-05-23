import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui";

const visitHostLinks = [
    { href: "/events", label: "Events" },
    { href: "/host-an-event", label: "Host an Event" },
    { href: "/private-meetings", label: "Private Meetings" }
];

const serviceLinks = [
    { href: "/catering", label: "Catering" },
    { href: "/event-decoration", label: "Event Decoration" }
];

const communityLinks = [
    { href: "/membership", label: "Membership" },
    { href: "/work-with-us", label: "Work With Us" },
    { href: "/volunteer-with-us", label: "Volunteer With Us" }
];

const companyLinks = [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" }
];

const legalLinks = [
    { href: "/terms", label: "Terms" },
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/cookie-policy", label: "Cookie Policy" }
];

const socialLinks = [
    { href: "https://instagram.com/rorum_space", label: "Instagram", mark: "ig" },
    { href: "https://facebook.com", label: "Facebook", mark: "f" },
    { href: "https://linkedin.com", label: "LinkedIn", mark: "in" }
];

function FooterLinkColumn({ title, links, children }) {
    return (<nav className="footer-links" aria-label={title}>
      <span>{title}</span>
      {children}
      {links?.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
    </nav>);
}

export function Footer() {
    return (<footer className="footer">
      <Container>
        <div className="footer-main">
          <div className="footer-brand">
            <Image className="footer-logo" src="/logos/rorum-creative-event-space.png" alt="RORUM Creative & Event Space" width={264} height={58}/>
            <div className="footer-contact-stack">
              <p><MapPin aria-hidden="true" strokeWidth={1.8}/>Buermistersgade 26, 1 th, Copenhagen</p>
              <p><Phone aria-hidden="true" strokeWidth={1.8}/>+45 31 42 86 19</p>
              <a href="mailto:hello@rorum.dk"><Mail aria-hidden="true" strokeWidth={1.8}/>hello@rorum.dk</a>
              <Link href="/contact#map">View on map</Link>
            </div>
            <div className="footer-socials" aria-label="Social links">
              {socialLinks.map(({ href, label, mark }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}><span aria-hidden="true">{mark}</span></a>)}
            </div>
          </div>

          <div className="footer-divider" aria-hidden="true"/>

          <div className="footer-columns">
            <FooterLinkColumn title="Contact / Visit Time">
              <a href="mailto:hello@rorum.dk">hello@rorum.dk</a>
              <p>Phone on request</p>
              <p><strong>Visit Time:</strong><br/>By appointment<br/>Events by schedule<br/>Response: Mon-Fri · 09:00-17:00</p>
            </FooterLinkColumn>

            <FooterLinkColumn title="Visit & Host" links={visitHostLinks}/>
            <FooterLinkColumn title="Services" links={serviceLinks}/>
            <FooterLinkColumn title="Community" links={communityLinks}/>
            <FooterLinkColumn title="Company" links={companyLinks}/>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 RORUM. All rights reserved.</span>
          <nav className="footer-legal" aria-label="Legal links">
            {legalLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          </nav>
          <span>Developed by <a href="https://irynadev.netlify.app" target="_blank" rel="noreferrer">IrinaDev</a></span>
        </div>
      </Container>
    </footer>);
}
