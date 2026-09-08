import { createImageUrlBuilder } from "@sanity/image-url";
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

/**
 * Builds a direct CDN URL for an uploaded Sanity file asset (e.g. the
 * homepage hero video) — `@sanity/image-url` only handles images, so file
 * assets are resolved by parsing their `_ref` (`file-<id>-<extension>`)
 * directly, matching Sanity's documented file-asset URL format.
 */
export function urlForFile(source: { asset?: { _ref?: string | null } | null } | undefined | null): string | undefined {
  const ref = source?.asset?._ref;
  if (!ref || !projectId || !dataset) return undefined;
  const match = /^file-([a-f0-9]+)-(\w+)$/.exec(ref);
  if (!match) return undefined;
  const [, id, extension] = match;
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${extension}`;
}
