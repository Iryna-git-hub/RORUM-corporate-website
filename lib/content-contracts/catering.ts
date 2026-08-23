import { locales } from "@/lib/i18n";
import type { PageContentContract } from "@/lib/content-contracts/types";

// Second corrective pass (blockers found after the first): every
// informative Catering image now requires en/da/uk (imageWithAlt.ts's
// Catering-scoped branch), not just English — 177 missing translations
// backfilled (scripts/backfill-catering-alt-text.ts), all derived from
// either an accurate literal translation (59 gallery photos, 1 philosophy
// image) or the item's OWN already-approved localized title (51 dish
// photos, 3 menu-format cards) — never invented. Category creation is now
// genuinely manager-friendly: sanity/components/CateringMenuSectionsInput.tsx
// uses Sanity's own `ArrayOptions.disableActions` (not CSS) to remove the
// generic array add/duplicate/copy controls entirely on this one document,
// leaving "+ Add category" as the sole creation path. An intentionally
// emptied category list now renders lib/cateringMenuResolve.ts's
// distinction ("document missing" -> fallback, "document present with 0
// categories" -> real CMS empty state) instead of ever resurrecting
// lib/cateringMenu.ts. 10 confirmed-empty draft-residue paths on
// drafts.page-catering were removed (scripts/clean-catering-draft-residue.ts).
const ALL = locales; // ["en", "da", "uk"]
const CATERING_QUERY = 'sanity/queries/page.ts (pageByKeyQuery, pageKey="catering")';
const MENU_QUERY = 'sanity/queries/page.ts (pageByKeyQuery, pageKey="cateringMenuExamples")';
const SECTIONS = "lib/sanity-sections.ts (getSection/getItem/getAction/listItems)";

/**
 * Catering content contract, covering both `page-catering` (the Catering
 * page) and `page-catering-menu-examples` (the Catering Menu Examples
 * overlay, opened from the Catering page — not a standalone route; see
 * cateringMenuExamplesContract below).
 *
 * Sourced by reading sanity/schemaTypes/documents/page.ts,
 * sanity/schemaTypes/objects/{pageSection,contentItem,mediaItem,ctaAction,imageWithAlt,seo}.ts,
 * lib/sanity-sections.ts, and every line of
 * app/[locale]/(site)/catering/page.tsx's getData()/generateMetadata(), plus
 * components/CateringMenuOverlay.tsx and components/CateringInquiryForm.tsx
 * — cross-checked against the live documents (raw perspective, read-only)
 * before and after the migration this contract documents.
 *
 * Root findings this pass corrected (see the Catering CMS integration
 * report for full detail):
 *   - `cateringPage`/`cateringMenuExamplesPage` (legacy singletons) never
 *     had a published copy — only drafts. The `page?.field ?? ...` /
 *     `menuPage?.field ?? ...` middle tier in getData() was dead code in
 *     production; removed, not merely deprioritized.
 *   - `page-catering-menu-examples` (the REAL, canonical, already-published
 *     document — pageKey "cateringMenuExamples", full en/da/uk text for all
 *     6 categories and 51 dishes) had zero dish photos and no category-tab
 *     icons; both backfilled by scripts/migrate-catering-menu-examples.ts.
 *   - A second, erroneously-created document with a camelCase id
 *     (`page-cateringMenuExamples`) briefly existed this pass and made
 *     `pageByKeyQuery`'s `[0]` ambiguous; deleted (backed up first), and
 *     `page.ts`'s `pageKey` field gained a uniqueness validator so this
 *     class of bug can't recur, for any page.
 *   - `page-catering.seo` was completely empty; backfilled by
 *     scripts/repair-catering-seo.ts and confirmed connected — the sole
 *     `generateMetadata()` call for the whole /catering surface reads only
 *     `page-catering`'s own `seo`.
 *   - `page-catering-menu-examples.seo` was ALSO backfilled by that same
 *     script in an earlier pass of this work and originally reported
 *     "connected" — wrong. Tracing generateMetadata() shows it is never
 *     read: Catering Menu Examples has no route of its own, so there is no
 *     independent `<head>` for it to populate. The seeded values were
 *     removed (scripts/remove-catering-menu-examples-seo.ts, backed up
 *     first) and the `seo` field is now hidden on this one document
 *     (see page.ts) rather than left visible-but-inert.
 *
 * `classification` follows lib/content-contracts/types.ts's
 * `FieldClassification` (see that file for the full definition of each
 * value) — the taxonomy already established by the Home/About/Events
 * contracts in this same directory, kept consistent rather than
 * introducing a second one for this page.
 */
