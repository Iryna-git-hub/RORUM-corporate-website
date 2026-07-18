"use client";

import { useLayoutEffect } from "react";
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

    return (<div className={shellClass}>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>);
}
