/**
 * Adds the `emptyStateMessage` reserved item (itemKey "emptyStateMessage",
 * `.text` in en/da/uk) to `page-catering-menu-examples`'s `banner` section —
 * the manager-editable message CateringMenuOverlay.tsx now shows in place
 * of the category nav/list whenever `categories` is genuinely empty. See
 * contentItem.ts's "Catering Menu Examples empty-state message" role and
 * the Catering integration report for why this exists (an intentionally
 * emptied menu must never resurrect the old hardcoded categories, and must
 * never render a blank/broken overlay either).
 *
 * Idempotent: does nothing if the item already exists.
 *
 * Usage:
 *   npm run sanity:backfill-catering-empty-state:dry-run
 *   npm run sanity:backfill-catering-empty-state
 */
import { createClient } from "@sanity/client";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;
const DOC_ID = "page-catering-menu-examples";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

const MESSAGE = {
  en: "No menu examples are available right now — please get in touch and we'll help create a menu for your event.",
  da: "Der er ingen menueksempler tilgængelige lige nu — kontakt os, så hjælper vi med at skabe en menu til dit arrangement.",
  uk: "Наразі приклади меню недоступні — зв'яжіться з нами, і ми допоможемо створити меню для вашої події.",
};

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log(`\n== Add emptyStateMessage to ${DOC_ID}'s banner section ==`);

  const doc = await client.fetch<{ _rev: string; sections?: { sectionKey?: string; items?: { itemKey?: string }[] }[] } | null>(
    `*[_id == $id][0]{_rev, sections}`,
    { id: DOC_ID },
  );
  if (!doc) {
    console.error(`ABORTED: ${DOC_ID} not found.`);
    process.exitCode = 1;
    return;
  }
  const banner = doc.sections?.find((s) => s.sectionKey === "banner");
  if (!banner) {
    console.error(`ABORTED: ${DOC_ID} has no "banner" section.`);
    process.exitCode = 1;
    return;
  }
  const alreadyExists = banner.items?.some((i) => i.itemKey === "emptyStateMessage");
  if (alreadyExists) {
    console.log("emptyStateMessage item already exists — nothing to do.");
    return;
  }

  console.log("WOULD INSERT sections[sectionKey==\"banner\"].items += emptyStateMessage (en/da/uk set).");
  if (DRY_RUN) {
    console.log("\nDry run only — no writes performed.");
    return;
  }

  const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id: DOC_ID });
  if (!fresh || fresh._rev !== doc._rev) {
    console.error("ABORTED: document changed concurrently — re-run to recompute.");
    process.exitCode = 1;
    return;
  }

  await client
    .patch(DOC_ID)
    .ifRevisionId(fresh._rev)
    .insert("after", `sections[sectionKey=="banner"].items[-1]`, [
      {
        _key: "emptyStateMessage",
        _type: "contentItem",
        itemKey: "emptyStateMessage",
        text: [
          { _key: "en", _type: "internationalizedArrayTextValue", language: "en", value: MESSAGE.en },
          { _key: "da", _type: "internationalizedArrayTextValue", language: "da", value: MESSAGE.da },
          { _key: "uk", _type: "internationalizedArrayTextValue", language: "uk", value: MESSAGE.uk },
        ],
      },
    ])
    .commit();

  console.log(`\n${DOC_ID}: emptyStateMessage item added.`);
  console.log("Live update complete.");
}

main().catch((error) => {
  console.error("backfill-catering-empty-state-message failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
