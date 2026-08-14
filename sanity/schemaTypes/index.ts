import type { SchemaTypeDefinition } from "sanity";

// Objects (reusable field shapes)
import bodyPortableText from "./objects/bodyPortableText";
import bulletParagraph from "./objects/bulletParagraph";
import bulletText from "./objects/bulletText";
import cateringMenuItem from "./objects/cateringMenuItem";
import ctaLink from "./objects/ctaLink";
import editorialFeature from "./objects/editorialFeature";
import faqItem from "./objects/faqItem";
import iconCard from "./objects/iconCard";
import imageWithAlt from "./objects/imageWithAlt";
import keyedString from "./objects/keyedString";
import mediaGalleryItem from "./objects/mediaGalleryItem";
import navChild from "./objects/navChild";
import navItem from "./objects/navItem";
import nextStepSection from "./objects/nextStepSection";
import packageTier from "./objects/packageTier";
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

// Singletons (globals + page documents)
import aboutPage from "./singletons/aboutPage";
import cateringMenuExamplesPage from "./singletons/cateringMenuExamplesPage";
import cateringPage from "./singletons/cateringPage";
import communityMembershipPage from "./singletons/communityMembershipPage";
import contactInfo from "./singletons/contactInfo";
import contactPage from "./singletons/contactPage";
import eventDecorationPage from "./singletons/eventDecorationPage";
import eventMessages from "./singletons/eventMessages";
import eventsPage from "./singletons/eventsPage";
import faqPage from "./singletons/faqPage";
import footer from "./singletons/footer";
import formMessages from "./singletons/formMessages";
import homePage from "./singletons/homePage";
import hostAtRorumPage from "./singletons/hostAtRorumPage";
import legalPage from "./singletons/legalPage";
import navigation from "./singletons/navigation";
import siteSettings from "./singletons/siteSettings";
import socialLinks from "./singletons/socialLinks";
import volunteerPage from "./singletons/volunteerPage";
import workWithUsPage from "./singletons/workWithUsPage";

export const schemaTypes: SchemaTypeDefinition[] = [
  // Objects
  bodyPortableText,
  bulletParagraph,
  bulletText,
  cateringMenuItem,
  ctaLink,
  editorialFeature,
  faqItem,
  iconCard,
  imageWithAlt,
  keyedString,
  mediaGalleryItem,
  navChild,
  navItem,
  nextStepSection,
  packageTier,
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
  // Singletons
  aboutPage,
  cateringMenuExamplesPage,
  cateringPage,
  communityMembershipPage,
  contactInfo,
  contactPage,
  eventDecorationPage,
  eventMessages,
  eventsPage,
  faqPage,
  footer,
  formMessages,
  homePage,
  hostAtRorumPage,
  legalPage,
  navigation,
  siteSettings,
  socialLinks,
  volunteerPage,
  workWithUsPage,
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
  "homePage",
  "aboutPage",
  "eventsPage",
  "cateringPage",
  "cateringMenuExamplesPage",
  "eventDecorationPage",
  "hostAtRorumPage",
  "communityMembershipPage",
  "volunteerPage",
  "workWithUsPage",
  "contactPage",
  "faqPage",
]);

/**
 * `legalPage` is a singleton TYPE but has 3 fixed-id instances (one per
 * `pageKey`) rather than exactly one — handled separately in structure.ts.
 */
export const LEGAL_PAGE_KEYS = ["terms", "privacy-policy", "cookie-policy"] as const;
