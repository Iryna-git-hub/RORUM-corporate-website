import type { Locale } from "@/lib/i18n";

/**
 * The reverse-direction companion to the frontend content contract
 * (types.ts). That contract proves:
 *
 *   Sanity value -> query -> mapper -> component -> frontend output
 *
 * This one proves the other direction, for every field a content manager
 * can actually SEE in Studio:
 *
 *   Studio field -> clear editorial purpose -> consumed by the website,
 *   metadata, accessibility, navigation, or another documented public
 *   behaviour
 *
 * A generic reusable object (pageSection, contentItem, ctaAction,
 * mediaItem, seo) being registered in the schema is never sufficient by
 * itself to mark one of its fields "connected" in a given document/section
 * context — visibility and actual consumption are evaluated per
 * pageKey+sectionKey+sectionKind+itemKey/actionKey, not per schema type.
 */

export type StudioClassification =
  /** A. Editor sees it, purpose is clear, changing it affects the intended public behaviour. */
  | "visible-connected"
  /** B. The code connection works, but current content is missing/incomplete for an applicable language. */
  | "visible-connected-but-empty"
  /** C. Editor sees it; frontend, metadata and accessibility layers do not consume it. */
  | "visible-unused"
  /** D. Has some use, but its title/description/validation/placement sets an incorrect editor expectation. */
  | "visible-misleading"
  /** E. A technical identifier/implementation field is exposed unnecessarily. */
  | "technical-visible"
  /** F. Controls shared content that should be edited in Navigation/Footer/Site Settings/etc instead of this page. */
  | "global-shared"
  /** G. The generic field exists but is correctly hidden in this document/section context. */
  | "correctly-hidden"
  /**
   * Not part of the original A-I list — added because the reverse-direction
   * audit surfaced its mirror image: a field the frontend genuinely reads
   * and renders (real, populated, consumed content), but which the editor
   * cannot find in Studio because a sectionKind's FIELD_VISIBILITY doesn't
   * show it. `correctly-hidden` would misreport this as intentional and
   * fine; this makes the mismatch explicit so it isn't silently folded into
   * either "hidden and fine" or "visible and used".
   */
  | "hidden-but-required"
  /** H. Field or type is no longer used anywhere — later cleanup candidate. */
  | "obsolete"
  /** I. Controls content rendered from another document type, or only appears under a documented condition. */
  | "conditional-dynamic";

export interface StudioVisibilityEntry {
  pageKey: string;
  documentId: string;
  sectionKey: string;
  /** pageSection.sectionKind, or "n/a" for document-level fields (e.g. seo). */
  sectionKind: string;
  /** GROQ/Studio-addressable path, e.g. `sections[sectionKey=="eventsStrip"].text`. */
  fieldPath: string;
  studioTitle: string;
  studioDescription: string;
  fieldType: string;
  editorVisibleExpected: boolean;
  editorVisibleActual: boolean;
  requiredExpected: boolean;
  requiredActual: boolean;
  localized: boolean;
  requiredLanguages: readonly Locale[];
  /** Answers "why does the content manager see this field?" in plain language. */
  editorialPurpose: string;
  /** Answers "what exact website behaviour does it control?" — "(none)" for visible-unused/obsolete. */
  websiteConsumer: string;
  querySource: string;
  mapper: string;
  component: string;
  /** Playwright selector for a visible consumer, or a plain description for a nonvisual one (metadata/accessibility/none). */
  frontendSelectorOrConsumer: string;
  classification: StudioClassification;
  recommendedAction: string;
  reason: string;
  /** Which other documents/pages share this exact field via a generic schema type, and how a change here would affect them. */
  sharedSchemaImpact: string;
  approvalRequired: boolean;
  notes?: string;
}

export interface StudioVisibilityContract {
  pageKey: string;
  documentId: string;
  entries: StudioVisibilityEntry[];
}
