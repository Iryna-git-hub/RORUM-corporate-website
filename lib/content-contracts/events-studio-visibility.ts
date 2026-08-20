import type { StudioVisibilityContract, StudioVisibilityEntry } from "./studio-visibility-types";

/**
 * Events Studio Visibility Contract — reverse-direction companion to
 * lib/content-contracts/events.ts. Covers page-events, every `event`
 * document, and eventMessages. Verified against the live documents (raw
 * perspective, read-only) plus direct inspection of contentItem.ts's
 * ITEM_ROLE_RULES, event.ts, eventsPage.ts, and eventMessages.ts.
 *
 * Legacy `eventsPage` singleton: registered in the schema, NOT reachable
 * from Studio's desk structure (no listItem in structure.ts), and — as of
 * this pass — no longer read by the frontend at all (see the dedicated
 * entry below). Kept registered, backed up, not deleted; full schema
 * removal is a later, separate decision once the legacy read path has been
 * gone for a full editorial cycle with nothing broken.
 */

const D: readonly ["en", "da", "uk"] = ["en", "da", "uk"];
const eventDoc = "event-*";
const eventQ = "sanity/queries/events.ts";
const listingDoc = "page-events";
const listingQ = 'sanity/queries/page.ts:pageByKeyQuery(pageKey="events")';
const messagesQ = "sanity/queries/globals.ts:eventMessagesQuery";
const ticketsMapper = "lib/sanityEvents.ts sanityEventToRorumEvent (raw passthrough, no spotsLeft derivation)";

function eventEntry(e: Omit<StudioVisibilityEntry, "pageKey" | "documentId">): StudioVisibilityEntry {
  return { pageKey: "events", documentId: eventDoc, ...e };
}
function listingEntry(e: Omit<StudioVisibilityEntry, "pageKey" | "documentId">): StudioVisibilityEntry {
  return { pageKey: "events", documentId: listingDoc, ...e };
}

