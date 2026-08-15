// Canonical id scheme for the `page` document type. The original scheme
// (`page.<key>`, dotted) is not publicly readable: confirmed by direct,
// unauthenticated GROQ tests that a dash-based id (`legalPage-terms`) reads
// fine anonymously while a dot-based id (`page.home`) returns null, on the
// same dataset, same auth state — differing only in id format. Every page
// document was migrated from the dotted id to the dashed one below (see
// scripts/migrate-page-ids.ts, MIGRATION_REPORT.md).
//
// This is the single source of truth for both ids — `sanity/structure.ts`,
// the migration script, and the (separate, not-run-automatically) cleanup
// script all import from here so the mapping can never drift between them.
export const PAGE_KEYS = [
  "home",
  "about",
  "events",
  "catering",
  "cateringMenuExamples",
  "eventDecoration",
  "hostAtRorum",
  "communityMembership",
  "volunteer",
  "workWithUs",
  "contact",
  "faq",
] as const;

export type PageKey = (typeof PAGE_KEYS)[number];

/** Current, publicly-readable document id for each page. */
export const PAGE_DOC_ID: Record<PageKey, string> = {
  home: "page-home",
  about: "page-about",
  events: "page-events",
  catering: "page-catering",
  cateringMenuExamples: "page-catering-menu-examples",
  eventDecoration: "page-event-decoration",
  hostAtRorum: "page-host-at-rorum",
  communityMembership: "page-community-membership",
  volunteer: "page-volunteer",
  workWithUs: "page-work-with-us",
  contact: "page-contact",
  faq: "page-faq",
};

/** Old, dotted document id — not publicly readable, kept only for the migration/cleanup scripts. */
export const OLD_PAGE_DOC_ID: Record<PageKey, string> = {
  home: "page.home",
  about: "page.about",
  events: "page.events",
  catering: "page.catering",
  cateringMenuExamples: "page.cateringMenuExamples",
  eventDecoration: "page.eventDecoration",
  hostAtRorum: "page.hostAtRorum",
  communityMembership: "page.communityMembership",
  volunteer: "page.volunteer",
  workWithUs: "page.workWithUs",
  contact: "page.contact",
  faq: "page.faq",
};
