import type { SchemaTypeDefinition } from "sanity";

// Objects (reusable field shapes)
import bodyPortableText from "./objects/bodyPortableText";
import bulletParagraph from "./objects/bulletParagraph";
import bulletText from "./objects/bulletText";
import cateringMenuItem from "./objects/cateringMenuItem";
import contentItem from "./objects/contentItem";
import ctaAction from "./objects/ctaAction";
import ctaLink from "./objects/ctaLink";
import editorialFeature from "./objects/editorialFeature";
import faqItem from "./objects/faqItem";
import iconCard from "./objects/iconCard";
import imageWithAlt from "./objects/imageWithAlt";
import keyedString from "./objects/keyedString";
import mediaGalleryItem from "./objects/mediaGalleryItem";
import mediaItem from "./objects/mediaItem";
import navChild from "./objects/navChild";
import navItem from "./objects/navItem";
import nextStepSection from "./objects/nextStepSection";
import packageTier from "./objects/packageTier";
import pageSection from "./objects/pageSection";
import practicalDetail from "./objects/practicalDetail";
import seo from "./objects/seo";
import serviceHero from "./objects/serviceHero";
import socialLink from "./objects/socialLink";
import titledText from "./objects/titledText";

// Structured documents
import cateringMenuCategory from "./documents/cateringMenuCategory";
import event from "./documents/event";
import faqGroup from "./documents/faqGroup";
import galleryCollection from "./documents/galleryCollection";
import page from "./documents/page";

// Global singletons. (The old per-page singletons — homePage, aboutPage,
// cateringPage, … — were deleted once every page moved to the shared `page`
// document type; see MIGRATION_REPORT.md Parts 16–17 and the R8 cleanup in
// SANITY_MIGRATION.md §20.8. Their production documents were already gone; this
// pass removed the now-dead schema types, queries and fallback fetches too.)
import contactInfo from "./singletons/contactInfo";
import eventMessages from "./singletons/eventMessages";
import footer from "./singletons/footer";
import formMessages from "./singletons/formMessages";
import legalPage from "./singletons/legalPage";
import navigation from "./singletons/navigation";
import siteSettings from "./singletons/siteSettings";
import socialLinks from "./singletons/socialLinks";

export const schemaTypes: SchemaTypeDefinition[] = [
  // Objects
  bodyPortableText,
  bulletParagraph,
  bulletText,
  cateringMenuItem,
  contentItem,
  ctaAction,
  ctaLink,
  editorialFeature,
  faqItem,
  iconCard,
  imageWithAlt,
  keyedString,
  mediaGalleryItem,
  mediaItem,
  navChild,
  navItem,
  nextStepSection,
  packageTier,
  pageSection,
  practicalDetail,
  seo,
  serviceHero,
  socialLink,
  titledText,
  // Structured documents
  cateringMenuCategory,
  event,
  faqGroup,
  galleryCollection,
  page,
  // Global singletons
  contactInfo,
  eventMessages,
  footer,
  formMessages,
  legalPage,
  navigation,
  siteSettings,
  socialLinks,
];

/** Document type names that are singletons — exactly one instance should ever exist. */
export const SINGLETON_TYPES = new Set([
  "siteSettings",
  "contactInfo",
  "socialLinks",
  "navigation",
  "footer",
  "formMessages",
  "eventMessages",
]);

/**
 * `legalPage` is a singleton TYPE but has 3 fixed-id instances (one per
 * `pageKey`) rather than exactly one — handled separately in structure.ts.
 */
export const LEGAL_PAGE_KEYS = ["terms", "privacy-policy", "cookie-policy"] as const;

// The full set of `page` document keys lives in `sanity/lib/pageIds.ts`
// (`PAGE_KEYS` / `PageKey` / `PAGE_DOC_ID`) — the authoritative source used
// by `structure.ts` and the scripts. The old per-page singletons this shared
// `page` type replaced have been removed (MIGRATION_REPORT.md Parts 16–17,
// SANITY_MIGRATION.md §20.8).
