"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { navItems } from "@/lib/data";
import { Button, Container } from "@/components/ui";
export function Header() {
    const pathname = usePathname();
    const isHome = pathname === "/";
    const [hidden, setHidden] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
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
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [menuOpen]);
    return (<header className={`header ${isHome ? "header-home" : ""} ${hidden ? "header-hidden" : ""} ${menuOpen ? "mobile-menu-open" : ""}`}>
      <Container>
        <div className="header-inner">
          <Link className="brand" href="/" onClick={() => setMenuOpen(false)}>
            <Image className="brand-wordmark" src={isHome ? "/logos/rorum-home-logo.png" : "/logos/rorum-creative-event-space.png"} alt="RORUM Creative & Event Space" width={264} height={58} priority/>
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
        <div className="mobile-menu-panel-head">
          <Image className="mobile-menu-logo" src="/logos/rorum-creative-event-space.png" alt="RORUM Creative & Event Space" width={260} height={58}/>
        </div>
        <nav className="mobile-panel-nav">
          {navItems.map((item) => (<div className="mobile-nav-group" key={item.label}>
              <Link className="mobile-nav-parent" href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>
              {item.children ? (<div className="mobile-nav-children">
                  {item.children.map((child) => <Link className="mobile-nav-child" key={child.href} href={child.href} onClick={() => setMenuOpen(false)}>{child.label}</Link>)}
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
