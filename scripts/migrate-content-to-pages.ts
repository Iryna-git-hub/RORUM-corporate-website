/**
 * One-time content-architecture migration: copies content out of 3 legacy
 * top-level document types — `faqGroup`, `cateringMenuCategory`, and
 * `galleryCollection` — into the page singleton documents they actually
 * belong to, matching the Studio sidebar restructure to "Site / Pages /
 * Events" (see sanity/structure.ts).
 *
 *   1. faqGroup[]                     -> faqPage.groups
 *   2. cateringMenuCategory[]         -> cateringMenuExamplesPage.categories
 *      + cateringPage.menuOverlay.*   -> cateringMenuExamplesPage.{title,intro,requestCta,...}
 *      + cateringPage.menuOverlay.triggerLabel -> cateringPage.menuExamplesCta
 *   3. public/images/catering/catering-gallery-added-16.png (previously a
 *      hardcoded CSS background in components/CateringMenuOverlay.tsx)
 *                                     -> cateringMenuExamplesPage.bannerImage
 *   4. galleryCollection (key="catering")         -> cateringPage.gallery
 *      galleryCollection (key="event-decoration") -> eventDecorationPage.gallery
 *      galleryCollection (key="host-at-rorum")    -> hostAtRorumPage.gallery
 *
 * This migrates *existing* trilingual content verbatim (internationalized-
 * array values are copied as-is) rather than re-authoring text, since the
 * source documents already hold real EN/DA/UK content.
 *
 * The legacy documents (`faqGroup`, `cateringMenuCategory`,
 * `galleryCollection`) are left untouched — only unlisted from the Studio
 * sidebar (sanity/structure.ts) — so nothing is lost if anything here needs
 * to be re-verified or re-run.
 *
 * Idempotency: each step checks whether its destination already has content
 * before writing, so running this script multiple times is safe and the
 * second run should report everything already migrated.
 *
 * Usage:
 *   npm run sanity:migrate-content-to-pages:dry-run   (default-safe: prints a plan, writes nothing)
 *   npm run sanity:migrate-content-to-pages           (requires SANITY_API_WRITE_TOKEN)
 */
import { createClient } from "@sanity/client";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { en } from "./lib/sanityImportUtils";

const DRY_RUN = process.argv.includes("--dry-run") || !process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  // Raw perspective so a document that only exists as a draft is never
  // silently missed (see MIGRATION_REPORT.md's Part 9/10 lesson) — combined
  // with dedupeByPublishedId() below, which then collapses each
  // draft/published pair back down to the one version we should actually
  // read (published wins when both exist).
  perspective: "raw",
});

type LocalizedArrayValue = { _key: string; _type: string; language?: string; value?: string };
type LocalizedArray = LocalizedArrayValue[] | undefined;

interface FaqGroupDoc {
  _id: string;
  title?: LocalizedArray;
  items?: { _key: string; question?: LocalizedArray; answer?: LocalizedArray }[];
}

interface CateringMenuCategoryDoc {
  _id: string;
  title?: LocalizedArray;
  navLabel?: LocalizedArray;
  slug?: { current?: string };
  description?: LocalizedArray;
  featuredItems?: Record<string, unknown>[];
}

interface CateringMenuOverlayChrome {
  triggerLabel?: LocalizedArray;
  title?: LocalizedArray;
  intro?: unknown[];
  requestCta?: LocalizedArray;
  featuredDishesLabel?: LocalizedArray;
  disclaimerNote?: LocalizedArray;
  customMenuTitle?: LocalizedArray;
  customMenuText?: LocalizedArray;
  backToCateringCta?: LocalizedArray;
}

interface GalleryCollectionDoc {
  _id: string;
  key?: { current?: string };
  images?: Record<string, unknown>[];
}

/**
 * Under `perspective: "raw"`, `*[_type == "x"]` returns a draft and its
 * published counterpart as two separate documents (ids `drafts.<id>` and
 * `<id>`) instead of resolving them into one. Collapses each pair back down
 * to a single entry per natural id, preferring the published version.
 */
function dedupeByPublishedId<T extends { _id: string }>(docs: T[]): T[] {
  const byId = new Map<string, T>();
  for (const doc of docs) {
    const publishedId = doc._id.startsWith("drafts.") ? doc._id.slice("drafts.".length) : doc._id;
    const existing = byId.get(publishedId);
    const isDraft = doc._id.startsWith("drafts.");
    if (!existing || (existing._id.startsWith("drafts.") && !isDraft)) {
      byId.set(publishedId, doc);
    }
  }
  return Array.from(byId.values());
}

