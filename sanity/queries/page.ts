import { defineQuery } from "next-sanity";

// The new compact `page` document type (see sanity/schemaTypes/documents/page.ts) —
// one query, reused by every page instead of one query per page singleton.
export const pageByKeyQuery = defineQuery(`*[_type == "page" && pageKey == $pageKey][0]`);
