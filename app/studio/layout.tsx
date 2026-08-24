import type { Metadata } from "next";
import type { ReactNode } from "react";
import { merriweather, quicksand } from "@/app/fonts";
import { PRODUCTION_ORIGIN } from "@/shared/siteIdentity";
import "@/app/globals.css";

// Studio is an internal authoring tool, never a public search result — see
// app/robots.ts's `disallow: "/studio"` for the crawl-level half of this;
// `noindex`/`nofollow` here additionally covers the (unlikely, but
// possible) case of a crawler that ignores robots.txt or a stray inbound
// link. `noarchive`/`noimageindex` further ensure no cached copy or image
// from Studio's own UI ever surfaces in search results.
export const metadata: Metadata = {
  metadataBase: new URL(PRODUCTION_ORIGIN),
  title: { default: "RORUM | Events, Community & Creative Space", template: "%s" },
  description: "Discover RORUM — a place for events, community, hosting, catering and creative collaboration where people and ideas come together.",
  robots: { index: false, follow: false, noarchive: true, noimageindex: true },
};

// Studio's own root layout — independent of app/[locale]/layout.tsx (the
// site's root). Sanity Studio is an admin tool, not a localized page: it
// never needs a locale-specific <html lang>, and rendering it full-viewport
// (no <SiteShell> Header/Footer) is why it always lived outside the
// site-chrome route group. See app/[locale]/layout.tsx for the other half
// of this split.
export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${merriweather.variable} ${quicksand.variable}`}>{children}</body>
    </html>
  );
}
