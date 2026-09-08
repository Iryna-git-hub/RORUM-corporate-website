// Canonical `page.pageKey` / `legalPage.pageKey` -> public route (English,
// no locale prefix). Dependency-free by the same rule as shared/siteIdentity.ts
// (no React / Next.js / Sanity / browser APIs) so both the Next.js app and the
// separately bundled Sanity Studio can import it — the Presentation Tool's
// location resolver (sanity/presentation/resolve.ts) is the first consumer.
//
// NOTE: app/sitemap.ts and sanity/components/SeoObjectInput.tsx still hold
// their own private copies of this map (each documents why it must not import
// a Next-specific route file). This module is the shared home for new
// consumers; folding those two in is a separate, low-risk cleanup, not part
// of the Presentation/Draft Mode task.

/** Static `page` documents that have a public route of their own. */
export const PAGE_KEY_ROUTES: Record<string, string> = {
  home: "/",
  about: "/about",
  events: "/events",
  catering: "/catering",
  eventDecoration: "/event-decoration",
  hostAtRorum: "/host-at-rorum",
  communityMembership: "/community-membership",
  volunteer: "/volunteer",
  workWithUs: "/work-with-us",
  contact: "/contact",
  faq: "/faq",
  // `cateringMenuExamples` is deliberately absent — it is an in-page overlay
  // opened from /catering, never its own route (mirrors the same omission in
  // sanity/components/SeoObjectInput.tsx).
};

/** The three `legalPage` singleton documents and their routes. */
export const LEGAL_PAGE_KEY_ROUTES: Record<string, string> = {
  terms: "/terms",
  "privacy-policy": "/privacy-policy",
  "cookie-policy": "/cookie-policy",
};

/** Route for a document Presentation might ask about, or `undefined` if it has no public page. */
export function routeForPageKey(documentType: string | undefined, pageKey: string | undefined): string | undefined {
  if (!pageKey) return undefined;
  if (documentType === "page") return PAGE_KEY_ROUTES[pageKey];
  if (documentType === "legalPage") return LEGAL_PAGE_KEY_ROUTES[pageKey];
  return undefined;
}