async function migrateFaq() {
  const faqPage = await client.fetch<{ groups?: unknown[] } | null>(`*[_id == "faqPage"][0]{groups}`);
  if (faqPage?.groups?.length) {
    console.log(`FAQ: faqPage.groups already has ${faqPage.groups.length} group(s) — skipping.`);
    return;
  }

  const groupsRaw = await client.fetch<FaqGroupDoc[]>(
    `*[_type == "faqGroup"] | order(order asc){_id, title, items}`,
  );
  const groups = dedupeByPublishedId(groupsRaw);

  if (!groups.length) {
    console.log("FAQ: no faqGroup documents found — nothing to migrate.");
    return;
  }

  const totalQuestions = groups.reduce((n, g) => n + (g.items?.length ?? 0), 0);
  console.log(`FAQ: found ${groups.length} group(s) / ${totalQuestions} question(s) — would migrate into faqPage.groups.`);
  if (DRY_RUN) return;

  const newGroups = groups.map((g) => ({
    _key: g._id,
    _type: "faqPageGroup",
    title: g.title,
    items: (g.items ?? []).map((item) => ({
      _key: item._key,
      _type: "faqItem",
      question: item.question,
      answer: item.answer,
    })),
  }));

  await client.createIfNotExists({ _id: "faqPage", _type: "faqPage" });
  await client.patch("faqPage").set({ groups: newGroups }).commit({ autoGenerateArrayKeys: false });
  console.log(`FAQ: migrated ${groups.length} group(s) / ${totalQuestions} question(s) into faqPage.groups.`);
}

async function migrateCateringMenu() {
  const existing = await client.fetch<{ categories?: unknown[] } | null>(
    `*[_id == "cateringMenuExamplesPage"][0]{categories}`,
  );

  const categoryDocsRaw = await client.fetch<CateringMenuCategoryDoc[]>(
    `*[_type == "cateringMenuCategory"] | order(order asc){_id, title, navLabel, slug, description, featuredItems}`,
  );
  const categoryDocs = dedupeByPublishedId(categoryDocsRaw);

  const cateringPageRaw = await client.fetch<{ menuOverlay?: CateringMenuOverlayChrome } | null>(
    `*[_id == "cateringPage"][0]{menuOverlay}`,
  );
  const overlay = cateringPageRaw?.menuOverlay;

  if (existing?.categories?.length) {
    console.log(
      `Catering menu: cateringMenuExamplesPage.categories already has ${existing.categories.length} categor${existing.categories.length === 1 ? "y" : "ies"} — skipping.`,
    );
  } else if (!categoryDocs.length) {
    console.log("Catering menu: no cateringMenuCategory documents found — nothing to migrate.");
  } else {
    const totalDishes = categoryDocs.reduce((n, c) => n + (c.featuredItems?.length ?? 0), 0);
    console.log(
      `Catering menu: found ${categoryDocs.length} categor${categoryDocs.length === 1 ? "y" : "ies"} / ${totalDishes} dish(es), chrome text ${overlay ? "found" : "NOT found"} on cateringPage.menuOverlay — would migrate into cateringMenuExamplesPage.`,
    );
    if (!DRY_RUN) {
      const categories = categoryDocs.map((cat) => ({
        _key: cat.slug?.current || cat._id,
        _type: "menuCategory",
        title: cat.title,
        navLabel: cat.navLabel,
        description: cat.description,
        dishes: (cat.featuredItems ?? []).map((item) => ({ ...item, _type: "cateringMenuItem" })),
      }));

      await client.createIfNotExists({ _id: "cateringMenuExamplesPage", _type: "cateringMenuExamplesPage" });
      await client
        .patch("cateringMenuExamplesPage")
        .set({
          title: overlay?.title,
          intro: overlay?.intro,
          requestCta: overlay?.requestCta,
          categories,
          featuredDishesLabel: overlay?.featuredDishesLabel,
          disclaimerNote: overlay?.disclaimerNote,
          customMenuTitle: overlay?.customMenuTitle,
          customMenuText: overlay?.customMenuText,
          backToCateringCta: overlay?.backToCateringCta,
        })
        .commit({ autoGenerateArrayKeys: false });
      console.log(
        `Catering menu: migrated ${categoryDocs.length} categor${categoryDocs.length === 1 ? "y" : "ies"} / ${totalDishes} dish(es) into cateringMenuExamplesPage.`,
      );
    }
  }

  const cateringPageCta = await client.fetch<{ menuExamplesCta?: unknown[] } | null>(
    `*[_id == "cateringPage"][0]{menuExamplesCta}`,
  );
  if (cateringPageCta?.menuExamplesCta?.length) {
    console.log("Catering menu: cateringPage.menuExamplesCta already set — skipping.");
  } else if (overlay?.triggerLabel?.length) {
    console.log("Catering menu: would set cateringPage.menuExamplesCta from the old menuOverlay.triggerLabel.");
    if (!DRY_RUN) {
      await client.patch("cateringPage").set({ menuExamplesCta: overlay.triggerLabel }).commit();
      console.log("Catering menu: set cateringPage.menuExamplesCta.");
    }
  } else {
    console.log("Catering menu: no old menuOverlay.triggerLabel found — leaving cateringPage.menuExamplesCta unset.");
  }
}

