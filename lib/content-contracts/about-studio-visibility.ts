import type { StudioVisibilityContract, StudioVisibilityEntry } from "./studio-visibility-types";

/**
 * NOTE (Phase G, 2026-09-03): the machine-readable, CI-checked source of
 * truth for which pageSection fields each section shows the editor is now
 * `SECTION_FIELD_VISIBILITY` in sanity/schemaTypes/objects/pageSection.ts
 * (+ `npm run sanity:audit-sections`). This file remains the detailed
 * per-field prose rationale; About's `statement`/`community` empty Small
 * label was tightened away by that allow-list.
 */

/**
 * About Studio Visibility Contract — the reverse-direction companion to
 * lib/content-contracts/about.ts. Independent pass: About's own
 * sectionKind choices are checked against About's own field usage, not
 * assumed from Home's conclusions (some generic fields are valid on one
 * page and not the other).
 *
 * Two corrections relative to the original About Content Audit, found only
 * by tracing pageSection.ts's FIELD_VISIBILITY/fieldHidden() precisely for
 * this pass rather than reasoning from the SETTINGS_HIDDEN_FOR_SECTION_KEYS
 * special case alone:
 *  1. `closingCta.settings[variant]` is actually HIDDEN in Studio (sectionKind
 *     "cta"'s FIELD_VISIBILITY doesn't include "settings" at all) — the
 *     original audit reported it as visible-and-disconnected. It is hidden
 *     (same mechanism as Home's equivalent field) — see that entry below.
 *  2. `pillars.text` has the SAME hidden-but-rendered defect already found
 *     on statement.text/community.text — missed originally because sectionKind
 *     "steps" was not re-checked against FIELD_VISIBILITY at the time.
 * Both are disclosed explicitly rather than silently amended.
 *
 * UPDATED after the approved implementation pass: every entry below
 * reflects current, post-fix reality (not the original audit snapshot).
 * Fixed: statement/community/pillars.text now visible; hero.actions,
 * hero.media.caption, and every audited item role's unused sub-fields now
 * hidden; closingCta action href/openInNewTab/enabled now wired;
 * ctaAction.linkType hidden site-wide; seo.title/description wired (still
 * empty in content). Deferred, unchanged: seo.ogImage.
 */

const D: readonly ["en", "da", "uk"] = ["en", "da", "uk"];
const doc = "page-about";
const page = "about";
const q = "sanity/queries/page.ts:pageByKeyQuery";

function entry(e: Omit<StudioVisibilityEntry, "pageKey" | "documentId">): StudioVisibilityEntry {
  return { pageKey: page, documentId: doc, ...e };
}

