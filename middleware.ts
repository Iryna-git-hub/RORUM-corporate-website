import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, localizedHref } from "@/lib/i18n";
import { PRODUCTION_ORIGIN } from "@/shared/siteIdentity";

// The 3 permanent redirects that used to live in next.config.js's
// redirects() — moved here so each is defined once and automatically valid
// for every locale (checked against the locale-neutral path, re-prefixed
// with whichever locale the request actually used), instead of needing a
// separate next.config.js entry per locale per redirect.
const LEGACY_REDIRECTS: Record<string, string> = {
  "/private-meetings": "/host-at-rorum",
  "/host-an-event": "/host-at-rorum",
  "/space-decoration-event-styling": "/event-decoration",
};

// The old, no-hyphen domain — never the canonical origin (see
// shared/siteIdentity.ts's own doc comment for the full domain-authority
// correction). This host check is a best-effort application-level safety
// net for the page routes this middleware already covers; it does nothing
// unless `rorum.dk` is separately connected to this deployment as a domain
// alias in Netlify (a manual, account-holder-only step this code cannot
// perform or verify) — see MIGRATION_REPORT.md's redirect/hosting section
// for the exact manual Netlify configuration, which is the complete,
// authoritative fix covering every path (including /studio, /api, and
// static assets, none of which this middleware's own matcher reaches).
const OLD_DOMAIN_HOST = "rorum.dk";

// Only `x-forwarded-proto` is trusted for the HTTP->HTTPS check — never a
// fallback to `request.nextUrl.protocol`. Netlify's edge (and any real
// reverse proxy) sets this header after terminating TLS, but local dev/test
// (`next dev`/`next start` with no proxy in front) never does — falling
// back to `nextUrl.protocol` there would read "http:" for every single
// local/test request and redirect all of them, breaking local development
// and this project's entire Playwright suite. Absent the header, this
// check simply does nothing, which is the safe default.
function isInsecureRequest(request: NextRequest): boolean {
  return request.headers.get("x-forwarded-proto") === "http";
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase().split(":")[0] ?? "";

  // http://rorum.dk/*, https://rorum.dk/*, and http://ro-rum.dk/* all
  // resolve to https://ro-rum.dk/* — path and query string preserved,
  // never the domain-neutral locale rewrite below (which would otherwise
  // still run for the correct host but never for the wrong one).
  if (host === OLD_DOMAIN_HOST || (host === "ro-rum.dk" && isInsecureRequest(request))) {
    const target = new URL(request.nextUrl.pathname + request.nextUrl.search, PRODUCTION_ORIGIN);
    return NextResponse.redirect(target, 308);
  }

  const { pathname } = request.nextUrl;
  const segments = pathname.split("/");
  const maybeLocale = segments[1] ?? "";
  const explicitLocale = isLocale(maybeLocale) ? maybeLocale : null;
  const restPath = explicitLocale ? `/${segments.slice(2).join("/")}` : pathname;
  const activeLocale = explicitLocale ?? defaultLocale;

  const legacyTarget = LEGACY_REDIRECTS[restPath];
  if (legacyTarget) {
    const url = request.nextUrl.clone();
    url.pathname = localizedHref(legacyTarget, activeLocale);
    return NextResponse.redirect(url, 308);
  }

  // English has exactly one URL — canonicalize away an explicit /en/*.
  if (explicitLocale === defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = restPath;
    return NextResponse.redirect(url, 308);
  }

  // /da/... and /uk/... already match the [locale] segment as-is.
  if (explicitLocale) {
    return NextResponse.next();
  }

  // Unprefixed = English. Rewrite internally to /en/... so the router's
  // [locale] segment resolves it, while the visible browser URL and
  // canonical stay byte-identical to before locale routing existed.
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Excludes /studio (its own root, never localized), Next internals, and
  // any path containing a dot (covers robots.txt, sitemap.xml, and every
  // /public asset in one rule — those live outside the [locale] segment and
  // would 404 if rewritten to /en/*).
  matcher: ["/((?!_next/|studio(?:/|$)|api(?:/|$)|.*\\..*).*)"],
};
