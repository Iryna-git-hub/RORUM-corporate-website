/**
 * READ-ONLY. Studio field-visibility + section-order audit for every `page`
 * document.
 *
 * For each section it prints, side by side:
 *   - which pageSection fields actually hold data in the live published doc
 *   - which fields the schema's SECTION_FIELD_VISIBILITY allow-list shows the editor
 *   - MISMATCH markers:
 *       VISIBLE-BUT-EMPTY   field shown to the editor but never populated (usually fine — "fill me in")
 *       POPULATED-BUT-HIDDEN field has data the editor can't see/edit  ← always a bug
 *   - stale allow-list keys (declared for a section that no longer exists)
 *   - sections present in the dataset with no explicit allow-list entry
 *
 * It also prints each page's stored section order so it can be eyeballed
 * against the rendered page order (Studio shows sections in stored order;
 * the frontend looks them up by key, so order is display-only — reorder in
 * Studio if it drifts).
 *
 * Never writes anything. Usage:  npm run sanity:audit-sections
 */
import { createClient } from "@sanity/client";
import {
  SECTION_FIELD_VISIBILITY,
  PAGE_SECTION_FIELDS,
  resolveVisibleSectionFields,
} from "@/sanity/schemaTypes/objects/pageSection";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "published",
});

const OPEN_SET_KINDS = new Set(["menuCategory", "faqCategory"]);

// The section order each page's Studio editor should show — the SAME
// top-to-bottom order the rendered website uses (the frontend looks sections
// up by key, so the stored array order is purely the Studio display order;
// if it drifts, reorder the sections in Studio). Verified against each
// page.tsx's render order.
const EXPECTED_SECTION_ORDER: Record<string, string[]> = {
  "page-home": ["hero", "quickPaths", "eventsStrip", "editorialAttendEvents", "editorialHostAtRorum", "servicesTeaser", "communityTeaser", "closingCta"],
  "page-about": ["hero", "statement", "community", "pillars", "closingCta"],
  "page-catering": ["hero", "gallery", "menuFormats", "philosophy", "steps", "inquiryForm"],
  "page-community-membership": ["hero", "donation", "intro", "benefits", "application", "gallery"],
  "page-contact": ["hero", "form"],
  "page-event-decoration": ["hero", "gallery", "styling", "steps", "inquiryForm"],
  "page-events": ["hero", "filters", "closingCta"],
  "page-host-at-rorum": ["hero", "gallery", "session", "packages", "steps", "inquiryForm"],
  "page-volunteer": ["hero", "applicationForm"],
  "page-work-with-us": ["hero", "features", "cvUploadForm"],
  // page-faq / page-catering-menu-examples: hero/banner first, then an
  // open-ended set of category sections — order within the set is editorial.
};

// `<page-id>:<sectionKey>:<field>` combinations where the live document holds
// data the editor deliberately cannot see — dead/legacy values kept only so
// nothing is destroyed. Reported as "obsolete (documented)", never a bug.
// See SANITY_MIGRATION.md §20.13.
const KNOWN_OBSOLETE = new Set<string>([
  "page-home:closingCta:settings", // legacy `variant=final` — frontend hardcodes variant="final" in JSX
  "page-about:closingCta:settings", // same
  "page-events:closingCta:settings", // legacy `variant=host` — frontend hardcodes variant="host"
  "page-home:editorialHostAtRorum:settings", // legacy `variant=reversed` — frontend hardcodes `reversed`
]);

function hasData(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    if (value[0] && typeof value[0] === "object" && "language" in (value[0] as object)) {
      return value.some((e: { value?: unknown }) => (typeof e.value === "string" ? e.value.trim() !== "" : Boolean(e.value)));
    }
    return true;
  }
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

async function main() {
  const pages = await client.fetch<{ _id: string; pageKey?: string; sections?: Record<string, unknown>[] }[]>(
    `*[_type == "page"]{ _id, pageKey, sections }`,
  );

  const liveKeys = new Set<string>();
  let bugs = 0;
  let obsolete = 0;
  let unlisted = 0;
  let orderDrift = 0;

  for (const page of pages.sort((a, b) => a._id.localeCompare(b._id))) {
    console.log(`\n################ ${page._id} ################`);
    const storedOrder = (page.sections ?? []).map((s) => String(s.sectionKey));
    console.log(`  stored section order: ${storedOrder.join("  →  ")}`);
    const expectedOrder = EXPECTED_SECTION_ORDER[page._id];
    if (expectedOrder && storedOrder.join("|") !== expectedOrder.join("|")) {
      console.log(`  ⚠ SECTION ORDER DRIFT — expected: ${expectedOrder.join("  →  ")}  (reorder in Studio)`);
      orderDrift++;
    }
    for (const section of page.sections ?? []) {
      const sectionKey = String(section.sectionKey);
      const sectionKind = String(section.sectionKind);
      const key = `${page._id}:${sectionKey}`;
      const isOpenSet = OPEN_SET_KINDS.has(sectionKind);
      if (!isOpenSet) liveKeys.add(key);

      const explicit = SECTION_FIELD_VISIBILITY[key];
      // Ask the real schema resolver — exactly what `fieldHidden` uses.
      const visible = resolveVisibleSectionFields({ _id: page._id }, { sectionKind, sectionKey });
      const source = explicit ? "allow-list" : isOpenSet ? `kind:${sectionKind} (open set)` : `kind:${sectionKind} (NO ALLOW-LIST ENTRY)`;
      if (!explicit && !isOpenSet) unlisted++;

      const populated = PAGE_SECTION_FIELDS.filter((f) => hasData(section[f]));
      const shown = PAGE_SECTION_FIELDS.filter((f) => visible.has(f));
      const populatedButHidden = populated.filter((f) => !visible.has(f));
      const visibleButEmpty = shown.filter((f) => !populated.includes(f));

      console.log(`\n  [${sectionKey}]  kind=${sectionKind}  (${source})`);
      console.log(`      populated: ${populated.join(", ") || "(none)"}`);
      console.log(`      shown    : ${shown.join(", ") || "(none)"}`);
      const realBugs = populatedButHidden.filter((f) => !KNOWN_OBSOLETE.has(`${key}:${f}`));
      const documentedObsolete = populatedButHidden.filter((f) => KNOWN_OBSOLETE.has(`${key}:${f}`));
      if (realBugs.length) {
        console.log(`      🐛 POPULATED-BUT-HIDDEN (bug): ${realBugs.join(", ")}`);
        bugs += realBugs.length;
      }
      if (documentedObsolete.length) {
        console.log(`      ·  obsolete (documented, data preserved): ${documentedObsolete.join(", ")}`);
        obsolete += documentedObsolete.length;
      }
      if (visibleButEmpty.length) {
        console.log(`      ·  visible-but-empty: ${visibleButEmpty.join(", ")}`);
      }
    }
  }

  const stale = Object.keys(SECTION_FIELD_VISIBILITY).filter((k) => !liveKeys.has(k));
  console.log(`\n================ SUMMARY ================`);
  console.log(`  POPULATED-BUT-HIDDEN fields (bugs): ${bugs}`);
  console.log(`  obsolete stored fields (hidden, documented, data preserved): ${obsolete}`);
  console.log(`  live sections with no allow-list entry (fell back to kind): ${unlisted}`);
  console.log(`  stale allow-list keys (declared, no live section): ${stale.length ? stale.join(", ") : "none"}`);
  console.log(`  pages with section-order drift: ${orderDrift}`);
  if (bugs > 0 || stale.length > 0 || orderDrift > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("audit-page-sections failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
