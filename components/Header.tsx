"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, MessageCircle, X } from "lucide-react";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import { navItems, type NavItem } from "@/lib/data";
import { socialLinks } from "@/lib/siteConfig";
import { SocialIcon } from "@/components/SocialIcon";
import { Button, Container } from "@/components/ui";

type BrandColorStyle = CSSProperties & { "--social-brand-color": string };

const languages = ["EN", "DA", "UA"];

const navTriggerBaseClass =
  "appearance-none border-0 bg-transparent inline-flex items-center justify-center gap-0.5 font-[inherit] leading-none";
const dropdownMenuBaseClass =
  "absolute top-[calc(100%+14px)] grid gap-1 p-2.5 border-0 rounded-none bg-white shadow-[0_18px_38px_rgba(var(--rgb-brown),0.08)] [transition:opacity_0.16s_ease,transform_0.16s_ease,visibility_0.16s_ease] before:content-[''] before:absolute before:inset-x-0 before:-top-[15px] before:h-[15px]";
const dropdownMenuOpenClass = "opacity-100 visible translate-y-0";
const dropdownMenuClosedClass = "opacity-0 invisible translate-y-1.5";

function LanguageDropdown({
  className = "",
  currentLanguage,
  onLanguageChange,
}: {
  className?: string;
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  function focusOption(index: number) {
    const options = menuRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="menuitemradio"]',
    );
    options?.[index]?.focus();
  }

  function openMenu(focusIndex: number = languages.indexOf(currentLanguage)) {
    setOpen(true);
    requestAnimationFrame(() => focusOption(focusIndex));
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenu(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(languages.length - 1);
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const options = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitemradio"]',
      ) ?? [],
    );
    const currentIndex = options.indexOf(
      document.activeElement as HTMLButtonElement,
    );
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
      className={`relative inline-flex items-center flex-none ${className}`.trim()}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        className={`${navTriggerBaseClass} min-h-[34px] py-[5px] px-[9px] text-primary-dark text-[13px] font-bold tracking-[0.04em] whitespace-nowrap hover:text-primary ${open ? "text-primary no-underline" : ""}`}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Language: ${currentLanguage}`}
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{currentLanguage}</span>
        <ChevronDown aria-hidden="true" className="w-[15px] h-[15px] text-primary flex-none" strokeWidth={2.2} />
      </button>
      <div
        ref={menuRef}
        id={menuId}
        className={`${dropdownMenuBaseClass} right-0 min-w-[92px] z-[3] ${open ? dropdownMenuOpenClass : dropdownMenuClosedClass}`}
        role="menu"
        aria-label="Choose language"
        onKeyDown={handleMenuKeyDown}
      >
        {languages.map((language) => (
          <button
            className={`w-full py-2.5 px-2.75 border-0 rounded-none bg-transparent text-[13px] font-[650] text-left whitespace-nowrap hover:bg-cream hover:outline-none focus-visible:bg-cream focus-visible:outline-none ${language === currentLanguage ? "text-red font-extrabold" : "text-text-primary"}`}
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

function MobileLanguageSwitcher({
  currentLanguage,
  onLanguageChange,
}: {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-3 rounded-full text-dark-brown bg-transparent backdrop-blur-[10px]"
      role="group"
      aria-label="Language selector"
    >
      {languages.map((language, index) => (
        <Fragment key={language}>
          {index ? (
            <i aria-hidden="true" className="not-italic text-dark-brown opacity-20">
              |
            </i>
          ) : null}
          <button
            className={`border-0 bg-transparent text-[14px] font-bold tracking-[0.05em] ${language === currentLanguage ? "text-red" : ""}`}
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

const hamburgerSpanBase =
  "absolute left-2.5 w-6.5 h-0.5 bg-current [transition:transform_0.24s_ease,top_0.24s_ease,opacity_0.18s_ease]";

export function Header() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);
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
    (document.activeElement as HTMLElement | null)?.blur?.();
  }

  function isActiveItem(item: NavItem): boolean {
    // `=== null` (rather than a `!item.href` truthy check) so TypeScript
    // narrows the discriminated NavItem union correctly: the dropdown
    // variant always has null href + real children, the link variant always
    // has a real href and never children, so the children-check below is
    // unreachable in the link branch, not just defensively redundant.
    if (item.href === null) {
      return Boolean(
        item.children.some(
          (child) => pathname === child.href || pathname.startsWith(`${child.href}/`),
        ),
      );
    }
    if (item.href === "/") return pathname === "/";
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b border-transparent bg-white text-primary-dark backdrop-blur-[18px] shadow-none [transition:transform_0.26s_ease,background-color_0.22s_ease,box-shadow_0.22s_ease] ${hidden ? "-translate-y-[110%]" : ""}`}
    >
      <Container>
        <div className="flex min-h-19.5 items-center justify-between gap-5.5 lg:max-xl:gap-5 max-sm:min-h-17">
          <Link className="inline-flex items-center gap-3 mr-[clamp(8px,1.4vw,22px)] text-primary-dark font-bold tracking-[0.08em] flex-none lg:max-xl:mr-0" href="/" onClick={closeMenus}>
            <Image className="w-[min(162px,20vw)] h-auto object-contain lg:max-xl:w-37 max-lg:w-39 max-sm:w-33" src={logoSrc} alt="RORUM Creative & Event Space" width={264} height={58} priority />
          </Link>
          <nav className="flex items-center gap-[0.9rem] text-dark-brown text-[0.87rem] font-semibold uppercase whitespace-nowrap max-lg:hidden lg:max-xl:flex-none lg:max-xl:gap-3" aria-label="Main navigation">
            {navItems.map((item) => {
              const active = isActiveItem(item);
              const isOpen = openDropdown === item.label;
              return item.children ? (
                <div
                  className="relative inline-flex items-center flex-none"
                  key={item.label}
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                  onFocus={() => setOpenDropdown(item.label)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setOpenDropdown(null);
                  }}
                >
                  <button
                    className={`${navTriggerBaseClass} uppercase hover:text-primary ${active || isOpen ? "text-primary no-underline" : ""}`}
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                  >
                    {item.label}
                    <ChevronDown aria-hidden="true" className="w-[15px] h-[15px] text-primary flex-none" strokeWidth={2.2} />
                  </button>
                  <div className={`${dropdownMenuBaseClass} left-[-14px] min-w-60 ${isOpen ? dropdownMenuOpenClass : dropdownMenuClosedClass}`}>
                    {item.children.map((child) => {
                      const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                      return (
                        <Link
                          className={`pt-2.5 pr-2.75 pb-2.5 pl-6 rounded-none text-[13px] whitespace-nowrap hover:bg-cream ${childActive ? "text-primary" : "text-text-primary"}`}
                          aria-current={childActive ? "page" : undefined}
                          key={child.href}
                          href={child.href}
                          onClick={closeMenus}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Link
                  className={`flex-none ${active ? "text-primary no-underline" : ""}`}
                  aria-current={active ? "page" : undefined}
                  key={item.href}
                  href={item.href}
                  onClick={closeMenus}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="inline-flex items-center gap-2 ml-auto flex-none max-lg:hidden">
            {/* Stacking a named breakpoint (`lg:`) with an arbitrary one
                (`max-[1100px]:`) doesn't combine into an AND'd media query
                in this Tailwind version - it silently drops the `lg:` part.
                A single raw arbitrary media query is unambiguous. */}
            <div className="inline-flex items-center gap-2 px-4 py-[5px] rounded-full text-primary-dark backdrop-blur-[10px] m-0 text-[13px] [@media(min-width:1024px)_and_(max-width:1100px)]:hidden" aria-label="Language selector">
              {languages.map((language, index) => (
                <Fragment key={language}>
                  {index ? <i aria-hidden="true" className="not-italic opacity-35">|</i> : null}
                  <span className={`inline-flex items-center justify-center min-h-[26px] font-semibold tracking-[0.04em] ${language === currentLanguage ? "text-red" : ""}`}>
                    {language}
                  </span>
                </Fragment>
              ))}
            </div>
            {/* `hidden!`: LanguageDropdown's own base className already
                hardcodes `inline-flex` unconditionally, which competes with
                this `display` override for the same property - Tailwind's
                generated order doesn't reliably favor whichever comes later
                in the className string. */}
            <LanguageDropdown
              className="hidden! [@media(min-width:1024px)_and_(max-width:1100px)]:inline-flex!"
              currentLanguage={currentLanguage}
              onLanguageChange={setCurrentLanguage}
            />
            <div className="flex-none">
              {/* `!important` on the color utilities: Tailwind's generated
                  utility order isn't guaranteed to follow this string's
                  order, so `bg-cta-red` here isn't reliably guaranteed to
                  beat Button's own `bg-primary` default without it. */}
              <Button
                href="/contact"
                className="min-h-10 px-5 text-xs border-cta-red! bg-cta-red! text-white! hover:border-cta-red-hover! hover:bg-cta-red-hover! hover:text-white! lg:text-[13px] lg:font-bold lg:max-xl:min-h-9.5 lg:max-xl:px-3 lg:max-xl:whitespace-nowrap"
              >
                <MessageCircle className="w-3.75 h-3.75 mr-1.75 -translate-y-px flex-none lg:max-xl:w-3.5 lg:max-xl:h-3.5 lg:max-xl:mr-1.25" aria-hidden="true" strokeWidth={2} />
                Let&apos;s Talk
              </Button>
            </div>
          </div>
          <button
            className={`relative z-[62] w-11.5 h-11.5 border-0 bg-transparent text-primary-dark cursor-pointer hidden max-lg:inline-flex ${menuOpen ? "opacity-0 pointer-events-none" : ""}`}
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            tabIndex={menuOpen ? -1 : 0}
            data-testid="mobile-menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={`${hamburgerSpanBase} ${menuOpen ? "top-5.5 rotate-45" : "top-3.5"}`} />
            <span className={`${hamburgerSpanBase} top-5.5 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`${hamburgerSpanBase} ${menuOpen ? "top-5.5 -rotate-45" : "top-7.5"}`} />
          </button>
        </div>
      </Container>
      <button
        className={`fixed inset-0 z-50 border-0 bg-[rgba(var(--rgb-dark-green),0.42)] [transition:opacity_0.24s_ease,visibility_0.24s_ease] ${menuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        type="button"
        aria-label="Close menu"
        onClick={closeMenus}
      />
      <aside
        className={`fixed top-0 right-0 z-[60] h-[100svh] max-h-[100dvh] w-screen grid grid-rows-[auto_auto_auto] content-start gap-6 pt-6 px-8 pb-8 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] bg-white text-text-primary shadow-[-18px_0_44px_rgba(var(--rgb-brown),0.16)] transition-transform duration-300 ease-[ease] ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-label="Mobile menu"
      >
        <div className="flex items-center justify-start gap-9.5 min-h-17 -mt-6 -mx-8 px-6.5 bg-cream border-b border-border max-[360px]:gap-2 max-[360px]:px-4">
          <Link
            // `!important` on the color utilities: `.btn`'s own deferred,
            // still-unlayered CSS sets `background`/`border-color` too, and
            // unlayered CSS always beats a layered Tailwind utility
            // regardless of specificity.
            className="btn flex-none min-h-9.5 px-3.5 border-cta-red! bg-cta-red! text-white! text-[11px] whitespace-nowrap hover:border-cta-red-hover! hover:bg-cta-red-hover! hover:text-white! focus-visible:border-cta-red-hover! focus-visible:bg-cta-red-hover! focus-visible:text-white! max-sm:min-h-10 max-sm:py-0 max-sm:text-xs max-[360px]:px-2.5 max-[360px]:text-[10px]"
            href="/contact"
            onClick={closeMenus}
          >
            Let&apos;s Talk
          </Link>
          <MobileLanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
          <button
            className="inline-flex items-center justify-center w-10.5 h-10.5 border-0 rounded-full bg-transparent text-dark-brown cursor-pointer transition-[color,background-color] duration-180 ease-[ease] ml-auto hover:bg-[rgba(var(--rgb-dark-green),0.1)] hover:text-white hover:outline-none focus-visible:bg-[rgba(var(--rgb-dark-green),0.1)] focus-visible:text-white focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-beige)]"
            type="button"
            aria-label="Close menu"
            onClick={closeMenus}
          >
            <X aria-hidden="true" strokeWidth={2} className="w-[23px] h-[23px]" />
          </button>
        </div>
        <nav className="grid content-start gap-1 pt-0 pr-1 pl-0">
          <div className="grid border-b border-beige last:border-b-0">
            <Link
              className="flex items-center justify-between gap-3 py-[15px] w-full border-0 bg-transparent text-left text-dark-brown text-base font-bold tracking-[0.02em] uppercase"
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              onClick={closeMenus}
            >
              <span className="min-w-0">Home</span>
            </Link>
          </div>
          {navItems.map((item) => {
            const active = isActiveItem(item);
            const isOpen = openMobileDropdown === item.label;
            const mobileNavItemClass = `flex items-center justify-between gap-3 py-[15px] w-full border-0 bg-transparent text-left text-dark-brown text-base tracking-[0.02em] uppercase ${active ? "font-black" : "font-bold"}`;
            return (
              <div className="grid border-b border-beige last:border-b-0" key={item.label}>
                {item.children ? (
                  <button
                    className={mobileNavItemClass}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    aria-expanded={isOpen}
                    onClick={() => setOpenMobileDropdown(isOpen ? null : item.label)}
                  >
                    <span className="min-w-0">{item.label}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`w-[17px] h-[17px] flex-[0_0_17px] transition-transform duration-180 ease-[ease] ${isOpen ? "rotate-180" : ""}`}
                      strokeWidth={2.2}
                    />
                  </button>
                ) : (
                  <Link className={mobileNavItemClass} href={item.href} aria-current={active ? "page" : undefined} onClick={closeMenus}>
                    <span className="min-w-0">{item.label}</span>
                  </Link>
                )}
                {item.children && isOpen ? (
                  <div className="grid pb-2">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                      return (
                        <Link
                          className={`block pt-[13px] pb-[13px] pl-4 text-dark-brown text-sm ${childActive ? "font-black" : "font-semibold"}`}
                          aria-current={childActive ? "page" : undefined}
                          key={child.href}
                          href={child.href}
                          onClick={closeMenus}
                        >
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
        <div className="flex items-center gap-2.5 border-t border-border pt-4.5 text-text-primary font-bold">
          {socialLinks.map((link) => (
            <a
              href={link.href}
              key={link.label}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="w-11 h-11 inline-flex items-center justify-center gap-2 border-0 rounded-full bg-[var(--social-brand-color,var(--color-light-green))] text-white transition-[color,transform] duration-180 ease-[ease] hover:-translate-y-px hover:brightness-[1.08] hover:saturate-[1.05] hover:outline-none focus-visible:-translate-y-px focus-visible:brightness-[1.08] focus-visible:saturate-[1.05] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-beige)]"
              style={{ "--social-brand-color": link.brandColor } as BrandColorStyle}
            >
              <SocialIcon icon={link.icon} />
            </a>
          ))}
        </div>
      </aside>
    </header>
  );
}
