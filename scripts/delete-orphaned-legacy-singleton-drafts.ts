/**
 * Deletes the 11 orphaned DRAFT-ONLY legacy page singletons left behind by the
 * `page` + `sections[]` migration.
 *
 * Background: scripts/delete-migrated-page-singletons.ts and
 * scripts/delete-orphaned-legacy-docs.ts removed the *published* legacy
 * singleton documents (`homePage`, `aboutPage`, …) once their content was
 * confirmed copied into the new `page-*` documents. But `client.delete(id)`
 * with a bare published id does NOT remove the `drafts.<id>` sibling, so a
 * draft copy of each was orphaned. Phase B (SANITY_MIGRATION.md §20.8) then
 * deleted the *schema types* for these documents — so the 11 drafts now sit in
 * the dataset referencing types Studio no longer knows about.
 *
 * Impact today: none for the public site — `sanity/lib/client.ts` and
 * `sanityFetch` read `perspective: "published"`, and there are 0 published
 * legacy singletons (confirmed). These drafts are pure dead weight against the
 * free-plan attribute cap and clutter in Studio's "documents with unknown
 * type" surface. This script finishes the cleanup.
 *
 * Explicitly authorized scope only: TARGET below is the complete, hardcoded,
 * exhaustive set of ids this script will ever touch. No wildcard, no loop over
 * a list that could grow. `contactPage` is deliberately absent — it has no
 * remaining draft (confirmed).
 *
 * Usage:
 *   npm run sanity:delete-orphaned-legacy-singleton-drafts:dry-run
 *   npm run sanity:delete-orphaned-legacy-singleton-drafts
 *
 * Safety: dry-run by default (and whenever SANITY_API_WRITE_TOKEN is unset).
 * Live run writes a verified JSON backup of every document to scripts/backups/
 * first, re-checks each revision immediately before deleting, and deletes in a
 * single revision-guarded atomic transaction (all-or-nothing).
 */
import { createClient } from "@sanity/client";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PAGE_DOC_ID } from "../sanity/lib/pageIds";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

// The complete, explicit set. Each obsolete legacy-singleton draft is paired
// with the current `page-*` document that replaced it — deletion is refused
// unless that replacement exists and has sections.
const TARGET: { draftId: string; legacyType: string; replacementId: string }[] = [
  { draftId: "drafts.homePage", legacyType: "homePage", replacementId: PAGE_DOC_ID.home },
  { draftId: "drafts.aboutPage", legacyType: "aboutPage", replacementId: PAGE_DOC_ID.about },
  { draftId: "drafts.eventsPage", legacyType: "eventsPage", replacementId: PAGE_DOC_ID.events },
  { draftId: "drafts.cateringPage", legacyType: "cateringPage", replacementId: PAGE_DOC_ID.catering },
  { draftId: "drafts.cateringMenuExamplesPage", legacyType: "cateringMenuExamplesPage", replacementId: PAGE_DOC_ID.cateringMenuExamples },
  { draftId: "drafts.eventDecorationPage", legacyType: "eventDecorationPage", replacementId: PAGE_DOC_ID.eventDecoration },
  { draftId: "drafts.hostAtRorumPage", legacyType: "hostAtRorumPage", replacementId: PAGE_DOC_ID.hostAtRorum },
  { draftId: "drafts.communityMembershipPage", legacyType: "communityMembershipPage", replacementId: PAGE_DOC_ID.communityMembership },
  { draftId: "drafts.volunteerPage", legacyType: "volunteerPage", replacementId: PAGE_DOC_ID.volunteer },
  { draftId: "drafts.workWithUsPage", legacyType: "workWithUsPage", replacementId: PAGE_DOC_ID.workWithUs },
  { draftId: "drafts.faqPage", legacyType: "faqPage", replacementId: PAGE_DOC_ID.faq },
];

interface Doc {
  _id: string;
  _type?: string;
  _rev?: string;
}

async function inspect(t: (typeof TARGET)[number]) {
  const publishedLegacyId = t.draftId.replace(/^drafts\./, "");
  const [draftDoc, publishedLegacyDoc, replacement] = await Promise.all([
    client.fetch<Doc | null>(`*[_id == $id][0]{_id, _type, _rev}`, { id: t.draftId }),
    client.fetch<Doc | null>(`*[_id == $id][0]{_id}`, { id: publishedLegacyId }),
    client.fetch<{ _id: string; sections?: unknown[] } | null>(
      `*[_id in [$a, $b]][0]{_id, sections}`,
      { a: t.replacementId, b: `drafts.${t.replacementId}` },
    ),
  ]);
  return { draftDoc, publishedLegacyDoc, replacement };
}