async function migrateBanner() {
  const doc = await client.fetch<{ hasBanner: boolean } | null>(
    `*[_id == "cateringMenuExamplesPage"][0]{"hasBanner": defined(bannerImage.asset)}`,
  );
  if (doc?.hasBanner) {
    console.log("Banner image: cateringMenuExamplesPage.bannerImage already set — skipping.");
    return;
  }

  const relativePath = "images/catering/catering-gallery-added-16.png";
  const localPath = path.join(process.cwd(), "public", relativePath);
  if (!existsSync(localPath)) {
    console.warn(`Banner image: local file not found at ${localPath} — skipping.`);
    return;
  }

  console.log(`Banner image: would upload public/${relativePath} and set cateringMenuExamplesPage.bannerImage.`);
  if (DRY_RUN) return;

  await client.createIfNotExists({ _id: "cateringMenuExamplesPage", _type: "cateringMenuExamplesPage" });
  const asset = await client.assets.upload("image", readFileSync(localPath), {
    filename: path.basename(localPath),
  });
  await client
    .patch("cateringMenuExamplesPage")
    .set({
      bannerImage: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
        alt: en("Catering menu example from RORUM's catering gallery"),
      },
    })
    .commit();
  console.log("Banner image: uploaded and linked to cateringMenuExamplesPage.bannerImage.");
}

const GALLERY_TARGETS: { key: string; pageId: string; pageLabel: string }[] = [
  { key: "catering", pageId: "cateringPage", pageLabel: "cateringPage.gallery" },
  { key: "event-decoration", pageId: "eventDecorationPage", pageLabel: "eventDecorationPage.gallery" },
  { key: "host-at-rorum", pageId: "hostAtRorumPage", pageLabel: "hostAtRorumPage.gallery" },
];

async function migrateGalleries() {
  const galleryDocsRaw = await client.fetch<GalleryCollectionDoc[]>(
    `*[_type == "galleryCollection"]{_id, key, images}`,
  );
  const galleryDocs = dedupeByPublishedId(galleryDocsRaw);

  for (const { key, pageId, pageLabel } of GALLERY_TARGETS) {
    const galleryDoc = galleryDocs.find((d) => d.key?.current === key);
    if (!galleryDoc) {
      console.log(`Gallery "${key}": no galleryCollection document found — nothing to migrate.`);
      continue;
    }

    const target = await client.fetch<{ gallery?: unknown[] } | null>(`*[_id == $id][0]{gallery}`, { id: pageId });
    if (target?.gallery?.length) {
      console.log(`Gallery "${key}": ${pageLabel} already has ${target.gallery.length} image(s) — skipping.`);
      continue;
    }

    const count = galleryDoc.images?.length ?? 0;
    console.log(`Gallery "${key}": found ${count} image(s) — would migrate into ${pageLabel}.`);
    if (DRY_RUN) continue;

    await client.patch(pageId).set({ gallery: galleryDoc.images ?? [] }).commit({ autoGenerateArrayKeys: false });
    console.log(`Gallery "${key}": migrated ${count} image(s) into ${pageLabel}.`);
  }
}

async function main() {
  console.log(`Content-to-pages migration (${DRY_RUN ? "DRY RUN — nothing will be written" : "LIVE RUN"}):\n`);

  await migrateFaq();
  console.log("");
  await migrateCateringMenu();
  console.log("");
  await migrateBanner();
  console.log("");
  await migrateGalleries();

  console.log(
    `\n${DRY_RUN ? "Dry run" : "Live run"} complete.` +
      (DRY_RUN ? " Re-run with SANITY_API_WRITE_TOKEN set (and without --dry-run) to write." : ""),
  );
}

main().catch((error) => {
  console.error("Content-to-pages migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
