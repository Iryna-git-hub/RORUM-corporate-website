import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui";

const exploreLinks = [
    { href: "/events", label: "Events" },
    { href: "/host-an-event", label: "Host an Event" },
    { href: "/private-events", label: "Private Events" },
    { href: "/catering", label: "Catering" },
    { href: "/space-decoration-event-styling", label: "Event Decoration" }
];

const communityLinks = [
    { href: "/community-membership", label: "Membership" },
    { href: "/work-with-us", label: "Work with us" },
    { href: "/volunteer", label: "Volunteer with us" }
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

function FooterLinkColumn({ title, links, external = false }) {
    return (<nav className="footer-links" aria-label={title}>
      <span>{title}</span>
      {links.map((link) => external
        ? <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
        : <Link key={link.href} href={link.href}>{link.label}</Link>)}
    </nav>);
}

export function Footer() {
    return (<footer className="footer">
      <Container>
        <div className="footer-grid">
          <div className="footer-brand">
            <Image className="footer-logo" src="/logos/rorum-creative-event-space.png" alt="RORUM Creative & Event Space" width={264} height={58}/>
            <p className="footer-subheading">Creative event space, hospitality and community moments in Copenhagen.</p>
            <div className="footer-contact-list">
              <span><MapPin aria-hidden="true"/>Buermistersgade 26, 1 th, Copenhagen</span>
              <a href="mailto:hello@rorum.dk"><Mail aria-hidden="true"/>hello@rorum.dk</a>
              <span><Phone aria-hidden="true"/>Phone on request</span>
            </div>
            <div className="footer-socials" aria-label="Social links">
              {socialLinks.map(({ href, label, mark }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>{mark}</a>)}
            </div>
          </div>
          <FooterLinkColumn title="Explore" links={exploreLinks}/>
          <FooterLinkColumn title="Community" links={communityLinks}/>
          <FooterLinkColumn title="Company" links={companyLinks}/>
          <FooterLinkColumn title="Legal" links={legalLinks}/>
          <FooterLinkColumn title="Social" links={socialLinks} external/>
        </div>
        <div className="footer-bottom">
          <span>© RORUM</span>
          <span>Developed by <a href="https://irynadev.netlify.app" target="_blank" rel="noreferrer">IrinaDev</a></span>
        </div>
      </Container>
    </footer>);
}
