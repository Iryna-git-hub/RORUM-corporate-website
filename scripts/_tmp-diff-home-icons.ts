import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  useCdn: false,
  perspective: "raw",
});

function stripVolatile(doc: unknown): unknown {
  const d = JSON.parse(JSON.stringify(doc));
  delete d._rev;
  delete d._updatedAt;
  delete d._system;
  return d;
}

function deepDiff(a: unknown, b: unknown, path: string, out: string[]) {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (
    typeof a === "object" && a !== null && typeof b === "object" && b !== null &&
    !Array.isArray(a) && !Array.isArray(b)
  ) {
    const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)]);
    for (const k of keys) {
      deepDiff((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`, out);
    }
    return;
  }
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    for (let i = 0; i < a.length; i++) deepDiff(a[i], b[i], `${path}[${i}]`, out);
    return;
  }
  out.push(`${path}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
}

async function main() {
  const backup = JSON.parse(readFileSync("scripts/backups/home-page-pre-quickpath-icon-canonical-migration-1786972271259.json", "utf8"));
  const current = await client.fetch<{ _id: string }[]>(`*[_id in ["page-home","drafts.page-home"]]`);

  for (const backupDoc of backup.documents) {
    const currentDoc = current.find((d) => d._id === backupDoc._id);
    console.log(`\n=== ${backupDoc._id} ===`);
    if (!currentDoc) {
      console.log("  MISSING in current dataset!");
      continue;
    }
    const diffs: string[] = [];
    deepDiff(stripVolatile(backupDoc), stripVolatile(currentDoc), "", diffs);
    if (!diffs.length) {
      console.log("  No differences found.");
    } else {
      for (const d of diffs) console.log(" ", d);
    }
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
