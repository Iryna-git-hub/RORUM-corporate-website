/**
 * Migrates every meaningful EN/DA/UK `event.longDescription` locale into a
 * missing `formattedDescription` locale. Dry-run is the default; pass
 * `--apply` for revision-guarded writes. Published and draft documents are
 * treated as separate raw documents and are never published by this script.
 */
import { createClient } from "@sanity/client";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  hasMeaningfulPortableText,
  mergeFormattedDescription,
  planEventMigration,
  type Locale,
  type LocaleBodyEntry,
  type LocaleTextEntry,
} from "../lib/eventFormattedDescriptionMigration";

const APPLY = process.argv.includes("--apply");
const LOCALES: readonly Locale[] = ["en", "da", "uk"];

interface EventDocument {
  _id: string;
  _rev: string;
  _type: "event";
  slug?: { current?: string };
  title?: LocaleTextEntry[];
  visibleLocales?: string[];
  longDescription?: LocaleTextEntry[];
  formattedDescription?: LocaleBodyEntry[];
  [key: string]: unknown;
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

function hasText(entries: LocaleTextEntry[] | undefined, locale: Locale): boolean {
  const value = entries?.find((entry) => entry.language === locale)?.value;
  return typeof value === "string" && value.trim().length > 0;
}

function hasBody(entries: LocaleBodyEntry[] | undefined, locale: Locale): boolean {
  return entries?.some((entry) => entry.language === locale && hasMeaningfulPortableText(entry.value)) ?? false;
}

function titleFor(doc: EventDocument): string {
  return doc.title?.find((entry) => entry.language === "en")?.value?.trim() || doc.slug?.current || "(untitled)";
}

function writeBackup(docs: EventDocument[]): string {
  const backupDir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(backupDir, { recursive: true });
  const filepath = path.join(backupDir, `event-formatted-description-pre-apply-${Date.now()}.json`);
  writeFileSync(filepath, JSON.stringify({
    createdAt: new Date().toISOString(),
    purpose: "Pre-apply backup of every raw event document before formattedDescription migration",
    documentCount: docs.length,
    documentIds: docs.map((doc) => doc._id),
    documents: docs,
  }, null, 2));
  return filepath;
}

async function fetchDocuments(): Promise<EventDocument[]> {
  return client.fetch(`*[_type == "event"] | order(_id asc)`);
}

async function main() {
  if (APPLY && !process.env.SANITY_API_WRITE_TOKEN) throw new Error("--apply requires SANITY_API_WRITE_TOKEN");

  const docs = await fetchDocuments();
  const rows = docs.map((doc) => ({ doc, plan: planEventMigration(doc.visibleLocales, doc.longDescription, doc.formattedDescription) }));
  const published = docs.filter((doc) => !doc._id.startsWith("drafts.")).length;
  const drafts = docs.length - published;
  const canonical = new Set(docs.map((doc) => doc._id.replace(/^drafts\./, ""))).size;
  const totals = {
    oldOnly: 0,
    formattedOnly: 0,
    both: 0,
    neither: 0,
    migrated: Object.fromEntries(LOCALES.map((locale) => [locale, 0])) as Record<Locale, number>,
    skippedFormatted: Object.fromEntries(LOCALES.map((locale) => [locale, 0])) as Record<Locale, number>,
    noSource: Object.fromEntries(LOCALES.map((locale) => [locale, 0])) as Record<Locale, number>,
    hiddenOld: [] as string[],
    visibleNeither: [] as string[],
  };

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN (read only)"}`);
  console.log(`Dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET ?? "(unset)"}`);
  console.log(`Documents: ${docs.length} (${published} published, ${drafts} drafts, ${canonical} canonical identities)`);

  for (const { doc, plan } of rows) {
    const oldAny = LOCALES.some((locale) => hasText(doc.longDescription, locale));
    const formattedAny = LOCALES.some((locale) => hasBody(doc.formattedDescription, locale));
    totals[oldAny ? (formattedAny ? "both" : "oldOnly") : (formattedAny ? "formattedOnly" : "neither")]++;

    for (const locale of plan.needsMigration.map((entry) => entry.locale)) totals.migrated[locale]++;
    for (const locale of plan.alreadyHasFormatted) totals.skippedFormatted[locale]++;
    for (const locale of plan.noSourceContent) totals.noSource[locale]++;
    for (const locale of LOCALES) {
      const visible = doc.visibleLocales?.includes(locale) ?? false;
      if (hasText(doc.longDescription, locale) && !visible) totals.hiddenOld.push(`${doc._id}:${locale}`);
      if (visible && !hasText(doc.longDescription, locale) && !hasBody(doc.formattedDescription, locale)) {
        totals.visibleNeither.push(`${doc._id}:${locale}`);
      }
    }

    console.log(`\n${doc._id} | ${titleFor(doc)} | visible=${JSON.stringify(doc.visibleLocales ?? [])}`);
    for (const locale of LOCALES) {
      const decision = plan.needsMigration.find((entry) => entry.locale === locale)
        ? "MIGRATE"
        : plan.alreadyHasFormatted.includes(locale)
          ? "SKIP_FORMATTED"
          : "NO_SOURCE";
      const hidden = hasText(doc.longDescription, locale) && !(doc.visibleLocales?.includes(locale) ?? false) ? " HIDDEN_SOURCE" : "";
      console.log(`  ${locale}: ${decision}${hidden}`);
    }
  }

  console.log("\nSummary:");
  console.log(JSON.stringify(totals, null, 2));

  const pending = rows.filter(({ plan }) => plan.needsMigration.length > 0);
  if (!APPLY) {
    console.log(`\nDry run complete: ${pending.length} document(s), ${Object.values(totals.migrated).reduce((a, b) => a + b, 0)} locale(s) pending; no writes.`);
    return;
  }
  if (pending.length === 0) {
    console.log("\nNothing to migrate; no backup or writes needed.");
    return;
  }

  const backupPath = writeBackup(docs);
  console.log(`\nBackup: ${backupPath} (${docs.length} event documents)`);

  for (const { doc } of pending) {
    const fresh = (await client.fetch(`*[_id == $id][0]`, { id: doc._id })) as EventDocument | null;
    if (!fresh) throw new Error(`${doc._id} disappeared before apply`);
    if (fresh._rev !== doc._rev) throw new Error(`${doc._id} changed after backup; refusing to patch a revision not in the backup`);
    const freshPlan = planEventMigration(fresh.visibleLocales, fresh.longDescription, fresh.formattedDescription);
    if (freshPlan.needsMigration.length === 0) {
      console.log(`${doc._id}: concurrent migration already completed; skipped.`);
      continue;
    }
    const value = mergeFormattedDescription(fresh.formattedDescription, freshPlan.needsMigration);
    await client.patch(fresh._id).ifRevisionId(fresh._rev).set({ formattedDescription: value }).commit();
    const readBack = (await client.fetch(`*[_id == $id][0]{_id, formattedDescription}`, { id: fresh._id })) as Pick<EventDocument, "_id" | "formattedDescription"> | null;
    if (!readBack || !isDeepStrictEqual(readBack.formattedDescription ?? [], value)) {
      throw new Error(`${doc._id} read-back mismatch after commit`);
    }
    console.log(`${doc._id}: migrated ${freshPlan.needsMigration.map((entry) => entry.locale).join(", ")} and verified exact read-back.`);
  }

  console.log("\nApply complete. Run this script again without --apply to verify zero pending migrations.");
}

main().catch((error) => {
  console.error("migrate-event-formatted-description failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
