import type { QueryParams } from "next-sanity";
import { defineLive } from "next-sanity/live";
import { getClient } from "@/sanity/lib/client";
import { stegaFilter } from "@/sanity/lib/stegaFilter";
import { isSanityConfigured } from "@/sanity/env";

// next-sanity's Live Content API. `sanityFetch` is the request-aware fetch
// helper every rendered page/layout uses; `<SanityLive />` (rendered once in
// the root layout) keeps rendered pages in sync with the Content Lake over a
// live event stream — no revalidation webhook wiring needed.
//
// Draft Mode wiring (see app/api/draft-mode/{enable,disable} and
// sanity.config.ts's Presentation Tool):
//
// - `serverToken` — a SERVER-ONLY Sanity **Viewer (read-only)** token. With
//   `strict: false` (the default), the request-aware `sanityFetch` inspects
//   `draftMode()`: a normal visitor has Draft Mode off, so it fetches cached
//   PUBLISHED content with no token and no stega. Only inside Next.js Draft
//   Mode does it switch to the draft perspective + stega.
// - `browserToken` — the SAME Viewer token. next-sanity ships it to the
//   browser ONLY when `<SanityLive>` opens a draft-capable live connection,
//   which only happens when `draftMode().isEnabled` (see the root layout's
//   explicit `includeDrafts`). This is what makes true live preview work:
//   an editor typing in a Studio field sees the preview iframe update with no
//   Publish. A normal visitor's `<SanityLive>` never requests drafts, so the
//   token is never sent to them. It is read-only — it cannot mutate anything,
//   and the Editor write token is never involved here or anywhere in the
//   Next.js runtime.
// - `stega.studioUrl` lets the server encode invisible edit-links into draft
//   strings so Presentation can map a clicked DOM node back to its exact
//   Sanity field. Stega ENCODING stays gated on Draft Mode by next-sanity, so
//   published HTML served to normal visitors is never stega-encoded.
// - `stega.filter` (see stegaFilter.ts) additionally keeps encoding OFF the
//   structural discriminator fields (`sectionKey`, `itemKey`, `actionKey`,
//   `kind`, …) that the resolver layer matches with `===` — without it those
//   lookups miss in Draft Mode and every page falls back to hardcoded English
//   with no overlays.
//
// Guarded by `isSanityConfigured` so importing this module never throws in an
// environment with no Sanity project yet.
const readToken = process.env.SANITY_API_READ_TOKEN;

export const { sanityFetch, SanityLive } = isSanityConfigured
  ? defineLive({
      client: getClient().withConfig({ stega: { studioUrl: "/studio", filter: stegaFilter } }),
      serverToken: readToken,
      browserToken: readToken,
    })
  : {
      sanityFetch: async () => {
        throw new Error(
          "sanityFetch() called but Sanity is not configured (missing " +
            "NEXT_PUBLIC_SANITY_PROJECT_ID/NEXT_PUBLIC_SANITY_DATASET). Check " +
            "isSanityConfigured before calling this.",
        );
      },
      SanityLive: () => null,
    };

/**
 * Build-time / static PUBLISHED fetch — for `generateStaticParams`,
 * `app/sitemap.ts`, `app/robots.ts` and the site-wide SEO defaults.
 *
 * `generateStaticParams` runs with no HTTP request, so next-sanity's automatic
 * `draftMode()` / `cookies()` perspective detection throws there ("used
 * `draftMode()` inside `generateStaticParams`"). Passing an explicit
 * `perspective: "published"` + `stega: false` disables that detection entirely
 * and pins the read to published, stega-free, regardless of Draft Mode — which
 * is also exactly what sitemaps, robots and canonical/SEO defaults must always
 * be. This is the official next-sanity pattern for build-time queries.
 *
 * Rendered page BODIES must NOT use this — they use the bare `sanityFetch`,
 * which is request-aware and serves draft content inside Draft Mode.
 */
export function sanityFetchStatic<const QueryString extends string>(options: {
  query: QueryString;
  params?: QueryParams | Promise<QueryParams>;
  tags?: string[];
}) {
  return sanityFetch({ ...options, perspective: "published", stega: false });
}