export const aboutStudioVisibilityContract: StudioVisibilityContract = {
  pageKey: page,
  documentId: doc,
  entries: [
    // ============================================================ hero
    entry({
      sectionKey: "hero", sectionKind: "hero", fieldPath: `sections[sectionKey=="hero"].label/title/text`,
      studioTitle: "Small label / Title / Text", studioDescription: "generic", fieldType: "i18n string/text",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "Hero eyebrow, H1, and lead paragraph.",
      websiteConsumer: "Hero label/H1/lead", querySource: q, mapper: "about/page.tsx:getData",
      component: "about/page.tsx hero block", frontendSelectorOrConsumer: `page.getByRole("heading", { level: 1 })`,
      classification: "visible-connected", recommendedAction: "Keep as-is.", reason: "Fully wired, fully localized.",
      sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    entry({
      sectionKey: "hero", sectionKind: "hero", fieldPath: `sections[sectionKey=="hero"].media[0..2].image/alt`,
      studioTitle: "Photo / Alt text", studioDescription: "generic", fieldType: "image + i18n string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: true,
      localized: true, requiredLanguages: D, editorialPurpose: "The 3 atmosphere photos beside the hero copy — meaningful, informative images.",
      websiteConsumer: "Atmosphere photo grid", querySource: q, mapper: "getData (atmosphereImages)",
      component: "about/page.tsx atmosphereImages map", frontendSelectorOrConsumer: `[aria-label="RORUM atmosphere"] img`,
      classification: "visible-connected", recommendedAction: "Keep as-is.", reason: "Populated, correctly not decorative-hidden (these are real photographs, unlike Home/About's CSS backgrounds).",
      sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    entry({
      sectionKey: "hero", sectionKind: "hero", fieldPath: `sections[sectionKey=="hero"].media[0..2].caption`,
      studioTitle: "Caption", studioDescription: "generic", fieldType: "i18n text",
      editorVisibleExpected: false, editorVisibleActual: false, requiredExpected: false, requiredActual: false,
      localized: true, requiredLanguages: [], editorialPurpose: "n/a — hidden site-wide (Approved Fix 6).",
      websiteConsumer: "(none)", querySource: q, mapper: "none (grep-verified: `.caption` is never referenced in any .ts/.tsx file)",
      component: "n/a", frontendSelectorOrConsumer: "none",
      classification: "correctly-hidden", recommendedAction: "FIXED this pass: mediaItem.caption hidden unconditionally, site-wide (Home + About). Confirmed via a read-only query across all 12 page documents (published+draft) that no caption value was populated anywhere before hiding. Field and any future values preserved.",
      reason: "mediaItem.caption has zero consumers anywhere in the codebase.", sharedSchemaImpact: "Global — see the Home contract's matching entry.", approvalRequired: false,
    }),
    entry({
      sectionKey: "hero", sectionKind: "hero", fieldPath: `sections[sectionKey=="hero"].actions`,
      studioTitle: "Buttons", studioDescription: "generic — array of ctaAction", fieldType: "array<ctaAction>",
      editorVisibleExpected: false, editorVisibleActual: false, requiredExpected: false, requiredActual: false,
      localized: false, requiredLanguages: [], editorialPurpose: "n/a — hidden, scoped to page-about's hero only (Approved Fix 10).",
      websiteConsumer: "(none)", querySource: q, mapper: "about/page.tsx never reads heroSection?.actions", component: "n/a",
      frontendSelectorOrConsumer: "none",
      classification: "correctly-hidden", recommendedAction: "FIXED this pass: hidden via pageSection.ts's ABOUT_HERO_ACTIONS_HIDDEN_SECTION_KEYS, scoped to document (page-about/drafts.page-about) + sectionKey \"hero\" together — verified Home's hero (sectionKind \"hero\" too) keeps `actions` visible via a dedicated schema-callback test.",
      reason: "Was empty and unpopulated; a generic field carried over from the shared \"hero\" sectionKind that About's own hero doesn't use.",
      sharedSchemaImpact: "Scoped precisely to page-about's hero section — sectionKind \"hero\" is also used by Home, where actions IS genuinely connected and stays visible (regression-tested).", approvalRequired: false,
    }),
    entry({
      sectionKey: "hero", sectionKind: "hero", fieldPath: `sections[sectionKey=="hero"].items[itemKey=="intro0"/"intro1"].icon/href/label`,
      studioTitle: "Icon / Link destination / Link text", studioDescription: "generic", fieldType: "string + string + i18n string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "The 2 quick-link chips under the hero (Host at RORUM / Attend Events).",
      websiteConsumer: "Hero intro links", querySource: q, mapper: "about/page.tsx:getData (resolveIconLinksFromSection)",
      component: "about/page.tsx introLinks map", frontendSelectorOrConsumer: `[aria-label="RORUM event paths"] a`,
      classification: "visible-connected", recommendedAction: "Keep as-is.", reason: "icon/href/label are all genuinely read here (unlike Home's quickPaths.items.icon bug — About's own resolveIconLinksFromSection() does use item.icon).",
      sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    entry({
      sectionKey: "hero", sectionKind: "hero", fieldPath: `sections[sectionKey=="hero"].items[itemKey=="intro0"/"intro1"].itemKey`,
      studioTitle: "Key (do not change)", studioDescription: "generic, readOnly", fieldType: "readOnly string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: true,
      localized: false, requiredLanguages: [], editorialPurpose: "Technical lookup key.", websiteConsumer: "positional lookup",
      querySource: q, mapper: "n/a", component: "n/a", frontendSelectorOrConsumer: "none",
      classification: "technical-visible", recommendedAction: "Same low-priority note as the Home contract's equivalent entries.",
      reason: "Raw system key, locked and labeled.", sharedSchemaImpact: "Site-wide pattern.", approvalRequired: true,
    }),
    entry({
      sectionKey: "hero", sectionKind: "hero", fieldPath: `sections[sectionKey=="hero"].items[itemKey=="intro0"/"intro1"].title/text/image/value`,
      studioTitle: "(4 fields per item, 8 total)", studioDescription: "generic",
      fieldType: "mixed", editorVisibleExpected: false, editorVisibleActual: false, requiredExpected: false, requiredActual: false,
      localized: true, requiredLanguages: [], editorialPurpose: "n/a — hidden (Approved Fix 4, role \"About hero intro link\").",
      websiteConsumer: "(none)", querySource: q, mapper: "not read for intro0/intro1", component: "n/a", frontendSelectorOrConsumer: "none",
      classification: "correctly-hidden", recommendedAction: "FIXED this pass via contentItem.ts's ITEM_ROLE_RULES (role \"About hero intro link\", sectionKeys:[\"hero\"], itemKeyPattern /^intro[01]$/, visible:[itemKey,icon,href,label]). FIXED (later pass): drafts.page-about's intro0 item had accumulated stray, empty-string `en` entries for title/text/image (pre-dating this hide) that failed allOrNothingLanguages()/imageWithAlt validation despite being invisible — the same class of bug as Home's closingCta link items, fixed the same way: contentItem.ts's title/text/label validation and imageWithAlt.ts's alt validation now both skip whenever the field is hidden by an item role, and the stray data was unset live via scripts/repair-home-about-validation.ts (backed up first, dry-run verified, idempotent).",
      reason: "These chips only ever render icon+href+label — the 4 fields above never had an effect.", sharedSchemaImpact: "Scoped by sectionKey \"hero\" + itemKey pattern together, per-page-safe.", approvalRequired: false,
    }),

    // ========================================================= statement
    entry({
      sectionKey: "statement", sectionKind: "iconGrid", fieldPath: `sections[sectionKey=="statement"].title`,
      studioTitle: "Title", studioDescription: "generic", fieldType: "i18n string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "\"Services\" sub-heading.", websiteConsumer: "statement <h2>",
      querySource: q, mapper: "getData (statementTitle)", component: "about/page.tsx", frontendSelectorOrConsumer: `page.getByRole("heading", { level: 2 })`,
      classification: "visible-connected", recommendedAction: "Keep as-is.", reason: "Fully wired, fully localized.",
      sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    entry({
      sectionKey: "statement", sectionKind: "iconGrid", fieldPath: `sections[sectionKey=="statement"].text`,
      studioTitle: "Text", studioDescription: "generic — now force-visible for this exact section, see recommendedAction",
      fieldType: "i18n text", editorVisibleExpected: true, editorVisibleActual: true,
      requiredExpected: true, requiredActual: false, localized: true, requiredLanguages: D,
      editorialPurpose: "Services statement paragraph — real, live, rendered content, now locatable in Studio.",
      websiteConsumer: "statement <p>", querySource: q, mapper: "getData (statementText)", component: "about/page.tsx",
      frontendSelectorOrConsumer: `page.getByText(value, { exact: true })`,
      classification: "visible-connected",
      recommendedAction: "FIXED this pass: pageSection.ts's ABOUT_TEXT_FORCE_VISIBLE_SECTION_KEYS force-shows \"text\" for page-about's statement/community/pillars sections specifically — NOT added to iconGrid's FIELD_VISIBILITY globally (that would have exposed empty text fields on catering's menuFormats and workWithUs's features, which have not been audited). Scoped by document id (draft-stripped) + sectionKey together.",
      reason: "sectionKind \"iconGrid\"'s FIELD_VISIBILITY = {label,title,items} still omits \"text\" in general — this section is a narrow, deliberate exception.",
      sharedSchemaImpact: "No other iconGrid section is affected — regression-tested (catering/workWithUs's iconGrid text fields remain hidden).", approvalRequired: false,
    }),
    entry({
      sectionKey: "statement", sectionKind: "iconGrid", fieldPath: `sections[sectionKey=="statement"].items[itemKey=="service0"/"service1"].icon/href/label`,
      studioTitle: "Icon / Link destination / Link text", studioDescription: "generic", fieldType: "string + string + i18n string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "Catering / Event Decoration quick-link chips.",
      websiteConsumer: "Statement service links", querySource: q, mapper: "getData (resolveIconLinksFromSection)",
      component: "about/page.tsx serviceLinks map", frontendSelectorOrConsumer: `[aria-label="RORUM service paths"] a`,
      classification: "visible-connected", recommendedAction: "Keep as-is.", reason: "icon/href/label all genuinely read.",
      sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    entry({
      sectionKey: "statement", sectionKind: "iconGrid", fieldPath: `sections[sectionKey=="statement"].items[*].itemKey`,
      studioTitle: "Key (do not change)", studioDescription: "generic, readOnly", fieldType: "readOnly string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: true,
      localized: false, requiredLanguages: [], editorialPurpose: "Technical lookup key.", websiteConsumer: "positional lookup",
      querySource: q, mapper: "n/a", component: "n/a", frontendSelectorOrConsumer: "none",
      classification: "technical-visible", recommendedAction: "Unchanged — same low-priority note as elsewhere.",
      reason: "Raw system key, locked and labeled.", sharedSchemaImpact: "Site-wide pattern.", approvalRequired: true,
    }),
    entry({
      sectionKey: "statement", sectionKind: "iconGrid", fieldPath: `sections[sectionKey=="statement"].items[*].title/text/image/value`,
      studioTitle: "(4 fields per item, 8 total)", studioDescription: "generic",
      fieldType: "mixed", editorVisibleExpected: false, editorVisibleActual: false, requiredExpected: false, requiredActual: false,
      localized: true, requiredLanguages: [], editorialPurpose: "n/a for a service quick-link chip.",
      websiteConsumer: "(none)", querySource: q, mapper: "not read", component: "n/a",
      frontendSelectorOrConsumer: "none", classification: "correctly-hidden",
      recommendedAction: "FIXED this pass via ITEM_ROLE_RULES (role \"About statement service link\").",
      reason: "8 previously-unused generic sub-fields, now hidden.", sharedSchemaImpact: "Scoped by sectionKey \"statement\" + itemKey pattern.", approvalRequired: false,
    }),

    // ========================================================= community
    entry({
      sectionKey: "community", sectionKind: "iconGrid", fieldPath: `sections[sectionKey=="community"].title`,
      studioTitle: "Title", studioDescription: "generic", fieldType: "i18n string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "\"Community\" sub-heading.", websiteConsumer: "community <h2>",
      querySource: q, mapper: "getData (communityTitle)", component: "about/page.tsx", frontendSelectorOrConsumer: `page.getByRole("heading", { level: 2 })`,
      classification: "visible-connected", recommendedAction: "FIXED: da/uk populated live (scripts/backfill-about-translations.ts, verified idempotent) — previously EN-only, silently rendering the English word \"Community\" on da/uk pages.",
      reason: "Wired, visible, and now fully localized.", sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    entry({
      sectionKey: "community", sectionKind: "iconGrid", fieldPath: `sections[sectionKey=="community"].text`,
      studioTitle: "Text", studioDescription: "generic — now force-visible for this exact section", fieldType: "i18n text",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "Community paragraph — real, live, fully localized, rendered content, now locatable in Studio.",
      websiteConsumer: "community <p>", querySource: q, mapper: "getData (communityText)", component: "about/page.tsx",
      frontendSelectorOrConsumer: `page.getByText(value, { exact: true })`,
      classification: "visible-connected", recommendedAction: "FIXED this pass — same document+sectionKey-scoped override as statement.text, bundled in one FIELD_VISIBILITY-adjacent change (ABOUT_TEXT_FORCE_VISIBLE_SECTION_KEYS covers both).",
      reason: "Identical defect to statement.text, same sectionKind, now fixed identically.", sharedSchemaImpact: "Same as statement.text entry.", approvalRequired: false,
    }),
    entry({
      sectionKey: "community", sectionKind: "iconGrid", fieldPath: `sections[sectionKey=="community"].items[*].icon/href/label`,
      studioTitle: "Icon / Link destination / Link text", studioDescription: "generic", fieldType: "string + string + i18n string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "WECODA / Work with us / Volunteer quick-link chips.",
      websiteConsumer: "Community links", querySource: q, mapper: "getData (resolveIconLinksFromSection)",
      component: "about/page.tsx communityQuickLinks map", frontendSelectorOrConsumer: `[aria-label="Community paths"] a`,
      classification: "visible-connected", recommendedAction: "Keep as-is.", reason: "icon/href/label all genuinely read.",
      sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    entry({
      sectionKey: "community", sectionKind: "iconGrid", fieldPath: `sections[sectionKey=="community"].items[*].itemKey`,
      studioTitle: "Key (do not change)", studioDescription: "generic, readOnly", fieldType: "readOnly string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: true,
      localized: false, requiredLanguages: [], editorialPurpose: "Technical lookup key.", websiteConsumer: "positional lookup",
      querySource: q, mapper: "n/a", component: "n/a", frontendSelectorOrConsumer: "none",
      classification: "technical-visible", recommendedAction: "Unchanged.", reason: "Raw system key, locked and labeled.",
      sharedSchemaImpact: "Site-wide pattern.", approvalRequired: true,
    }),
    entry({
      sectionKey: "community", sectionKind: "iconGrid", fieldPath: `sections[sectionKey=="community"].items[*].title/text/image/value`,
      studioTitle: "(4 fields per item, 12 total)", studioDescription: "generic", fieldType: "mixed",
      editorVisibleExpected: false, editorVisibleActual: false, requiredExpected: false, requiredActual: false,
      localized: true, requiredLanguages: [], editorialPurpose: "n/a for a community quick-link chip.",
      websiteConsumer: "(none)", querySource: q, mapper: "not read", component: "n/a", frontendSelectorOrConsumer: "none",
      classification: "correctly-hidden", recommendedAction: "FIXED this pass via ITEM_ROLE_RULES (role \"About community link\").",
      reason: "12 previously-unused generic sub-fields across 3 items, now hidden.", sharedSchemaImpact: "Scoped by sectionKey \"community\" + itemKey pattern.", approvalRequired: false,
    }),

    // ============================================================ pillars
    entry({
      sectionKey: "pillars", sectionKind: "steps", fieldPath: `sections[sectionKey=="pillars"].label/title`,
      studioTitle: "Small label / Title", studioDescription: "generic", fieldType: "i18n string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "\"Experience principles\" eyebrow + \"Thoughtful and practical\" heading.",
      websiteConsumer: "Pillars label/H2", querySource: q, mapper: "getData (pillarsLabel/locationTitle)",
      component: "about/page.tsx", frontendSelectorOrConsumer: `page.getByRole("heading", { level: 2 })`,
      classification: "visible-connected", recommendedAction: "Keep as-is.", reason: "Fully wired, fully localized.",
      sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    entry({
      sectionKey: "pillars", sectionKind: "steps", fieldPath: `sections[sectionKey=="pillars"].text`,
      studioTitle: "Text", studioDescription: "generic — now force-visible for this exact section", fieldType: "i18n text",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D,
      editorialPurpose: "Pillars intro paragraph ('These principles shape the way RORUM approaches...') — real, live, fully localized, rendered content, now locatable in Studio.",
      websiteConsumer: "Pillars intro <p>", querySource: q, mapper: "getData (locationText)", component: "about/page.tsx",
      frontendSelectorOrConsumer: `page.getByText(value, { exact: true })`,
      classification: "visible-connected",
      recommendedAction: "FIXED this pass: same document+sectionKey-scoped override mechanism as statement/community.text, NOT a global change to \"steps\"'s FIELD_VISIBILITY (which would have exposed empty text fields on catering/eventDecoration/hostAtRorum's steps sections, none of which have been audited).",
      reason: "Identical defect class to statement.text/community.text, on sectionKind \"steps\" — now fixed the same narrow way.",
      sharedSchemaImpact: "No other \"steps\" section is affected — regression-tested (catering/eventDecoration/hostAtRorum's steps text fields remain hidden).", approvalRequired: false,
    }),
    entry({
      sectionKey: "pillars", sectionKind: "steps", fieldPath: `sections[sectionKey=="pillars"].items[0..3].title/text`,
      studioTitle: "Title / Text", studioDescription: "generic", fieldType: "i18n string + i18n text",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "The 4 principle cards.", websiteConsumer: "Pillars grid",
      querySource: q, mapper: "getData (pillars)", component: "about/page.tsx pillars map",
      frontendSelectorOrConsumer: `page.getByRole("heading", { level: 3, name: title })`,
      classification: "visible-connected", recommendedAction: "Keep as-is.", reason: "Best-translated section on the page — fully wired, no gaps at all.",
      sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    entry({
      sectionKey: "pillars", sectionKind: "steps", fieldPath: `sections[sectionKey=="pillars"].items[*].itemKey`,
      studioTitle: "Key (do not change)", studioDescription: "generic, readOnly", fieldType: "readOnly string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: true,
      localized: false, requiredLanguages: [], editorialPurpose: "Technical lookup key.", websiteConsumer: "positional lookup",
      querySource: q, mapper: "n/a", component: "n/a", frontendSelectorOrConsumer: "none",
      classification: "technical-visible", recommendedAction: "Unchanged.", reason: "Raw system key, locked and labeled.",
      sharedSchemaImpact: "Site-wide pattern.", approvalRequired: true,
    }),
    entry({
      sectionKey: "pillars", sectionKind: "steps", fieldPath: `sections[sectionKey=="pillars"].items[*].icon/image/href/label/value`,
      studioTitle: "(5 fields per item, 20 total)", studioDescription: "generic", fieldType: "mixed",
      editorVisibleExpected: false, editorVisibleActual: false, requiredExpected: false, requiredActual: false,
      localized: false, requiredLanguages: [], editorialPurpose: "n/a for a principle card (title+text only).",
      websiteConsumer: "(none)", querySource: q, mapper: "not read", component: "n/a", frontendSelectorOrConsumer: "none",
      classification: "correctly-hidden", recommendedAction: "FIXED this pass via ITEM_ROLE_RULES (role \"About pillar card\").",
      reason: "20 previously-unused generic sub-fields across the 4 cards, now hidden.", sharedSchemaImpact: "Scoped by sectionKey \"pillars\" + itemKey pattern.", approvalRequired: false,
    }),

    // ========================================================== closingCta
    entry({
      sectionKey: "closingCta", sectionKind: "cta", fieldPath: `sections[sectionKey=="closingCta"].label/title/text`,
      studioTitle: "Small label / Title / Text", studioDescription: "generic", fieldType: "i18n string/text",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "Closing CTA eyebrow, heading, paragraph.",
      websiteConsumer: "CTASection eyebrow/title/text", querySource: q, mapper: "getData (closingEyebrow/closingTitle/closingText)",
      component: "CTASection", frontendSelectorOrConsumer: `.next-step-section-not-sure`,
      classification: "visible-connected", recommendedAction: "Keep as-is.", reason: "Fully wired, fully localized.",
      sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    entry({
      sectionKey: "closingCta", sectionKind: "cta", fieldPath: `sections[sectionKey=="closingCta"].actions[actionKey=="main"].label`,
      studioTitle: "Button text", studioDescription: "generic", fieldType: "i18n string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: true,
      localized: true, requiredLanguages: D, editorialPurpose: "\"Let's talk\" button label.",
      websiteConsumer: "CTASection Button label", querySource: q, mapper: "getData (via getAction(...).label)",
      component: "CTASection", frontendSelectorOrConsumer: `.next-step-section-not-sure a`,
      classification: "visible-connected", recommendedAction: "Keep as-is.", reason: "Wired.", sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    entry({
      sectionKey: "closingCta", sectionKind: "cta", fieldPath: `sections[sectionKey=="closingCta"].actions[actionKey=="main"].href/openInNewTab/enabled`,
      studioTitle: "Destination / Open in a new tab / Shown on the site", studioDescription: "generic",
      fieldType: "mixed", editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: true,
      localized: false, requiredLanguages: [], editorialPurpose: "Controls the button's destination, tab behavior, and visibility.",
      websiteConsumer: "About closing CTA button href/target/rel, and whether it renders at all",
      querySource: q, mapper: "about/page.tsx:getData (closingMainAction, via the shared resolveAction() helper)",
      component: "about/page.tsx CTASection call", frontendSelectorOrConsumer: `.next-step-section-not-sure a`,
      classification: "visible-connected",
      recommendedAction: "FIXED this pass (Approved Fix 8): routed through resolveAction(), same as every Home CTA. Verified with current production data: rendered destination/appearance unchanged.",
      reason: "3 fields that now genuinely affect the frontend.", sharedSchemaImpact: "About-specific wiring fix, not a shared-schema change.", approvalRequired: false,
    }),
    entry({
      sectionKey: "closingCta", sectionKind: "cta", fieldPath: `sections[sectionKey=="closingCta"].actions[actionKey=="main"].linkType`,
      studioTitle: "Link type", studioDescription: "generic", fieldType: "string enum",
      editorVisibleExpected: false, editorVisibleActual: false, requiredExpected: false, requiredActual: false,
      localized: false, requiredLanguages: [], editorialPurpose: "n/a — hidden site-wide (Approved Fix 5).",
      websiteConsumer: "(none)", querySource: q, mapper: "not branched on", component: "n/a", frontendSelectorOrConsumer: "none",
      classification: "correctly-hidden", recommendedAction: "FIXED this pass: ctaAction.linkType hidden unconditionally, site-wide.",
      reason: "Same global no-op found on every ctaAction, now hidden everywhere.", sharedSchemaImpact: "Global — see the Home contract's matching entry.", approvalRequired: false,
    }),
    entry({
      sectionKey: "closingCta", sectionKind: "cta", fieldPath: `sections[sectionKey=="closingCta"].items[itemKey=="faqQuestion"/"faqLabel"].title`,
      studioTitle: "Title", studioDescription: "generic", fieldType: "i18n string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "FAQ inline prompt question + link label.",
      websiteConsumer: "FAQInlinePrompt", querySource: q, mapper: "getData (getItem)", component: "FAQInlinePrompt",
      frontendSelectorOrConsumer: `.next-step-section-not-sure`, classification: "visible-connected",
      recommendedAction: "Keep as-is.", reason: "Fully wired, fully localized.", sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    entry({
      sectionKey: "closingCta", sectionKind: "cta", fieldPath: `sections[sectionKey=="closingCta"].items[itemKey=~"^link"].href/label`,
      studioTitle: "Link destination / Link text", studioDescription: "generic", fieldType: "string + i18n string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "4 suggested-path chips.", websiteConsumer: "CTASection links",
      querySource: q, mapper: "getData (closingLinks)", component: "CTASection", frontendSelectorOrConsumer: `[aria-label="Suggested paths"] a`,
      classification: "visible-connected", recommendedAction: "Keep as-is.", reason: "Fully wired, fully localized.",
      sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    entry({
      sectionKey: "closingCta", sectionKind: "cta", fieldPath: `sections[sectionKey=="closingCta"].items[*].itemKey/icon/text/image/value (6 items)`,
      studioTitle: "(up to 6 unused fields per item, 36 total)", studioDescription: "generic", fieldType: "mixed",
      editorVisibleExpected: false, editorVisibleActual: false, requiredExpected: false, requiredActual: false,
      localized: true, requiredLanguages: [], editorialPurpose: "n/a for FAQ prompt rows or link chips.",
      websiteConsumer: "(none)", querySource: q, mapper: "not read", component: "n/a", frontendSelectorOrConsumer: "none",
      classification: "correctly-hidden", recommendedAction: "FIXED this pass via ITEM_ROLE_RULES (roles \"Closing CTA FAQ prompt row\" and \"Closing CTA suggested-path link\", shared by Home + About). Unlike hero/statement/community/pillars items, itemKey is hidden here too (not kept technical-visible) — these 2 closingCta item roles are a closed, fixed set, same treatment as Home's trust badges.",
      reason: "Same generic-oversupply pattern as Home, now hidden on both pages.", sharedSchemaImpact: "Scoped by sectionKey \"closingCta\" + itemKey pattern — shared rule covers both Home and About identically since the role is the same.", approvalRequired: false,
    }),
    entry({
      sectionKey: "closingCta", sectionKind: "cta", fieldPath: `sections[sectionKey=="closingCta"].settings`,
      studioTitle: "Advanced settings", studioDescription: "generic", fieldType: "array<sectionSetting>",
      editorVisibleExpected: false, editorVisibleActual: false, requiredExpected: false, requiredActual: false,
      localized: false, requiredLanguages: [], editorialPurpose: "n/a — hidden by the generic sectionKind mechanism.",
      websiteConsumer: "(none — <CTASection variant=\"final\"> is a hardcoded JSX literal on About too)", querySource: q, mapper: "n/a",
      component: "n/a", frontendSelectorOrConsumer: "none", classification: "correctly-hidden",
      recommendedAction: "CORRECTION to the original About Content Audit: this field is Studio-HIDDEN, not visible as previously reported (sectionKind \"cta\" doesn't include \"settings\" in FIELD_VISIBILITY, identical to Home's closingCta — verified this pass). The underlying finding (frontend never reads it) still stands and is preserved unchanged; only the editorVisibility detail is corrected. See the Home contract's matching entry for the full reasoning.",
      reason: "Traced fieldHidden() precisely this pass rather than inferring visibility from the SETTINGS_HIDDEN_FOR_SECTION_KEYS special case alone.",
      sharedSchemaImpact: "Same site-wide settings/getSetting() finding as Home — 0 confirmed consumers anywhere.", approvalRequired: true,
    }),

    // ================================================================ seo
    entry({
      sectionKey: "seo", sectionKind: "n/a", fieldPath: `seo.title`,
      studioTitle: "SEO title", studioDescription: "Shown in the browser tab and search results.",
      fieldType: "i18n string", editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: false,
      requiredActual: false, localized: true, requiredLanguages: D,
      editorialPurpose: "Sets the browser-tab/search-result title for About.", websiteConsumer: "generateMetadata() -> <title>",
      querySource: q, mapper: "getData (seoTitle = pickLocalized(newPage?.seo?.title, locale) ?? fallback.seoTitle)",
      component: "about/page.tsx:generateMetadata", frontendSelectorOrConsumer: "page.title()",
      classification: "visible-connected", recommendedAction: "FIXED this pass (Approved Fix 9): wired with the same locale-aware fallback chain as Home. Content remains EMPTY in Sanity for all 3 languages — not populated this phase. Do not read \"connected\" as \"content-complete\" for this entry.",
      reason: "Code path is now correct for both the populated and empty branches; classification reflects code correctness, not content completeness.", sharedSchemaImpact: "About-specific wiring fix, not shared-schema.", approvalRequired: false,
    }),
    entry({
      sectionKey: "seo", sectionKind: "n/a", fieldPath: `seo.description`,
      studioTitle: "SEO description", studioDescription: "Shown under the title in search results.",
      fieldType: "i18n text", editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: false,
      requiredActual: false, localized: true, requiredLanguages: D,
      editorialPurpose: "Sets the search-result description for About.", websiteConsumer: "generateMetadata() -> meta[name=description]",
      querySource: q, mapper: "getData (description = pickLocalized(newPage?.seo?.description, locale) ?? fallback.description)",
      component: "about/page.tsx:generateMetadata", frontendSelectorOrConsumer: `page.locator('meta[name="description"]')`,
      classification: "visible-connected", recommendedAction: "FIXED this pass (Approved Fix 9): now reads `newPage`, not the dead legacy `aboutPage` singleton. Content remains EMPTY in Sanity — not populated this phase.",
      reason: "Code path corrected; classification reflects code correctness, not content completeness.", sharedSchemaImpact: "About-specific wiring fix.", approvalRequired: false,
    }),
    entry({
      sectionKey: "seo", sectionKind: "n/a", fieldPath: `seo.ogImage / seo.ogImage.alt`,
      studioTitle: "Social Sharing Image / Alt text", studioDescription: "The preview image shown when this page is shared on Facebook, LinkedIn, messaging apps, and other services.", fieldType: "image + i18n string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: false, requiredActual: false,
      localized: true, requiredLanguages: [], editorialPurpose: "Lets the editor set the social-share preview image for About.",
      websiteConsumer: "generateMetadata() -> og:image", querySource: q,
      mapper: "getData() ogImageUrl = urlForImage(newPage?.seo?.ogImage), passed to localizedPageMetadata()'s `image` param when set",
      component: "app/[locale]/(site)/about/page.tsx:generateMetadata", frontendSelectorOrConsumer: `page.locator('meta[property="og:image"]')`,
      classification: "visible-connected", recommendedAction: "FIXED this pass — same wiring as Home's equivalent entry (About's own generateMetadata() call), plus the same lib/seo.ts absolute-URL bug fix (shared helper, fixed once for both pages). Content currently unset on About; falls back to the existing default unchanged.",
      reason: "Now genuinely affects the frontend for About specifically.", sharedSchemaImpact: "Wired only for Home + About's own generateMetadata() calls.", approvalRequired: false,
    }),

    // ============================================================ legacy
    entry({
      sectionKey: "(legacy)", sectionKind: "n/a", fieldPath: `*[_type == "aboutPage"] (whole document type, 17 fields)`,
      studioTitle: "About page (legacy singleton)", studioDescription: "n/a — not reachable from Studio's navigation at all.",
      fieldType: "document", editorVisibleExpected: false, editorVisibleActual: false, requiredExpected: false,
      requiredActual: false, localized: false, requiredLanguages: [],
      editorialPurpose: "n/a", websiteConsumer: "(none — 0 documents exist, confirmed via read-only query)",
      querySource: "sanity/queries/pages.ts:aboutPageQuery", mapper: "about/page.tsx:getData (third-priority fallback, never resolves)",
      component: "n/a", frontendSelectorOrConsumer: "none",
      classification: "correctly-hidden", recommendedAction: "Already reported (obsolete-deferred in the content contract). No Studio-visibility action needed — it was never reachable in Studio to begin with (sanity/structure.ts only lists the new page-about document).",
      reason: "Confirms Studio-side: not just data-empty, genuinely unreachable through the editing UI.", sharedSchemaImpact: "n/a — page-scoped schema type, not shared.", approvalRequired: false,
    }),
  ],
};
