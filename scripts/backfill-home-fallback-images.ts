/**
 * Populates the (currently empty) `media` array on 3 Home sections whose
 * visible image is presently a hardcoded code fallback:
 *   - editorialAttendEvents  <- /images/events/host-event-workshop-quickpath.png (meaningful — gets alt text)
 *   - editorialHostAtRorum   <- /images/events/private-meetings.png (meaningful — gets alt text)
 *   - communityTeaser        <- /images/catering/community-catering-bg.png (decorative — no alt text)
 * (see the `fallback.attendFeature.image` / `fallback.hostFeature.image` /
 * DEFAULT_COMMUNITY_IMAGE constants in app/[locale]/(site)/page.tsx and
 * components/HomeEditorialSections.tsx). Uploading these as real Sanity
 * assets means the exact same photo an editor currently sees keeps
 * rendering (unchanged appearance) but becomes something they can actually
 * replace in Studio, instead of a value baked into the code.
 *
 * The community-teaser background is a plain CSS background-image with no
 * role="img"/aria-label anywhere in CommunityTeaserSection (same decorative
 * pattern as the Home hero) — its media item is added with NO `alt` field,
 * matching sanity/schemaTypes/objects/mediaItem.ts's
 * `isHomeDecorativeBackgroundMedia`, which hides that field in Studio and
 * skips its required-language validation for exactly this section. Inventing
 * descriptive alt text for a decorative image would be wrong, not merely
 * unpolished.
 *
 * Idempotent and non-destructive:
 *   - Skips a section entirely if its `media` array already has at least
 *     one item (never overwrites an editor-provided image).
 *   - Reuses an existing Sanity asset with a matching `originalFilename`
 *     instead of re-uploading, if one is already in the asset library
 *     (checked before every upload) — never creates a duplicate asset on
 *     repeated runs.
 *   - Covers both the published `page-home` document and its draft
 *     (`drafts.page-home`), if one exists — patched independently, never
 *     published/created/deleted.
 *
 * Usage:
 *   npm run sanity:backfill-home-images:dry-run   (default-safe: prints a plan, uploads/writes nothing)
 *   npm run sanity:backfill-home-images           (requires SANITY_API_WRITE_TOKEN)
 */
import { createClient } from "@sanity/client";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

interface Target {
  sectionKey: string;
  localPath: string;
  /** Omitted for decorative images (communityTeaser) — no alt text is written for those. */
  alt?: { en: string; da: string; uk: string };
}

const TARGETS: Target[] = [
  {
    sectionKey: "editorialAttendEvents",
    localPath: "/images/events/host-event-workshop-quickpath.png",
    alt: {
      en: "Workshop participants gathered around a table at RORUM",
      da: "Workshopdeltagere samlet omkring et bord hos RORUM",
      uk: "Учасники воркшопу зібралися за столом у RORUM",
    },
  },
  {
    sectionKey: "editorialHostAtRorum",
    localPath: "/images/events/private-meetings.png",
    alt: {
      en: "A small meeting in a room at RORUM",
      da: "Et mindre møde i et lokale hos RORUM",
      uk: "Невелика зустріч у залі RORUM",
    },
  },
  {
    sectionKey: "communityTeaser",
    localPath: "/images/catering/community-catering-bg.png",
    // Decorative — no alt field written. See the file-level comment above.
  },
];

function resolveLocalPath(publicRelativePath: string): string {
  return path.join(process.cwd(), "public", publicRelativePath);
}

function altField(alt: NonNullable<Target["alt"]>) {
  return (["en", "da", "uk"] as const).map((language) => ({
    _key: language,
    _type: "internationalizedArrayStringValue" as const,
    language,
    value: alt[language],
  }));
}

interface SectionDoc {
  _key: string;
  sectionKey?: string;
  mediaCount?: number;
}
interface PageDoc {
  _id: string;
  sections?: SectionDoc[];
}

async function findExistingAssetId(filename: string): Promise<string | undefined> {
  return client.fetch<string | undefined>(
    `*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`,
    { filename },
  );
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no uploads/writes)" : "LIVE"}`);
  console.log("\n== Backfilling Home fallback images ==\n");

  let plannedUpdates = 0;

  for (const target of TARGETS) {
    const localPath = resolveLocalPath(target.localPath);
    const filename = path.basename(target.localPath);
    if (!existsSync(localPath)) {
      console.log(`- ${target.sectionKey}: SKIP — local file not found at ${localPath}`);
      continue;
    }

    const existingAssetId = await findExistingAssetId(filename);
    console.log(`- ${target.sectionKey}`);
    console.log(`    source file: ${target.localPath}`);
    console.log(
      existingAssetId
        ? `    asset: reusing existing "${filename}" -> ${existingAssetId}`
        : `    asset: would upload "${filename}" (no existing asset with this filename found)`,
    );
    if (target.alt) {
      console.log(`    alt (en): ${target.alt.en}`);
      console.log(`    alt (da): ${target.alt.da}`);
      console.log(`    alt (uk): ${target.alt.uk}`);
    } else {
      console.log(`    alt: (none — decorative image, no accessible name)`);
    }

    const docs = await client.fetch<PageDoc[]>(
      `*[_id in ["page-home", "drafts.page-home"]]{_id, sections[sectionKey == $sectionKey]{_key, sectionKey, "mediaCount": count(media)}}`,
      { sectionKey: target.sectionKey },
    );

    for (const doc of docs) {
      const section = doc.sections?.[0];
      if (!section) {
        console.log(`    ${doc._id}: SKIP — section not found`);
        continue;
      }
      if (section.mediaCount && section.mediaCount > 0) {
        console.log(`    ${doc._id}: SKIP — section already has ${section.mediaCount} media item(s)`);
        continue;
      }
      console.log(`    ${doc._id}: ${DRY_RUN ? "would add" : "adding"} 1 media item to section "${target.sectionKey}"`);
      plannedUpdates++;

      if (DRY_RUN) continue;

      const assetId = existingAssetId ?? (await client.assets.upload("image", readFileSync(localPath), { filename }))._id;
      const mediaItem: Record<string, unknown> = {
        _type: "mediaItem",
        kind: "image",
        image: { _type: "image", asset: { _type: "reference", _ref: assetId } },
      };
      if (target.alt) mediaItem.alt = altField(target.alt);
      await client
        .patch(doc._id)
        .setIfMissing({ [`sections[_key=="${section._key}"].media`]: [] })
        .append(`sections[_key=="${section._key}"].media`, [mediaItem])
        .commit({ autoGenerateArrayKeys: true });
      console.log(`    ${doc._id}: added.`);
    }
    console.log("");
  }

  console.log(`Summary: ${plannedUpdates} document-field update(s) ${DRY_RUN ? "would be made" : "made"} (up to 3 sections × 2 documents = 6 max).`);
}

main().catch((error) => {
  console.error("backfill-home-fallback-images failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
