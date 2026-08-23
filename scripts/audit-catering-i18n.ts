/**
 * READ-ONLY recursive audit for the entire Catering CMS surface:
 *   - page-catering (published + draft);
 *   - page-catering-menu-examples (published + draft) — every category
 *     section, every dish item, category icons, the banner, the closing
 *     section;
 *   - legacy cateringPage / cateringMenuExamplesPage (informational only —
 *     kept for compatibility, no longer read by the frontend);
 *   - every cateringMenuCategory document (informational — this type is
 *     orphaned; expected count is 0, reported if that ever changes);
 *   - gallery media, CTAs, form-copy rows, SEO, category icons, and
 *     informative-image alt text, all with exact paths.
 *
 * `perspective: "raw"` so drafts are included; `useCdn: false` for a fresh
 * read; never mutates anything.
 *
 * Distinguishes "field entirely unset" (fine — optional content) from
 * "partially populated" (a real problem), same rule as every other audit
 * script in this project.
 *
 * Exact-path output format, one line per finding:
 *   page-catering.sections[hero].title -> missing: da, uk
 *   drafts.page-catering-menu-examples.sections[category-ukrainian].items[dish0].image.alt -> empty: uk
 *
 * Usage: npm run sanity:audit-catering
 */
import { createClient } from "@sanity/client";
import { icons as lucideIcons } from "lucide-react";

const REQUIRED_LANGUAGES = ["en", "da", "uk"];

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  useCdn: false,
  perspective: "raw",
  token: process.env.SANITY_API_WRITE_TOKEN,
});

interface I18nEntry {
  _key?: string;
  language?: string;
  value?: string;
}
interface RawItem {
  _key: string;
  itemKey?: string;
  icon?: string;
  title?: I18nEntry[];
  text?: I18nEntry[];
  image?: { asset?: { _ref?: string }; alt?: I18nEntry[] };
  href?: string;
  label?: I18nEntry[];
}
interface RawAction {
  _key: string;
  actionKey?: string;
  label?: I18nEntry[];
  href?: string;
  enabled?: boolean;
}
interface RawMedia {
  _key: string;
  kind?: string;
  image?: { asset?: { _ref?: string } };
  alt?: I18nEntry[];
}
interface RawSection {
  _key: string;
  sectionKey?: string;
  sectionKind?: string;
  label?: I18nEntry[];
  title?: I18nEntry[];
  text?: I18nEntry[];
  media?: RawMedia[];
  actions?: RawAction[];
  items?: RawItem[];
}
interface RawPage {
  _id: string;
  pageKey?: string;
  seo?: { title?: I18nEntry[]; description?: I18nEntry[]; ogImage?: { asset?: { _ref?: string } } };
  sections?: RawSection[];
}

const findings: string[] = [];
function report(path: string, kind: string, detail: string) {
  findings.push(`${path} -> ${kind}: ${detail}`);
}

/** Fully unset = fine. Partially populated (some langs present, others missing, or a present lang empty) = reported. Returns true if the field was non-empty at all. */
function checkI18n(entries: I18nEntry[] | undefined | null, path: string): boolean {
  const list = (entries ?? []).filter((e) => e.language);
  if (list.length === 0) return false;

  const seen = new Map<string, number>();
  for (const e of list) seen.set(e.language!, (seen.get(e.language!) ?? 0) + 1);
  const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([lang]) => lang);
  const missing = REQUIRED_LANGUAGES.filter((l) => !seen.has(l));
  const empty = list.filter((e) => REQUIRED_LANGUAGES.includes(e.language!) && !e.value?.trim()).map((e) => e.language!);

  if (duplicates.length) report(path, "duplicate", duplicates.join(", "));
  if (missing.length) report(path, "missing", missing.join(", "));
  if (empty.length) report(path, "empty", empty.join(", "));
  return true;
}

