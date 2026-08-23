// Extracted from scripts/delete-old-dotted-page-ids.ts so its two most
// safety-critical pieces — the client perspective used to look up documents,
// and the actual delete-eligibility decision — are independently testable
// without needing a live Sanity client or dataset.
//
// FIXED regression (found while diagnosing a live Publish-blocking pageKey
// collision on page-catering): the script used to build its client with
// `perspective: "published"`. Under that perspective, an explicit
// `_id == "drafts.X"` lookup silently returns null even when the document
// exists — 3 real, orphaned draft-only documents (drafts.page.catering,
// drafts.page.about, drafts.page.home) were invisible to this script's own
// dry-run ("no draft found" for every key) while directly, provably existing
// under `perspective: "raw"` and actively blocking Publish via
// page.ts's async pageKey-uniqueness validator. `CLEANUP_CLIENT_PERSPECTIVE`
// must stay "raw" — see the regression test in this file's `.unit.test.ts`
// sibling, which asserts this constant directly so a future edit reverting
// it back to "published" fails a test instead of silently going invisible
// again.
export const CLEANUP_CLIENT_PERSPECTIVE = "raw" as const;

export interface CleanupDoc {
  _id: string;
  _type?: string;
  pageKey?: string;
  sections?: unknown;
  seo?: unknown;
}

const CONTENT_FIELDS = ["_type", "pageKey", "sections", "seo"] as const;

function extractContent(doc: CleanupDoc): Record<string, unknown> {
  const content: Record<string, unknown> = {};
  for (const field of CONTENT_FIELDS) content[field] = doc[field as keyof CleanupDoc];
  return content;
}

export type DeletionEligibility =
  | { eligible: true; deletePublished: true; deleteDraft: boolean; reason: string }
  | { eligible: false; reason: string };

/**
 * Pure decision function — given the 3 already-fetched candidates for one
 * page key (the old dotted published doc, the new dash-id doc, and the old
 * dotted DRAFT, each possibly null), decides whether it's safe to delete.
 * Never fetches anything itself; the caller (the CLI script) is responsible
 * for using `CLEANUP_CLIENT_PERSPECTIVE` when fetching so `draftDoc` here
 * reflects reality (this is exactly the visibility bug the regression test
 * guards against — this function has no way to detect a caller silently
 * passing `null` for a draft that actually exists).
 *
 * Conservative by design: a draft is only ever eligible for deletion
 * alongside a verified-matching published old/new pair. A draft-only orphan
 * with no published old-dotted counterpart (oldDoc null, draftDoc non-null —
 * exactly the drafts.page.catering/.about/.home case this project hit live)
 * is correctly DETECTED (not silently missed) but NOT auto-deleted by this
 * function — that narrower, higher-scrutiny case is handled by the separate,
 * explicitly-authorized scripts/delete-orphaned-dotted-page-drafts.ts.
 */
export function evaluateDeletionEligibility(params: { oldDoc: CleanupDoc | null; newDoc: CleanupDoc | null; draftDoc: CleanupDoc | null }): DeletionEligibility {
  const { oldDoc, newDoc, draftDoc } = params;

  if (!oldDoc) {
    return {
      eligible: false,
      reason: draftDoc
        ? "a draft-only orphan was detected (no published old-dotted document exists to verify it against) — refusing to delete without that verification; use delete-orphaned-dotted-page-drafts.ts with explicit authorization instead"
        : "the old dotted document does not exist — nothing to delete",
    };
  }
  if (!newDoc) {
    return { eligible: false, reason: "the new dash-id document does not exist yet — refusing to delete without a confirmed replacement" };
  }
  const matches = JSON.stringify(extractContent(oldDoc)) === JSON.stringify(extractContent(newDoc));
  if (!matches) {
    return { eligible: false, reason: "the new dash-id document exists but its content does not match the old dotted document — refusing to delete without a verified match" };
  }
  return {
    eligible: true,
    deletePublished: true,
    deleteDraft: Boolean(draftDoc),
    reason: "the new dash-id document is confirmed to match the old dotted document",
  };
}
