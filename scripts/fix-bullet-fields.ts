/**
 * One-off corrective patch for data written before the `bulletText` schema
 * fix: `event.included`, `event.whatToExpect` and `hostAtRorumPage`'s
 * `packages[].items` were imported as raw internationalized-array values
 * (`{_key:"i0", _type:"internationalizedArrayStringValue", value:"..."}`)
 * instead of `bulletText` objects wrapping one (`{_key:"i0",
 * _type:"bulletText", text:[{_key:"en", ..., value:"..."}]}`). This script
 * rewrites already-live documents in place to the correct shape.
 *
 * Idempotent: an item is only rewritten if it's still in the old flat shape
 * (detected by the presence of `value` directly on the item, with no
 * `text` field) — already-fixed items and any other array member shape are
 * left untouched, so re-running is always safe.
 *
 * Usage:
 *   npm run sanity:fix-bullet-fields:dry-run   (default-safe: prints a plan, writes nothing)
 *   npm run sanity:fix-bullet-fields           (requires SANITY_API_WRITE_TOKEN)
 */
import { createClient } from "@sanity/client";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

type FlatItem = { _key: string; _type: string; value?: string };
type BulletItem = { _key: string; _type: "bulletText"; text: { _key: string; _type: string; value: string }[] };

function isFlatItem(item: FlatItem): item is FlatItem & { value: string } {
  return typeof item.value === "string";
}

function toBullet(item: FlatItem & { value: string }): BulletItem {
  return {
    _key: item._key,
    _type: "bulletText",
    text: [{ _key: "en", _type: item._type, value: item.value }],
  };
}

type EventDoc = { _id: string; included?: FlatItem[]; whatToExpect?: FlatItem[] };
type HostPageDoc = { _id: string; packages?: { _key: string; items?: FlatItem[] }[] };

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_WRITE_TOKEN;

  // A token (even in dry-run mode, where nothing is committed) is required
  // to read draft documents at all — `perspective: "raw"` below is what
  // surfaces `drafts.*` alongside published documents, but the API still
  // requires auth to return drafts to the caller.
  const client = createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
    token,
    useCdn: false,
    perspective: "raw",
  });

  const events = await client.fetch<EventDoc[]>(
    `*[_type == "event"]{ _id, included, whatToExpect }`,
  );
  const hostPage = await client.fetch<HostPageDoc | null>(
    `*[_id == "hostAtRorumPage"][0]{ _id, packages }`,
  );

  let eventsToPatch = 0;
  let itemsFixed = 0;

  for (const event of events) {
    const patch: Record<string, BulletItem[]> = {};
    for (const field of ["included", "whatToExpect"] as const) {
      const items = event[field];
      if (!items || items.length === 0) continue;
      if (!items.some(isFlatItem)) continue;
      patch[field] = items.map((item) => (isFlatItem(item) ? toBullet(item) : (item as unknown as BulletItem)));
      itemsFixed += items.filter(isFlatItem).length;
    }
    if (Object.keys(patch).length === 0) continue;
    eventsToPatch++;
    console.log(`${DRY_RUN ? "[dry run] would patch" : "Patching"} ${event._id}: ${Object.keys(patch).join(", ")}`);
    if (!DRY_RUN) {
      await client.patch(event._id).set(patch).commit({ autoGenerateArrayKeys: false });
    }
  }

  let hostPagePatched = false;
  if (hostPage?.packages) {
    let packagesChanged = false;
    const packages = hostPage.packages.map((tier) => {
      const items = tier.items;
      if (!items || items.length === 0 || !items.some(isFlatItem)) return tier;
      packagesChanged = true;
      itemsFixed += items.filter(isFlatItem).length;
      return { ...tier, items: items.map((item) => (isFlatItem(item) ? toBullet(item) : (item as unknown as BulletItem))) };
    });
    if (packagesChanged) {
      hostPagePatched = true;
      console.log(`${DRY_RUN ? "[dry run] would patch" : "Patching"} hostAtRorumPage: packages[].items`);
      if (!DRY_RUN) {
        await client.patch("hostAtRorumPage").set({ packages }).commit({ autoGenerateArrayKeys: false });
      }
    }
  }

  console.log(
    `\n${DRY_RUN ? "Dry run" : "Live run"} complete. ${eventsToPatch} event document(s)` +
      `${hostPagePatched ? " + hostAtRorumPage" : ""} ${DRY_RUN ? "would be" : "were"} patched` +
      ` (${itemsFixed} malformed array items total).`,
  );
  if (DRY_RUN) {
    console.log("Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write.");
  }
}

main().catch((error) => {
  console.error("Fix-up failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
