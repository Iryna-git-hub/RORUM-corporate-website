/**
 * Removes the migrated `longDescription` field from raw Event documents.
 * Dry-run is the default. A document is removed only when every source locale
 * has equivalent readable text in `formattedDescription`; conflicting docs
 * are preserved and reported. All targets are backed up and each
 * revision-guarded unset is read back immediately.
 */
import { createClient } from "@sanity/client";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { portableTextToPlainText, splitPlainTextParagraphs } from "../lib/portableText";
import type { LocaleBodyEntry, LocaleTextEntry } from "../lib/eventFormattedDescriptionMigration";

const APPLY = process.argv.includes("--apply");
const LOCALES = ["en", "da", "uk"] as const;

interface EventDocument {
  _id: string;
  _rev: string;
  _type: "event";
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

function normalizedSource(doc: EventDocument, locale: string): string {
  const source = doc.longDescription?.find((entry) => entry.language === locale)?.value ?? "";
  return splitPlainTextParagraphs(source).join("\n\n");
}

function normalizedFormatted(doc: EventDocument, locale: string): string {
  const body = doc.formattedDescription?.find((entry) => entry.language === locale)?.value;
  return portableTextToPlainText(body);
}

function backup(docs: EventDocument[]): string {
  const dir = path.join(process.cwd(), "scripts", "backups");
  mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, `event-long-description-pre-removal-${Date.now()}.json`);
  writeFileSync(filepath, JSON.stringify({
    createdAt: new Date().toISOString(),
    purpose: "Pre-removal backup of Event documents containing migrated longDescription",
    documentCount: docs.length,
    documentIds: docs.map((doc) => doc._id),
    documents: docs,
  }, null, 2));
  return filepath;
}

async function main() {
  if (APPLY && !process.env.SANITY_API_WRITE_TOKEN) throw new Error("--apply requires SANITY_API_WRITE_TOKEN");
  const docs = await client.fetch<EventDocument[]>(`*[_type == "event" && defined(longDescription)] | order(_id asc)`);
  const mismatches: string[] = [];
  const blockedIds = new Set<string>();

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN (read only)"}`);
  console.log(`${docs.length} Event document(s) still contain longDescription.`);
  for (const doc of docs) {
    const compared: string[] = [];
    for (const locale of LOCALES) {
      const source = normalizedSource(doc, locale);
      if (!source) continue;
      compared.push(locale);
      if (normalizedFormatted(doc, locale) !== source) {
        mismatches.push(`${doc._id}:${locale}`);
        blockedIds.add(doc._id);
      }
    }
    console.log(`  ${doc._id}: ${compared.join(", ") || "no meaningful source"}`);
  }

  const removable = docs.filter((doc) => !blockedIds.has(doc._id));
  if (mismatches.length) {
    console.warn(`Preserving ${blockedIds.size} document(s) with ${mismatches.length} source/formatted mismatch(es): ${mismatches.join(", ")}`);
  }
  console.log(`${removable.length} document(s) are safe to remove: every meaningful source locale has exact readable paragraph text in formattedDescription.`);

  if (!APPLY) {
    console.log("Dry run complete; no writes.");
    return;
  }
  if (!removable.length) {
    console.log("Nothing to remove.");
    return;
  }

  console.log(`Backup: ${backup(removable)}`);
  for (const doc of removable) {
    const fresh = await client.fetch<EventDocument | null>(`*[_id == $id][0]`, { id: doc._id });
    if (!fresh || fresh._rev !== doc._rev) throw new Error(`${doc._id} changed after backup; aborting`);
    await client.patch(doc._id).ifRevisionId(doc._rev).unset(["longDescription"]).commit();
    const readBack = await client.fetch<(EventDocument & { hasLongDescription: boolean }) | null>(
      `*[_id == $id][0]{_id, _rev, _type, formattedDescription, "hasLongDescription": defined(longDescription)}`,
      { id: doc._id },
    );
    if (!readBack) throw new Error(`${doc._id} disappeared after unset`);
    if (readBack.hasLongDescription) throw new Error(`${doc._id} still has longDescription after unset`);
    for (const locale of LOCALES) {
      const source = normalizedSource(doc, locale);
      if (source && normalizedFormatted(readBack, locale) !== source) {
        throw new Error(`${doc._id}:${locale} formattedDescription changed during removal`);
      }
    }
    console.log(`${doc._id}: removed and verified.`);
  }
}

main().catch((error) => {
  console.error("remove-event-long-description failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
