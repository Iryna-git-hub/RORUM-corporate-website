import type { Metadata } from "next";
import { pages, siteUrl } from "@/lib/data";
import { locales, localeTags, localizedHref, type Locale } from "@/lib/i18n";

const ogLocaleTags: Record<Locale, string> = { en: "en_US", da: "da_DK", uk: "uk_UA" };

/** Non-locale-aware fallback, kept for any call site not yet converted to `generateMetadata`. */
export function pageMetadata(path: string): Metadata {
  const page = pages.find((item) => item.href === path) ?? pages[0]!;
  const title =
    page.href === "/"
      ? "RORUM | Creative Event Space in Copenhagen"
      : `${page.title} | RORUM`;
  return {
    title,
    description: page.description,
    alternates: { canonical: `${siteUrl}${page.href}` },
    openGraph: {
      title,
      description: page.description,
      url: `${siteUrl}${page.href}`,
      siteName: "RORUM",
      images: [
        {
          url: `${siteUrl}/images/hero.jpg`,
          width: 1200,
          height: 630,
          alt: "RORUM creative event space",
        },
      ],
      locale: "en_US",
      type: "website",
    },
  };
}

/**
 * Locale-aware page metadata: `alternates.canonical` points at this
 * locale's own URL, `alternates.languages` lists every locale variant of
 * the same page (hreflang, including `x-default` pointing at the
 * unprefixed English URL) so search engines understand the 3 URLs are
 * translations of one page rather than duplicate content.
 */
export function localizedPageMetadata({
  path,
  locale,
  title,
  description,
  image = "/images/hero.jpg",
}: {
  path: string;
  locale: Locale;
  title: string;
  description: string;
  image?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${localizedHref(path, locale)}`,
      languages: {
        ...Object.fromEntries(locales.map((l) => [localeTags[l], `${siteUrl}${localizedHref(path, l)}`])),
        "x-default": `${siteUrl}${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${localizedHref(path, locale)}`,
      siteName: "RORUM",
      images: [{ url: `${siteUrl}${image}`, width: 1200, height: 630, alt: title }],
      locale: ogLocaleTags[locale],
      type: "website",
    },
  };
}
