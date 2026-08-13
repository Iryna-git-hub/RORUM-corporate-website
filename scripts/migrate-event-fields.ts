/**
 * One-time migration for existing `event` documents onto the new schema
 * shape introduced alongside this script (see MIGRATION_REPORT.md):
 *
 *   - `whatToExpect`: array-of-bulletText → one multiline
 *     internationalizedArrayText value per language (joins each language's
 *     bullets with "\n", preserving the real per-event translations that
 *     already existed — NOT regenerating them).
 *   - `practicalDetails` (generic label/value array) → dedicated `address`,
 *     `duration` ({value,unit}), `arrival` fields. Duration is derived from
 *     the legacy "Duration" text if it parses as a real duration, otherwise
 *     computed from the event's actual time range (some pre-existing
 *     templated events had "Duration" mistakenly set to their time range
 *     string — this recovers the correct value rather than copying the bug
 *     forward).
 *   - plain `ticketProvider` string → `ticketProviderInfo.value`, with
 *     `ticketProviderInfo.label` set to the same "Ticket provider" default
 *     new events get.
 *   - `shareSettings`: backfilled with the same 6 actions (all enabled, in
 *     the same order) new events get automatically via the schema's
 *     `initialValue` — existing events never got that `initialValue` (it
 *     only applies to documents created after the field existed), so
 *     without this they'd show no "Share with Friends" actions at all,
 *     silently regressing behavior that was previously unconditional.
 *
 * Old fields (`shortDescription`, `practicalDetails`, `ticketProvider`) are
 * left untouched — they're still declared in the schema (hidden from
 * Studio) as a safety net, not deleted.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/migrate-event-fields.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/migrate-event-fields.ts
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
  _key: string;
  language?: string;
  value?: string;
}

interface LegacyEventDoc {
  _id: string;
  slug?: { current?: string };
  time?: string;
  address?: string;
  duration?: { value?: number; unit?: string };
  arrival?: I18nEntry[];
  ticketProviderInfo?: { label?: I18nEntry[]; value?: I18nEntry[] };
  shareSettings?: unknown[];
  shortDescription?: I18nEntry[];
  whatToExpect?: { _key: string; text?: I18nEntry[] }[] | I18nEntry[];
  practicalDetails?: { _key: string; label?: I18nEntry[]; value?: I18nEntry[] }[];
  ticketProvider?: string;
}

function localized(en: string, da?: string, uk?: string): I18nEntry[] {
  const entries: I18nEntry[] = [{ _key: "en", language: "en", value: en }];
  if (da) entries.push({ _key: "da", language: "da", value: da });
  if (uk) entries.push({ _key: "uk", language: "uk", value: uk });
  return entries;
}

function pick(entries: I18nEntry[] | undefined, language: string): string | undefined {
  return entries?.find((e) => e.language === language)?.value;
}

function getLegacyDetail(doc: LegacyEventDoc, label: string): string | undefined {
  const entry = doc.practicalDetails?.find((d) => pick(d.label, "en") === label);
  return entry ? pick(entry.value, "en") : undefined;
}

function parseDurationText(text: string | undefined): { value: number; unit: "hours" | "minutes" } | undefined {
  const match = text?.trim().match(/^(\d+(?:\.\d+)?)\s*(hour|minute)/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return { value, unit: (match[2] ?? "hour").toLowerCase().startsWith("hour") ? "hours" : "minutes" };
}

function parseTimeToMinutes(timeValue: string | undefined): number | null {
  const match = timeValue?.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function computeDurationFromTimeRange(timeRange: string | undefined): { value: number; unit: "hours" | "minutes" } | undefined {
  const [startTime, endTime] = timeRange?.split(/\s*[-–]\s*/) ?? [];
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null || end <= start) return undefined;
  const totalMinutes = end - start;
  if (totalMinutes % 30 === 0) return { value: totalMinutes / 60, unit: "hours" };
  return { value: totalMinutes, unit: "minutes" };
}

// Already-approved translations reused verbatim from
// scripts/import-translations.ts's `T.arrivalNote` (same source used for
// the schema's `arrival` field `initialValue`) — not re-derived here.
const ARRIVAL_NOTE_DA = "Ankom venligst 5-10 minutter, før arrangementet begynder.";
const ARRIVAL_NOTE_UK = "Будь ласка, прийдіть за 5-10 хвилин до початку події.";

