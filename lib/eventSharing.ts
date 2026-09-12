import type { Locale } from "@/lib/i18n";
import { localizedHref } from "@/lib/i18n";
import type { RorumEvent } from "@/lib/data";
import { buildUrl, PRODUCTION_ORIGIN } from "@/shared/siteIdentity";

export interface EventShareData {
  locale: Locale;
  title: string;
  metadataTitle: string;
  description: string;
  text: string;
  url: string;
  image?: string;
  imageAlt?: string;
}

export interface EventShareLinks {
  whatsapp: string;
  email: string;
  linkedin: string;
  facebook: string;
}

/** One localized, canonical data source for event metadata and share actions. */
export function resolveEventShareData(
  event: RorumEvent,
  locale: Locale,
  fallbackShareText = "",
): EventShareData {
  const description = event.seo?.description || event.longDescription || "";
  return {
    locale,
    title: event.title,
    metadataTitle: event.seo?.title || `${event.title} | RORUM`,
    description,
    text: description || fallbackShareText,
    url: buildUrl(PRODUCTION_ORIGIN, localizedHref(`/events/${event.slug}`, locale)),
    // The mapper's generic /images/hero.jpg is only an emergency UI
    // placeholder, not an event-specific banner. Leave that case empty so
    // localizedPageMetadata can prefer the manager's site-wide social image
    // before falling back to the same static hero as its final safety net.
    image:
      event.seo?.ogImageUrl ||
      event.socialImageUrl ||
      (event.image && event.image !== "/images/hero.jpg" ? event.image : undefined),
    imageAlt: event.seo?.ogImageAlt || event.imageAlt || undefined,
  };
}

/** Share endpoints only receive the canonical URL/copy they actually support. */
export function buildEventShareLinks({ title, text, url }: Pick<EventShareData, "title" | "text" | "url">): EventShareLinks {
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
      [text, title, url].filter(Boolean).join("\n\n"),
    )}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };
}

export function buildNativeSharePayload({
  title,
  text,
  url,
}: Pick<EventShareData, "title" | "text" | "url">): ShareData {
  return { title, text, url };
}
