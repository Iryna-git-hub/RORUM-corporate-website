import type { StructureResolver } from "sanity/structure";
import { LEGAL_PAGE_KEYS } from "./schemaTypes";
import { PAGE_DOC_ID, type PageKey } from "./lib/pageIds";

/**
 * Singleton documents use a fixed `documentId` (see sanity.config.ts's
 * `document.actions` override, which removes "duplicate"/"delete" for these
 * types) so there's exactly one editable instance, listed here by name
 * instead of through the generic "create new" document-type list.
 */
function singleton(S: Parameters<StructureResolver>[0], id: string, title: string, type: string) {
  return S.listItem()
    .id(id)
    .title(title)
    .child(S.document().documentId(id).schemaType(type));
}

/**
 * A page migrated to the new `page` document type (see documents/page.ts,
 * MIGRATION_REPORT.md) — same fixed-id/named-entry pattern as `singleton()`
 * above, just always targeting the shared `page` type. Uses the dash-based
 * id from PAGE_DOC_ID — dotted ids (the old `page.<key>` scheme) are not
 * publicly readable, see sanity/lib/pageIds.ts.
 */
function pageDoc(S: Parameters<StructureResolver>[0], key: PageKey, title: string) {
  return singleton(S, PAGE_DOC_ID[key], title, "page");
}

/**
 * "Contact" opens a 4-item list instead of jumping straight to page-contact
 * — the Contact page's on-screen content is genuinely split across 4
 * separate Sanity documents (page-contact itself, plus 3 documents shared
 * with other parts of the site), each publishing independently. Sanity's
 * Structure Tool has no supported way to combine independent documents into
 * one Publish transaction, so this deliberately does NOT try to hide that —
 * each entry's own title states plainly what else reads the same document,
 * so a manager editing "Contact information" understands a change there
 * also affects the Footer before they publish it, not after.
 */
function contactPagesEntry(S: Parameters<StructureResolver>[0]) {
  return S.listItem()
    .title("Contact")
    .child(
      S.list()
        .title("Contact")
        .items([
          pageDoc(S, "contact", "Page content & form"),
          singleton(S, "contactInfo", "Contact information (also used by Footer + event practical details)", "contactInfo"),
          singleton(S, "socialLinks", "Social links (also used by Footer)", "socialLinks"),
          singleton(S, "formMessages", "Shared form text (used by every form on the site, not just Contact)", "formMessages"),
        ]),
    );
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title("RORUM Content")
    .items([
      S.listItem()
        .title("Site")
        .child(
          S.list()
            .title("Site")
            .items([
              singleton(S, "siteSettings", "Site settings", "siteSettings"),
              singleton(S, "contactInfo", "Contact information", "contactInfo"),
              singleton(S, "socialLinks", "Social links", "socialLinks"),
              singleton(S, "navigation", "Navigation", "navigation"),
              singleton(S, "footer", "Footer", "footer"),
              singleton(S, "formMessages", "Shared form messages", "formMessages"),
              singleton(S, "eventMessages", "Shared event labels", "eventMessages"),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title("Pages")
        .child(
          S.list()
            .title("Pages")
            .items([
              pageDoc(S, "home", "Home"),
              pageDoc(S, "about", "About"),
              pageDoc(S, "events", "Attend Events (listing)"),
              pageDoc(S, "catering", "Catering"),
              pageDoc(S, "cateringMenuExamples", "Catering Menu Examples"),
              pageDoc(S, "eventDecoration", "Event Decoration"),
              pageDoc(S, "hostAtRorum", "Host at RORUM"),
              pageDoc(S, "communityMembership", "Community Membership"),
              pageDoc(S, "volunteer", "Volunteer"),
              pageDoc(S, "workWithUs", "Work With Us"),
              contactPagesEntry(S),
              pageDoc(S, "faq", "FAQ"),
              S.divider(),
              ...LEGAL_PAGE_KEYS.map((key) =>
                singleton(
                  S,
                  `legalPage-${key}`,
                  key === "terms"
                    ? "Terms"
                    : key === "privacy-policy"
                      ? "Privacy Policy"
                      : "Cookie Policy",
                  "legalPage",
                ),
              ),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title("Events")
        .child(S.documentTypeList("event").title("Events")),
    ]);
