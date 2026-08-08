// Central environment configuration for Sanity. Two tiers on purpose:
//
// - `projectId`/`dataset` are read WITHOUT throwing, and `isSanityConfigured`
//   lets frontend page code check availability and fail safely (render the
//   existing hardcoded content, or a documented empty state) instead of
//   crashing when Sanity hasn't been provisioned yet in an environment.
// - `assertConfigured()` throws a clear, specific error and is called only
//   from code that truly cannot function without real config: the Studio
//   itself (`sanity.config.ts`), the write-capable import script, and the
//   Sanity client factory when something actually tries to fetch.
//
// This split exists because this repository, as of this task, has no live
// Sanity project provisioned (no credentials were supplied or invented) —
// see MIGRATION_REPORT.md's Sanity section for the exact blocker.

export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

/** True once the minimum public config needed to read published content exists. */
export const isSanityConfigured = Boolean(projectId && dataset);

export function assertConfigured(): { projectId: string; dataset: string } {
  if (!projectId) {
    throw new Error(
      "Missing NEXT_PUBLIC_SANITY_PROJECT_ID. Copy `.env.example` to `.env.local` " +
        "and fill in your Sanity project's values (see MIGRATION_REPORT.md's Sanity " +
        "section for where to find them).",
    );
  }
  if (!dataset) {
    throw new Error(
      "Missing NEXT_PUBLIC_SANITY_DATASET. Copy `.env.example` to `.env.local` " +
        "and fill in your Sanity project's values.",
    );
  }
  return { projectId, dataset };
}