function checkImage(image: { asset?: { _ref?: string }; alt?: I18nEntry[] } | undefined, path: string, informative: boolean) {
  if (!image) return;
  if (!image.asset?._ref) {
    report(path, "missing-image-asset", "no uploaded image");
    return;
  }
  if (informative) {
    const en = image.alt?.find((e) => e.language === "en")?.value?.trim();
    if (!en) report(`${path}.alt`, "missing-alt-text", "informative image has no English alt text");
    else checkI18n(image.alt, `${path}.alt`);
  }
}

function checkIcon(icon: string | undefined | null, path: string) {
  if (!icon) return;
  if (!(icon in lucideIcons)) report(path, "invalid-icon", `"${icon}" is not a valid lucide-react export name`);
}

function checkAction(action: RawAction | undefined, path: string) {
  if (!action) return;
  if (action.enabled === false) return; // disabled CTAs are never required to have a label/destination
  const hasLabel = (action.label ?? []).some((e) => e.value?.trim());
  const hasHref = !!action.href?.trim();
  if (!hasLabel) report(`${path}[actionKey=="${action.actionKey}"]`, "enabled-cta-missing-label", "enabled but no non-empty label in any language");
  if (!hasHref) report(`${path}[actionKey=="${action.actionKey}"]`, "enabled-cta-missing-destination", "enabled but href is empty");
  checkI18n(action.label, `${path}[actionKey=="${action.actionKey}"].label`);
}

/** Walks one page-catering / page-catering-menu-examples document. */
function walkPage(doc: RawPage) {
  const base = doc._id;
  const seenSectionKeys = new Map<string, number>();

  checkI18n(doc.seo?.title, `${base}.seo.title`);
  checkI18n(doc.seo?.description, `${base}.seo.description`);
  checkImage(doc.seo?.ogImage, `${base}.seo.ogImage`, false);

  for (const section of doc.sections ?? []) {
    const sk = section.sectionKey ?? section._key;
    const path = `${base}.sections[${sk}]`;
    if (!section.sectionKey) report(path, "malformed-section", "no sectionKey");
    if (!section.sectionKind) report(path, "malformed-section", "no sectionKind");
    if (section.sectionKey) seenSectionKeys.set(section.sectionKey, (seenSectionKeys.get(section.sectionKey) ?? 0) + 1);

    checkI18n(section.label, `${path}.label`);
    checkI18n(section.title, `${path}.title`);
    checkI18n(section.text, `${path}.text`);

    for (const media of section.media ?? []) {
      // `mediaItem`'s `alt` is a SIBLING of `image` (not nested inside it,
      // unlike `imageWithAlt` below) — combine them before checkImage's
      // shared informative-alt-text check, which expects alt nested.
      checkImage({ asset: media.image?.asset, alt: media.alt }, `${path}.media[${media._key}]`, media.kind !== "video");
    }

    for (const action of section.actions ?? []) {
      checkAction(action, `${path}.actions`);
    }

    for (const item of section.items ?? []) {
      const itemPath = `${path}.items[${item.itemKey ?? item._key}]`;

      if (section.sectionKind === "menuCategory" && item.itemKey === "categoryIcon") {
        checkIcon(item.icon, `${itemPath}.icon`);
        if (!item.icon) report(itemPath, "visible-unused", "categoryIcon item exists but has no icon set — the category will fall back to the neutral default");
        continue;
      }

      if (section.sectionKind === "menuCategory") {
        // A dish. Required content: name (title) in every selected language;
        // description (text) is optional-but-complete-if-started; a photo is
        // expected (informative, not decorative).
        const hasName = checkI18n(item.title, `${itemPath}.title`);
        if (!hasName) report(itemPath, "malformed-dish", "no title (dish name) at all");
        checkI18n(item.text, `${itemPath}.text`);
        checkImage(item.image, `${itemPath}.image`, true);
        if (item.icon) report(`${itemPath}.icon`, "visible-unused", "dish items are never rendered with an icon — this value has no effect");
        continue;
      }

      // Reserved single-purpose rows (hero.menuExamplesCta, gallery
      // suitableFor*/ariaLabel, closing.*, banner.intro*/requestCta, etc.) —
      // just run the generic i18n checks on whichever of title/text/label is
      // actually populated; anything populated on a field the frontend never
      // reads for a given role would already have been caught by the
      // Studio-visibility test suite (contentItem.ts's ITEM_ROLE_RULES), not
      // this data-level audit.
      checkI18n(item.title, `${itemPath}.title`);
      checkI18n(item.text, `${itemPath}.text`);
      checkI18n(item.label, `${itemPath}.label`);
      checkIcon(item.icon, `${itemPath}.icon`);
      checkImage(item.image, `${itemPath}.image`, true);
    }
  }

  const duplicateSectionKeys = [...seenSectionKeys.entries()].filter(([, n]) => n > 1).map(([k]) => k);
  if (duplicateSectionKeys.length) report(base, "duplicate-sectionKey", duplicateSectionKeys.join(", "));
}

