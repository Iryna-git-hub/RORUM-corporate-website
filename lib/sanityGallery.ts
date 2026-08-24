import { pickLocalized } from "@/lib/sanity-i18n";
import type { Locale } from "@/lib/i18n";
import type { GalleryImage } from "@/lib/galleryImages";
import type { HorizontalGalleryItem } from "@/components/HorizontalGallery";
import { urlForFile, urlForImage } from "@/sanity/lib/image";
import { isDirectVideoFileUrl } from "@/sanity/lib/videoUrl";
import type { MediaItem } from "@/sanity.types";

function devWarn(message: string) {
  if (process.env.NODE_ENV !== "production") console.warn(`resolveGalleryItems: ${message}`);
}

/**
 * Resolves one raw Sanity `mediaItem` (photo or video) to a
 * `HorizontalGalleryItem`, or `undefined` if it can't be resolved to
 * anything playable/showable — the caller drops `undefined` results rather
 * than ever resurrecting an unrelated static fallback photo in its place
 * (a broken video is not "an image that failed to load").
 *
 * `fallbackId` is used only when `media._key` is missing (shouldn't happen
 * in practice — Sanity always assigns `_key` to array-of-objects items —
 * but keeps id generation total rather than throwing on malformed data).
 */
function resolveOne(media: MediaItem & { _key?: string }, locale: Locale, fallbackImage: GalleryImage | undefined, fallbackId: string): HorizontalGalleryItem | undefined {
  const alt = pickLocalized(media.alt, locale) ?? fallbackImage?.alt ?? "";
  const id = media._key ?? fallbackId;

  if (media.kind === "video") {
    // Uploaded file takes precedence over an external URL (matches the
    // field's own description: "used only if no file is uploaded above").
    const uploadedSrc = urlForFile(media.videoFile);
    let src = uploadedSrc;
    if (!src && media.videoUrl?.trim()) {
      if (isDirectVideoFileUrl(media.videoUrl)) {
        src = media.videoUrl.trim();
      } else {
        // Schema validation (mediaItem.ts) should have already rejected
        // this at save time — this is defense in depth for data written
        // before that validation existed, or by a script. Never put a
        // non-file URL (e.g. a YouTube/Vimeo watch page) into <video src>.
        devWarn(`dropping video item with an unsupported videoUrl (not a direct video-file URL): ${media.videoUrl}`);
      }
    }
    if (!src) {
      devWarn(`dropping video item with no resolvable source (no uploaded file, no valid videoUrl) — _key: ${media._key ?? "(none)"}`);
      return undefined;
    }
    // No poster resolved or included: a separate poster image can have a
    // different crop/aspect ratio than the video and render incorrectly —
    // the gallery deliberately shows the video's own frame instead (see
    // components/HorizontalGallery.tsx and mediaItem.ts's posterImage
    // field, which is now unused/hidden site-wide).
    return { id, kind: "video", src, accessibleLabel: alt || "Video" };
  }

  // Photo (default/undefined kind is treated as a photo, matching the
  // schema's own `initialValue: "image"`).
  const src = urlForImage(media.image as unknown as Parameters<typeof urlForImage>[0])?.width(900).url() ?? fallbackImage?.src;
  if (!src) {
    devWarn(`dropping image item with no resolvable source and no positional fallback — _key: ${media._key ?? "(none)"}`);
    return undefined;
  }
  return { id, kind: "image", src, alt };
}

/**
 * Shared by every page that renders a `HorizontalGallery` backed by its own
 * `gallery` field (catering / event-decoration / host-at-rorum page
 * documents). Preserves the manager's original Sanity array order across
 * photos and videos — never splits into separate arrays that could reorder
 * relative to each other. Falls back to the page's static photo set when
 * the given `media` array is missing/empty — this function alone can't
 * distinguish "the canonical gallery section doesn't exist at all" from
 * "it exists but was intentionally emptied," since it only ever receives
 * an array (or `undefined`), never the section itself. Callers that need
 * that distinction (all 3 current ones do) should use
 * `resolveCanonicalGalleryItems` below instead of calling this directly
 * with a section's `media` field.
 */
export function resolveGalleryItems(
  media: (MediaItem & { _key?: string })[] | null | undefined,
  locale: Locale,
  fallback: GalleryImage[],
): HorizontalGalleryItem[] {
  if (!media?.length) return fallback.map((f, i) => ({ id: `fallback-${i}`, kind: "image" as const, ...f }));
  return media
    .map((item, i) => resolveOne(item, locale, fallback[i], `fallback-media-${i}`))
    .filter((item): item is HorizontalGalleryItem => item !== undefined);
}

/**
 * The single shared "missing vs. intentionally-empty" policy for a page's
 * canonical `gallery` section — used by Catering, Event Decoration, and
 * Host at RORUM alike (all 3 need the identical rule; see
 * MIGRATION_REPORT.md for the Event Decoration/Host at RORUM bug this
 * fixed: both previously used `gallerySection?.media?.length ? canonical :
 * legacy`, which silently resurrected legacy gallery photos the moment a
 * manager intentionally emptied the canonical gallery to `[]`, since an
 * empty array is just as falsy as a missing section to that ternary).
 *
 * Exactly 3 cases, resolved in order:
 *   1. `gallerySection` is `undefined`/`null` (the canonical page/section
 *      genuinely doesn't exist yet, e.g. before migration) — a documented
 *      legacy fallback is allowed: try `legacyMedia` first, and
 *      `resolveGalleryItems` itself falls through to the static emergency
 *      fallback (`fallback`) if that's also empty/undefined. Catering has
 *      no legacy singleton left to read (confirmed dead in production —
 *      see catering/page.tsx's own comment), so it simply never passes a
 *      `legacyMedia` argument, collapsing straight to the static fallback.
 *   2. `gallerySection` exists but `gallerySection.media` has no items —
 *      the manager's own intentional choice. Returns `[]`. Never touches
 *      `legacyMedia` or `fallback` — resurrecting either here would be
 *      exactly the bug this function exists to prevent.
 *   3. `gallerySection.media` has items — the real, ordered, mixed
 *      photo/video array, resolved as-is.
 *
 * `!isSanityConfigured` (Sanity unreachable entirely) is handled by each
 * page's own early-return branch, before this function is ever called —
 * not this function's concern.
 */
export function resolveCanonicalGalleryItems(
  gallerySection: { media?: (MediaItem & { _key?: string })[] | null } | null | undefined,
  locale: Locale,
  fallback: GalleryImage[],
  legacyMedia?: (MediaItem & { _key?: string })[] | null,
): HorizontalGalleryItem[] {
  if (!gallerySection) return resolveGalleryItems(legacyMedia, locale, fallback);
  if (!gallerySection.media?.length) return [];
  return resolveGalleryItems(gallerySection.media, locale, fallback);
}
