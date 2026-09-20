/**
 * Read-only: reports the production dataset's Content Lake attribute count
 * against Sanity's free-plan cap (2,000 unique path+datatype combinations),
 * plus asset-storage usage (a separate free-plan quota — relevant before any
 * asset upload, e.g. the home hero video). Never writes anything.
 *
 * Usage: npm run sanity:stats
 */

import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

const ATTRIBUTE_LIMIT = 2000;
const TARGET_MAX = 1600;

interface DatasetStats {
  documents?: { count?: { value?: number } };
  fields?: { count?: { value?: number; limit?: number } };
  assets?: { count?: number; size?: number };
  [key: string]: unknown;
}

async function main() {
  if (!projectId) {
    console.error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set.");
    process.exitCode = 1;
    return;
  }

  const url = `https://${projectId}.api.sanity.io/v1/data/stats/${dataset}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    console.error(`Stats request failed: ${res.status} ${res.statusText}`);
    console.error(await res.text());
    process.exitCode = 1;
    return;
  }

  const stats = (await res.json()) as DatasetStats;
  const count = stats.fields?.count?.value;
  const limit = stats.fields?.count?.limit ?? ATTRIBUTE_LIMIT;

  console.log(`Dataset: ${dataset} (project ${projectId})`);
  console.log(`Documents: ${stats.documents?.count?.value ?? "unknown"}`);
  console.log("");
  console.log("== Attribute count (Content Lake, free-plan cap) ==");
  if (typeof count === "number") {
    const remaining = limit - count;
    console.log(`  Current: ${count} / ${limit}`);
    console.log(`  Remaining: ${remaining}`);
    console.log(`  Over limit: ${count > limit ? "YES" : "no"}`);
    console.log(`  Within ${TARGET_MAX}-attribute safety target: ${count <= TARGET_MAX ? "YES" : "no"}`);
  } else {
    console.log("  Attribute count not present in stats response — printing raw response below.");
  }

  // The stats endpoint above doesn't report asset storage, so query it
  // directly — relevant before any asset upload (e.g. the home hero video).
  const client = createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
    token,
    useCdn: false,
    perspective: "raw",
  });
  const assetSizes = await client.fetch<number[]>(`*[_type in ["sanity.fileAsset","sanity.imageAsset"]].size`);
  const totalAssetBytes = assetSizes.reduce((sum, size) => sum + (size || 0), 0);
  console.log("");
  console.log("== Asset storage (free-plan quota is separate from the attribute cap) ==");
  console.log(`  Asset count: ${assetSizes.length}`);
  console.log(`  Total size: ${(totalAssetBytes / (1024 * 1024)).toFixed(1)} MB`);

  console.log("");
  console.log("Raw stats response:");
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((error) => {
  console.error("sanity-stats failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
