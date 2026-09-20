import type { FilterDefault } from "@sanity/client";

// Structural DISCRIMINATOR / control fields — never editorial copy. The
// resolver layer looks documents/sections/items up by an exact `===` (or
// `.includes`) match on these, so an encoded value silently misses:
//
//   lib/sanity-sections.ts     getSection(s => s.sectionKey === "hero")
//                              getItem(i => i.itemKey === "faqQuestion")
//                              getAction(a => a.actionKey === "primary")
//   lib/sanityGallery.ts       media.kind === "video"
//   lib/cateringMenuResolve.ts s.sectionKind === "menuCategory"
//   app/[locale]/(site)/page.tsx   m.kind === "video"
//   lib/eventVisibility.ts     event.visibleLocales.includes(locale)
//
// Stega encoding appends invisible characters to string VALUES. An encoded
// `sectionKey` of "hero␠␠␠…" is no longer `=== "hero"`, so the lookup misses,
// the page renders its hardcoded English fallback — no Visual Editing overlay
// (the text isn't from Sanity) AND no localization (`pickLocalized` never
// runs). Navigation/footer are immune only because they resolve positionally.
//
// `@sanity/client`'s built-in denylist already skips `key`, `language`,
// `slug`, `href`, `icon`, `type`, `id`, `index`, `url`, `platform`, `variant`
// (see its `filterDefault`). This adds only the project-specific ones that
// were verified at real frontend call sites. Every VISIBLE editorial string
// (labels, headings, paragraphs, button text, alt text, …) is still encoded,
// so its Content Source Map reaches `<VisualEditing />` intact.
const DISCRIMINATOR_LEAF_FIELDS: ReadonlySet<string> = new Set([
  "sectionKey",
  "sectionKind",
  "itemKey",
  "actionKey",
  "pageKey",
  "kind",
]);

// Fields whose value is a control token even though a same-named field is
// editorial elsewhere — matched by an ancestor path segment, not the leaf:
//   pageSection.settings[].value  → "true"/"false"/variant, read by getSetting()
//   event.visibleLocales[]        → "en"/"da"/"uk", read by isEventVisibleInLocale()
// (`contentItem.value` bank-detail strings are NOT under either, so they stay
// editorial and encoded.)
const CONTROL_PARENT_SEGMENTS: readonly string[] = ["settings", "visibleLocales"];

type Segment = string | number | { _key: string };

function isNonEditorial(path: readonly Segment[]): boolean {
  const leaf = path[path.length - 1];
  if (typeof leaf === "string" && DISCRIMINATOR_LEAF_FIELDS.has(leaf)) return true;
  if (path.some((s) => typeof s === "string" && CONTROL_PARENT_SEGMENTS.includes(s))) {
    // only the primitive leaf under that array/object, not the container itself
    if (typeof leaf === "string" || typeof leaf === "number") return true;
  }
  return false;
}

/**
 * `stega.filter` for the Live client (sanity/lib/live.ts). Skips encoding for
 * structural discriminator / control fields; defers everything else to the
 * built-in default so ordinary editorial text keeps its source map.
 */
export const stegaFilter: FilterDefault = (props) => {
  if (isNonEditorial(props.sourcePath) || isNonEditorial(props.resultPath)) {
    return false;
  }
  return props.filterDefault(props);
};
