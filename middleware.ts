import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, localizedHref } from "@/lib/i18n";

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

export function middleware(request: NextRequest) {
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
