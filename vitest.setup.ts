// Vitest loads no `.env*` file on its own (unlike Playwright's config or
// Next's own dev/build/start, which read `.env.local` for free) — so
// `shared/siteIdentity.ts`'s module-scope `SITE_ORIGIN = resolveSiteOrigin(
// process.env.NEXT_PUBLIC_SITE_URL)` would throw the instant any test file
// imports it (directly, or transitively via lib/siteSettings.ts,
// lib/eventSharing.ts, lib/seo.ts, or sanity/components/SeoObjectInput.tsx).
//
// This setup file (wired in via vitest.config.ts's `test.setupFiles`) runs
// before any test file's own imports resolve, so it fixes a valid value
// here first. `https://ro-rum.dk` is deliberately used as the fixed test
// origin — it's the project's real production domain, and keeps every
// existing test's literal `https://ro-rum.dk` expectations valid without
// having to rewrite them just to migrate off the old hardcoded-constant
// model. Tests that need to exercise OTHER origins (Netlify-shaped, a future
// custom domain, localhost-rejection, etc.) call `resolveSiteOrigin()`
// directly with an explicit argument instead of relying on this env value —
// see shared/siteIdentity.test.ts.
if (!process.env.NEXT_PUBLIC_SITE_URL) {
  process.env.NEXT_PUBLIC_SITE_URL = "https://ro-rum.dk";
}
