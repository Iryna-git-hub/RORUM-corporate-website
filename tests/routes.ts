// All public App Router routes, discovered from app/**/page.tsx plus one
// representative slug for the dynamic /events/[slug] route (32 slugs exist;
// they share one template, so one instance is representative for visual/
// interaction coverage - see MIGRATION_REPORT.md for the full slug list).
export const STATIC_ROUTES = [
  "/",
  "/events",
  "/host-at-rorum",
  "/catering",
  "/event-decoration",
  "/community-membership",
  "/volunteer",
  "/work-with-us",
  "/about",
  "/contact",
  "/faq",
  "/terms",
  "/privacy-policy",
  "/cookie-policy",
] as const;

export const SAMPLE_EVENT_ROUTE = "/events/copenhagen-makers-dinner";

export const ALL_ROUTES = [...STATIC_ROUTES, SAMPLE_EVENT_ROUTE] as const;

// Key Tailwind default breakpoints plus one px below each boundary, used by
// the responsive transition matrix.
export const BREAKPOINT_MATRIX = [
  360, 375, 639, 640, 767, 768, 1023, 1024, 1279, 1280, 1535, 1536,
] as const;

// Smaller set used for full-page visual regression screenshots per route -
// one representative width per major Tailwind tier keeps the golden-image
// set maintainable (14 routes x 4 widths = 56 images) while still covering
// every layout tier (mobile / sm-tablet / lg-desktop / xl-wide).
export const VISUAL_WIDTHS = [375, 768, 1024, 1440] as const;
