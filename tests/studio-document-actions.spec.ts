import { expect, test } from "@playwright/test";
import { isDeleteProtectedType, resolveDocumentActions } from "@/sanity/lib/studioDocumentActions";
import { SINGLETON_TYPES } from "@/sanity/schemaTypes";

/**
 * Phase 1 — every normal `event` document must expose Studio's standard
 * Delete action so a manager can remove an individual event; the global
 * singletons and the fixed-id `page` / `legalPage` types must NOT.
 * Pure logic test of `sanity.config.ts`'s `document.actions` resolver
 * (extracted to studioDocumentActions.ts).
 */

const ALL_ACTIONS = [
  { action: "publish" },
  { action: "unpublish" },
  { action: "discardChanges" },
  { action: "duplicate" },
  { action: "delete" },
  { action: "restore" },
] as const;

test.describe("Studio document actions — event stays deletable, singletons/pages do not", () => {
  test("`event` keeps every action, Delete and Duplicate included", () => {
    expect(isDeleteProtectedType("event")).toBe(false);
    const resolved = resolveDocumentActions([...ALL_ACTIONS], "event").map((a) => a.action);
    expect(resolved).toContain("delete");
    expect(resolved).toContain("duplicate");
    expect(resolved).toEqual(ALL_ACTIONS.map((a) => a.action));
  });

  test("the fixed-id page types (`page`, `legalPage`) lose Delete + Duplicate, keep the rest", () => {
    for (const type of ["page", "legalPage"] as const) {
      expect(isDeleteProtectedType(type)).toBe(true);
      const resolved = resolveDocumentActions([...ALL_ACTIONS], type).map((a) => a.action);
      expect(resolved).not.toContain("delete");
      expect(resolved).not.toContain("duplicate");
      expect(resolved).toContain("publish");
      expect(resolved).toContain("unpublish");
    }
  });

  test("every global singleton type loses Delete + Duplicate", () => {
    for (const type of SINGLETON_TYPES) {
      expect(isDeleteProtectedType(type)).toBe(true);
      const resolved = resolveDocumentActions([...ALL_ACTIONS], type).map((a) => a.action);
      expect(resolved, `singleton "${type}"`).not.toContain("delete");
      expect(resolved, `singleton "${type}"`).not.toContain("duplicate");
    }
  });

  test("an unknown / undefined type is left completely untouched", () => {
    expect(resolveDocumentActions([...ALL_ACTIONS], undefined)).toHaveLength(ALL_ACTIONS.length);
    expect(resolveDocumentActions([...ALL_ACTIONS], "somethingElse")).toHaveLength(ALL_ACTIONS.length);
  });
});
