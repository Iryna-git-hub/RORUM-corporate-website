"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, MessageCircle, X } from "lucide-react";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import { navItems } from "@/lib/data";
import { socialLinks } from "@/lib/siteConfig";
import { SocialIcon } from "@/components/SocialIcon";
import { Button, Container } from "@/components/ui";

const languages = ["EN", "DA", "UA"];

function LanguageDropdown({ className = "", currentLanguage, onLanguageChange }) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const menuId = useId();

    function focusOption(index) {
        const options = menuRef.current?.querySelectorAll('[role="menuitemradio"]');
        options?.[index]?.focus();
    }

    function openMenu(focusIndex = languages.indexOf(currentLanguage)) {
        setOpen(true);
        requestAnimationFrame(() => focusOption(focusIndex));
    }

    function handleTriggerKeyDown(event) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            openMenu(0);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            openMenu(languages.length - 1);
        }
    }

    function handleMenuKeyDown(event) {
        const options = Array.from(menuRef.current?.querySelectorAll('[role="menuitemradio"]') ?? []);
        const currentIndex = options.indexOf(document.activeElement);
        let nextIndex = currentIndex;

        if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % options.length;
        else if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + options.length) % options.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = options.length - 1;
        else if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
            return;
        } else return;

        event.preventDefault();
        options[nextIndex]?.focus();
    }

    return (
      <div
        className={`nav-dropdown language-dropdown ${open ? "nav-dropdown-open" : ""} ${className}`.trim()}
        onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <button
          ref={triggerRef}
          className="nav-trigger language-dropdown-trigger"
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={`Language: ${currentLanguage}`}
          onClick={() => setOpen((isOpen) => !isOpen)}
          onKeyDown={handleTriggerKeyDown}
        >
          <span>{currentLanguage}</span>
          <ChevronDown aria-hidden="true" className="nav-caret" strokeWidth={2.2}/>
        </button>
        <div
          ref={menuRef}
          id={menuId}
          className="dropdown-menu language-dropdown-menu"
          role="menu"
          aria-label="Choose language"
          onKeyDown={handleMenuKeyDown}
        >
          {languages.map((language) => (
            <button
              className={language === currentLanguage ? "language-option-active" : ""}
              type="button"
              role="menuitemradio"
              aria-checked={language === currentLanguage}
              tabIndex={open && language === currentLanguage ? 0 : -1}
              key={language}
              onClick={() => {
                  onLanguageChange(language);
                  setOpen(false);
                  requestAnimationFrame(() => triggerRef.current?.focus());
              }}
            >
              {language}
            </button>
          ))}
        </div>
      </div>
    );
}

function MobileLanguageSwitcher({ currentLanguage, onLanguageChange }) {
    return (
      <div className="mobile-language-switcher" role="group" aria-label="Language selector">
        {languages.map((language, index) => (
          <Fragment key={language}>
            {index ? <i aria-hidden="true">|</i> : null}
            <button
              className={language === currentLanguage ? "language-option-active" : ""}
              type="button"
              aria-pressed={language === currentLanguage}
              onClick={() => onLanguageChange(language)}
            >
              {language}
            </button>
          </Fragment>
        ))}
      </div>
    );
}

