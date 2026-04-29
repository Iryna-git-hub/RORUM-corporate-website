"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronDown, Handshake, Mail, Paintbrush, Sparkles, Store, Ticket, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { navItems } from "@/lib/data";
import { Button, Container } from "@/components/ui";

const mobileNavIcons = {
    "/events": Ticket,
    "/host-an-event": CalendarDays,
    "/book-the-space": Store,
    "/services": Sparkles,
    "/catering": Utensils,
    "/space-decoration-event-styling": Paintbrush,
    "/volunteer": Handshake,
    "/work-with-us": Handshake,
    "/contact": Mail
};

function MobileNavIcon({ href, child = false }) {
    const Icon = mobileNavIcons[href] ?? Sparkles;
    return <Icon className={child ? "mobile-nav-icon mobile-nav-icon-child" : "mobile-nav-icon"} aria-hidden="true" strokeWidth={1.9}/>;
}

export function Header() {
    const pathname = usePathname();
    const isHome = pathname === "/";
    const [hidden, setHidden] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [homePastGreenSection, setHomePastGreenSection] = useState(false);
    useEffect(() => {
        let lastY = window.scrollY;
        const onScroll = () => {
            const currentY = window.scrollY;
            setHidden(!menuOpen && currentY > lastY && currentY > 96);
            lastY = currentY;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [menuOpen]);
    useEffect(() => {
        if (!isHome) {
            setHomePastGreenSection(false);
            return;
        }
        const onScroll = () => {
            const greenSection = document.querySelector(".quick-paths-section");
            const headerHeight = document.querySelector(".header")?.offsetHeight ?? 0;
            setHomePastGreenSection(Boolean(greenSection && greenSection.getBoundingClientRect().bottom <= headerHeight));
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, [isHome]);
    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [menuOpen]);
    const logoSrc = isHome && !homePastGreenSection ? "/logos/rorum-home-logo-gold.png" : "/logos/rorum-creative-event-space.png";
    return (<header className={`header ${isHome ? "header-home" : ""} ${homePastGreenSection ? "header-home-scrolled" : ""} ${hidden ? "header-hidden" : ""} ${menuOpen ? "mobile-menu-open" : ""}`}>
      <Container>
        <div className="header-inner">
          <Link className="brand" href="/" onClick={() => setMenuOpen(false)}>
            <Image className="brand-wordmark" src={logoSrc} alt="RORUM Creative & Event Space" width={264} height={58} priority/>
          </Link>
          <nav className="nav" aria-label="Main navigation">
            {navItems.map((item) => item.children ? (<div className="nav-dropdown" key={item.label}>
                <Link className="nav-trigger" href={item.href} aria-haspopup="true">
                  {item.label}
                  <ChevronDown aria-hidden="true" className="nav-caret" strokeWidth={2.2}/>
                </Link>
                <div className="dropdown-menu">
                  {item.children.map((child) => <Link key={child.href} href={child.href}>{child.label}</Link>)}
                </div>
              </div>) : <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </nav>
          <div className="header-cta">
            <Button href="/contact">
              <span className="talk-icon" aria-hidden="true"/>
              Let&apos;s Talk
            </Button>
          </div>
          <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </Container>
      <button className="mobile-menu-backdrop" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}/>
      <aside className="mobile-menu-panel" aria-label="Mobile menu">
        <nav className="mobile-panel-nav">
          {navItems.map((item) => (<div className="mobile-nav-group" key={item.label}>
              <Link className="mobile-nav-parent" href={item.href} onClick={() => setMenuOpen(false)}>
                <MobileNavIcon href={item.href}/>
                <span>{item.label}</span>
              </Link>
              {item.children ? (<div className="mobile-nav-children">
                  {item.children.map((child) => <Link className="mobile-nav-child" key={child.href} href={child.href} onClick={() => setMenuOpen(false)}>
                    <span>{child.label}</span>
                  </Link>)}
                </div>) : null}
            </div>))}
        </nav>
        <div className="mobile-panel-socials">
          <span>Social</span>
          <a href="https://instagram.com/rorum_space" target="_blank" rel="noreferrer">Instagram</a>
          <a href="mailto:hello@rorum.dk">hello@rorum.dk</a>
        </div>
      </aside>
    </header>);
}
