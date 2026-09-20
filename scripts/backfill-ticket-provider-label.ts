/**
 * Backfills missing EN/DA/UK translations on each event's own
 * `ticketProviderInfo.label` — the per-event override the Event Details
 * page now checks *before* the shared `eventMessages.ticketProviderRowLabel`
 * (see app/[locale]/(site)/events/[slug]/page.tsx's
 * `resolveTicketProviderLabel`). The schema's `initialValue` historically
 * only ever seeded English, so most existing events are missing DA/UK.
 *
 * Idempotent and non-destructive:
 *   - Only ADDS languages that are missing or whitespace-only on a given
 *     event — never touches a language that already has a non-empty value,
 *     custom or not (e.g. one production event's own Ukrainian translation,
 *     "Квитковий сервіс", differs from the default below and must survive
 *     unchanged).
 *   - Never touches `ticketProviderInfo.value`, `ticketUrl`, or any other
 *     field.
 *   - Skips any event that already has all three languages non-empty.
 *   - Re-running after a partial run (or after an editor has since filled
 *     in a language themselves) only adds what's still missing.
 *
 * Usage:
 *   npm run sanity:backfill-ticket-provider-label:dry-run   (default-safe: prints a plan, writes nothing)
 *   npm run sanity:backfill-ticket-provider-label           (requires SANITY_API_WRITE_TOKEN)
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

const DEFAULTS: Record<"en" | "da" | "uk", string> = {
  en: "Ticket provider",
  da: "Billetudbyder",
  uk: "Квитковий оператор",
};
const LANGUAGES = ["en", "da", "uk"] as const;

interface LabelEntry {
  _key?: string;
  language?: string;
  value?: string;
}

interface EventDoc {
  _id: string;
  title?: { language?: string; value?: string }[];
  ticketProviderInfo?: { label?: LabelEntry[] } | null;
}

function englishTitle(doc: EventDoc): string {
  return doc.title?.find((t) => t.language === "en")?.value ?? "(untitled)";
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log("\n== Backfilling event.ticketProviderInfo.label (EN/DA/UK) ==\n");

  const docs = await client.fetch<EventDoc[]>(`*[_type == "event"]{ _id, title, ticketProviderInfo }`);
  console.log(`Found ${docs.length} event document(s).\n`);

  let touchedCount = 0;
  let skippedCount = 0;

  for (const doc of docs) {
    const existing = doc.ticketProviderInfo?.label ?? [];
    const presentLanguages = new Set(
      existing.filter((e) => e.value?.trim()).map((e) => e.language).filter((l): l is string => Boolean(l)),
    );
    const missing = LANGUAGES.filter((lang) => !presentLanguages.has(lang));

    if (!missing.length) {
      skippedCount++;
      continue;
    }

    touchedCount++;
    console.log(`- ${doc._id} (${englishTitle(doc)})`);
    console.log(`    present: ${presentLanguages.size ? [...presentLanguages].join(", ") : "(none)"}`);
    console.log(`    would add: ${missing.map((lang) => `${lang}="${DEFAULTS[lang]}"`).join(", ")}`);

    if (DRY_RUN) continue;

    const newItems = missing.map((lang) => ({
      _key: lang,
      _type: "internationalizedArrayStringValue" as const,
      language: lang,
      value: DEFAULTS[lang],
    }));
    await client
      .patch(doc._id)
      .setIfMissing({ ticketProviderInfo: {} })
      .setIfMissing({ "ticketProviderInfo.label": [] })
      .append("ticketProviderInfo.label", newItems)
      .commit({ autoGenerateArrayKeys: false });
    console.log(`    ${DRY_RUN ? "would add" : "added"}.`);
  }

  console.log(`\nSummary: ${docs.length} total, ${touchedCount} ${DRY_RUN ? "would be" : "were"} updated, ${skippedCount} already complete (skipped).`);
}

main().catch((error) => {
  console.error("backfill-ticket-provider-label failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
