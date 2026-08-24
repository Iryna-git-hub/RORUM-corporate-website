// Shared between mediaItem.ts's own schema (hidden/validation) and
// sanity/components/GalleryMediaAltInput.tsx (the always-show-EN/DA/UK
// Studio input) — kept in a dependency-free module so neither file needs to
// import the other (mediaItem.ts is schema-definition code; the input
// component is a "use client" React component reading Studio form state —
// mixing them via a direct cross-import would be circular).
//
// `isHomeDecorativeBackgroundMedia` and `isInformativeMedia` (its exact
// inverse) are ONE classification, not two: whatever mediaItem.ts's own
// `alt` field treats as "hidden + validation skipped" (decorative) is
// EXACTLY what must never get the always-visible-3-rows input either, and
// whatever it treats as required (informative) must ALWAYS get that input —
// there is deliberately no separate, narrower scope for the input than for
// validation, because a narrower UI scope is exactly the bug this file
// exists to prevent: Event Decoration's `styling.media[image]` (informative,
// alt-required, blocking Publish) was invisible to an earlier, narrower
// "gallery section only" version of this predicate, even though the SAME
// document's `gallery` section media correctly got the always-visible UI.
export const HOME_DECORATIVE_BACKGROUND_SECTION_KEYS = new Set(["hero", "communityTeaser"]);

interface MediaDocumentContext {
  _id?: string;
  sections?: { sectionKey?: string; media?: { _key?: string }[] }[];
}
interface MediaParentContext {
  _key?: string;
}

/**
 * True only for Home's hero/communityTeaser background media: a plain CSS
 * background-image with no accessible-image semantics anywhere in the
 * component that renders it (no `role="img"`, no aria-label) — confirmed by
 * reading components/ui.tsx's HomeHero and
 * components/HomeEditorialSections.tsx's CommunityTeaserSection before
 * adding either entry. NOT the same as every section literally keyed
 * "hero"/"communityTeaser" site-wide: 11 of the site's other 12 pages also
 * have a "hero" section, and About's has 3 media items — clearly not a
 * single decorative background there. Matching on `document._id` first
 * means no other page's media is ever affected by this, regardless of how
 * that page's own components happen to render alt text.
 *
 * `parent` is the mediaItem object itself (has its own `_key`); the
 * enclosing section is found by walking `document.sections` — no
 * `path`/grandparent access needed.
 */
export function isHomeDecorativeBackgroundMedia(document: unknown, parent: unknown): boolean {
  const doc = document as MediaDocumentContext | undefined;
  const docId = doc?._id?.replace(/^drafts\./, "");
  if (docId !== "page-home") return false;
  const mediaKey = (parent as MediaParentContext | undefined)?._key;
  if (!mediaKey) return false;
  return !!doc?.sections?.some(
    (s) => s.sectionKey && HOME_DECORATIVE_BACKGROUND_SECTION_KEYS.has(s.sectionKey) && s.media?.some((m) => m._key === mediaKey),
  );
}

/**
 * The exact inverse of `isHomeDecorativeBackgroundMedia` — every mediaItem
 * this returns `true` for has alt text that is genuinely required (via
 * mediaItem.ts's own `requireAllLanguages({ skip: isHomeDecorativeBackgroundMedia })`),
 * on every page and every section, not just the 3 HorizontalGallery
 * galleries. `GalleryMediaAltInput` uses this single predicate to decide
 * whether to show the always-visible EN/DA/UK rows — so its scope can never
 * drift narrower (missing a real blocker, as `styling.media[image]` was)
 * or broader (showing the UI somewhere alt isn't even required) than what
 * validation actually enforces.
 */
export function isInformativeMedia(document: unknown, parent: unknown): boolean {
  return !isHomeDecorativeBackgroundMedia(document, parent);
}
