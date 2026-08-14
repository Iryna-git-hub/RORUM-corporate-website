import { pickLocalized } from "@/lib/sanity-i18n";
import type { Locale } from "@/lib/i18n";
import { contactDetails, socialLinks as fallbackSocialLinks, type SocialIconName } from "@/lib/siteConfig";
import type { ContactInfoQueryResult, SocialLinksQueryResult } from "@/sanity.types";

export interface ResolvedContactDetails {
  email: string;
  phone: string;
  phoneHref: string;
  address: string;
  shortAddress: string;
  mapHref: string;
  mapQueryAddress: string;
}

export interface ResolvedSocialLink {
  href: string;
  label: string;
  icon: SocialIconName;
  brandColor: string;
}

/** Shared by the Footer and the Contact page — both show the same facts. */
export function resolveContactDetails(doc: ContactInfoQueryResult | null | undefined): ResolvedContactDetails {
  return {
    email: doc?.email ?? contactDetails.email,
    phone: doc?.phone ?? contactDetails.phone,
    phoneHref: doc?.phoneHref ?? contactDetails.phoneHref,
    address: doc?.address ?? contactDetails.address,
    shortAddress: doc?.shortAddress ?? contactDetails.shortAddress,
    mapHref: doc?.mapHref ?? contactDetails.mapHref,
    mapQueryAddress: doc?.mapQueryAddress ?? contactDetails.mapQueryAddress,
  };
}

export function resolveSocialLinks(
  doc: SocialLinksQueryResult | null | undefined,
  locale: Locale,
): ResolvedSocialLink[] {
  return doc?.links?.length
    ? doc.links.map((l, i) => ({
        href: l?.href ?? fallbackSocialLinks[i]?.href ?? "",
        label: pickLocalized(l?.label, locale) ?? fallbackSocialLinks[i]?.label ?? "",
        icon: (l?.icon as SocialIconName | undefined) ?? fallbackSocialLinks[i]?.icon ?? "instagram",
        brandColor: l?.brandColor ?? fallbackSocialLinks[i]?.brandColor ?? "#000000",
      }))
    : fallbackSocialLinks;
}
