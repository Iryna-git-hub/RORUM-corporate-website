/**
 * Migrates every `page` document from its old, dotted id (`page.<key>`) to
 * a new, dash-based id (`page-<key>`). The dotted ids are not publicly
 * readable — confirmed directly: an unauthenticated GROQ query for a
 * dash-based id (`legalPage-terms`) returns the document, the identical
 * kind of query for a dotted id (`page.home`) returns null, on the same
 * dataset, same auth state, differing only in id format. See
 * MIGRATION_REPORT.md for the full investigation.
 *
 * This script only ever CREATES the new documents — it never deletes or
 * modifies the old ones. Old documents are removed separately, only after
 * the new ones are verified, via scripts/delete-old-dotted-page-ids.ts
 * (not run by this script).
 *
 * Idempotent: if a destination id already exists, its content is compared
 * to the source; if it matches, the item is skipped (already migrated); if
 * it differs, the item is reported as a CONFLICT and left untouched (never
 * overwritten automatically).
 *
 * Usage:
 *   npm run sanity:migrate-page-ids:dry-run
 *   npm run sanity:migrate-page-ids
 */
import { createClient } from "@sanity/client";
import { OLD_PAGE_DOC_ID, PAGE_DOC_ID, PAGE_KEYS } from "../sanity/lib/pageIds";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "published",
});

// Fields that are copied verbatim to the new document. Everything else on a
// `page` document is a Sanity-managed system field (_id/_rev/_createdAt/
// _updatedAt/_system) that must NOT be copied — the new document gets its
// own, assigned by Sanity on create.
const CONTENT_FIELDS = ["_type", "pageKey", "sections", "seo"] as const;

interface PageDoc {
  _id: string;
  _type?: string;
  pageKey?: string;
  sections?: unknown;
  seo?: unknown;
}

function extractContent(doc: PageDoc): { _type: string } & Record<string, unknown> {
  const content: Record<string, unknown> = {};
  for (const field of CONTENT_FIELDS) content[field] = doc[field as keyof PageDoc];
  return content as { _type: string } & Record<string, unknown>;
}

async function main() {
  console.log(`Migrate page document ids (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):`);
  console.log("\nSource -> destination id mapping:");
  for (const key of PAGE_KEYS) {
    console.log(`  ${OLD_PAGE_DOC_ID[key]}  ->  ${PAGE_DOC_ID[key]}`);
  }
  console.log("");

  let created = 0;
  let skippedMatching = 0;
  let conflicts = 0;
  let missingSource = 0;

  for (const key of PAGE_KEYS) {
    const oldId = OLD_PAGE_DOC_ID[key];
    const newId = PAGE_DOC_ID[key];

    const [oldDoc, newDoc] = await Promise.all([
      client.fetch<PageDoc | null>(`*[_id == $id][0]`, { id: oldId }),
      client.fetch<PageDoc | null>(`*[_id == $id][0]`, { id: newId }),
    ]);

    if (!oldDoc) {
      console.log(`[${key}] SKIP — source ${oldId} not found.`);
      missingSource += 1;
      continue;
    }

    const sourceContent = extractContent(oldDoc);

    if (newDoc) {
      const destContent = extractContent(newDoc);
      const matches = JSON.stringify(sourceContent) === JSON.stringify(destContent);
      if (matches) {
        console.log(`[${key}] ${newId} already exists and matches the source — skipping (idempotent).`);
        skippedMatching += 1;
      } else {
        console.log(`[${key}] CONFLICT — ${newId} already exists but its content differs from ${oldId}. NOT overwriting. Review manually.`);
        conflicts += 1;
      }
      continue;
    }

    const sectionCount = Array.isArray(sourceContent.sections) ? sourceContent.sections.length : 0;
    console.log(`[${key}] would create ${newId} from ${oldId} (${sectionCount} sections, pageKey="${sourceContent.pageKey}").`);
    if (DRY_RUN) continue;

    await client.create({ _id: newId, ...sourceContent });
    console.log(`  created ${newId}.`);
    created += 1;
  }

  console.log(
    `\nSummary: ${created} created, ${skippedMatching} already migrated (skipped), ${conflicts} conflict(s), ${missingSource} source(s) missing.`,
  );
  if (conflicts > 0) {
    console.log("Conflicts were left untouched — resolve manually before re-running.");
  }
  if (DRY_RUN) {
    console.log("\nDry run complete. Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write.");
  }
}

main().catch((error) => {
  console.error("migrate-page-ids failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
