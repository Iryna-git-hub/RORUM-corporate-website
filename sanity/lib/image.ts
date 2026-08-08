import createImageUrlBuilder from "@sanity/image-url";
import type { Image } from "sanity";
import { dataset, projectId } from "@/sanity/env";

const builder =
  projectId && dataset ? createImageUrlBuilder({ projectId, dataset }) : undefined;

/**
 * Builds a Sanity image CDN URL builder for the given image reference.
 * Returns `undefined` when Sanity isn't configured so callers can fall back
 * to a static asset instead of throwing.
 */
export function urlForImage(source: Image | undefined | null) {
  if (!source?.asset?._ref || !builder) return undefined;
  return builder.image(source).auto("format").fit("max");
}
