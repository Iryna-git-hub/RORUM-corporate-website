// Pure-function tests for resolveGalleryItems — the mixed photo/video
// resolver shared by the Catering, Event Decoration, and Host at RORUM
// galleries. `@/sanity/lib/image`'s real urlForImage/urlForFile depend on
// NEXT_PUBLIC_SANITY_PROJECT_ID/_DATASET (unset in this test environment,
// so they'd always return undefined) — mocked here with deterministic fake
// CDN URL builders so the RESOLUTION LOGIC (precedence, fallback, dropped
// items) is what's actually under test, independent of real Sanity config.
import { describe, expect, it, vi } from "vitest";

vi.mock("@/sanity/lib/image", () => ({
  urlForImage: vi.fn((source: { asset?: { _ref?: string } } | undefined | null) => {
    const ref = source?.asset?._ref;
    if (!ref) return undefined;
    return { width: () => ({ url: () => `https://cdn.test/image/${ref}.jpg` }) };
  }),
  urlForFile: vi.fn((source: { asset?: { _ref?: string } } | undefined | null) => {
    const ref = source?.asset?._ref;
    return ref ? `https://cdn.test/file/${ref}.mp4` : undefined;
  }),
}));

import { resolveGalleryItems } from "./sanityGallery";
import { cateringGalleryImages, eventDecorationGalleryImages, hostAtRorumGalleryImages } from "./galleryImages";
import type { MediaItem } from "@/sanity.types";

const LOCALE = "en" as const;

function imageItem(overrides: Partial<MediaItem> & { _key?: string } = {}): MediaItem & { _key?: string } {
  return {
    _type: "mediaItem",
    kind: "image",
    image: { _type: "image", asset: { _type: "reference", _ref: "image-abc-800x600-jpg" } },
    alt: [{ _key: "en", _type: "internationalizedArrayStringValue", language: "en", value: "A photo" }],
    ...overrides,
  };
}

function videoItem(overrides: Partial<MediaItem> & { _key?: string } = {}): MediaItem & { _key?: string } {
  return {
    _type: "mediaItem",
    kind: "video",
    alt: [{ _key: "en", _type: "internationalizedArrayStringValue", language: "en", value: "A video" }],
    ...overrides,
  };
}

describe("resolveGalleryItems — images", () => {
  it("resolves a real uploaded image to its CDN URL and localized alt", () => {
    const [item] = resolveGalleryItems([imageItem()], LOCALE, []);
    expect(item).toEqual({ kind: "image", src: "https://cdn.test/image/image-abc-800x600-jpg.jpg", alt: "A photo" });
  });

  it("falls back to the positional static fallback src when the Sanity image has no asset, but keeps the item's own real alt text", () => {
    const [item] = resolveGalleryItems([imageItem({ image: undefined })], LOCALE, [{ src: "/fallback.png", alt: "Fallback" }]);
    expect(item).toEqual({ kind: "image", src: "/fallback.png", alt: "A photo" });
  });

  it("falls back to the positional fallback's alt too when the item has no alt of its own", () => {
    const [item] = resolveGalleryItems([imageItem({ image: undefined, alt: undefined })], LOCALE, [{ src: "/fallback.png", alt: "Fallback" }]);
    expect(item).toEqual({ kind: "image", src: "/fallback.png", alt: "Fallback" });
  });

  it("returns the full fallback set, wrapped as image items, when the whole media array is missing", () => {
    const result = resolveGalleryItems(undefined, LOCALE, [{ src: "/a.png", alt: "A" }, { src: "/b.png", alt: "B" }]);
    expect(result).toEqual([{ kind: "image", src: "/a.png", alt: "A" }, { kind: "image", src: "/b.png", alt: "B" }]);
  });

  it("treats an empty array the same as a missing one (falls back) — the 'section present but intentionally emptied -> []' distinction is the CALLER's responsibility, not this function's; the 3 page.tsx call sites never call this function at all in that case, returning [] directly themselves instead", () => {
    const result = resolveGalleryItems([], LOCALE, [{ src: "/a.png", alt: "A" }]);
    expect(result).toEqual([{ kind: "image", src: "/a.png", alt: "A" }]);
  });
});

