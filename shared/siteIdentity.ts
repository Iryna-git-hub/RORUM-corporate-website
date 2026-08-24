// The single source of truth for RORUM's production web origin — imported by
// Next.js server code, Sanity Studio client code, scripts, and tests alike.
// Dependency-free by design (no React, Next.js, Sanity, browser APIs, or
// server-only environment modules) so it can safely cross every one of those
// boundaries without pulling in a runtime that doesn't belong on the other
// side — see shared/eventFilterDefinitions.ts for the same pattern
// established earlier for Events filter definitions.
//
// `ro-rum.dk` (hyphenated) is the real, owned production domain — NOT
// `rorum.dk` (no hyphen), which several parts of this codebase used to
// hardcode by mistake (see MIGRATION_REPORT.md's domain-authority correction
// for the full audit). Business email addresses such as `hello@rorum.dk`
// are a separate, unrelated fact — real contact addresses at the no-hyphen
// domain — and must never be "corrected" by this module or by anything that
// imports it.

/** The one canonical production origin — no trailing slash, always HTTPS. */
export const PRODUCTION_ORIGIN = "https://ro-rum.dk";

/** Recognizably local or ephemeral-preview origins that must never be treated as the production canonical origin. */
const LOCAL_OR_PREVIEW_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$|\.netlify\.app$|\.netlify\.live$/i;

/** Strips one or more trailing slashes — `"https://ro-rum.dk/"` and `"https://ro-rum.dk"` normalize to the same value, so concatenating a path that already starts with `/` can never produce a double slash. */
export function normalizeOrigin(input: string): string {
  return input.trim().replace(/\/+$/, "");
}

/** True only for the exact canonical production origin, after normalization (so a trailing-slash variant still counts). */
export function isProductionOrigin(origin: string): boolean {
  return normalizeOrigin(origin) === PRODUCTION_ORIGIN;
}

/**
 * The one resolver for "what production origin should this build use" —
 * everything that needs the production origin (Next metadata, sitemap,
 * robots, structured data, the Studio SEO preview) is meant to go through
 * this function rather than hold its own separate constant.
 *
 * `rawOverride` exists only so a future, explicitly-named production
 * environment variable can be threaded through without a second resolver —
 * nothing in this codebase currently sets one, and none is required to. A
 * missing, empty, non-HTTPS, or localhost/preview-shaped override is never
 * silently trusted — it always falls back to `PRODUCTION_ORIGIN`, never to
 * whatever the caller happened to pass in.
 */
export function resolveProductionOrigin(rawOverride?: string | null): string {
  const trimmed = rawOverride?.trim();
  if (!trimmed) return PRODUCTION_ORIGIN;
  const normalized = normalizeOrigin(trimmed);
  if (!normalized || !/^https:\/\//i.test(normalized) || LOCAL_OR_PREVIEW_ORIGIN_PATTERN.test(normalized)) {
    return PRODUCTION_ORIGIN;
  }
  return normalized;
}

/** Joins an origin and an internal path with exactly one slash between them — `path` is normalized to always start with `/` first. */
export function buildUrl(origin: string, path: string): string {
  const normalizedOrigin = normalizeOrigin(origin);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}
