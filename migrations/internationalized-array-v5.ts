import { migrateToLanguageField } from "sanity-plugin-internationalized-array/migrations";

// `sanity-plugin-internationalized-array` v5 moved the language identifier
// from each array item's `_key` to a dedicated `language` field. Every
// document this project has imported so far (scripts/import-content.ts,
// scripts/import-images.ts) was written before that was known, using the
// old v4 shape (`{ _key: "en", _type: "internationalizedArray...Value", value }`)
// — this migration is the plugin's own official fix, applied via Sanity's
// migration framework (not a hand-rolled patch script) so it correctly
// finds every internationalized array item across every document type,
// including ones nested inside objects/arrays (e.g. `faqGroup.items[].question`,
// `cateringMenuCategory.featuredItems[].name`), not just top-level fields.
//
// Run (dry-run is the CLI default, review its report first):
//   npx sanity migrations run internationalized-array-v5
// Then for real:
//   npx sanity migrations run internationalized-array-v5 --no-dry-run
//
// Safe to re-run: the migration's own detection skips any item that
// already has a `language` field, so it only ever touches the old-format
// items still remaining.
export default migrateToLanguageField([
  // Structured documents
  "cateringMenuCategory",
  "event",
  "eventCategory",
  "faqGroup",
  "galleryCollection",
  // Singletons (global + page) — harmless to list ones with no documents yet
  "aboutPage",
  "cateringPage",
  "communityMembershipPage",
  "contactInfo",
  "contactPage",
  "eventDecorationPage",
  "eventsPage",
  "faqPage",
  "footer",
  "formMessages",
  "homePage",
  "hostAtRorumPage",
  "legalPage",
  "navigation",
  "siteSettings",
  "socialLinks",
  "volunteerPage",
  "workWithUsPage",
]);
