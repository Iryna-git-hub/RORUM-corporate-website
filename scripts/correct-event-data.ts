/**
 * One-time corrective migration for existing `event` documents, covering
 * two issues found while implementing the Event Details page corrections
 * (see MIGRATION_REPORT.md):
 *
 *   1. `address`: 29 of the 34 originally-imported events ended up with the
 *      generic placeholder "RORUM, Copenhagen" instead of the real street
 *      address — traced to an earlier (now-removed) translation-import
 *      helper that used that placeholder, well before this project's Part
 *      13/14 work. The Part 14 migration faithfully copied this
 *      pre-existing bad data into the new `address` field rather than
 *      correcting it. This script corrects it to the same real address
 *      already used by the site's `contactInfo` singleton (and already
 *      correct on the other 5-9 events).
 *   2. `shareSettings`: every event migrated in Part 14 only has the 6
 *      original actions (Copy link/WhatsApp/Email/LinkedIn/Facebook/
 *      Instagram) — "Share" (the native Web Share API action) only became
 *      a configurable `shareSettings` entry in this pass, so no existing
 *      document has it yet. Prepends a "share" entry (enabled) to any
 *      event whose `shareSettings` doesn't already include one, preserving
 *      its original always-first position.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/correct-event-data.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/correct-event-data.ts
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

const GENERIC_ADDRESS_PATTERN = /^RORUM,\s*Copenhagen$/i;

function localized(en: string, da: string, uk: string) {
  return [
    { _key: "en", _type: "internationalizedArrayStringValue", language: "en", value: en },
    { _key: "da", _type: "internationalizedArrayStringValue", language: "da", value: da },
    { _key: "uk", _type: "internationalizedArrayStringValue", language: "uk", value: uk },
  ];
}

const SHARE_ACTION_ENTRY = {
  _key: "share",
  _type: "shareAction",
  type: "share",
  enabled: true,
  label: localized("Share", "Del", "Поділитися"),
};

async function main() {
  const contactInfo = await client.fetch<{ shortAddress?: string } | null>(`*[_id == "contactInfo"][0]{shortAddress}`);
  const realAddress = contactInfo?.shortAddress;
  if (!realAddress) throw new Error("contactInfo.shortAddress is not set — cannot determine the canonical address.");
  console.log(`Canonical address (from contactInfo.shortAddress): "${realAddress}"\n`);

  const docs = await client.fetch<{ _id: string; slug?: { current?: string }; address?: string; shareSettings?: { type?: string }[] }[]>(
    `*[_type == "event"]{_id, slug, address, shareSettings}`,
  );

  console.log(`Found ${docs.length} event document(s) (${DRY_RUN ? "DRY RUN" : "LIVE RUN"})\n`);

  let patched = 0;
  for (const doc of docs) {
    const patch: Record<string, unknown> = {};

    if (doc.address && GENERIC_ADDRESS_PATTERN.test(doc.address)) {
      patch.address = realAddress;
    }

    const hasShare = doc.shareSettings?.some((a) => a.type === "share");
    if (doc.shareSettings?.length && !hasShare) {
      patch.shareSettings = [SHARE_ACTION_ENTRY, ...doc.shareSettings];
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
