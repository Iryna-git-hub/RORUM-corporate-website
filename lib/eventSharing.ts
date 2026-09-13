import type { Locale } from "@/lib/i18n";
import { localizedHref } from "@/lib/i18n";
import type { RorumEvent } from "@/lib/data";
import { buildUrl, SITE_ORIGIN } from "@/shared/siteIdentity";

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

/**
 * Absolutizes an event image candidate against the deployed site origin.
 *
 * `sanityEventToRorumEvent()` (lib/sanityEvents.ts) can resolve `event.image`
 * to a **relative** path — either the generic `/images/hero.jpg` UI
 * placeholder, or a static-seed event banner such as
 * `/images/events/banners/community-reset-night.png` (lib/data.ts) — for any
 * event that has no image asset of its own in Sanity. `seo.ogImageUrl` /
 * `socialImageUrl` are already-absolute Sanity CDN URLs in practice, but are
 * routed through the same guard for a single, consistent absolutization
 * point rather than trusting each source's shape individually.
 *
 * Every consumer of `EventShareData.image` (JSON-LD, Open Graph, Twitter
 * Card, native share) needs an absolute URL — JSON-LD in particular has no
 * base URL to resolve a relative path against, so an un-absolutized value
 * would silently emit an invalid `Event.image`. Resolving this once here
 * (rather than duplicating the guard at each call site, as `lib/seo.ts`
 * currently must for its own separate image inputs) is the same
 * one-central-resolver pattern this module already uses for `shareData.url`.
 */
function toAbsoluteEventImage(candidate: string | undefined): string | undefined {
  if (!candidate) return undefined;
  return /^https?:\/\//.test(candidate) ? candidate : buildUrl(SITE_ORIGIN, candidate);
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
    url: buildUrl(SITE_ORIGIN, localizedHref(`/events/${event.slug}`, locale)),
    // The mapper's generic /images/hero.jpg is only an emergency UI
    // placeholder, not an event-specific banner. Leave that case empty so
    // localizedPageMetadata can prefer the manager's site-wide social image
    // before falling back to the same static hero as its final safety net.
    // The surviving candidate is always absolutized (see
    // toAbsoluteEventImage) so `shareData.image` is guaranteed absolute for
    // every consumer, including JSON-LD.
    image: toAbsoluteEventImage(
      event.seo?.ogImageUrl ||
        event.socialImageUrl ||
        (event.image && event.image !== "/images/hero.jpg" ? event.image : undefined),
    ),
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
