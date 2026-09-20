/**
 * One-time seed for the 3 `galleryCollection` documents that back
 * `HorizontalGallery` on catering / event-decoration / host-at-rorum
 * (`lib/galleryImages.ts`'s static arrays — the same fallback data the
 * frontend uses when Sanity has no matching gallery). Uploads each local
 * `/public` image as a Sanity asset and creates the document with real
 * English alt text already attached.
 *
 * Usage:
 *   npm run sanity:import-gallery-images:dry-run
 *   npm run sanity:import-gallery-images
 *
 * Idempotency — deliberately different from import-images.ts: once a
 * gallery document exists, this script never touches it again, even to add
 * a missing image. The whole point of wiring these into Sanity is so an
 * editor can add/remove/reorder images from Studio afterward — a script
 * that kept "correcting" the array back to this file's contents would fight
 * every edit made there. Re-running after the first live run is a safe
 * no-op that only reports "already exists, skipped".
 */
import { createClient } from "@sanity/client";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  cateringGalleryImages,
  eventDecorationGalleryImages,
  hostAtRorumGalleryImages,
  type GalleryImage,
} from "../lib/galleryImages";
import { deterministicId, en } from "./lib/sanityImportUtils";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

const galleries: { key: string; title: string; images: GalleryImage[] }[] = [
  { key: "catering", title: "Catering gallery", images: cateringGalleryImages },
  { key: "event-decoration", title: "Event decoration gallery", images: eventDecorationGalleryImages },
  { key: "host-at-rorum", title: "Host at RORUM gallery", images: hostAtRorumGalleryImages },
];

function resolveLocalPath(publicRelativePath: string): string {
  return path.join(process.cwd(), "public", publicRelativePath);
}

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_WRITE_TOKEN;

  if (DRY_RUN) {
    let missing = 0;
    for (const gallery of galleries) {
      for (const image of gallery.images) {
        if (!existsSync(resolveLocalPath(image.src))) missing++;
      }
    }
    const total = galleries.reduce((n, g) => n + g.images.length, 0);
    console.log("Import-gallery-images summary (DRY RUN — nothing will be uploaded):");
    for (const gallery of galleries) {
      console.log(`  ${gallery.key}: ${gallery.images.length} images -> galleryCollection-${gallery.key}`);
    }
    console.log(`  ${total} images total`);
    console.log(`  ${missing} referenced local file(s) missing on disk` + (missing ? " — fix before a live run." : ""));
    console.log("\nDry run complete. Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to upload.");
    return;
  }

  if (!projectId || !dataset || !token) {
    throw new Error(
      "NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_API_WRITE_TOKEN are all required for a live run.",
    );
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
    token,
    useCdn: false,
  });

  let created = 0;
  let skippedExisting = 0;

  for (const gallery of galleries) {
    const id = deterministicId("galleryCollection", gallery.key);
    const existing = await client.fetch<{ _id: string } | null>(`*[_id == $id][0]{_id}`, { id });
    if (existing) {
      skippedExisting++;
      console.log(`  skipped (already exists — edit in Studio): galleryCollection/${gallery.key}`);
      continue;
    }

    const imageFields: Record<string, unknown>[] = [];
    for (const [index, image] of gallery.images.entries()) {
      const localPath = resolveLocalPath(image.src);
      if (!existsSync(localPath)) {
        console.warn(`  skipping one image for ${gallery.key}: local file not found at ${localPath}`);
        continue;
      }
      const asset = await client.assets.upload("image", readFileSync(localPath), {
        filename: path.basename(image.src),
      });
      imageFields.push({
        _key: `img${index}`,
        _type: "imageWithAlt",
        asset: { _type: "reference", _ref: asset._id },
        alt: en(image.alt),
      });
    }

    await client.createIfNotExists({
      _id: id,
      _type: "galleryCollection",
      key: { _type: "slug", current: gallery.key },
      title: gallery.title,
      images: imageFields,
    } as never);
    created++;
    console.log(`  created: galleryCollection/${gallery.key} (${imageFields.length} images)`);
  }

  console.log(`\nDone. ${created} gallery document(s) created, ${skippedExisting} already existed (untouched).`);
}

main().catch((error) => {
  console.error("Gallery image import failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
