import { defineDocuments, defineLocations, type PresentationPluginOptions } from "sanity/presentation";
import { LEGAL_PAGE_KEY_ROUTES, PAGE_KEY_ROUTES, routeForPageKey } from "@/shared/pageRoutes";

// Wires Sanity's Presentation Tool to this site's routes, both directions:
//
// - `locations`: given an open document, which page(s) of the site show it —
//   powers the "Used on these pages" links in the document form and the
//   "open in Presentation" affordance.
// - `mainDocuments`: given a URL open in the preview iframe, which document is
//   the primary one being viewed — so navigating the site preview keeps the
//   Studio's document pane in sync.
//
// The `page`/`legalPage`/`event` shapes below match the real GROQ each route's
// own page.tsx runs (`pageByKeyQuery`, `legalPageQuery`, `eventBySlugQuery`).

const pageDocuments = Object.entries(PAGE_KEY_ROUTES).map(([pageKey, route]) => ({
  route,
  filter: '_type == "page" && pageKey == $pageKey',
  params: { pageKey },
}));

const legalDocuments = Object.entries(LEGAL_PAGE_KEY_ROUTES).map(([pageKey, route]) => ({
  route,
  filter: '_type == "legalPage" && pageKey == $pageKey',
  params: { pageKey },
}));

export const resolve: PresentationPluginOptions["resolve"] = {
  mainDocuments: defineDocuments([
    ...pageDocuments,
    ...legalDocuments,
    { route: "/events/:slug", filter: '_type == "event" && slug.current == $slug' },
  ]),
  locations: {
    page: defineLocations({
      select: { pageKey: "pageKey" },
      resolve: (doc) => {
        const route = routeForPageKey("page", doc?.pageKey ?? undefined);
        if (!route) return null;
        return { locations: [{ title: `${doc?.pageKey ?? "page"} (site page)`, href: route }] };
      },
    }),
    legalPage: defineLocations({
      select: { pageKey: "pageKey" },
      resolve: (doc) => {
        const route = routeForPageKey("legalPage", doc?.pageKey ?? undefined);
        if (!route) return null;
        return { locations: [{ title: `${doc?.pageKey ?? "legal page"} (legal page)`, href: route }] };
      },
    }),
    event: defineLocations({
      select: { slug: "slug.current" },
      resolve: (doc) => {
        if (!doc?.slug) return null;
        return {
          locations: [
            { title: `Event: ${doc.slug}`, href: `/events/${doc.slug}` },
            { title: "Events listing", href: "/events" },
          ],
        };
      },
    }),
  },
};
