/**
 * Backfills `seo.title` / `seo.description` / `seo.ogImage` on
 * `page-catering` ONLY — it was completely empty (confirmed via a
 * live, read-only probe), so an editor filling in the Catering page's
 * "Search Result Title"/"Search Result Description"/"Social Sharing Image"
 * fields today would have zero connection to what the site actually shows:
 * `generateMetadata()` in app/[locale]/(site)/catering/page.tsx reads
 * `newPage?.seo` directly.
 *
 * Does NOT target `page-catering-menu-examples`: an earlier version of
 * this script did, and was wrong to — that document's `seo` field has no
 * frontend reader at all (Catering Menu Examples is an in-page overlay,
 * never its own route) and is now hidden in Studio (see page.ts) after the
 * seeded values were removed (scripts/remove-catering-menu-examples-seo.ts).
 * Re-adding a TARGETS entry for it here would silently undo that fix.
 *
 * Seed content is NOT invented: the English title/description reuse text
 * already shipping on the live site today (the page's own hero copy /
 * hardcoded metadata fallback already in app/[locale]/(site)/catering/page.tsx),
 * and the OG image reuses an asset already uploaded to the same document
 * (the philosophy photo) rather than uploading anything new. Danish and
 * Ukrainian are mechanical translations of that same English copy, written
 * for this migration and disclosed here and in the final report — not
 * existing approved page copy, unlike the English seed text.
 *
 * Idempotent / safe to re-run: every field is only ever set via
 * `setIfMissing` — an editor's own SEO edits (even partial: title filled in
 * but description still empty) are never overwritten.
 *
 * Usage:
 *   npm run sanity:repair-catering-seo:dry-run
 *   npm run sanity:repair-catering-seo
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

function entries(en: string, da: string, uk: string, typeName: string) {
  return [
    { _key: "en", _type: typeName, language: "en", value: en },
    { _key: "da", _type: typeName, language: "da", value: da },
    { _key: "uk", _type: typeName, language: "uk", value: uk },
  ];
}

interface Target {
  id: string;
  label: string;
  title: [string, string, string];
  description: [string, string, string];
  /** GROQ path (relative to the document) to an existing uploaded image asset to reuse as the OG image. */
  ogImagePath: string;
}

const TARGETS: Target[] = [
  {
    id: "page-catering",
    label: "Catering page",
    title: ["Catering | RORUM", "Catering | RORUM", "Кейтеринг | RORUM"],
    description: [
      "Warm Scandinavian catering for workshops, meetings and intimate events.",
      "Varm skandinavisk catering til workshops, møder og intime arrangementer.",
      "Тепла скандинавська кейтерингова кухня для воркшопів, зустрічей та камерних подій.",
    ],
    ogImagePath: `sections[sectionKey=="philosophy"][0].media[0].image.asset`,
  },
];

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log("\n== Catering SEO backfill — plan ==");

  for (const target of TARGETS) {
    const doc = await client.fetch<{
      _id: string;
      _rev: string;
      seo?: { title?: unknown; description?: unknown; ogImage?: { asset?: unknown } };
      ogAsset?: { _ref?: string } | null;
    } | null>(`*[_id == $id][0]{_id, _rev, seo, "ogAsset": ${target.ogImagePath}}`, { id: target.id });

    if (!doc) {
      console.log(`\n${target.label} (${target.id}): document not found — skipped.`);
      continue;
    }

    const needsTitle = !doc.seo?.title;
    const needsDescription = !doc.seo?.description;
    const needsOgImage = !doc.seo?.ogImage?.asset && !!doc.ogAsset?._ref;

    console.log(`\n${target.label} (${target.id}):`);
    console.log(`  title: ${needsTitle ? `WOULD SET "${target.title[0]}" (+ da/uk)` : "already set — left alone"}`);
    console.log(`  description: ${needsDescription ? `WOULD SET "${target.description[0].slice(0, 50)}..." (+ da/uk)` : "already set — left alone"}`);
    console.log(`  ogImage: ${needsOgImage ? `WOULD REUSE existing asset ${doc.ogAsset?._ref}` : doc.seo?.ogImage?.asset ? "already set — left alone" : "no existing asset available to reuse — skipped"}`);

    if (DRY_RUN || (!needsTitle && !needsDescription && !needsOgImage)) continue;

    const fresh = await client.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id: target.id });
    if (!fresh || fresh._rev !== doc._rev) {
      console.error(`  ABORTED (${target.id}): changed concurrently — re-run to recompute.`);
      process.exitCode = 1;
      continue;
    }

    let patch = client.patch(target.id).ifRevisionId(fresh._rev);
    if (needsTitle) {
      patch = patch.setIfMissing({ "seo.title": entries(...target.title, "internationalizedArrayStringValue") });
    }
    if (needsDescription) {
      patch = patch.setIfMissing({ "seo.description": entries(...target.description, "internationalizedArrayTextValue") });
    }
    if (needsOgImage && doc.ogAsset?._ref) {
      patch = patch.setIfMissing({ "seo.ogImage": { _type: "image", asset: { _type: "reference", _ref: doc.ogAsset._ref } } });
    }
    await patch.commit();
    console.log(`  applied.`);
  }

  if (DRY_RUN) {
    console.log("\nDry run only — no writes performed.");
  } else {
    console.log("\nLive repair complete.");
  }
}

main().catch((error) => {
  console.error("repair-catering-seo failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
