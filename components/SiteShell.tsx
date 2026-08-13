"use client";

import type { ReactNode } from "react";
import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { splitLocaleFromPath } from "@/lib/i18n";
import type { NavItem } from "@/lib/data";

export function SiteShell({
  children,
  navItems,
  footerColumns,
  footerLegalLinks,
  footerCopyrightText,
  contactCtaLabel,
  contactDetailsLabel,
}: {
  children: ReactNode;
  navItems?: NavItem[];
  footerColumns?: { title: string; links: { href: string; label: string }[] }[];
  footerLegalLinks?: { href: string; label: string }[];
  footerCopyrightText?: string;
  contactCtaLabel?: string;
  contactDetailsLabel?: string;
}) {
  const pathname = usePathname();
  // Locale-neutral path — on a `/da/...`/`/uk/...` URL, raw `pathname`
  // would never match "/" or the event-detail pattern below.
  const { path } = splitLocaleFromPath(pathname);
  const isHome = path === "/";
  const shellClass = `site-shell ${isHome ? "site-shell-home" : "site-shell-inner"}`;

  useLayoutEffect(() => {
    const isEventDetail = /^\/events\/[^/]+$/.test(path);

    // Preserve deliberate anchor navigation; ordinary event links are hash-free.
    if (!isEventDetail || window.location.hash) return;

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;

    // The site uses smooth scrolling globally. Temporarily disable it so the
    // route reset is synchronous and complete before the browser paints.
    root.style.scrollBehavior = "auto";
    root.getClientRects();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.style.scrollBehavior = previousScrollBehavior;
  }, [path]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      return undefined;
    }

    const targets = Array.from(
      document.querySelectorAll(".site-shell main > section, .site-shell > .footer"),
    ).filter(
      (element) =>
        !element.classList.contains("wecoda-benefits-section") &&
        !element.classList.contains("is-site-reveal-visible"),
    );

    if (!targets.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-site-reveal-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -6% 0px",
      },
    );

    targets.forEach((element) => element.classList.add("site-reveal"));

    // Let the browser paint the initial reveal state before observing.
    // Without this frame boundary, above-the-fold sections can become
    // visible before their opacity/transform transition is rendered.
    let observationFrame: number | undefined;
    const preparationFrame = window.requestAnimationFrame(() => {
      observationFrame = window.requestAnimationFrame(() => {
        targets.forEach((element) => observer.observe(element));
      });
    });

    return () => {
      window.cancelAnimationFrame(preparationFrame);
      if (observationFrame !== undefined) {
        window.cancelAnimationFrame(observationFrame);
      }
      observer.disconnect();
    };
  }, [pathname]);

  return (
    <div className={shellClass}>
      <Header navItems={navItems} contactCtaLabel={contactCtaLabel} />
      <main>{children}</main>
      <Footer
        columns={footerColumns}
        legalLinks={footerLegalLinks}
        copyrightText={footerCopyrightText}
        contactDetailsLabel={contactDetailsLabel}
      />
    </div>
  );
}