function assertEligible(t: (typeof TARGET)[number], info: Awaited<ReturnType<typeof inspect>>): Doc {
  const { draftDoc, publishedLegacyDoc, replacement } = info;
  if (!draftDoc) throw new Error(`${t.draftId} does not exist — nothing to delete.`);
  if (draftDoc._type !== t.legacyType) {
    throw new Error(`${t.draftId} has _type "${draftDoc._type}" (expected "${t.legacyType}") — refusing to delete.`);
  }
  if (publishedLegacyDoc) {
    throw new Error(`${t.legacyType} (published) still exists — ${t.draftId} is not a pure orphan. Refusing to delete.`);
  }
  if (!replacement?.sections?.length) {
    throw new Error(`Replacement ${t.replacementId} does not exist or has no sections — cannot confirm ${t.draftId} is redundant. Refusing to delete.`);
  }
  return draftDoc;
}

async function main() {
  console.log(`Delete orphaned legacy-singleton DRAFTS (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):`);
  console.log(`Explicitly authorized targets (exactly ${TARGET.length}, no wildcard):`);
  for (const t of TARGET) console.log(`  ${t.draftId}  (redundant with ${t.replacementId})`);
  console.log("");

  const eligible: { draftId: string; doc: Doc }[] = [];
  for (const t of TARGET) {
    const info = await inspect(t);
    const doc = assertEligible(t, info);
    console.log(`[OK] ${t.draftId}: draft-only ✓, _type "${doc._type}" ✓, replacement ${t.replacementId} has sections ✓, _rev=${doc._rev}`);
    eligible.push({ draftId: t.draftId, doc });
  }

  if (DRY_RUN) {
    console.log(`\nDry run complete — would delete exactly these ${eligible.length} document(s):`);
    for (const d of eligible) console.log(`  ${d.draftId} (_rev: ${d.doc._rev})`);
    console.log("\nRe-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write.");
    return;
  }

  const backupDir = path.join(process.cwd(), "scripts", "backups");
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `orphaned-legacy-singleton-drafts-${Date.now()}.json`);
  // Backup the FULL documents (not just id/rev), so a mistaken delete is recoverable.
  const fullDocs = await client.fetch<Doc[]>(`*[_id in $ids]`, { ids: eligible.map((d) => d.draftId) });
  writeFileSync(backupPath, JSON.stringify(fullDocs, null, 2), "utf-8");
  const verify = JSON.parse(readFileSync(backupPath, "utf-8")) as Doc[];
  const expectedIds = new Set(eligible.map((d) => d.draftId));
  if (verify.length !== eligible.length || verify.some((d) => !d._id || !d._rev || !expectedIds.has(d._id))) {
    throw new Error(`Backup verification failed at ${backupPath} (${verify.length}/${eligible.length}, or an _id/_rev is missing/unexpected) — refusing to delete.`);
  }
  console.log(`\nBackup written and verified at ${backupPath} (${verify.length} full document(s)).`);

  console.log("\nRe-checking revisions immediately before delete (abort on any mismatch)...");
  for (const { draftId, doc } of eligible) {
    const fresh = await client.fetch<{ _rev?: string } | null>(`*[_id == $id][0]{_rev}`, { id: draftId });
    if (!fresh || fresh._rev !== doc._rev) {
      throw new Error(`ABORTING — ${draftId} changed since pre-flight (was ${doc._rev}, now ${fresh?._rev ?? "missing"}). Nothing deleted.`);
    }
  }
  console.log("All revisions confirmed unchanged.");

  const transaction = client.transaction();
  for (const { draftId, doc } of eligible) {
    transaction.patch(draftId, (p) => p.ifRevisionId(doc._rev!).unset(["__deleteGuardNoop__"]));
    transaction.delete(draftId);
  }
  await transaction.commit();
  console.log(`\nDeleted (revision-guarded, single atomic transaction): ${eligible.map((d) => d.draftId).join(", ")}.`);

  console.log("\nVerifying deletion...");
  for (const { draftId } of eligible) {
    const gone = await client.fetch<unknown>(`*[_id == $id][0]`, { id: draftId });
    console.log(`  ${draftId}: ${gone ? "STILL EXISTS (unexpected!)" : "confirmed gone"}`);
  }
}

main().catch((error) => {
  console.error("delete-orphaned-legacy-singleton-drafts failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
