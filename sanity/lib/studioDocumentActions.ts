import { SINGLETON_TYPES } from "@/sanity/schemaTypes";

// Which document *types* must never expose Studio's "Delete" / "Duplicate"
// actions: the global singletons (the frontend assumes each always exists),
// plus `page` / `legalPage` — singleton *types* with a fixed set of
// fixed-id instances (deleting one would orphan a route). EVERY OTHER type,
// `event` in particular, keeps the standard Delete action so a manager can
// remove an individual event from the Studio document pane (Phase 1).
export function isDeleteProtectedType(schemaType: string | undefined): boolean {
  return (
    (schemaType !== undefined && SINGLETON_TYPES.has(schemaType)) ||
    schemaType === "legalPage" ||
    schemaType === "page"
  );
}

const REMOVED_ACTIONS = new Set(["duplicate", "delete"]);

/**
 * The `document.actions` resolver body, extracted so it is unit-testable
 * without importing the whole `"use client"` Studio config (which calls
 * `assertConfigured()` at module load). Filters out delete/duplicate for the
 * protected types above and returns every other type's actions untouched.
 */
export function resolveDocumentActions<T extends { action?: string | null }>(
  input: T[],
  schemaType: string | undefined,
): T[] {
  if (!isDeleteProtectedType(schemaType)) return input;
  return input.filter(({ action }) => action != null && !REMOVED_ACTIONS.has(action));
}