async function main() {
  console.log("== Catering CMS recursive audit ==\n");

  // --- page-catering / page-catering-menu-examples (published + draft) ---
  const pages = await client.fetch<RawPage[]>(
    `*[_id in ["page-catering", "drafts.page-catering", "page-catering-menu-examples", "drafts.page-catering-menu-examples"]]`,
  );
  for (const id of ["page-catering", "drafts.page-catering", "page-catering-menu-examples", "drafts.page-catering-menu-examples"]) {
    const doc = pages.find((p) => p._id === id);
    if (!doc) {
      console.log(`${id}: does not exist.`);
      continue;
    }
    console.log(`${id}: found, ${doc.sections?.length ?? 0} section(s) — auditing.`);
    walkPage(doc);
  }

  // --- duplicate pageKey across the whole `page` type (any page, not just Catering) ---
  const pageKeyRows = await client.fetch<{ pageKey?: string; _id: string }[]>(
    `*[_type == "page" && !(_id in path("drafts.**"))]{pageKey, _id}`,
  );
  const byKey = new Map<string, string[]>();
  for (const row of pageKeyRows) {
    if (!row.pageKey) continue;
    byKey.set(row.pageKey, [...(byKey.get(row.pageKey) ?? []), row._id]);
  }
  for (const [key, ids] of byKey) {
    if (ids.length > 1) report("(sitewide)", "duplicate-pageKey", `pageKey "${key}" used by: ${ids.join(", ")}`);
  }

  // --- legacy singletons: informational only, not a blocking finding ---
  const legacy = await client.fetch<{ _id: string; _type: string }[]>(
    `*[_type in ["cateringPage", "cateringMenuExamplesPage"]]{_id, _type}`,
  );
  console.log(`\nLegacy singletons present (informational, not read by the frontend): ${legacy.length ? legacy.map((d) => d._id).join(", ") : "none"}.`);

  const orphanedCategoryDocs = await client.fetch<{ _id: string }[]>(`*[_type == "cateringMenuCategory"]`);
  console.log(`cateringMenuCategory documents (expected 0 — orphaned schema type): ${orphanedCategoryDocs.length}.`);
  if (orphanedCategoryDocs.length) {
    report("(sitewide)", "unexpected-cateringMenuCategory-docs", orphanedCategoryDocs.map((d) => d._id).join(", "));
  }

  // --- summary ---
  console.log(`\n== Findings (${findings.length}) ==`);
  if (findings.length === 0) {
    console.log("None.");
  } else {
    for (const line of findings) console.log(`  ${line}`);
  }

  console.log(`\n== Summary ==`);
  const byKind = new Map<string, number>();
  for (const line of findings) {
    const kind = line.split(" -> ")[1]?.split(":")[0] ?? "unknown";
    byKind.set(kind, (byKind.get(kind) ?? 0) + 1);
  }
  for (const [kind, count] of byKind) console.log(`  ${kind}: ${count}`);
  if (findings.length === 0) console.log("  No blocking issues found.");
}

main().catch((error) => {
  console.error("audit-catering-i18n failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
