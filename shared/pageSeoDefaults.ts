// The "page's own approved SEO default" tier for every static page/legalPage
// route — the same English strings each route's own `page.tsx` already
// hardcodes as its own `fallback.seoTitle`/`fallback.description` (used
// there when the document's own `seo.title`/`.description` is empty). Kept
// here, dependency-free (no React/Next.js/Sanity/browser/server-only code),
// ONLY so the Sanity Studio SEO preview can show the exact same fallback
// text a visitor would actually receive for a static page with no SEO
// override — Studio has no access to a page's own route file.
//
// This is a deliberate, disclosed duplication of already-hardcoded English
// strings (matching this project's established Studio/Next boundary
// convention — see sanity/components/SeoObjectInput.tsx's own PAGE_ROUTES
// map, or shared/eventFilterDefinitions.ts's doc comment) — NOT a new
// runtime dependency. Each route's own `page.tsx` is left completely
// untouched and remains the actual source of truth for what's emitted;
// keep this table in sync by hand if a page's own fallback text ever
// changes. Keyed by the same `pageKey`/legalPage `pageKey` values
// `sanity/components/SeoObjectInput.tsx`'s `PAGE_ROUTES`/`LEGAL_ROUTES` and
// `app/sitemap.ts`'s `ROUTE_TO_PAGE_KEY` already use.
export interface PageSeoDefault {
  title: string;
  description: string;
}

export const PAGE_SEO_DEFAULTS: Record<string, PageSeoDefault> = {
  home: {
    title: "RORUM | Events, Community & Creative Space",
    description:
      "Discover RORUM — a place for events, community, hosting, catering and creative collaboration where people and ideas come together.",
  },
  about: {
    title: "About RORUM | Our Space, Purpose & Community",
    description:
      "Learn about RORUM, our purpose and our approach to creating thoughtful events, welcoming experiences and meaningful communities.",
  },
  events: {
    title: "Upcoming Events at RORUM | Find Your Next Event",
    description: "Explore upcoming events at RORUM, find practical information and choose an experience that interests and inspires you.",
  },
  hostAtRorum: {
    title: "Host Your Event at RORUM | Venue & Support",
    description: "Plan and host your event at RORUM with a flexible setting, practical support and an experience shaped around your guests.",
  },
  catering: {
    title: "Catering for Events | RORUM",
    description: "Explore RORUM catering for meetings, receptions, dinners and events, with menus tailored to the occasion and your guests.",
  },
  eventDecoration: {
    title: "Event Decoration & Styling | RORUM",
    description: "Create the right atmosphere for your event with RORUM decoration and styling tailored to your format, space and vision.",
  },
  communityMembership: {
    title: "Community Membership | Join RORUM",
    description: "Become part of the RORUM community, meet people, exchange ideas and take part in activities and shared experiences.",
  },
  volunteer: {
    title: "Volunteer at RORUM | Join the Community",
    description: "Discover ways to volunteer at RORUM, contribute your skills and energy, and help create welcoming events and communities.",
  },
  workWithUs: {
    title: "Work With Us | Opportunities at RORUM",
    description: "Explore opportunities to work and collaborate with RORUM and contribute to events, hospitality and community experiences.",
  },
  contact: {
    title: "Contact RORUM | Get in Touch",
    description: "Contact RORUM with questions about events, hosting, catering, membership, collaboration or visiting the space.",
  },
  faq: {
    title: "Frequently Asked Questions | RORUM",
    description: "Find answers to common questions about RORUM events, hosted programmes, volunteering, services and practical information.",
  },
  terms: {
    title: "Terms and Conditions | RORUM",
    description: "Read the terms and conditions that apply when using the RORUM website, services and related features.",
  },
  "privacy-policy": {
    title: "Privacy Policy | RORUM",
    description: "Learn how RORUM collects, uses, stores and protects personal information when you use the website or contact us.",
  },
  "cookie-policy": {
    title: "Cookie Policy | RORUM",
    description: "Learn which cookies the RORUM website uses, why they are used and how you can manage your cookie preferences.",
  },
};
