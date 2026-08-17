/**
 * Backfills the (currently empty) `icon` field on Home's editorial feature
 * bullets — `editorialAttendEvents`/`editorialHostAtRorum` sections,
 * `items[itemKey^="feature"]` — with the exact Lucide icon names the
 * frontend has been hardcoding by array position (see
 * app/[locale]/(site)/page.tsx's ATTEND_FEATURE_ICONS/HOST_FEATURE_ICONS).
 * The frontend already reads `item.icon` first and falls back to that same
 * hardcoded mapping when it's empty, so running this changes nothing
 * visible — it just makes the icon a first-class, editable Sanity value
 * instead of a silent code default.
 *
 * Idempotent and non-destructive:
 *   - Only sets `icon` on an item whose current value is empty/whitespace —
 *     never overwrites an editor's own icon choice.
 *   - Touches no other field (title, text, or anything else).
 *   - Covers both the published `page-home` document and its draft
 *     (`drafts.page-home`), if one exists — raw perspective, patched
 *     independently, never published/created/deleted.
 *   - Re-running after a partial run only fills in what's still empty.
 *
 * Usage:
 *   npm run sanity:backfill-home-feature-icons:dry-run   (default-safe: prints a plan, writes nothing)
 *   npm run sanity:backfill-home-feature-icons           (requires SANITY_API_WRITE_TOKEN)
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

// Must match app/[locale]/(site)/page.tsx's ATTEND_FEATURE_ICONS / HOST_FEATURE_ICONS exactly.
const ICON_MAP: Record<string, Record<string, string>> = {
  editorialAttendEvents: {
    feature0: "MessagesSquare",
    feature1: "Users",
    feature2: "MapPin",
    feature3: "HeartHandshake",
  },
  editorialHostAtRorum: {
    feature0: "Users",
    feature1: "SlidersHorizontal",
    feature2: "MapPin",
    feature3: "HandHeart",
  },
};

interface ItemDoc {
  _key: string;
  itemKey?: string;
  icon?: string | null;
}
interface SectionDoc {
  _key: string;
  sectionKey?: string;
  items?: ItemDoc[];
}
interface PageDoc {
  _id: string;
  sections?: SectionDoc[];
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log("\n== Backfilling Home feature-bullet icons ==\n");

  const docs = await client.fetch<PageDoc[]>(
    `*[_id in ["page-home", "drafts.page-home"]]{_id, sections[sectionKey in ["editorialAttendEvents","editorialHostAtRorum"]]{_key, sectionKey, items[]{_key, itemKey, icon}}}`,
  );
  console.log(`Found ${docs.length} document(s) (published + draft, if present).\n`);

  let touchedItems = 0;
  let skippedItems = 0;

  for (const doc of docs) {
    console.log(`- ${doc._id}`);
    for (const section of doc.sections ?? []) {
      const mapping = section.sectionKey ? ICON_MAP[section.sectionKey] : undefined;
      if (!mapping) continue;

      const patch = client.patch(doc._id);
      let hasChanges = false;

      for (const item of section.items ?? []) {
        if (!item.itemKey || !(item.itemKey in mapping)) continue;
        const desiredIcon = mapping[item.itemKey]!;
        if (item.icon?.trim()) {
          skippedItems++;
          console.log(`    [${section.sectionKey}] ${item.itemKey}: already has icon "${item.icon}" — skipped`);
          continue;
        }
        touchedItems++;
        console.log(`    [${section.sectionKey}] ${item.itemKey}: would set icon = "${desiredIcon}"`);
        patch.set({ [`sections[_key=="${section._key}"].items[_key=="${item._key}"].icon`]: desiredIcon });
        hasChanges = true;
      }

      if (hasChanges && !DRY_RUN) {
        await patch.commit({ autoGenerateArrayKeys: false });
        console.log(`    committed changes for section "${section.sectionKey}".`);
      }
    }
  }

  console.log(
    `\nSummary: ${touchedItems} item(s) ${DRY_RUN ? "would be" : "were"} updated, ${skippedItems} already had an icon (skipped).`,
  );
}

main().catch((error) => {
  console.error("backfill-home-feature-icons failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
