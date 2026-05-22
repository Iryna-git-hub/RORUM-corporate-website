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
    { href: "/space-decoration-event-styling", label: "Event Decoration" }
];

const communityLinks = [
    { href: "/community-membership", label: "Membership" },
    { href: "/work-with-us", label: "Work With Us" },
    { href: "/volunteer", label: "Volunteer With Us" }
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

function FooterLinkColumn({ title, links }) {
    return (<nav className="footer-links" aria-label={title}>
      <span>{title}</span>
      {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
    </nav>);
}

export function Footer() {
    return (<footer className="footer">
      <Container>
        <div className="footer-grid">
          <div className="footer-brand">
            <Image className="footer-logo" src="/logos/rorum-creative-event-space.png" alt="RORUM Creative & Event Space" width={264} height={58}/>
            <p className="footer-subheading">A warm Copenhagen space for meaningful events, private meetings, hospitality and community connection.</p>
          </div>
          <FooterLinkColumn title="Visit & Host" links={visitHostLinks}/>
          <FooterLinkColumn title="Services" links={serviceLinks}/>
          <FooterLinkColumn title="Community" links={communityLinks}/>
          <div className="footer-links footer-contact-column">
            <span>Contact</span>
            <div className="footer-contact-list">
              <span><MapPin aria-hidden="true"/>Buermistersgade 26, 1 th, Copenhagen</span>
              <a href="mailto:hello@rorum.dk"><Mail aria-hidden="true"/>hello@rorum.dk</a>
              <span><Phone aria-hidden="true"/>Phone on request</span>
            </div>
            <div className="footer-socials" aria-label="Social links">
              {socialLinks.map(({ href, label, mark }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>{mark}</a>)}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© RORUM</span>
          <nav className="footer-legal" aria-label="Legal links">
            {legalLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          </nav>
          <span>Developed by <a href="https://irynadev.netlify.app" target="_blank" rel="noreferrer">IrinaDev</a></span>
        </div>
      </Container>
    </footer>);
}
