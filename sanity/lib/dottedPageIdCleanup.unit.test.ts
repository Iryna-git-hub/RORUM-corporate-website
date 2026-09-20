// Regression tests for the bug found while diagnosing a live Publish-blocking
// pageKey collision on page-catering: scripts/delete-old-dotted-page-ids.ts
// used `perspective: "published"`, under which a direct `_id ==
// "drafts.X"` lookup silently returns null even when the draft exists — 3
// real orphaned drafts (drafts.page.catering/.about/.home) were invisible to
// this cleanup script's own dry-run while actively blocking Publish. These
// tests exercise the real exported logic (not a reimplementation): the
// perspective constant directly, and the pure eligibility decision function
// with representative document combinations — including the exact
// draft-only-orphan shape that was missed.
import { describe, expect, it } from "vitest";
import { CLEANUP_CLIENT_PERSPECTIVE, evaluateDeletionEligibility, type CleanupDoc } from "./dottedPageIdCleanup";

function doc(id: string, overrides: Partial<CleanupDoc> = {}): CleanupDoc {
  return { _id: id, _type: "page", pageKey: "catering", sections: [{ _key: "hero" }], ...overrides };
}

describe("dottedPageIdCleanup.ts — CLEANUP_CLIENT_PERSPECTIVE regression", () => {
  it('is "raw", not "published" — the exact config that made drafts.page.catering/.about/.home invisible to this script', () => {
    expect(CLEANUP_CLIENT_PERSPECTIVE).toBe("raw");
    expect(CLEANUP_CLIENT_PERSPECTIVE).not.toBe("published");
  });
});

describe("evaluateDeletionEligibility — draft-only orphan (the exact real-world case that was missed)", () => {
  it("a draft with NO published old-dotted counterpart is DETECTED (not silently treated as absent) but NOT marked eligible — matches drafts.page.catering's real shape", () => {
    const draftDoc = doc("drafts.page.catering");
    const result = evaluateDeletionEligibility({ oldDoc: null, newDoc: doc("page-catering"), draftDoc });
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.reason).toMatch(/draft-only orphan/i);
      expect(result.reason).toMatch(/no published old-dotted document/i);
    }
  });

  it("truly nothing at all (no old, no new, no draft) is reported as simply absent, not an orphan", () => {
    const result = evaluateDeletionEligibility({ oldDoc: null, newDoc: null, draftDoc: null });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toMatch(/does not exist/i);
  });
});

describe("evaluateDeletionEligibility — normal migration-verified cases (unchanged behavior)", () => {
  it("old + matching new + draft: eligible, deletes both published and draft", () => {
    const oldDoc = doc("page.catering");
    const newDoc = doc("page-catering");
    const draftDoc = doc("drafts.page.catering");
    const result = evaluateDeletionEligibility({ oldDoc, newDoc, draftDoc });
    expect(result.eligible).toBe(true);
    if (result.eligible) {
      expect(result.deletePublished).toBe(true);
      expect(result.deleteDraft).toBe(true);
    }
  });

  it("old + matching new, no draft: eligible, but deleteDraft is false", () => {
    const result = evaluateDeletionEligibility({ oldDoc: doc("page.catering"), newDoc: doc("page-catering"), draftDoc: null });
    expect(result.eligible).toBe(true);
    if (result.eligible) expect(result.deleteDraft).toBe(false);
  });

  it("old exists, new does not exist yet: not eligible, refuses to delete without a confirmed replacement", () => {
    const result = evaluateDeletionEligibility({ oldDoc: doc("page.catering"), newDoc: null, draftDoc: null });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toMatch(/does not exist yet/i);
  });

  it("old and new both exist but content differs: CONFLICT, not eligible, never silently overwritten", () => {
    const oldDoc = doc("page.catering", { pageKey: "catering", sections: [{ _key: "hero" }] });
    const newDoc = doc("page-catering", { pageKey: "catering", sections: [{ _key: "hero" }, { _key: "gallery" }] });
    const result = evaluateDeletionEligibility({ oldDoc, newDoc, draftDoc: null });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toMatch(/does not match/i);
  });

  it("a conflicting new document also protects any associated draft from deletion", () => {
    const oldDoc = doc("page.catering", { pageKey: "catering" });
    const newDoc = doc("page-catering", { pageKey: "different" });
    const draftDoc = doc("drafts.page.catering");
    const result = evaluateDeletionEligibility({ oldDoc, newDoc, draftDoc });
    expect(result.eligible).toBe(false);
  });
});
