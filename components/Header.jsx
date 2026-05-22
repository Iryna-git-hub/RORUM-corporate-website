"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronDown, Handshake, Mail, MessageCircle, Paintbrush, Sparkles, Store, Ticket, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { navItems } from "@/lib/data";
import { Button, Container } from "@/components/ui";

const mobileNavIcons = {
    "/events": Ticket,
    "/host-an-event": CalendarDays,
    "/book-the-space": Store,
    "/services": Sparkles,
    "/community-membership": Handshake,
    "/catering": Utensils,
    "/space-decoration-event-styling": Paintbrush,
    "/volunteer": Handshake,
    "/work-with-us": Handshake,
    "/about": Sparkles,
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
    const [openDropdown, setOpenDropdown] = useState(null);
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
    const homeScrolled = isHome && homePastGreenSection;
    const logoSrc = "/logos/rorum-creative-event-space.png";
    function closeMenus() {
        setMenuOpen(false);
        setOpenDropdown(null);
        document.activeElement?.blur?.();
    }
    return (<header className={`header ${isHome ? "header-home" : ""} ${homeScrolled ? "header-home-scrolled" : ""} ${hidden ? "header-hidden" : ""} ${menuOpen ? "mobile-menu-open" : ""}`}>
      <Container>
        <div className="header-inner">
          <Link className="brand" href="/" onClick={closeMenus}>
            <Image className="brand-wordmark" src={logoSrc} alt="RORUM Creative & Event Space" width={264} height={58} priority/>
          </Link>
          <nav className="nav" aria-label="Main navigation">
            {navItems.map((item) => item.children ? (<div className={`nav-dropdown ${openDropdown === item.label ? "nav-dropdown-open" : ""}`} key={item.label} onMouseEnter={() => setOpenDropdown(item.label)} onMouseLeave={() => setOpenDropdown(null)} onFocus={() => setOpenDropdown(item.label)} onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOpenDropdown(null);
            }}>
                <Link className="nav-trigger" href={item.href} aria-haspopup="true" aria-expanded={openDropdown === item.label} onClick={closeMenus}>
                  {item.label}
                  <ChevronDown aria-hidden="true" className="nav-caret" strokeWidth={2.2}/>
                </Link>
                <div className="dropdown-menu">
                  {item.children.map((child) => <Link key={child.href} href={child.href} onClick={closeMenus}>{child.label}</Link>)}
                </div>
              </div>) : <Link key={item.href} href={item.href} onClick={closeMenus}>{item.label}</Link>)}
          </nav>
          <div className="header-cta">
            <Button href="/contact">
              <MessageCircle className="talk-icon" aria-hidden="true" strokeWidth={2}/>
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
      <button className="mobile-menu-backdrop" type="button" aria-label="Close menu" onClick={closeMenus}/>
      <aside className="mobile-menu-panel" aria-label="Mobile menu">
        <nav className="mobile-panel-nav">
          {navItems.map((item) => (<div className="mobile-nav-group" key={item.label}>
              <Link className="mobile-nav-parent" href={item.href} onClick={closeMenus}>
                <MobileNavIcon href={item.href}/>
                <span>{item.label}</span>
              </Link>
              {item.children ? (<div className="mobile-nav-children">
                  {item.children.map((child) => <Link className="mobile-nav-child" key={child.href} href={child.href} onClick={closeMenus}>
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
