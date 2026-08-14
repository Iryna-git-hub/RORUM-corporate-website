import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { merriweather, nunito, quicksand } from "@/app/fonts";
import { isLocale, locales, localeTags, type Locale } from "@/lib/i18n";
import { SanityLive } from "@/sanity/lib/live";
import "@/app/globals.css";

// The site's real root layout. Split out of the old single app/layout.tsx
// (now app/studio/layout.tsx) specifically so <html lang> can vary per
// locale: a layout can only read the dynamic-segment params of the segment
// it lives in (and that segment's descendants), never of an ancestor — so
// the only way for a root layout to legitimately know `locale` without
// forcing the whole app into dynamic rendering (e.g. via `headers()`) is
// for the [locale] segment itself to BE the root. See MIGRATION_REPORT.md's
// localization-routing section for the full reasoning.
//
// `dynamicParams` intentionally left at its default (`true`), NOT `false`:
// this was the root cause of a real bug where a brand-new Sanity `event`
// published between builds returned "Event page not found" even though
// events/[slug]/page.tsx correctly leaves its OWN dynamicParams at the
// on-demand-friendly default. In the App Router, `dynamicParams = false` on
// an ANCESTOR segment disables on-demand rendering for the entire subtree —
// including nested dynamic segments (like `[slug]`) that never opted out
// themselves — reproduced empirically as `NoFallbackError` when requesting
// a locale/slug combination outside generateStaticParams's build-time list.
// Invalid locales are still correctly rejected below via `isLocale()` +
// `notFound()`, which is the actual enforcement mechanism now.
export const dynamicParams = true;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL("https://rorum.dk"),
  title: { default: "RORUM | Creative Event Space in Copenhagen", template: "%s" },
  description: "Warm Copenhagen event space for workshops, gatherings, catering and community-led hosting.",
  robots: { index: true, follow: true },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  // Quicksand has no Cyrillic glyphs (see app/fonts.ts), so `uk` swaps in
  // Nunito under the same `--font-body` variable instead.
  const bodyFont = locale === "uk" ? nunito.variable : quicksand.variable;

  return (
    <html lang={localeTags[locale]} data-scroll-behavior="smooth">
      <body className={`${merriweather.variable} ${bodyFont}`}>
        {children}
        <SanityLive />
      </body>
    </html>
  );
}
