"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export function SiteShell({ children }) {
    const pathname = usePathname();
    const isHome = pathname === "/";
    const shellClass = `site-shell ${isHome ? "site-shell-home" : "site-shell-inner"}`;

    useLayoutEffect(() => {
      const isEventDetail = /^\/events\/[^/]+$/.test(pathname);

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
    }, [pathname]);

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
      let observationFrame;
      const preparationFrame = window.requestAnimationFrame(() => {
        observationFrame = window.requestAnimationFrame(() => {
          targets.forEach((element) => observer.observe(element));
        });
      });

      return () => {
        window.cancelAnimationFrame(preparationFrame);
        window.cancelAnimationFrame(observationFrame);
        observer.disconnect();
      };
    }, [pathname]);

    return (<div className={shellClass}>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>);
}
