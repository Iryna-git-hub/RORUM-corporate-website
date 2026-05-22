import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui";

const exploreLinks = [
    { href: "/events", label: "Explore events" },
    { href: "/host-an-event", label: "Host an event" },
    { href: "/book-the-space", label: "Book the space" },
    { href: "/catering", label: "Catering" },
    { href: "/space-decoration-event-styling", label: "Event decoration" }
];

const communityLinks = [
    { href: "/community-membership", label: "Membership" },
    { href: "/work-with-us", label: "Work with us" },
    { href: "/volunteer", label: "Volunteer with us" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" }
];

const usefulLinks = [
    { href: "/faq", label: "Frequently asked questions" },
    { href: "/terms", label: "Terms" },
    { href: "/privacy-policy", label: "Privacy policy" },
    { href: "/cookie-policy", label: "Cookie policy" }
];

const socialLinks = [
    { href: "https://facebook.com", label: "Facebook", mark: "f" },
    { href: "https://instagram.com/rorum_space", label: "Instagram", mark: "ig" },
    { href: "https://linkedin.com", label: "LinkedIn", mark: "in" },
    { href: "https://youtube.com", label: "YouTube", mark: "yt" }
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
          <FooterLinkColumn title="Useful links" links={usefulLinks}/>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} RORUM. All rights reserved.</span>
          <span>Website developed by <a href="https://irynadev.netlify.app" target="_blank" rel="noreferrer">irynadev</a></span>
        </div>
      </Container>
    </footer>);
}
