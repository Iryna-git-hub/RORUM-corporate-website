import { pickLocalized } from "@/lib/sanity-i18n";
import type { Locale } from "@/lib/i18n";
import type { GalleryImage } from "@/lib/galleryImages";
import { urlForImage } from "@/sanity/lib/image";
import type { ImageWithAlt } from "@/sanity.types";

// Shared by every page that renders a `HorizontalGallery` backed by its own
// `gallery` field (catering / event-decoration / host-at-rorum page
// singletons). Falls back to the matching static image, by index, when
// Sanity has no asset for a given slot — same fallback convention as
// everywhere else content is Sanity-fetched.
export function resolveGalleryImages(
  images: ImageWithAlt[] | null | undefined,
  locale: Locale,
  fallback: GalleryImage[],
): GalleryImage[] {
  if (!images?.length) return fallback;
  return images.map((image, i) => ({
    src:
      urlForImage(image as unknown as Parameters<typeof urlForImage>[0])
        ?.width(900)
        .url() ?? fallback[i]?.src ?? "",
    alt: pickLocalized(image.alt, locale) ?? fallback[i]?.alt ?? "",
  }));
}
