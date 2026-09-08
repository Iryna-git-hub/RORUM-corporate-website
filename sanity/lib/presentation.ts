// Shared constants for the Sanity Presentation Tool <-> Next.js Draft Mode
// handshake. Imported by the `"use client"` Studio config (sanity.config.ts),
// by the Draft Mode API routes, and by tests — so this file must stay free of
// `next/headers` and any other server-only import.

/**
 * The route the Presentation Tool calls (with a one-time preview-URL secret it
 * mints and stores in the dataset) to turn on Next.js Draft Mode for that
 * browser session. Implemented by app/api/draft-mode/enable/route.ts via
 * `defineEnableDraftMode`, which validates the secret server-side with the
 * Viewer token before setting the draft cookie.
 */
export const DRAFT_MODE_ENABLE_ROUTE = "/api/draft-mode/enable";

/** The route that turns Draft Mode back off (clears the cookie, redirects home). */
export const DRAFT_MODE_DISABLE_ROUTE = "/api/draft-mode/disable";

/**
 * Origin the Presentation Tool loads the site preview from.
 *
 * Normally left undefined: the Studio is embedded at `/studio` on the SAME
 * origin as the site, so a relative `/` preview URL (see sanity.config.ts)
 * works identically on localhost and on the deployed site — no environment
 * variable, no branch, one code path everywhere.
 *
 * Set `NEXT_PUBLIC_SANITY_PREVIEW_ORIGIN` only when the Studio is opened from
 * a different origin than the frontend it should preview (for example a
 * Netlify deploy-preview Studio pointed at the production site). Value is a
 * bare origin such as `https://ro-rum.dk`. It is only a URL — never a secret —
 * so `NEXT_PUBLIC_` is the correct prefix (the Studio bundle runs in the
 * browser and needs to read it).
 */
export const PREVIEW_ORIGIN: string | undefined =
  process.env.NEXT_PUBLIC_SANITY_PREVIEW_ORIGIN?.trim() || undefined;