export const eventsStudioVisibilityContract: StudioVisibilityContract = {
  pageKey: "events",
  documentId: "event / page-events / eventMessages",
  entries: [
    // ===================================================== page-events
    listingEntry({
      sectionKey: "hero", sectionKind: "hero", fieldPath: `sections[sectionKey=="hero"].title`,
      studioTitle: "Title", studioDescription: "(generic)", fieldType: "i18n string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "Events listing H1.",
      websiteConsumer: "H1 heading + <title> tag", querySource: listingQ, mapper: "events/page.tsx getData()",
      component: "SectionHeader <h1>; generateMetadata()", frontendSelectorOrConsumer: `page.getByRole("heading", { level: 1 })`,
      classification: "visible-connected", recommendedAction: "Keep as-is.",
      reason: "FIXED this pass: generateMetadata() previously ignored this field entirely (hardcoded <title>=\"Events\") — now reads it.",
      sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    listingEntry({
      sectionKey: "filters", sectionKind: "filters", fieldPath: `sections[sectionKey=="filters"].items[*].title`,
      studioTitle: "Title", studioDescription: "generic", fieldType: "i18n string",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "The 13 filter-bar / empty-state label rows use this field to hold their actual displayed text.",
      websiteConsumer: "EventFilters labels; EventsPaginatedList empty state", querySource: listingQ,
      mapper: "events/page.tsx getData() filters / emptyState", component: "EventFilters, EventsPaginatedList",
      frontendSelectorOrConsumer: "filter bar controls; empty-state text",
      classification: "visible-connected", recommendedAction: "Keep as-is.", reason: "Fully wired, fully localized, all 13 rows populated live.",
      sharedSchemaImpact: "n/a", approvalRequired: false,
    }),
    listingEntry({
      sectionKey: "filters", sectionKind: "filters", fieldPath: `sections[sectionKey=="filters"].items[*].icon/text/label/href/value`,
      studioTitle: "(5 fields per item, 65 total across the 13 rows, all hidden)", studioDescription: "n/a",
      fieldType: "mixed", editorVisibleExpected: false, editorVisibleActual: false, requiredExpected: false, requiredActual: false,
      localized: true, requiredLanguages: [],
      editorialPurpose: "n/a — a filter/empty-state label row only ever uses `.title` — hidden.",
      websiteConsumer: "(none)", querySource: listingQ, mapper: "not read for filters items", component: "n/a",
      frontendSelectorOrConsumer: "none",
      classification: "correctly-hidden",
      recommendedAction: "FIXED this pass via a new ITEM_ROLE_RULES entry (role \"Events filter/empty-state label\", sectionKeys:[\"filters\"], visible:[\"title\"] only — itemKey hidden too, since this is a fixed, closed set of 13 built-in rows, same treatment as trust badges).",
      reason: "Confirmed live: all 13 rows have icon/text/label/href/value = null. No frontend code reads any of them for this sectionKey.",
      sharedSchemaImpact: "Scoped by sectionKey \"filters\" + itemKey pattern — contentItem's generic fields remain used normally everywhere else.", approvalRequired: false,
    }),
    listingEntry({
      sectionKey: "closingCta", sectionKind: "cta", fieldPath: `sections[sectionKey=="closingCta"].*`,
      studioTitle: "Small label / Title / Text / Button / FAQ prompt", studioDescription: "generic, shared shape with Home/About",
      fieldType: "mixed", editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: true, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "Closing \"Would you like to host at RORUM?\" section.",
      websiteConsumer: "CTASection", querySource: listingQ, mapper: "events/page.tsx getData()", component: "CTASection",
      frontendSelectorOrConsumer: `page.getByTestId("events-closing-cta")`,
      classification: "visible-connected", recommendedAction: "Keep as-is.",
      reason: "Reuses the existing Home/About \"Closing CTA FAQ prompt row\" / \"suggested-path link\" ITEM_ROLE_RULES rows unchanged — verified they apply correctly here too (shared by sectionKey, not by document). Regression test added.",
      sharedSchemaImpact: "Shared sectionKey \"closingCta\" across Home/About/Events — one rule set covers all three.", approvalRequired: false,
    }),
    listingEntry({
      sectionKey: "seo", sectionKind: "n/a", fieldPath: `seo.title / seo.description / seo.ogImage`,
      studioTitle: "Search Result Title / Search Result Description / Social Sharing Image",
      studioDescription: "Same shared seo object, same labels established for Home/About.", fieldType: "i18n string/text + image",
      editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: false, requiredActual: false,
      localized: true, requiredLanguages: D, editorialPurpose: "Controls the listing page's search-result and social-share appearance.",
      websiteConsumer: "generateMetadata() -> <title>, meta[name=description], og:image", querySource: listingQ,
      mapper: "events/page.tsx generateMetadata()", component: "events/page.tsx generateMetadata()",
      frontendSelectorOrConsumer: `page.title(); page.locator('meta[name="description"]'); page.locator('meta[property="og:image"]')`,
      classification: "visible-connected",
      recommendedAction: "FIXED this pass: generateMetadata() previously read description from the legacy, unpublished eventsPage document (a query that always resolved to nothing in production) and never read ogImage or a listing-specific title at all. Now reads page-events.seo directly. Content is currently unset in Sanity (empty) — wiring is correct for both branches; population is a separate content task, not required here.",
      reason: "Same defect class as Home/About's pre-fix seo.description/seo.title/seo.ogImage.",
      sharedSchemaImpact: "Shared seo object type — this fix only touches the Events listing's own generateMetadata() call site.", approvalRequired: false,
    }),

    // ========================================================== event
    eventEntry({
      sectionKey: "event", sectionKind: "n/a", fieldPath: "included",
      studioTitle: "What's included", studioDescription: "Optional bullet list of what's included in the event.",
      fieldType: "array<bulletText>", editorVisibleExpected: false, editorVisibleActual: true,
      requiredExpected: false, requiredActual: false, localized: true, requiredLanguages: [],
      editorialPurpose: "Appeared editable but had no effect.", websiteConsumer: "(none — grep-confirmed, zero rendering consumers)",
      querySource: eventQ, mapper: "lib/sanityEvents.ts reads it but nothing downstream renders it", component: "n/a",
      frontendSelectorOrConsumer: "none",
      classification: "visible-unused",
      recommendedAction: "FIXED this pass (approved decision): hidden via `hidden: () => true`, matching the existing legacy-field style. Not wired to new UI (would be new visible page content, out of scope). Any existing data preserved, not deleted.",
      reason: "The schema's own description already said \"not currently shown on the site\" — now actually hidden instead of just documented as such.",
      sharedSchemaImpact: "bulletText remains used elsewhere on the site (e.g. host-at-rorum's own `included` field) — this hide is scoped to event.included only.", approvalRequired: false,
    }),
    eventEntry({
      sectionKey: "event", sectionKind: "n/a", fieldPath: "calendarUrl",
      studioTitle: "Add-to-calendar URL", studioDescription: "Link that adds the event to a calendar.",
      fieldType: "url", editorVisibleExpected: false, editorVisibleActual: true,
      requiredExpected: false, requiredActual: false, localized: false, requiredLanguages: [],
      editorialPurpose: "Appeared editable but had no effect.", websiteConsumer: "(none — grep-confirmed)",
      querySource: eventQ, mapper: "lib/sanityEvents.ts reads it but nothing downstream renders it", component: "n/a",
      frontendSelectorOrConsumer: "none",
      classification: "visible-unused",
      recommendedAction: "FIXED this pass — same treatment as `included` above.",
      reason: "No add-to-calendar control exists anywhere on the Event Detail page.", sharedSchemaImpact: "n/a — event-only field.", approvalRequired: false,
    }),
    eventEntry({
      sectionKey: "event", sectionKind: "n/a", fieldPath: "waitlistUrl",
      studioTitle: "Waitlist URL", studioDescription: "Usually a mailto: link with a prefilled subject.",
      fieldType: "string", editorVisibleExpected: false, editorVisibleActual: true,
      requiredExpected: false, requiredActual: false, localized: false, requiredLanguages: [],
      editorialPurpose: "Appeared editable but had no effect.", websiteConsumer: "(none — grep-confirmed)",
      querySource: eventQ, mapper: "lib/sanityEvents.ts reads it but nothing downstream renders it", component: "n/a",
      frontendSelectorOrConsumer: "none",
      classification: "visible-unused",
      recommendedAction: "FIXED this pass — same treatment as `included` above.",
      reason: "No waitlist control exists anywhere on the Event Detail page.", sharedSchemaImpact: "n/a — event-only field.", approvalRequired: false,
    }),
    eventEntry({
      sectionKey: "event", sectionKind: "n/a", fieldPath: "seo.title / seo.description / seo.ogImage",
      studioTitle: "Search Result Title / Search Result Description / Social Sharing Image", studioDescription: "Shared seo object.",
      fieldType: "i18n string/text + image", editorVisibleExpected: true, editorVisibleActual: true,
      requiredExpected: false, requiredActual: false, localized: true, requiredLanguages: D,
      editorialPurpose: "Controls this event's own search-result/social-share appearance.",
      websiteConsumer: "generateMetadata() -> <title>, meta[name=description], og:image", querySource: eventQ,
      mapper: "events/[slug]/page.tsx generateMetadata() (FIXED this pass — previously did not read event.seo at all)",
      component: "events/[slug]/page.tsx generateMetadata()", frontendSelectorOrConsumer: "page.title(); meta tags",
      classification: "visible-misleading",
      recommendedAction: "FIXED this pass: generateMetadata() now prefers event.seo.title/.description/.ogImage, falling back to event.title/.longDescription/.image (the previous, only, behavior) when SEO fields are empty.",
      reason: "Before this fix: every event document showed a full SEO block in Studio, but filling it in changed nothing — the page always used the event's own title/description/image instead. Textbook visible-misleading.",
      sharedSchemaImpact: "Shared seo object — this fix is scoped to the event-detail generateMetadata() call site only.", approvalRequired: false,
    }),
    eventEntry({
      sectionKey: "event", sectionKind: "n/a", fieldPath: "shortDescription / practicalDetails / ticketProvider",
      studioTitle: "(3 legacy fields, all hidden)", studioDescription: "Superseded by longDescription/address+duration+arrival+ticketProviderInfo.",
      fieldType: "mixed", editorVisibleExpected: false, editorVisibleActual: false, requiredExpected: false, requiredActual: false,
      localized: true, requiredLanguages: [],
      editorialPurpose: "n/a — kept only as a fallback for any still-unmigrated document.", websiteConsumer: "lib/sanityEvents.ts getLegacyDetail() fallback only",
      querySource: eventQ, mapper: "getLegacyDetail()", component: "n/a", frontendSelectorOrConsumer: "none (fallback-only, not directly rendered)",
      classification: "correctly-hidden",
      recommendedAction: "Keep as-is — already correctly hidden with no validation attached (confirmed by reading the full schema), so this cannot become a hidden-but-validated defect.",
      reason: "Deliberate migration safety net, already correctly implemented.", sharedSchemaImpact: "n/a — event-only, legacy fields.", approvalRequired: false,
    }),
    eventEntry({
      sectionKey: "event", sectionKind: "n/a", fieldPath: "ticketsLeft",
      studioTitle: "Tickets left", studioDescription: "Number of tickets remaining, if shown.",
      fieldType: "number", editorVisibleExpected: true, editorVisibleActual: true, requiredExpected: false, requiredActual: false,
      localized: false, requiredLanguages: [],
      editorialPurpose: "Lets the editor set a remaining-tickets count, including 0.",
      websiteConsumer: "EventCard availability badge; detail-page availability row", querySource: eventQ,
      mapper: ticketsMapper, component: "EventCard.tsx, events/[slug]/page.tsx",
      frontendSelectorOrConsumer: "availability text on card + detail page",
      classification: "visible-connected",
      recommendedAction: "No change — per explicit decision this pass, TicketButton's isSoldOut-only gating stays as the defined, documented, tested precedence rule. ticketsLeft=0 renders \"0 spots left\" as informational text without disabling the purchase button; this is intentional current behavior, not a defect silently left unfixed.",
      reason: "min(0) validation already correctly allows 0 as a real, distinct value.", sharedSchemaImpact: "n/a — event-only field.", approvalRequired: false,
    }),

    // ==================================================== eventMessages
    eventEntry({
      sectionKey: "eventMessages", sectionKind: "n/a", fieldPath: `labels[key=="<any of 22 keys>"].value`,
      studioTitle: "Key (do not change) / Text", studioDescription: "keyedString shared shape.",
      fieldType: "readOnly string + i18n string", editorVisibleExpected: true, editorVisibleActual: true,
      requiredExpected: true, requiredActual: false, localized: true, requiredLanguages: D,
      editorialPurpose: "Shared UI microcopy for every event card/detail page.",
      websiteConsumer: "EventCard, events/[slug]/page.tsx (headings, ticket-state text, share strings)",
      querySource: messagesQ, mapper: "lib/sanity-i18n.ts pickLabel()", component: "EventCard.tsx, events/[slug]/page.tsx",
      frontendSelectorOrConsumer: "varies per key",
      classification: "visible-connected",
      recommendedAction: "Keep as-is. `key` is already readOnly + labeled \"(do not change)\" — correctly technical-visible, not a defect. All 22 expected keys present live, no duplicates, single document (no draft).",
      reason: "Fully wired, matches the frontend's exact key list 1:1 (verified against every pickLabel()/pickLabelExact() call site).",
      sharedSchemaImpact: "keyedString is also used by eventsPage.labels and formMessages — this entry covers eventMessages only.", approvalRequired: false,
    }),

    // ================================================ legacy eventsPage
    listingEntry({
      sectionKey: "n/a", sectionKind: "n/a", fieldPath: "(entire eventsPage document)",
      studioTitle: "Events (listing) page (legacy singleton)", studioDescription: "n/a — not reachable from Studio's nav at all.",
      fieldType: "document", editorVisibleExpected: false, editorVisibleActual: false, requiredExpected: false, requiredActual: false,
      localized: false, requiredLanguages: [],
      editorialPurpose: "n/a — no structure.ts listItem exists for this type; an editor cannot open it through Studio's UI even though it's schema-registered.",
      websiteConsumer: "FIXED this pass: previously events/page.tsx's getData() read it as the middle tier of a 3-way `page-events ?? eventsPage ?? hardcoded` fallback chain for every listing-page field. That fetch and every corresponding `?? eventsPageField` has been removed.",
      querySource: "sanity/queries/events.ts eventsPageQuery (now unused)", mapper: "n/a", component: "n/a",
      frontendSelectorOrConsumer: "none, as of this pass",
      classification: "obsolete",
      recommendedAction:
        "Legacy read path removed from events/page.tsx. Schema type left registered (not unregistered/deleted) and " +
        "the sole existing document, drafts.eventsPage, was backed up (scripts/backup-events-docs.ts) rather than " +
        "deleted, per the task's explicit \"do not unregister until verified\" instruction. Full schema removal is " +
        "recommended as a separate, later follow-up task once this pass's removal has been live for a full " +
        "editorial cycle with nothing broken.",
      reason:
        "Confirmed live: only a DRAFT of this singleton exists (no published document) — a published-perspective " +
        "fetch (what the frontend actually uses in production) always resolved to null, so this tier was already " +
        "dead in production before removal; removing it is safe cleanup, not a live content change. page-events " +
        "(the new source) is already fully, independently populated with matching content for every field this " +
        "singleton held.",
      sharedSchemaImpact: "n/a — eventsPage is not reused by any other page.", approvalRequired: false,
    }),
  ],
};
