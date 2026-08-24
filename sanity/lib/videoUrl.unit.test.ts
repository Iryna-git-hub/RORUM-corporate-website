// Tests for the shared direct-video-file-URL validation used by both the
// Studio schema (mediaItem.ts's `videoUrl` field) and the frontend
// (lib/sanityGallery.ts's resolution) — see sanity/lib/videoUrl.ts for the
// full rationale. Covers the exact cases the Catering Gallery mixed-media
// follow-up task called out: query strings, uppercase extensions, relative
// site URLs, provider-page rejection, ordinary-webpage rejection, malformed
// URLs, and an uploaded Sanity CDN file URL — plus the .mov/.m4v decision.
import { describe, expect, it } from "vitest";
import { detectWatchPageProvider, isDirectVideoFileUrl, videoUrlValidationMessage } from "./videoUrl";

describe("isDirectVideoFileUrl — accepted direct video files", () => {
  it("accepts a plain .mp4 URL", () => {
    expect(isDirectVideoFileUrl("https://example.com/video.mp4")).toBe(true);
  });

  it("accepts a .mp4 URL with a query string", () => {
    expect(isDirectVideoFileUrl("https://example.com/video.mp4?token=abc")).toBe(true);
  });

  it("accepts an uppercase .MP4 extension, case-insensitively", () => {
    expect(isDirectVideoFileUrl("https://example.com/VIDEO.MP4")).toBe(true);
  });

  it("accepts a relative site URL ending in .webm", () => {
    expect(isDirectVideoFileUrl("/videos/example.webm")).toBe(true);
  });

  it("accepts an HTTPS direct .webm URL", () => {
    expect(isDirectVideoFileUrl("https://example.com/clip.webm")).toBe(true);
  });

  it("accepts a URL with both a query string and a fragment", () => {
    expect(isDirectVideoFileUrl("https://example.com/video.mp4?token=abc#t=10")).toBe(true);
  });

  it("accepts an uploaded Sanity asset CDN file URL", () => {
    expect(
      isDirectVideoFileUrl("https://cdn.sanity.io/files/abc123/production/deadbeef1234.mp4"),
    ).toBe(true);
  });

  it("accepts .m4v (kept: usually an MP4-equivalent container, but re-audited as codec-dependent, not guaranteed like .mp4/.webm)", () => {
    expect(isDirectVideoFileUrl("https://example.com/video.m4v")).toBe(true);
  });
});

describe("isDirectVideoFileUrl — rejected inputs", () => {
  it("rejects a YouTube watch-page URL", () => {
    expect(isDirectVideoFileUrl("https://www.youtube.com/watch?v=abc123")).toBe(false);
  });

  it("rejects a Vimeo page URL", () => {
    expect(isDirectVideoFileUrl("https://vimeo.com/123456789")).toBe(false);
  });

  it("rejects an ordinary webpage URL with no video extension", () => {
    expect(isDirectVideoFileUrl("https://example.com/about-us")).toBe(false);
  });

  it("rejects an ordinary webpage URL whose query string merely contains something extension-shaped", () => {
    expect(isDirectVideoFileUrl("https://example.com/watch?next=/clip.mp4")).toBe(false);
  });

  it("rejects a malformed URL", () => {
    expect(isDirectVideoFileUrl("not a url at all")).toBe(false);
  });

  it("rejects .mov (excluded: QuickTime container's codec support is not reliably web-safe)", () => {
    expect(isDirectVideoFileUrl("https://example.com/video.mov")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isDirectVideoFileUrl("")).toBe(false);
  });
});

describe("detectWatchPageProvider", () => {
  it("identifies youtube.com", () => {
    expect(detectWatchPageProvider("https://www.youtube.com/watch?v=abc123")).toBe("YouTube");
  });

  it("identifies youtu.be", () => {
    expect(detectWatchPageProvider("https://youtu.be/abc123")).toBe("YouTube");
  });

  it("identifies vimeo.com", () => {
    expect(detectWatchPageProvider("https://vimeo.com/123456789")).toBe("Vimeo");
  });

  it("returns undefined for a direct video file URL", () => {
    expect(detectWatchPageProvider("https://example.com/video.mp4")).toBeUndefined();
  });

  it("returns undefined for a malformed URL", () => {
    expect(detectWatchPageProvider("not a url at all")).toBeUndefined();
  });
});

describe("videoUrlValidationMessage", () => {
  it("returns undefined (valid) for an empty/whitespace value — the field is optional", () => {
    expect(videoUrlValidationMessage("")).toBeUndefined();
    expect(videoUrlValidationMessage("   ")).toBeUndefined();
  });

  it("returns undefined (valid) for a direct .mp4 URL", () => {
    expect(videoUrlValidationMessage("https://example.com/video.mp4")).toBeUndefined();
  });

  it("gives a provider-specific bilingual message for a YouTube link", () => {
    const message = videoUrlValidationMessage("https://www.youtube.com/watch?v=abc123");
    expect(message).toContain("YouTube");
    expect(message).toContain("не можна відтворити напряму");
  });

  it("gives the generic bilingual message for an ordinary webpage link", () => {
    const message = videoUrlValidationMessage("https://example.com/about-us");
    expect(message).toContain("direct link to a video file");
    expect(message).toContain("Це має бути пряме посилання");
  });
});
