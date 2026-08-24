import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/live";
import { siteSettingsQuery } from "@/sanity/queries/globals";
import { urlForImage } from "@/sanity/lib/image";
import { siteUrl as staticSiteUrl } from "@/lib/data";
import type { I18nEntry } from "@/lib/sanity-i18n";

export interface SeoSiteDefaults {
  /** Manager-editable in Studio (Site settings → Canonical site URL); falls back to the static build-time value when Sanity is unavailable or the field is unset. */
  siteUrl: string;
  title?: I18nEntry<string>[] | null;
  description?: I18nEntry<string>[] | null;
  image?: string;
  imageAlt?: I18nEntry<string>[] | null;
}

/**
 * The one shared authority for the production site URL and the sitewide
 * Default SEO fallback (siteSettings.defaultSeo) — used by
 * lib/seo.ts's resolver, app/sitemap.ts and app/robots.ts so all three agree
 * on the same URL instead of each hardcoding it separately. `siteSettings`
 * is a singleton read via the same `sanityFetch`/Next fetch-memoization
 * every other server read in this project uses, so calling this more than
 * once per request (e.g. once from generateMetadata, once from the page
 * body) doesn't cause a duplicate network round trip.
 *
 * Falls back to the static `lib/data.ts` siteUrl (never localhost/preview)
 * whenever Sanity is unavailable, `siteSettings` doesn't exist yet, or its
 * `siteUrl` field is empty — a manager-editable field is preferred, but a
 * missing/unpublished one must never break metadata generation at build
 * time.
 */
export async function getSeoSiteDefaults(): Promise<SeoSiteDefaults> {
  const fallback: SeoSiteDefaults = { siteUrl: staticSiteUrl };
  if (!isSanityConfigured) return fallback;

  const { data } = await sanityFetch({ query: siteSettingsQuery });
  if (!data) return fallback;

  return {
    siteUrl: data.siteUrl?.trim() || staticSiteUrl,
    title: data.defaultSeo?.title,
    description: data.defaultSeo?.description,
    image: urlForImage(data.defaultSeo?.ogImage as unknown as Parameters<typeof urlForImage>[0])?.width(1200).url(),
    imageAlt: data.defaultSeo?.ogImage?.alt,
  };
}
