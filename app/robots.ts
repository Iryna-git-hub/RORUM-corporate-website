import type { MetadataRoute } from "next";
import { getSeoSiteDefaults } from "@/lib/siteSettings";

/**
 * Studio is an authoring tool, not a public page — it must never be
 * crawled or indexed. `noindex`/`nofollow` alone (app/studio/layout.tsx)
 * only stops indexing of pages a crawler has already fetched; disallowing
 * `/studio` here additionally stops crawlers from fetching it at all.
 * `_next` is intentionally NOT disallowed — those assets (JS/CSS/images)
 * are required to render every public page correctly. `/api/` (the Draft
 * Mode enable/disable handlers) is disallowed — it is machinery, not content.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { siteUrl } = await getSeoSiteDefaults();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/studio", "/api/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
