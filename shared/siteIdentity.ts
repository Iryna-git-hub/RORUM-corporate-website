// The single source of truth for RORUM's deployed public web origin —
// imported by Next.js server code, Sanity Studio client code (Studio is
// embedded in this same Next.js app at /studio — see app/studio/layout.tsx
// and sanity.config.ts — so it shares this exact bundling/env-inlining
// mechanism, not a separate Vite build), scripts, and tests alike.
// Dependency-free by design (no React, Next.js, Sanity, browser APIs, or
// server-only environment modules) so it can safely cross every one of those
// boundaries without pulling in a runtime that doesn't belong on the other
// side — see shared/eventFilterDefinitions.ts for the same pattern
// established earlier for Events filter definitions.
//
// The exact public domain is DEPLOYMENT-DRIVEN, not hardcoded: production
// (`ro-rum.dk`), a Netlify preview/staging deploy (`*.netlify.app` /
// `*.netlify.live`), and any future custom domain all set their own
// `NEXT_PUBLIC_SITE_URL`, and this module is the ONLY place that reads it and
// turns it into `SITE_ORIGIN`. Nothing here ever falls back to a hardcoded
// domain, `localhost`, or `window.location.origin` — a missing or invalid
// value throws immediately (at module-load time, which for the Next.js
// route modules that import this at module scope means build time) rather
// than silently serving canonical/OG/sitemap URLs for the wrong domain. This
// replaces an earlier hardcoded-`ro-rum.dk`-with-Netlify-rejected model — see
// MIGRATION_REPORT.md's domain-authority correction for that history.
//
// Business email addresses such as `hello@rorum.dk` (no hyphen) are a
// separate, unrelated fact — real contact addresses at the no-hyphen domain —
// and must never be "corrected" by this module or by anything that imports
// it.

/** Hostnames that can never be a legitimate deployed public origin. Checked against the URL's hostname only (never the full string), so this can't be fooled by a path/query containing these words. */
const FORBIDDEN_HOSTNAME_PATTERN = /^(localhost|127\.0\.0\.1|\[::1\]|::1)$/i;

/** Strips one or more trailing slashes — `"https://example.com/"` and `"https://example.com"` normalize to the same value, so concatenating a path that already starts with `/` can never produce a double slash. */
export function normalizeOrigin(input: string): string {
  return input.trim().replace(/\/+$/, "");
}

/**
 * Validates and normalizes a candidate site origin — the one gate every
 * value from `NEXT_PUBLIC_SITE_URL` must pass through.
 *
 * Accepts: any absolute HTTPS origin with no path/query/fragment — a
 * production custom domain, a `*.netlify.app`/`*.netlify.live` preview or
 * staging deploy, or any other future public domain — after normalizing away
 * a trailing slash.
 *
 * Rejects (throws, with a clear message naming `NEXT_PUBLIC_SITE_URL`):
 * a missing/empty value, a malformed URL, `localhost`/`127.0.0.1`/`[::1]`,
 * any non-HTTPS scheme, and a value carrying a path/query/fragment (which
 * would otherwise silently corrupt every URL `buildUrl` produces from it).
 *
 * There is no silent fallback to any hardcoded domain anywhere in this
 * function — a bad value is a configuration error that must be fixed at the
 * deployment, not papered over here.
 */
export function resolveSiteOrigin(raw?: string | null): string {
  const trimmed = raw?.trim();
  if (!trimmed) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is required and must be a valid public HTTPS origin (e.g. https://ro-rum.dk or https://your-site.netlify.app) — it is missing or empty. Set it in this environment's deployment configuration (see .env.example).",
    );
  }

  const normalized = normalizeOrigin(trimmed);
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL is required and must be a valid public HTTPS origin — "${trimmed}" is not a valid absolute URL.`,
    );
  }

  if (url.protocol !== "https:") {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL is required and must be a valid public HTTPS origin — "${trimmed}" uses the "${url.protocol}" scheme, not "https:".`,
    );
  }
  if (FORBIDDEN_HOSTNAME_PATTERN.test(url.hostname)) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL is required and must be a valid public HTTPS origin — "${trimmed}" is a local/loopback address, not a deployed public domain.`,
    );
  }
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be a bare origin with no path, query string, or fragment — got "${trimmed}".`,
    );
  }

  return normalizeOrigin(url.origin);
}

/**
 * The one resolved site origin every consumer imports — Next.js metadata
 * (canonical/hreflang/OG), the sitemap/robots, event share/JSON-LD URLs, and
 * Sanity Studio's SEO preview all read this same value, resolved once here
 * from `NEXT_PUBLIC_SITE_URL`.
 *
 * Resolved at MODULE-LOAD time, by design: for the Next.js route modules
 * that import this at module scope (app/[locale]/layout.tsx's and
 * app/studio/layout.tsx's `metadata.metadataBase`), a missing/invalid value
 * throws during `next build` — a loud, immediate build failure instead of a
 * site silently serving the wrong domain's URLs to every visitor and every
 * search engine.
 */
export const SITE_ORIGIN = resolveSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);

/** Joins an origin and an internal path with exactly one slash between them — `path` is normalized to always start with `/` first. */
export function buildUrl(origin: string, path: string): string {
  const normalizedOrigin = normalizeOrigin(origin);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}
