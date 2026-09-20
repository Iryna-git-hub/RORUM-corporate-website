import type { Locale } from "@/lib/i18n";

/**
 * Machine-readable description of one editorial "thing a content manager can
 * change" on a page — where it lives in Sanity, how the frontend gets from
 * that Sanity value to pixels on screen, and how a test should verify the
 * connection. This is metadata only: paths, expectations, test strategy —
 * never the actual production wording (that stays in Sanity, the single
 * source of truth).
 */

export type ContentFieldType =
  | "i18nString"
  | "i18nText"
  | "richText"
  | "image"
  | "video"
  | "icon"
  | "link"
  | "boolean"
  | "number"
  | "rawString"
  | "keyedString"
  | "repeatable";

export type MutationStrategy =
  | "localized-canary"
  | "image-swap"
  | "icon-swap"
  | "link-href"
  | "reorder"
  | "rich-text-insert"
  | "not-mutation-tested";

export type EditorVisibility = "visible" | "hidden" | "readOnly";

/**
 * Classification, extended (Home connection-fix pass) beyond the original
 * A-F audit taxonomy to distinguish "the code path is wired and real
 * content already resolves through it" from states that only look similar:
 *
 * - connected: editor sees it, changing it changes the site, AND real
 *   production content already resolves through that path today.
 * - pending-approved-migration: the frontend wiring is done (same as
 *   "connected" from the code's point of view), but the Sanity *content*
 *   still comes from a code-level fallback — an idempotent, dry-run-only
 *   migration exists to backfill it, awaiting explicit approval to run live.
 *   Do not report this as "connected" — the data isn't there yet.
 * - pending-decision: a real, viable path exists but a product/scope
 *   decision (not a technical one) is still open before wiring or
 *   populating it — e.g. the SEO title field.
 * - technical-hidden: correctly hidden/non-editable for a documented,
 *   narrow reason (not a defect) — e.g. a technical key, or a field hidden
 *   for one specific section because it's provably unused there.
 * - disconnected: visible in Studio, frontend does not read it (defect,
 *   not yet fixed).
 * - hardcoded: rendered on site, but not sourced from this field / not
 *   editable, with no fix in flight.
 * - global: belongs to a different (shared) document, not this page.
 * - obsolete-deferred: not required by this page's current data path, but
 *   removing it is a cross-page/schema decision out of this pass's scope.
 */
export type FieldClassification =
  | "connected"
  | "pending-approved-migration"
  | "pending-decision"
  | "technical-hidden"
  | "disconnected"
  | "hardcoded"
  | "global"
  | "obsolete-deferred";

export interface ContentContractEntry {
  pageKey: string;
  sectionKey: string;
  /** GROQ-addressable path from the page document root, e.g. `sections[sectionKey=="hero"].title`. */
  sanityPath: string;
  fieldPurpose: string;
  fieldType: ContentFieldType;
  required: boolean;
  languages: readonly Locale[];
  /** File + exported query identifying where this data is fetched from. */
  querySource: string;
  /** File + function responsible for turning the raw Sanity value into a prop. */
  mapper: string;
  /** React component that renders the resolved value. */
  component: string;
  /** Playwright-locator-friendly description of where to find the rendered value. */
  frontendSelector: string;
  expectedBehavior: string;
  mutationStrategy: MutationStrategy;
  editorVisibility: EditorVisibility;
  classification: FieldClassification;
  notes?: string;
}

export interface PageContentContract {
  pageKey: string;
  /** Publicly-readable document id for the page (see sanity/lib/pageIds.ts). */
  documentId: string;
  documentType: "page" | "legalPage" | "event" | "singleton";
  entries: ContentContractEntry[];
}