const DEFAULT_SHARE_SETTINGS = [
  { _key: "copyLink", _type: "shareAction", type: "copyLink", enabled: true, label: localized("Copy link", "Kopiér link", "Копіювати посилання") },
  { _key: "whatsapp", _type: "shareAction", type: "whatsapp", enabled: true, label: localized("WhatsApp", "WhatsApp", "WhatsApp") },
  { _key: "email", _type: "shareAction", type: "email", enabled: true, label: localized("Email", "E-mail", "Електронна пошта") },
  { _key: "linkedin", _type: "shareAction", type: "linkedin", enabled: true, label: localized("LinkedIn", "LinkedIn", "LinkedIn") },
  { _key: "facebook", _type: "shareAction", type: "facebook", enabled: true, label: localized("Facebook", "Facebook", "Facebook") },
  { _key: "instagram", _type: "shareAction", type: "instagram", enabled: true, label: localized("Instagram", "Instagram", "Instagram") },
];

function buildWhatToExpectPatch(doc: LegacyEventDoc): I18nEntry[] | undefined {
  const items = doc.whatToExpect;
  if (!items?.length) return undefined;
  // Already-new-shape (a plain internationalizedArrayText value: entries
  // with `language`/`value` directly, no per-item `text`) — nothing to do.
  if (!("text" in (items[0] as object))) return undefined;

  const bulletItems = items as { _key: string; text?: I18nEntry[] }[];
  const join = (language: string) =>
    bulletItems
      .map((b) => pick(b.text, language))
      .filter((v): v is string => !!v)
      .join("\n");

  const en = join("en");
  const da = join("da");
  const uk = join("uk");
  if (!en) return undefined;
  return localized(en, da || undefined, uk || undefined);
}

async function main() {
  const docs = await client.fetch<LegacyEventDoc[]>(`*[_type == "event"]{
    _id, "slug": slug, time, address, duration, arrival, ticketProviderInfo, shareSettings,
    shortDescription, whatToExpect, practicalDetails, ticketProvider
  }`);

  console.log(`Found ${docs.length} event document(s) (${DRY_RUN ? "DRY RUN" : "LIVE RUN"})\n`);

  let patched = 0;
  for (const doc of docs) {
    const patch: Record<string, unknown> = {};

    if (!doc.address) {
      const legacyAddress = getLegacyDetail(doc, "Address");
      if (legacyAddress) patch.address = legacyAddress;
    }

    if (!doc.duration?.value) {
      const legacyDurationText = getLegacyDetail(doc, "Duration");
      const duration = parseDurationText(legacyDurationText) ?? computeDurationFromTimeRange(doc.time);
      if (duration) patch.duration = duration;
    }

    if (!doc.arrival?.length) {
      const legacyArrival = getLegacyDetail(doc, "Arrival");
      if (legacyArrival) {
        // Reuse the already-approved da/uk translation only when the
        // legacy English text matches what that translation is *for* —
        // avoids mis-attributing a translation to a differently-worded
        // legacy value on some future/unexpected document.
        const isStandardArrivalText = /arrive.*5-10 minutes/i.test(legacyArrival);
        patch.arrival = isStandardArrivalText
          ? localized(legacyArrival, ARRIVAL_NOTE_DA, ARRIVAL_NOTE_UK)
          : localized(legacyArrival);
      }
    }

    if (!doc.ticketProviderInfo?.value?.length && doc.ticketProvider) {
      patch.ticketProviderInfo = {
        label: localized("Ticket provider"),
        value: localized(doc.ticketProvider, doc.ticketProvider, doc.ticketProvider),
      };
    }

    const whatToExpectPatch = buildWhatToExpectPatch(doc);
    if (whatToExpectPatch) patch.whatToExpect = whatToExpectPatch;

    if (!doc.shareSettings?.length) {
      patch.shareSettings = DEFAULT_SHARE_SETTINGS;
    }

    if (Object.keys(patch).length === 0) continue;

    patched += 1;
    console.log(`${doc._id} (${doc.slug?.current ?? "no slug"}):`, JSON.stringify(Object.keys(patch)));
    if (!DRY_RUN) {
      await client.patch(doc._id).set(patch).commit({ autoGenerateArrayKeys: false });
    }
  }

  console.log(`\n${DRY_RUN ? "[dry run] would patch" : "Patched"} ${patched} of ${docs.length} document(s).`);
  if (DRY_RUN) console.log("Re-run without --dry-run to apply.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