export function Header() {
    const pathname = usePathname();
    const [hidden, setHidden] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [openMobileDropdown, setOpenMobileDropdown] = useState(null);
    const [currentLanguage, setCurrentLanguage] = useState("EN");
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
    const logoSrc = "/logos/rorum-creative-event-space.png";
    function closeMenus() {
        setMenuOpen(false);
        setOpenDropdown(null);
        setOpenMobileDropdown(null);
        document.activeElement?.blur?.();
    }
    function isActiveItem(item) {
        if (!item.href) return Boolean(item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`)));
        if (item.href === "/") return pathname === "/";
        return pathname === item.href || pathname.startsWith(`${item.href}/`) || Boolean(item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`)));
    }
    return (<header className={`header ${hidden ? "header-hidden" : ""} ${menuOpen ? "mobile-menu-open" : ""}`}>
      <Container>
        <div className="header-inner">
          <Link className="brand" href="/" onClick={closeMenus}>
            <Image className="brand-wordmark" src={logoSrc} alt="RORUM Creative & Event Space" width={264} height={58} priority/>
          </Link>
          <nav className="nav" aria-label="Main navigation">
            {navItems.map((item) => {
              const active = isActiveItem(item);
              return item.children ? (<div className={`nav-dropdown ${openDropdown === item.label ? "nav-dropdown-open" : ""} ${active ? "nav-active" : ""}`} key={item.label} onMouseEnter={() => setOpenDropdown(item.label)} onMouseLeave={() => setOpenDropdown(null)} onFocus={() => setOpenDropdown(item.label)} onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOpenDropdown(null);
            }}>
                <button className="nav-trigger" type="button" aria-haspopup="true" aria-expanded={openDropdown === item.label} aria-current={active ? "page" : undefined} onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}>
                  {item.label}
                  <ChevronDown aria-hidden="true" className="nav-caret" strokeWidth={2.2}/>
                </button>
                <div className="dropdown-menu">
                  {item.children.map((child) => {
                    const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                    return <Link className={childActive ? "nav-child-active" : ""} aria-current={childActive ? "page" : undefined} key={child.href} href={child.href} onClick={closeMenus}>{child.label}</Link>;
                  })}
                </div>
              </div>) : <Link className={active ? "nav-active-link" : ""} aria-current={active ? "page" : undefined} key={item.href} href={item.href} onClick={closeMenus}>{item.label}</Link>;
            })}
          </nav>
          <div className="header-actions">
            <div className="language-switcher" aria-label="Language selector">
              {languages.map((language, index) => (
                <Fragment key={language}>
                  {index ? <i aria-hidden="true">|</i> : null}
                  <span className={language === currentLanguage ? "language-option-active" : ""}>
                    {language}
                  </span>
                </Fragment>
              ))}
            </div>
            <LanguageDropdown className="desktop-language-dropdown" currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
            <div className="header-cta">
              <Button href="/contact">
                <MessageCircle className="talk-icon" aria-hidden="true" strokeWidth={2}/>
                Let&apos;s Talk
              </Button>
            </div>
          </div>
          <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} tabIndex={menuOpen ? -1 : 0} onClick={() => setMenuOpen((open) => !open)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </Container>
      <button className="mobile-menu-backdrop" type="button" aria-label="Close menu" onClick={closeMenus}/>
      <aside className="mobile-menu-panel" aria-label="Mobile menu">
        <div className="mobile-menu-topbar">
          <Link className="btn mobile-topbar-cta" href="/contact" onClick={closeMenus}>
            Let&apos;s Talk
          </Link>
          <MobileLanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
          <button className="mobile-menu-close" type="button" aria-label="Close menu" onClick={closeMenus}>
            <X aria-hidden="true" strokeWidth={2}/>
          </button>
        </div>
        <nav className="mobile-panel-nav">
          <div className="mobile-nav-group">
            <Link className="mobile-nav-parent mobile-nav-home" href="/" aria-current={pathname === "/" ? "page" : undefined} onClick={closeMenus}>
              <span>Home</span>
            </Link>
          </div>
          {navItems.map((item) => {
            const active = isActiveItem(item);
            const isOpen = openMobileDropdown === item.label;
            return (<div className={`mobile-nav-group ${active ? "mobile-nav-active" : ""}`} key={item.label}>
              {item.children ? <button className="mobile-nav-parent mobile-nav-toggle" type="button" aria-current={active ? "page" : undefined} aria-expanded={isOpen} onClick={() => setOpenMobileDropdown(isOpen ? null : item.label)}>
                <span>{item.label}</span>
                <ChevronDown aria-hidden="true" className="mobile-nav-caret" strokeWidth={2.2}/>
              </button> : <Link className="mobile-nav-parent" href={item.href} aria-current={active ? "page" : undefined} onClick={closeMenus}>
                <span>{item.label}</span>
              </Link>}
              {item.children && isOpen ? (<div className="mobile-nav-children">
                  {item.children.map((child) => {
                    const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                    return <Link className={`mobile-nav-child ${childActive ? "mobile-nav-child-active" : ""}`} aria-current={childActive ? "page" : undefined} key={child.href} href={child.href} onClick={closeMenus}>
                    <span>{child.label}</span>
                  </Link>;
                  })}
                </div>) : null}
            </div>);
          })}
        </nav>
        <div className="mobile-panel-socials">
          {socialLinks.map((link) => (
            <a className="mobile-social-link" href={link.href} key={link.label} target="_blank" rel="noopener noreferrer" aria-label={link.label} style={{ "--social-brand-color": link.brandColor }}>
              <SocialIcon icon={link.icon} />
            </a>
          ))}
        </div>
      </aside>
    </header>);
}