export const cateringContract: PageContentContract = {
  pageKey: "catering",
  documentId: "page-catering",
  documentType: "page",
  entries: [
    // ---- hero ----------------------------------------------------------
    {
      pageKey: "catering", sectionKey: "hero", sanityPath: 'sections[sectionKey=="hero"].label',
      fieldPurpose: "Small eyebrow label above the hero H1", fieldType: "i18nString", required: false, languages: ALL,
      querySource: CATERING_QUERY, mapper: `getData() label, via ${SECTIONS}`, component: "app/.../catering/page.tsx (SectionLabel)",
      frontendSelector: "hero SectionLabel text", expectedBehavior: "Text above the H1 changes to the edited value.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "catering", sectionKey: "hero", sanityPath: 'sections[sectionKey=="hero"].title',
      fieldPurpose: "Hero H1", fieldType: "i18nString", required: true, languages: ALL,
      querySource: CATERING_QUERY, mapper: `getData() title, via ${SECTIONS}`, component: "app/.../catering/page.tsx (h1)",
      frontendSelector: "page <h1>", expectedBehavior: "H1 text changes to the edited value.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "catering", sectionKey: "hero", sanityPath: 'sections[sectionKey=="hero"].text',
      fieldPurpose: "Hero paragraph", fieldType: "i18nText", required: true, languages: ALL,
      querySource: CATERING_QUERY, mapper: `getData() text, via ${SECTIONS}`, component: "app/.../catering/page.tsx (hero <p>)",
      frontendSelector: "hero paragraph below H1", expectedBehavior: "Paragraph text changes to the edited value.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "catering", sectionKey: "hero", sanityPath: 'sections[sectionKey=="hero"].actions[actionKey=="request"].label/.href/.enabled',
      fieldPurpose: '"Request catering" primary button', fieldType: "link", required: false, languages: ALL,
      querySource: CATERING_QUERY, mapper: `getData() requestCta, via getAction() in ${SECTIONS}`, component: "app/.../catering/page.tsx (Button)",
      frontendSelector: 'hero primary <Button href="#catering-inquiry">', expectedBehavior: "Label text changes; disabling hides the button.",
      mutationStrategy: "link-href", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "catering", sectionKey: "hero", sanityPath: 'sections[sectionKey=="hero"].items[itemKey=="menuExamplesCta"].title',
      fieldPurpose: '"Menu examples" button label (opens the Menu Examples overlay)', fieldType: "i18nString", required: false, languages: ALL,
      querySource: CATERING_QUERY, mapper: `getData() menuExamplesCta, via getItem() in ${SECTIONS}`, component: "components/CateringMenuOverlay.tsx CateringMenuButton",
      frontendSelector: "hero secondary button next to the primary CTA", expectedBehavior: "Button label changes to the edited value.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
      notes: 'Stored as a reserved item (itemKey "menuExamplesCta") reading `.title`, not `.label` — matches the field the code actually reads.',
    },

    // ---- gallery + "suitable for" --------------------------------------
    {
      pageKey: "catering", sectionKey: "gallery", sanityPath: "sections[sectionKey=\"gallery\"].media[]",
      fieldPurpose: "Horizontal gallery photos, in order", fieldType: "image", required: true, languages: [],
      querySource: CATERING_QUERY, mapper: `getData() galleryImages, via resolveGalleryImages()`, component: "components/HorizontalGallery.tsx",
      frontendSelector: "#catering-gallery gallery images", expectedBehavior: "Adding/removing/reordering media changes the gallery accordingly.",
      mutationStrategy: "reorder", editorVisibility: "visible", classification: "connected",
      notes: "59 real uploaded photos live today (verified). Video items (kind=\"video\") are filtered out before rendering — HorizontalGallery is images-only.",
    },
    {
      pageKey: "catering", sectionKey: "gallery", sanityPath: 'sections[sectionKey=="gallery"].label',
      fieldPurpose: '"Suitable for:" label', fieldType: "i18nString", required: false, languages: ALL,
      querySource: CATERING_QUERY, mapper: "getData() suitableForLabel", component: "app/.../catering/page.tsx",
      frontendSelector: "text directly above the suitable-for chips", expectedBehavior: "Label text changes to the edited value.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "catering", sectionKey: "gallery", sanityPath: 'sections[sectionKey=="gallery"].items[itemKey=="ariaLabel"].title',
      fieldPurpose: "Screen-reader label for the suitable-for chip group (not visually rendered)", fieldType: "i18nString", required: false, languages: ALL,
      querySource: CATERING_QUERY, mapper: "getData() suitableForAriaLabel", component: "app/.../catering/page.tsx (aria-label)",
      frontendSelector: 'chip group\'s aria-label attribute', expectedBehavior: "Accessible name for the chip group changes (screen readers only).",
      mutationStrategy: "not-mutation-tested", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "catering", sectionKey: "gallery", sanityPath: 'sections[sectionKey=="gallery"].items[itemKey^="suitableFor"]',
      fieldPurpose: "\"Suitable for\" chips (icon + label), repeatable", fieldType: "repeatable", required: false, languages: ALL,
      querySource: CATERING_QUERY, mapper: `getData() suitableFor, via icon+title on each item`, component: "app/.../catering/page.tsx (chip <span>)",
      frontendSelector: "chips below the gallery", expectedBehavior: "Adding/removing/editing a chip changes the rendered set; icon change changes the rendered icon.",
      mutationStrategy: "icon-swap", editorVisibility: "visible", classification: "connected",
      notes: "12 chips live today, icon-per-chip already real Sanity data (verified). ITEM_ROLE_RULES hides href/text/image/value/label/itemKey for this role.",
    },

    // ---- menu format cards ----------------------------------------------
    {
      pageKey: "catering", sectionKey: "menuFormats", sanityPath: 'sections[sectionKey=="menuFormats"].title',
      fieldPurpose: "Menu formats section heading", fieldType: "i18nString", required: true, languages: ALL,
      querySource: CATERING_QUERY, mapper: "getData() menuFormatsTitle", component: "app/.../catering/page.tsx (h2)",
      frontendSelector: "heading above the 3 format cards", expectedBehavior: "Heading text changes to the edited value.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "catering", sectionKey: "menuFormats", sanityPath: 'sections[sectionKey=="menuFormats"].items[itemKey^="format"]',
      fieldPurpose: "3 menu format cards (title, text, image)", fieldType: "repeatable", required: true, languages: ALL,
      querySource: CATERING_QUERY, mapper: "getData() menuFormats", component: "app/.../catering/page.tsx (format <article>)",
      frontendSelector: "3 cards below the Menu Formats heading", expectedBehavior: "Editing title/text/image changes the corresponding card.",
      mutationStrategy: "image-swap", editorVisibility: "visible", classification: "connected",
      notes: "No icon field used for this role — cards render an image, not an icon. ITEM_ROLE_RULES limits visible fields to title/text/image accordingly.",
    },

    // ---- philosophy ("What we offer") ----------------------------------
    {
      pageKey: "catering", sectionKey: "philosophy", sanityPath: 'sections[sectionKey=="philosophy"].title/.text/.media[0]',
      fieldPurpose: "Philosophy heading, paragraph, and photo", fieldType: "richText", required: true, languages: ALL,
      querySource: CATERING_QUERY, mapper: "getData() philosophyTitle/philosophyText/philosophyImage(+Alt)", component: "app/.../catering/page.tsx (philosophy <section>)",
      frontendSelector: "heading/paragraph/photo in the What We Offer section", expectedBehavior: "Each field changes the corresponding element.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "catering", sectionKey: "philosophy", sanityPath: 'sections[sectionKey=="philosophy"].items[itemKey="tailoredNote"]',
      fieldPurpose: '"Tailored upon request" note (title + text)', fieldType: "repeatable", required: false, languages: ALL,
      querySource: CATERING_QUERY, mapper: "getData() tailoredTitle/tailoredText, via getItem()", component: "app/.../catering/page.tsx (.decoration-tailored-note)",
      frontendSelector: "note below the format bullet list", expectedBehavior: "Title/text change to the edited values.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "catering", sectionKey: "philosophy", sanityPath: 'sections[sectionKey=="philosophy"].items[itemKey^="format"]',
      fieldPurpose: '"What we offer" icon bullets (6 items)', fieldType: "repeatable", required: true, languages: ALL,
      querySource: CATERING_QUERY, mapper: "getData() formats", component: "app/.../catering/page.tsx (bullet <div>)",
      frontendSelector: "icon bullet list next to the philosophy photo", expectedBehavior: "Editing icon/title/text changes the corresponding bullet.",
      mutationStrategy: "icon-swap", editorVisibility: "visible", classification: "connected",
      notes: 'itemKey pattern "format[0-5]" — distinct role from the same pattern under sectionKey "menuFormats" (scoped by sectionKey, not itemKey alone).',
    },

    // ---- 3-step setup / inquiry form -------------------------------------
    {
      pageKey: "catering", sectionKey: "steps", sanityPath: 'sections[sectionKey=="steps"].label/.title',
      fieldPurpose: '"How it works" eyebrow + "3-step setup" heading', fieldType: "i18nString", required: true, languages: ALL,
      querySource: CATERING_QUERY, mapper: "getData() howItWorksLabel/stepsTitle", component: "app/.../catering/page.tsx (SectionLabel + h2)",
      frontendSelector: "eyebrow + heading above the numbered steps", expectedBehavior: "Text changes to the edited values.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "catering", sectionKey: "steps", sanityPath: 'sections[sectionKey=="steps"].items[]',
      fieldPurpose: "3 numbered steps (title + text; number is the array position, not a field)", fieldType: "repeatable", required: true, languages: ALL,
      querySource: CATERING_QUERY, mapper: "getData() steps", component: "app/.../catering/page.tsx (numbered <article>)",
      frontendSelector: "3 numbered rows in the inquiry section", expectedBehavior: "Editing/reordering items changes the rendered rows and their numbers.",
      mutationStrategy: "reorder", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "catering", sectionKey: "inquiryForm", sanityPath: 'sections[sectionKey=="inquiryForm"].title/.text',
      fieldPurpose: "Inquiry form title + intro text", fieldType: "richText", required: false, languages: ALL,
      querySource: CATERING_QUERY, mapper: "getData() inquiryTitle/inquiryIntro", component: "components/CateringInquiryForm.tsx",
      frontendSelector: "form heading + intro paragraph", expectedBehavior: "Text changes to the edited values.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "catering", sectionKey: "inquiryForm", sanityPath: 'sections[sectionKey=="inquiryForm"].items[itemKey=~"submitLabel|messagePlaceholder|successMessage|footerNote"]',
      fieldPurpose: "Catering-specific form copy: submit button, message placeholder, success message, footer privacy note", fieldType: "repeatable", required: false, languages: ALL,
      querySource: CATERING_QUERY, mapper: "getData() inquirySubmitLabel/messagePlaceholder/successMessage/footerNote", component: "components/CateringInquiryForm.tsx",
      frontendSelector: "submit button / textarea placeholder / success banner / footer note", expectedBehavior: "Each field changes the corresponding form element.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "catering", sectionKey: "inquiryForm", sanityPath: "n/a (formMessages singleton)",
      fieldPurpose: "Field labels/placeholders shared with every form on the site (name, phone, email, message, privacy consent, validation messages)", fieldType: "i18nString", required: true, languages: ALL,
      querySource: "sanity/queries/globals.ts (formMessagesQuery)", mapper: "components/FormContentProvider.tsx useFormContent()", component: "components/CateringInquiryForm.tsx",
      frontendSelector: "field labels/placeholders/validation errors", expectedBehavior: "Genuinely shared across every form — editing it here affects Catering's form AND every other page's form.",
      mutationStrategy: "not-mutation-tested", editorVisibility: "visible", classification: "global",
      notes: "Classified global, not catering-specific — correctly left in the shared formMessages singleton per Phase 10's own instruction, not duplicated here.",
    },
    {
      pageKey: "catering", sectionKey: "n/a", sanityPath: "n/a — no field exists",
      fieldPurpose: "Form recipient email / provider configuration / API keys", fieldType: "rawString", required: false, languages: [],
      querySource: "n/a", mapper: "n/a — CateringInquiryForm.tsx has no server submission handler (client-only validation + local success state)", component: "components/CateringInquiryForm.tsx",
      frontendSelector: "n/a", expectedBehavior: "Not applicable — this form does not send anywhere; no secret exists to protect or misconfigure.",
      mutationStrategy: "not-mutation-tested", editorVisibility: "hidden", classification: "technical-hidden",
      notes: "Confirmed: no submission endpoint, no recipient field, nothing secret-shaped anywhere in the Catering content model — the 2 known form-submission gaps (documented in MIGRATION_REPORT.md) are pre-existing and out of this pass's scope per the task's own instruction not to redesign the form provider.",
    },

    // ---- SEO -------------------------------------------------------------
    {
      pageKey: "catering", sectionKey: "seo", sanityPath: "seo.title",
      fieldPurpose: "Search Result Title", fieldType: "i18nString", required: false, languages: ALL,
      querySource: CATERING_QUERY, mapper: "generateMetadata() seoTitle -> localizedPageMetadata()", component: "next Metadata API (<title>)",
      frontendSelector: "document <title>", expectedBehavior: "Browser tab / search result title changes to the edited value.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
      notes: 'Backfilled this pass (was completely empty) via scripts/repair-catering-seo.ts, seeded from the page\'s own existing English fallback text.',
    },
    {
      pageKey: "catering", sectionKey: "seo", sanityPath: "seo.description",
      fieldPurpose: "Search Result Description", fieldType: "i18nText", required: false, languages: ALL,
      querySource: CATERING_QUERY, mapper: "getData() description -> generateMetadata()", component: "next Metadata API (meta description)",
      frontendSelector: '<meta name="description">', expectedBehavior: "Meta description changes to the edited value.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
      notes: "Backfilled this pass — see seo.title note.",
    },
    {
      pageKey: "catering", sectionKey: "seo", sanityPath: "seo.ogImage",
      fieldPurpose: "Social Sharing Image", fieldType: "image", required: false, languages: [],
      querySource: CATERING_QUERY, mapper: "getData() ogImageUrl -> generateMetadata()", component: "next Metadata API (og:image)",
      frontendSelector: "og:image meta tag", expectedBehavior: "Social preview image changes to the edited value.",
      mutationStrategy: "image-swap", editorVisibility: "visible", classification: "connected",
      notes: "Backfilled this pass by reusing the philosophy section's already-uploaded photo as the OG image — no new asset invented.",
    },

    // ---- legacy / technical --------------------------------------------
    {
      pageKey: "catering", sectionKey: "n/a", sanityPath: "cateringPage (legacy singleton, entire document)",
      fieldPurpose: "n/a — superseded by page-catering", fieldType: "rawString", required: false, languages: [],
      querySource: "sanity/queries/pages.ts cateringPageQuery (no longer imported by the frontend)", mapper: "n/a — removed from getData() this pass", component: "n/a",
      frontendSelector: "n/a", expectedBehavior: "n/a",
      mutationStrategy: "not-mutation-tested", editorVisibility: "hidden", classification: "obsolete-deferred",
      notes: 'Only drafts.cateringPage has ever existed (no published copy) — the middle `page?.field` fallback tier in getData() was proven dead in production before removal, not merely deprioritized. Schema type is still registered (kept for compatibility) but is reported here as removable in a later, separate pass — this task did not perform broader schema cleanup.',
    },
  ],
};

