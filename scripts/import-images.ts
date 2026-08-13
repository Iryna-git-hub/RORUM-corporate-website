/**
 * Uploads the event banner and catering-menu-item images referenced by
 * lib/data.ts / lib/cateringMenu.ts to Sanity's asset store, and patches
 * each already-imported document's `image` field with the resulting asset
 * reference. Run scripts/import-content.ts first — this script only patches
 * documents that already exist; it does not create any.
 *
 * Usage:
 *   npm run sanity:import-images:dry-run   (default-safe: prints a plan, uploads nothing)
 *   npm run sanity:import-images           (requires SANITY_API_WRITE_TOKEN)
 *
 * Idempotency: before uploading, each document (or array member) is checked
 * for an already-set `image.asset` — if present, that image is skipped
 * entirely (no re-upload, no re-patch), so this script is safe to re-run
 * after a partial run or after an editor has manually replaced an image in
 * the Studio (their choice is never overwritten).
 */
import { createClient } from "@sanity/client";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { events } from "../lib/data";
import { menuCategories } from "../lib/cateringMenu";
import { deterministicId, en } from "./lib/sanityImportUtils";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

function resolveLocalPath(publicRelativePath: string): string {
  return path.join(process.cwd(), "public", publicRelativePath);
}

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_WRITE_TOKEN;

  if (DRY_RUN) {
    let missing = 0;
    for (const event of events) {
      if (!existsSync(resolveLocalPath(event.image))) missing++;
    }
    for (const category of menuCategories) {
      for (const item of category.featuredItems) {
        if (!existsSync(resolveLocalPath(item.image))) missing++;
      }
    }
    const total = events.length + menuCategories.reduce((n, c) => n + c.featuredItems.length, 0);
    console.log(`Import-images summary (DRY RUN — nothing will be uploaded):`);
    console.log(`  ${events.length} event banners + ${total - events.length} catering menu item photos = ${total} images`);
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

  let uploaded = 0;
  let skippedExisting = 0;
  let skippedMissingFile = 0;

  // --- Event banners ---------------------------------------------------------
  for (const event of events) {
    const id = deterministicId("event", event.slug);
    const current = await client.fetch<{ hasImage: boolean } | null>(
      `*[_id == $id][0]{ "hasImage": defined(image.asset) }`,
      { id },
    );
    if (current === null) {
      console.warn(`Skipping ${event.slug}: no "event" document with id ${id} exists yet (run sanity:import first).`);
      continue;
    }
    if (current.hasImage) {
      skippedExisting++;
      continue;
    }
    const localPath = resolveLocalPath(event.image);
    if (!existsSync(localPath)) {
      console.warn(`Skipping ${event.slug}: local file not found at ${localPath}`);
      skippedMissingFile++;
      continue;
    }
    const asset = await client.assets.upload("image", readFileSync(localPath), {
      filename: path.basename(event.image),
    });
    await client
      .patch(id)
      .set({
        image: {
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
          alt: en(`${event.title} event atmosphere`),
        },
      })
      .commit();
    uploaded++;
    console.log(`  uploaded: event/${event.slug}`);
  }

  // --- Catering menu item photos ----------------------------------------------
  for (const category of menuCategories) {
    const categoryId = deterministicId("cateringMenuCategory", category.id);
    for (const [index, item] of category.featuredItems.entries()) {
      const key = `f${index}`;
      const current = await client.fetch<{ hasImage: boolean } | null>(
        `*[_id == $id][0].featuredItems[_key == $key][0]{ "hasImage": defined(image.asset) }`,
        { id: categoryId, key },
      );
      if (current === null) {
        console.warn(
          `Skipping ${category.id}/${item.name}: no matching document/array item found (run sanity:import first).`,
        );
        continue;
      }
      if (current.hasImage) {
        skippedExisting++;
        continue;
      }
      const localPath = resolveLocalPath(item.image);
      if (!existsSync(localPath)) {
        console.warn(`Skipping ${category.id}/${item.name}: local file not found at ${localPath}`);
        skippedMissingFile++;
        continue;
      }
      const asset = await client.assets.upload("image", readFileSync(localPath), {
        filename: path.basename(item.image),
      });
      await client
        .patch(categoryId)
        .set({
          [`featuredItems[_key=="${key}"].image`]: {
            _type: "image",
            asset: { _type: "reference", _ref: asset._id },
            alt: en(item.alt),
          },
        })
        .commit();
      uploaded++;
      console.log(`  uploaded: cateringMenuCategory/${category.id}/${item.name}`);
    }
  }

  console.log(
    `\nDone. ${uploaded} images uploaded and linked, ${skippedExisting} already had an image (untouched), ${skippedMissingFile} skipped (local file missing).`,
  );
}

main().catch((error) => {
  console.error("Image import failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
