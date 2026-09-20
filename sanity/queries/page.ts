import { defineQuery } from "next-sanity";

// The new compact `page` document type (see sanity/schemaTypes/documents/page.ts) —
// one query, reused by every page instead of one query per page singleton.
export const pageByKeyQuery = defineQuery(`*[_type == "page" && pageKey == $pageKey][0]`);

/**
 * `pageKey`/`_updatedAt` for every `page` and `legalPage` document — used
 * only by app/sitemap.ts to report each static route's real last-modified
 * time instead of the moment the sitemap itself was generated. One query
 * covers every static route (`page-catering-menu-examples` is included in
 * the result but never matched against a route — see sitemap.ts's own
 * PAGE_ROUTES map, which has no entry for it).
 */
export const pagesUpdatedAtQuery = defineQuery(
  `*[_type in ["page", "legalPage"]]{pageKey, _updatedAt}`,
);