/**
 * Catering Menu Examples — an in-page overlay opened from the Catering page
 * (components/CateringMenuOverlay.tsx), not a standalone crawlable route.
 * Modeled as its own `page` document (pageKey "cateringMenuExamples",
 * canonical id `page-catering-menu-examples` — see sanity/lib/pageIds.ts)
 * so editors manage it the same way as every other page, even though the
 * frontend never gives it its own URL.
 */
export const cateringMenuExamplesContract: PageContentContract = {
  pageKey: "cateringMenuExamples",
  documentId: "page-catering-menu-examples",
  documentType: "page",
  entries: [
    {
      pageKey: "cateringMenuExamples", sectionKey: "banner", sanityPath: 'sections[sectionKey=="banner"].title/.media[0]',
      fieldPurpose: "Overlay title + banner photo", fieldType: "richText", required: true, languages: ALL,
      querySource: MENU_QUERY, mapper: "getData() menuOverlayText.title/bannerImageUrl(+Alt)", component: "components/CateringMenuOverlay.tsx",
      frontendSelector: "overlay <h2> + banner background image", expectedBehavior: "Title/photo change to the edited values once the overlay is opened.",
      mutationStrategy: "image-swap", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "cateringMenuExamples", sectionKey: "banner", sanityPath: 'sections[sectionKey=="banner"].items[itemKey^="intro"]',
      fieldPurpose: "Intro paragraphs (repeatable, read via .text)", fieldType: "repeatable", required: true, languages: ALL,
      querySource: MENU_QUERY, mapper: "getData() menuOverlayText.intro", component: "components/CateringMenuOverlay.tsx",
      frontendSelector: "intro paragraphs next to the overlay title", expectedBehavior: "Adding/removing/editing a paragraph changes the rendered list.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "cateringMenuExamples", sectionKey: "banner", sanityPath: 'sections[sectionKey=="banner"].items[itemKey="requestCta"].title',
      fieldPurpose: '"Request custom menu" button', fieldType: "i18nString", required: false, languages: ALL,
      querySource: MENU_QUERY, mapper: "getData() menuOverlayText.requestCta", component: "components/CateringMenuOverlay.tsx",
      frontendSelector: "button below the intro paragraphs", expectedBehavior: "Button label changes to the edited value.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "cateringMenuExamples", sectionKey: "banner", sanityPath: 'sections[sectionKey=="banner"].items[itemKey="emptyStateMessage"].text',
      fieldPurpose: "Message shown instead of the category list when the manager has intentionally removed every category", fieldType: "i18nText", required: false, languages: ALL,
      querySource: MENU_QUERY, mapper: "getData() menuOverlayText.emptyStateMessage, via lib/cateringMenuResolve.ts", component: "components/CateringMenuOverlay.tsx (data-testid=\"catering-menu-empty-state\")",
      frontendSelector: 'overlay body, only rendered when there are 0 menuCategory sections', expectedBehavior: "Text changes to the edited value; only visible when the category list is genuinely empty.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
      notes: "Added this pass specifically to fix a 'stale hardcoded resurrection' defect: previously an emptied category list silently fell back to lib/cateringMenu.ts's hardcoded categories. Now genuinely empty renders this manager-controlled message instead — see lib/cateringMenuResolve.ts and its unit tests for the exact document-missing-vs-intentionally-empty distinction.",
    },
    {
      pageKey: "cateringMenuExamples", sectionKey: "category-*", sanityPath: 'sections[sectionKind=="menuCategory"].title/.label/.text',
      fieldPurpose: "Category title, short nav-tab label, and description (6 categories)", fieldType: "repeatable", required: true, languages: ALL,
      querySource: MENU_QUERY, mapper: "getData() menuCategories[].title/navLabel/description", component: "components/CateringMenuOverlay.tsx (category header + nav tab)",
      frontendSelector: "category header + sticky nav tab", expectedBehavior: "Editing changes the category's header and its nav tab label.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "cateringMenuExamples", sectionKey: "category-*", sanityPath: 'sections[sectionKind=="menuCategory"].items[itemKey="categoryIcon"].icon',
      fieldPurpose: "Category's own nav-tab icon", fieldType: "icon", required: false, languages: [],
      querySource: MENU_QUERY, mapper: "getData() menuCategories[].icon -> CateringMenuOverlay.tsx withIcons()", component: "components/CateringMenuOverlay.tsx (nav tab icon)",
      frontendSelector: "icon inside each category's sticky nav tab", expectedBehavior: "Changing the icon changes the rendered tab icon.",
      mutationStrategy: "icon-swap", editorVisibility: "visible", classification: "connected",
      notes: 'Added this pass. Previously the tab icon was resolved ONLY from a hardcoded id-keyed map in CateringMenuOverlay.tsx, matched against `sectionKey` — but every live category\'s sectionKey is "category-<id>", which never matched the map\'s bare "<id>" keys, so every tab silently rendered the map\'s neutral fallback icon (Soup) in production regardless of category. This field is the fix: reserved item backfilled with the SAME icon the map originally intended per category (visually unchanged), now Studio-editable and no longer silently wrong.',
    },
    {
      pageKey: "cateringMenuExamples", sectionKey: "category-*", sanityPath: 'sections[sectionKind=="menuCategory"].items[itemKey^="dish"].title/.text/.image',
      fieldPurpose: "Dish name, description, and photo (51 dishes across 6 categories)", fieldType: "repeatable", required: true, languages: ALL,
      querySource: MENU_QUERY, mapper: "getData() menuCategories[].featuredItems[].name/description/image(+alt)", component: "components/CateringMenuOverlay.tsx FeaturedCard",
      frontendSelector: "dish cards under each expanded category", expectedBehavior: "Editing name/description/photo changes the corresponding card; add/remove/reorder changes the card list and order.",
      mutationStrategy: "image-swap", editorVisibility: "visible", classification: "connected",
      notes: "Photos backfilled this pass via scripts/migrate-catering-menu-examples.ts — text (name/description, en/da/uk) already existed for all 51 dishes; no dish text was invented. Prices/allergen/dietary labels are NOT modeled: the frontend never renders them for a dish (FeaturedCard shows only name+description+image) — inventing such fields would violate the task's own boundary.",
    },
    {
      pageKey: "cateringMenuExamples", sectionKey: "categories-meta", sanityPath: 'sections[sectionKind=="menuCategory"] (section order)',
      fieldPurpose: "Category display order", fieldType: "repeatable", required: true, languages: [],
      querySource: MENU_QUERY, mapper: "getData() categorySections = sections.filter(sectionKind==\"menuCategory\") — order preserved from the array", component: "components/CateringMenuOverlay.tsx (nav tabs + section order)",
      frontendSelector: "order of nav tabs / order of expandable sections", expectedBehavior: "Dragging a category section in Studio's sections array changes its position everywhere on the overlay.",
      mutationStrategy: "reorder", editorVisibility: "visible", classification: "connected",
      notes: 'Single authoritative ordering mechanism: Studio\'s own array drag-order on `sections[]` (Phase 8\'s "preferred" option for embedded items) — no separate numeric `order` field exists or is read for this document, avoiding two competing systems. Adding a new category is possible in Studio (pageSection.ts\'s `sectionKey` now unlocks once, for a brand-new section only) and its dishes automatically get the same field visibility via contentItem.ts\'s sectionKind-based ITEM_ROLE_RULES matching.',
    },
    {
      pageKey: "cateringMenuExamples", sectionKey: "categoriesSection", sanityPath: 'sections[sectionKey="closing"].items[itemKey="featuredDishesLabel"].title',
      fieldPurpose: '"Featured Dishes" heading shown above each category\'s dish cards', fieldType: "i18nString", required: false, languages: ALL,
      querySource: MENU_QUERY, mapper: "getData() menuOverlayText.featuredDishesLabel", component: "components/CateringMenuOverlay.tsx",
      frontendSelector: "small heading above each category's dish grid", expectedBehavior: "Heading text changes to the edited value.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "cateringMenuExamples", sectionKey: "closing", sanityPath: 'sections[sectionKey="closing"].items[itemKey="disclaimerNote"].text',
      fieldPurpose: '"Examples only" disclaimer shown under every category\'s dish cards', fieldType: "i18nText", required: false, languages: ALL,
      querySource: MENU_QUERY, mapper: "getData() menuOverlayText.disclaimerNote", component: "components/CateringMenuOverlay.tsx",
      frontendSelector: "italic disclaimer text below each category's dish grid", expectedBehavior: "Text changes to the edited value.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "cateringMenuExamples", sectionKey: "closing", sanityPath: 'sections[sectionKey="closing"].title/.text',
      fieldPurpose: '"Create your custom menu" closing heading + text', fieldType: "richText", required: true, languages: ALL,
      querySource: MENU_QUERY, mapper: "getData() menuOverlayText.customMenuTitle/customMenuText", component: "components/CateringMenuOverlay.tsx (.catering-menu-final)",
      frontendSelector: "closing banner at the bottom of the overlay", expectedBehavior: "Text changes to the edited values.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "cateringMenuExamples", sectionKey: "closing", sanityPath: 'sections[sectionKey="closing"].items[itemKey="backToCateringCta"].title',
      fieldPurpose: '"Back to Catering" button', fieldType: "i18nString", required: false, languages: ALL,
      querySource: MENU_QUERY, mapper: "getData() menuOverlayText.backToCateringCta", component: "components/CateringMenuOverlay.tsx",
      frontendSelector: "closing banner's secondary button", expectedBehavior: "Button label changes to the edited value.",
      mutationStrategy: "localized-canary", editorVisibility: "visible", classification: "connected",
    },
    {
      pageKey: "cateringMenuExamples", sectionKey: "seo", sanityPath: "seo (entire field)",
      fieldPurpose: "Search Result Title / Description / Social Sharing Image", fieldType: "i18nString", required: false, languages: ALL,
      querySource: MENU_QUERY, mapper: "n/a — no route reads this document's own seo block", component: "n/a",
      frontendSelector: "n/a — the overlay has no standalone URL/route, so no <head> exists for it to populate", expectedBehavior: "n/a",
      mutationStrategy: "not-mutation-tested", editorVisibility: "hidden", classification: "disconnected",
      notes: 'The task itself anticipated this ("...if it is a real route/page document"): Catering Menu Examples is overlay-only, sharing the /catering URL and its <head>. First reported "connected" in error (a prior pass conflated seeding real content with it having a real effect) — corrected: traced generateMetadata() line by line, confirmed it reads only page-catering.seo, never this document\'s. The seeded values were removed (scripts/remove-catering-menu-examples-seo.ts, backed up first) and the field is now hidden here (page.ts) rather than left visible-but-inert — a manager can no longer fill in a field that provably does nothing.',
    },
  ],
};
