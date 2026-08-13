import type { Metadata } from "next";
import type { ReactNode } from "react";
import { merriweather, quicksand } from "@/app/fonts";
import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rorum.dk"),
  title: { default: "RORUM | Creative Event Space in Copenhagen", template: "%s" },
  description: "Warm Copenhagen event space for workshops, gatherings, catering and community-led hosting.",
  robots: { index: true, follow: true },
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
