import Link from "next/link";
import { Container } from "@/components/ui";
export function Footer() {
    const links = ["/events", "/host-an-event", "/book-the-space", "/services", "/faq", "/terms", "/privacy-policy"];
    return (<footer className="footer">
      <Container>
        <div className="footer-grid">
          <div>
            <h2 className="heading">RORUM</h2>
            <p className="muted">Creative event space, hospitality and community moments in Copenhagen.</p>
          </div>
          <div className="footer-links">
            {links.map((href) => <Link key={href} href={href}>{href.replace("/", "").replaceAll("-", " ") || "home"}</Link>)}
          </div>
          <div>
            <p className="muted">Copenhagen, Denmark<br />hello@rorum.dk<br />Instagram: @rorum_space</p>
          </div>
        </div>
      </Container>
    </footer>);
}