describe("resolveGalleryItems — videos", () => {
  it("resolves an uploaded Sanity video asset to a playable URL and accessible label", () => {
    const [item] = resolveGalleryItems(
      [videoItem({ videoFile: { _type: "file", asset: { _type: "reference", _ref: "file-def-mp4" } } })],
      LOCALE,
      [],
    );
    expect(item).toEqual({ kind: "video", src: "https://cdn.test/file/file-def-mp4.mp4", accessibleLabel: "A video" });
  });

  // Product decision: a separate poster can crop/frame the video
  // differently and look wrong, so it's never resolved or included in the
  // video item contract at all — not merely left undefined. `posterImage`
  // on the source document (mediaItem.ts) is now hidden/unused site-wide;
  // this proves the resolver never reads it even if a legacy document still
  // has a stored value.
  it("never resolves or includes a poster, even when the source document has a stored posterImage value", () => {
    const [item] = resolveGalleryItems(
      [videoItem({ videoFile: { _type: "file", asset: { _type: "reference", _ref: "file-def-mp4" } }, posterImage: { _type: "image", asset: { _type: "reference", _ref: "image-poster-jpg" } } })],
      LOCALE,
      [],
    );
    expect(item).not.toHaveProperty("poster");
    expect(Object.keys(item!)).toEqual(["kind", "src", "accessibleLabel"]);
  });

  it("resolves a valid direct video-file URL when no file is uploaded", () => {
    const [item] = resolveGalleryItems([videoItem({ videoUrl: "https://example.com/clip.mp4" })], LOCALE, []);
    expect(item).toEqual({ kind: "video", src: "https://example.com/clip.mp4", accessibleLabel: "A video" });
  });

  it("the uploaded file takes precedence over an external videoUrl when both are present", () => {
    const [item] = resolveGalleryItems(
      [videoItem({ videoFile: { _type: "file", asset: { _type: "reference", _ref: "file-uploaded-mp4" } }, videoUrl: "https://example.com/ignored.mp4" })],
      LOCALE,
      [],
    );
    expect(item?.kind).toBe("video");
    expect((item as { src: string }).src).toBe("https://cdn.test/file/file-uploaded-mp4.mp4");
  });

  it("drops a video whose videoUrl is a YouTube watch-page link — never puts it in <video src>", () => {
    const result = resolveGalleryItems([videoItem({ videoUrl: "https://www.youtube.com/watch?v=abc123" })], LOCALE, []);
    expect(result).toEqual([]);
  });

  it("drops a video whose videoUrl is a Vimeo watch-page link", () => {
    const result = resolveGalleryItems([videoItem({ videoUrl: "https://vimeo.com/123456" })], LOCALE, []);
    expect(result).toEqual([]);
  });

  it("drops a video whose videoUrl is an ordinary webpage, not a video file", () => {
    const result = resolveGalleryItems([videoItem({ videoUrl: "https://example.com/about-us" })], LOCALE, []);
    expect(result).toEqual([]);
  });

  it("drops a video with no uploaded file and no videoUrl at all — never blank, never resurrects a static photo", () => {
    const result = resolveGalleryItems([videoItem()], LOCALE, [{ src: "/unrelated-fallback.png", alt: "Unrelated" }]);
    expect(result).toEqual([]);
  });

  it("accepts a relative direct video-file URL (e.g. /videos/x.mp4), matching the existing static-file convention", () => {
    const [item] = resolveGalleryItems([videoItem({ videoUrl: "/videos/clip.webm" })], LOCALE, []);
    expect(item).toEqual({ kind: "video", src: "/videos/clip.webm", accessibleLabel: "A video" });
  });

  // A missing poster is not a reason to omit a video: it never was one
  // (poster was always optional at this layer, even before the
  // poster-removal decision), and now poster isn't part of the contract at
  // all, so there's nothing to be "missing". A video with a real, playable
  // `src` is always kept — only a video with no usable source at all (see
  // the "no uploaded file and no videoUrl" test above) is omitted.
  it("a video with a valid source is kept regardless of any stored posterImage on the source document", () => {
    const result = resolveGalleryItems([videoItem({ videoUrl: "https://example.com/video.mp4", posterImage: undefined })], LOCALE, []);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ kind: "video", src: "https://example.com/video.mp4", accessibleLabel: "A video" });
  });
});

describe("resolveGalleryItems — mixed order and per-item independence", () => {
  it("preserves original Sanity array order across photos and videos — one shared ordered array, never separate reordered lists", () => {
    const result = resolveGalleryItems(
      [imageItem({ image: { _type: "image", asset: { _type: "reference", _ref: "image-1-jpg" } } }), videoItem({ videoUrl: "https://example.com/v.mp4" }), imageItem({ image: { _type: "image", asset: { _type: "reference", _ref: "image-2-jpg" } } })],
      LOCALE,
      [],
    );
    expect(result.map((i) => i.kind)).toEqual(["image", "video", "image"]);
    expect((result[0] as { src: string }).src).toContain("image-1-jpg");
    expect((result[2] as { src: string }).src).toContain("image-2-jpg");
  });

  it("one invalid item (unsupported video URL) is dropped without affecting the surrounding valid items' order", () => {
    const result = resolveGalleryItems(
      [imageItem({ image: { _type: "image", asset: { _type: "reference", _ref: "image-1-jpg" } } }), videoItem({ videoUrl: "https://youtube.com/watch?v=x" }), imageItem({ image: { _type: "image", asset: { _type: "reference", _ref: "image-2-jpg" } } })],
      LOCALE,
      [],
    );
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.kind)).toEqual(["image", "image"]);
  });
});

describe("resolveGalleryItems — Event Decoration and Host at RORUM fallback data still resolves correctly (no regression)", () => {
  it("Catering's fallback set resolves to valid image items", () => {
    const result = resolveGalleryItems(undefined, LOCALE, cateringGalleryImages);
    expect(result).toHaveLength(cateringGalleryImages.length);
    expect(result.every((i) => i.kind === "image")).toBe(true);
  });

  it("Event Decoration's fallback set resolves to valid image items", () => {
    const result = resolveGalleryItems(undefined, LOCALE, eventDecorationGalleryImages);
    expect(result).toHaveLength(eventDecorationGalleryImages.length);
    expect(result.every((i) => i.kind === "image")).toBe(true);
  });

  it("Host at RORUM's fallback set resolves to valid image items", () => {
    const result = resolveGalleryItems(undefined, LOCALE, hostAtRorumGalleryImages);
    expect(result).toHaveLength(hostAtRorumGalleryImages.length);
    expect(result.every((i) => i.kind === "image")).toBe(true);
  });
});
