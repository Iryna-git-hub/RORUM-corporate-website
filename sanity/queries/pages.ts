// `legalPage` is the only page-family document type that still has its own
// query here — every other page moved to the shared `page` document type and
// is read via `sanity/queries/page.ts`'s `pageByKeyQuery` (see
// MIGRATION_REPORT.md Parts 16–17). The old per-page singleton queries
// (`homePageQuery`, `aboutPageQuery`, …) were removed in the R8 cleanup
// (SANITY_MIGRATION.md §20.8) once their schema types and documents were gone.
import { defineQuery } from "next-sanity";

/** `pageKey` is one of `"terms" | "privacy-policy" | "cookie-policy"` — matches `legalPage-{pageKey}` document ids (see sanity/structure.ts). */
export const legalPageQuery = defineQuery(`*[_type == "legalPage" && pageKey == $pageKey][0]`);
