import { defineLive } from "next-sanity/live";
import { getClient } from "@/sanity/lib/client";
import { isSanityConfigured } from "@/sanity/env";

// next-sanity v13's Live Content API: `sanityFetch` is the one fetch helper
// pages should use (it transparently serves live/draft content when Draft
// Mode is on, and cached published content otherwise), and `<SanityLive />`
// (rendered once in the root layout) keeps the page updated via Sanity's
// live event stream — no manual revalidation/ISR-write wiring needed, which
// is the pattern the current next-sanity docs recommend over the older
// webhook-triggered `revalidateTag` approach from v11/v12 examples.
//
// A `SANITY_API_READ_TOKEN` is optional for a *public* dataset's published
// content, but required the moment Draft Mode is used (browsing drafts is
// always a privileged read). Guarded here so importing this module doesn't
// throw in an environment with no Sanity project configured yet — the
// exported helpers simply won't be called (see `isSanityConfigured` call
// sites in page code).
export const { sanityFetch, SanityLive } = isSanityConfigured
  ? defineLive({
      client: getClient(),
      serverToken: process.env.SANITY_API_READ_TOKEN,
      browserToken: undefined, // never expose a token to the browser bundle
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
