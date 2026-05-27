"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export function SiteShell({ children }) {
    const pathname = usePathname();
    const isHome = pathname === "/";
    const shellClass = `site-shell ${isHome ? "site-shell-home" : "site-shell-inner"}`;

    return (<div className={shellClass}>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>);
}
