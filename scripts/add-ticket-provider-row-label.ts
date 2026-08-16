/**
 * Adds the `ticketProviderRowLabel` row to the `eventMessages` singleton's
 * shared `labels` (keyedString[]) collection, so the event detail page's
 * "Ticket provider" row label — previously read from each event's own
 * `ticketProviderInfo.label` field, whose Sanity `initialValue` only ever
 * seeded an English string — is properly trilingual like every sibling row
 * (`dateLabel`, `timeLabel`, `arrivalRowLabel`, etc.), all of which already
 * live in this same array. See app/[locale]/(site)/events/[slug]/page.tsx.
 *
 * Deliberately NOT a new named schema field: `eventMessages.labels` is one
 * generic {key, value} array precisely so new shared strings don't each cost
 * a distinct Content Lake attribute path (see
 * sanity/schemaTypes/objects/keyedString.ts) — this project is close to the
 * free-plan cap (see `npm run sanity:stats`). Adding this row costs zero new
 * attribute paths.
 *
 * Idempotent: only appends the row if a `ticketProviderRowLabel` key isn't
 * already present; re-running after a partial run, or after an editor has
 * since edited the value in Studio, never overwrites it.
 *
 * Usage:
 *   npm run sanity:add-ticket-provider-label:dry-run   (default-safe: prints a plan, writes nothing)
 *   npm run sanity:add-ticket-provider-label           (requires SANITY_API_WRITE_TOKEN)
 */
import { createClient } from "@sanity/client";
import { tri } from "./lib/sanityImportUtils";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

const NEW_LABEL = {
  key: "ticketProviderRowLabel",
  en: "Ticket provider",
  da: "Billetudbyder",
  uk: "Квитковий оператор",
};

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log("\n== Shared event labels (eventMessages) ==");

  const doc = await client.fetch<{ labels: { key?: string | null }[] | null } | null>(
    `*[_id == "eventMessages"][0]{labels[]{key}}`,
  );

  if (!doc) {
    console.warn("  eventMessages document not found — nothing to patch. (Run migrate-phase3a first to create it.)");
    return;
  }

  const existingKeys = new Set((doc.labels ?? []).map((l) => l.key).filter((k): k is string => Boolean(k)));
  if (existingKeys.has(NEW_LABEL.key)) {
    console.log(`  ${NEW_LABEL.key}: already set — skipping.`);
    return;
  }

  console.log(`  ${NEW_LABEL.key}: would add — en="${NEW_LABEL.en}", da="${NEW_LABEL.da}", uk="${NEW_LABEL.uk}".`);
  if (DRY_RUN) return;

  const newItem = {
    _key: NEW_LABEL.key,
    _type: "keyedString",
    key: NEW_LABEL.key,
    value: tri(NEW_LABEL.en, NEW_LABEL.da, NEW_LABEL.uk),
  };
  await client
    .patch("eventMessages")
    .setIfMissing({ labels: [] })
    .append("labels", [newItem])
    .commit({ autoGenerateArrayKeys: false });
  console.log(`  ${NEW_LABEL.key}: added.`);
}

main().catch((error) => {
  console.error("add-ticket-provider-row-label failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
