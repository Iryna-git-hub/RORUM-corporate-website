import type { StructureResolver } from "sanity/structure";
import { LEGAL_PAGE_KEYS } from "./schemaTypes";

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
            ]),
        ),
      S.divider(),
      S.listItem()
        .title("Pages")
        .child(
          S.list()
            .title("Pages")
            .items([
              singleton(S, "homePage", "Home", "homePage"),
              singleton(S, "aboutPage", "About", "aboutPage"),
              singleton(S, "eventsPage", "Attend Events (listing)", "eventsPage"),
              singleton(S, "cateringPage", "Catering", "cateringPage"),
              singleton(S, "eventDecorationPage", "Event Decoration", "eventDecorationPage"),
              singleton(S, "hostAtRorumPage", "Host at RORUM", "hostAtRorumPage"),
              singleton(S, "communityMembershipPage", "Community Membership", "communityMembershipPage"),
              singleton(S, "volunteerPage", "Volunteer", "volunteerPage"),
              singleton(S, "workWithUsPage", "Work With Us", "workWithUsPage"),
              singleton(S, "contactPage", "Contact", "contactPage"),
              singleton(S, "faqPage", "FAQ", "faqPage"),
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
      S.listItem()
        .title("FAQ groups")
        .child(S.documentTypeList("faqGroup").title("FAQ groups")),
      S.listItem()
        .title("Catering menu categories")
        .child(S.documentTypeList("cateringMenuCategory").title("Catering menu categories")),
      S.listItem()
        .title("Image galleries")
        .child(S.documentTypeList("galleryCollection").title("Image galleries")),
    ]);
