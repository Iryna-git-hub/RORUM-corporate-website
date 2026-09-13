import { isSanityConfigured } from "@/sanity/env";
import { sanityFetchStatic } from "@/sanity/lib/live";
import { siteSettingsQuery } from "@/sanity/queries/globals";
import { urlForImage } from "@/sanity/lib/image";
import type { I18nEntry } from "@/lib/sanity-i18n";
import { SITE_ORIGIN } from "@/shared/siteIdentity";

export interface SeoSiteDefaults {
  /** The deployed site's canonical origin — infrastructure, not editorial content. Always `shared/siteIdentity.ts`'s `SITE_ORIGIN` (resolved from `NEXT_PUBLIC_SITE_URL`); `siteSettings.siteUrl` is display-only in Studio (read-only) and is never read as a runtime authority here, so an accidentally stale/edited Sanity field can never change canonical/hreflang/sitemap URLs. */
  siteUrl: string;
  title?: I18nEntry<string>[] | null;
  description?: I18nEntry<string>[] | null;
  image?: string;
  imageAlt?: I18nEntry<string>[] | null;
}

/**
 * The one shared authority for the production site URL and the sitewide
 * Default SEO fallback (siteSettings.defaultSeo) — used by lib/seo.ts's
 * resolver, app/sitemap.ts and app/robots.ts so all three agree on the same
 * URL instead of each hardcoding it separately. Reads via `sanityFetchStatic`
 * (published, stega:false): everything it feeds is a stega-unsafe /
 * build-time context (SEO `<head>`, canonical, sitemap, robots) and must
 * never reflect a draft — and `app/sitemap.ts`/`robots.ts` run in
 * `generateStaticParams`-like build contexts where the request-aware
 * `sanityFetch` would call `draftMode()` and throw. Next fetch-memoization
 * still de-dupes repeat calls within one request.
 *
 * `siteUrl` is always `SITE_ORIGIN` (the env-driven value resolved in
 * shared/siteIdentity.ts) — deliberately NOT read from `data.siteUrl` (see
 * MIGRATION_REPORT.md's domain-authority correction): canonical/hreflang/
 * sitemap URLs are infrastructure, not ordinary editorial content, and must
 * never change just because a manager-editable Sanity field went stale or
 * got mistyped. `siteSettings.defaultSeo` (the genuinely editorial sitewide
 * SEO fallback) is unaffected by this and still reads live from Sanity as
 * before.
 */
export async function getSeoSiteDefaults(): Promise<SeoSiteDefaults> {
  const fallback: SeoSiteDefaults = { siteUrl: SITE_ORIGIN };
  if (!isSanityConfigured) return fallback;

  const { data } = await sanityFetchStatic({ query: siteSettingsQuery });
  if (!data) return fallback;

  return {
    siteUrl: SITE_ORIGIN,
    title: data.defaultSeo?.title,
    description: data.defaultSeo?.description,
    image: urlForImage(data.defaultSeo?.ogImage as unknown as Parameters<typeof urlForImage>[0])
      ?.width(1200)
      .height(630)
      .fit("crop")
      .url(),
    imageAlt: data.defaultSeo?.ogImage?.alt,
  };
}
