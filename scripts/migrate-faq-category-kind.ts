/**
 * Changes every FAQ category section's `sectionKind` on page-faq (and its
 * draft, if one exists) from the generic "custom" to the new semantic
 * "faqCategory" — see sanity/schemaTypes/objects/pageSection.ts (Task 2 of
 * the FAQ Studio workflow task). A FAQ category is identified by
 * `sectionKey` starting with "group-" (the existing, already-established
 * convention this migration reuses — see the frontend's own
 * `sectionKey?.startsWith("group-")` filter, now moved into
 * lib/sanityFaq.ts's resolveCanonicalFaqGroups).
 *
 * ONLY `sectionKind` is changed — `_key`, `sectionKey`, `title`, `items`
 * (every question, in order, with its own `_key`/`itemKey`) are untouched.
 * The hero section (sectionKey "hero") is never touched: its sectionKind
 * ("hero") is correct already and is a different role entirely.
 *
 * Idempotent / safe to re-run: a section already at sectionKind
 * "faqCategory" is reported as "already correct" and left alone; re-running
 * after a live apply reports 0 pending changes.
 *
 * Usage:
 *   npm run sanity:migrate-faq-category-kind:dry-run
 *   npm run sanity:migrate-faq-category-kind
 */
import { createClient } from "@sanity/client";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

interface I18nEntry {
  language?: string;
  value?: string;
}
interface Section {
  _key: string;
  sectionKey?: string;
  sectionKind?: string;
  title?: I18nEntry[];
  items?: unknown[];
}
interface FaqDoc {
  _id: string;
  _rev: string;
  sections?: Section[];
}

const DOC_IDS = ["page-faq", "drafts.page-faq"];

function englishTitle(section: Section): string {
  return section.title?.find((e) => e.language === "en")?.value ?? "(untitled)";
}

async function migrateDoc(id: string) {
  const doc = await client.fetch<FaqDoc | null>(`*[_id == $id][0]{_id, _rev, sections}`, { id });
  if (!doc) {
    console.log(`\n${id}: document not found — skipped.`);
    return;
  }

  const categories = (doc.sections ?? []).filter((s) => s.sectionKey?.startsWith("group-"));
  console.log(`\n${id} (${categories.length} FAQ categor${categories.length === 1 ? "y" : "ies"}):`);

  const pending = categories.filter((s) => s.sectionKind !== "faqCategory");
  for (const section of categories) {
    const questionCount = section.items?.length ?? 0;
    const needsChange = section.sectionKind !== "faqCategory";
    console.log(
      `  ${section.sectionKey} — "${englishTitle(section)}" (${questionCount} question${questionCount === 1 ? "" : "s"}): ${section.sectionKind} -> ${needsChange ? "faqCategory" : "already faqCategory — left alone"}`,
    );
  }

  if (pending.length === 0) {
    console.log("  Nothing to change.");
    return;
  }

  if (DRY_RUN) {
    console.log(`  Would change ${pending.length} section(s). Dry run only.`);
    return;
  }

  const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
  if (!fresh || fresh._rev !== doc._rev) {
    console.error(`  ABORTED (${id}): changed concurrently — re-run to recompute.`);
    process.exitCode = 1;
    return;
  }

  let tx = client.transaction();
  for (const section of pending) {
    tx = tx.patch(id, (p) => p.ifRevisionId(fresh._rev).set({ [`sections[_key=="${section._key}"].sectionKind`]: "faqCategory" }));
  }
  await tx.commit();
  console.log(`  Applied ${pending.length} change(s).`);
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log("== FAQ category sectionKind migration (custom -> faqCategory) — plan ==");
  for (const id of DOC_IDS) {
    await migrateDoc(id);
  }
  console.log(DRY_RUN ? "\nDry run only — no writes performed." : "\nLive migration complete.");
}

main().catch((error) => {
  console.error("migrate-faq-category-kind failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
