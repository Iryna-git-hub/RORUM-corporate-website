import { createDataAttribute } from "next-sanity";
import { dataset, projectId } from "@/sanity/env";

type PathSegment = string | { _key: string };

/**
 * Builds a `data-sanity` attribute value for a **non-string** editable field
 * (image / video / file / icon) so `<VisualEditing />` can draw a
 * click-to-edit overlay on it and open the right field in Studio.
 *
 * Text fields do NOT need this — their stega-encoded value already carries the
 * same source-map information invisibly (see sanity/lib/stegaFilter.ts). This
 * is only for elements that render no editable Sanity string of their own.
 *
 * `path` is the field path inside the document. Pointing it at a containing
 * array element (e.g. `["sections", { _key: heroKey }, "media", { _key: mediaKey }]`)
 * is intentional — Presentation focuses the whole `mediaItem`/`contentItem`,
 * which lets the editor swap the image, the video OR the icon from one
 * overlay; a stega-encoded string rendered inside the same element still
 * provides the finer field-level target.
 *
 * Returns `undefined` (so callers can spread it, and it never appears in
 * normal published HTML) unless `editable` is true — pass
 * `(await draftMode()).isEnabled` from the rendering Server Component. The
 * `drafts.` id prefix is stripped so the attribute always names the published
 * document, which is what Studio's document resolver expects.
 */
export function sanityFieldAttr(
  editable: boolean,
  docId: string | undefined | null,
  docType: string,
  path: PathSegment[],
): string | undefined {
  if (!editable || !projectId || !dataset || !docId || path.length === 0) return undefined;
  const publishedId = docId.replace(/^drafts\./, "");
  return createDataAttribute({ projectId, dataset, baseUrl: "/studio", id: publishedId, type: docType })
    .scope(path)
    .toString();
}

/**
 * `data-sanity` for one whole media element (photo or video) inside a `page`
 * document's `sections[].media[]`. `sectionKey`/`mediaKey` are the array
 * elements' own Sanity `_key`s (stable across reorders), NOT the `sectionKey`
 * discriminator field.
 */
export function sanitySectionMediaAttr(
  editable: boolean,
  docId: string | undefined | null,
  sectionKey: string | undefined | null,
  mediaKey: string | undefined | null,
): string | undefined {
  if (!sectionKey || !mediaKey) return undefined;
  return sanityFieldAttr(editable, docId, "page", [
    "sections",
    { _key: sectionKey },
    "media",
    { _key: mediaKey },
  ]);
}

/**
 * `data-sanity` for one whole `contentItem` element inside a `page`
 * document's `sections[].items[]` — used for list rows that render an image
 * and/or an editor-picked icon (quick-path cards, benefit cards, feature
 * bullets, trust badges, menu-format cards, …). Focuses the whole item so the
 * editor can change its image OR its icon; the row's stega text still targets
 * the specific string field.
 */
export function sanitySectionItemAttr(
  editable: boolean,
  docId: string | undefined | null,
  sectionKey: string | undefined | null,
  itemKey: string | undefined | null,
): string | undefined {
  if (!sectionKey || !itemKey) return undefined;
  return sanityFieldAttr(editable, docId, "page", [
    "sections",
    { _key: sectionKey },
    "items",
    { _key: itemKey },
  ]);
}

/** `data-sanity` for an `event` document's own banner image. */
export function sanityEventImageAttr(
  editable: boolean,
  eventId: string | undefined | null,
): string | undefined {
  return sanityFieldAttr(editable, eventId, "event", ["image"]);
}
