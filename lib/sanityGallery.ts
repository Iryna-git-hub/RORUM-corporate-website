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
 * relative to each other. Falls back to the page's static photo set only
 * when the whole `media` array is missing/empty (the "document missing" vs
 * "intentionally emptied" distinction is the caller's responsibility — see
 * app/[locale]/(site)/catering/page.tsx's own comment on this).
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
