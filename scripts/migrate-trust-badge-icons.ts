/**
 * Populates the `icon` field on Home's 4 hero trust-badge items
 * (Home's `page` document, hero section, itemKey trust0-trust3) with the exact icon
 * names currently hardcoded in `components/ui.tsx`'s `TRUST_ICONS` array —
 * so Sanity Studio shows the icon that's actually live on the site instead
 * of "No icon selected", and so the frontend can be switched to read the
 * icon from Sanity instead of picking it by array position.
 *
 * Idempotent: skips any item that already has an icon set (never
 * overwrites an editor's existing choice). Never touches title/text or any
 * other field, and never touches any item other than these 4.
 *
 * Usage:
 *   npm run sanity:migrate-trust-icons:dry-run
 *   npm run sanity:migrate-trust-icons
 */
import { createClient } from "@sanity/client";
import { PAGE_DOC_ID } from "../sanity/lib/pageIds";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;
const HOME_DOC_ID = PAGE_DOC_ID.home;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

// Matches components/ui.tsx's `TRUST_ICONS = [Users, MapPin, Smile, Wine]`
// (position 0-3), which this migration + the accompanying frontend change
// replaces with a per-item Sanity-driven icon.
const TRUST_BADGE_ICONS: Record<string, string> = {
  trust0: "Users",
  trust1: "MapPin",
  trust2: "Smile",
  trust3: "Wine",
};

interface HomeDoc {
  _id: string;
  sections?: {
    sectionKey?: string;
    items?: { itemKey?: string; icon?: string | null }[];
  }[];
}

async function main() {
  console.log(`Migrate trust-badge icons (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):`);

  const doc = await client.fetch<HomeDoc | null>(`*[_id == $id][0]{_id, sections}`, { id: HOME_DOC_ID });
  if (!doc) {
    console.log(`  ${HOME_DOC_ID} not found — nothing to migrate.`);
    return;
  }

  const heroSection = doc.sections?.find((s) => s.sectionKey === "hero");
  if (!heroSection) {
    console.log(`  hero section not found on ${HOME_DOC_ID} — nothing to migrate.`);
    return;
  }

  const patch: Record<string, unknown> = {};
  for (const [itemKey, iconName] of Object.entries(TRUST_BADGE_ICONS)) {
    const item = heroSection.items?.find((i) => i.itemKey === itemKey);
    if (!item) {
      console.log(`  ${itemKey}: not found in hero.items — skipping.`);
      continue;
    }
    if (item.icon) {
      console.log(`  ${itemKey}: already has icon "${item.icon}" — skipping (not overwriting an existing choice).`);
      continue;
    }
    console.log(`  ${itemKey}: would set icon to "${iconName}".`);
    patch[`sections[_key=="hero"].items[_key=="${itemKey}"].icon`] = iconName;
  }

  if (Object.keys(patch).length === 0) {
    console.log("\nNothing to do — all 4 trust badges already have an icon set.");
    return;
  }

  if (DRY_RUN) {
    console.log(`\nDry run complete — would set ${Object.keys(patch).length} icon(s).`);
    console.log("Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write.");
    return;
  }

  await client.patch(HOME_DOC_ID).set(patch).commit();
  console.log(`\nLive run complete — set ${Object.keys(patch).length} icon(s). No titles or other fields were touched.`);
}

main().catch((error) => {
  console.error("migrate-trust-badge-icons failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
