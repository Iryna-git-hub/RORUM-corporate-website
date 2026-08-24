// Component-level tests for the real HorizontalGallery rendering logic —
// proves mixed photo/video items render correctly, videos never appear in
// the photo-only lightbox, controls/accessible-label/no-autoplay are
// present, order is preserved, an empty/all-broken gallery never crashes
// (renders nothing instead), and — per the poster-removal product decision —
// no video ever shows, loads, or requests a separate poster/thumbnail image
// at any point (mount, loading, or runtime failure). Every video shows its
// own frame only.
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { HorizontalGallery, type HorizontalGalleryItem } from "./HorizontalGallery";

beforeEach(() => {
  // jsdom has no real scroll-container layout — HorizontalGallery calls
  // Element.scrollTo when the prev/next arrow buttons are clicked.
  window.HTMLElement.prototype.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
});

const photo1: HorizontalGalleryItem = { kind: "image", src: "/photo1.jpg", alt: "First photo" };
const photo2: HorizontalGalleryItem = { kind: "image", src: "/photo2.jpg", alt: "Second photo" };
const video1: HorizontalGalleryItem = { kind: "video", src: "/clip.mp4", accessibleLabel: "A short clip" };

describe("HorizontalGallery — empty and photo-only (no regression)", () => {
  it("renders nothing (no crash) for an empty item list", () => {
    const { container } = render(<HorizontalGallery items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("a photo-only gallery renders every image and opens the lightbox on click, unchanged from before", async () => {
    render(<HorizontalGallery items={[photo1, photo2]} />);
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "/photo1.jpg");
    expect(images[0]).toHaveAttribute("alt", "First photo");

    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    expect(screen.getByRole("dialog", { name: "Image preview" })).toBeInTheDocument();
  });
});

describe("HorizontalGallery — video rendering (no poster, ever)", () => {
  it("renders a video item as a real <video> with controls, preload=metadata, and no autoplay", () => {
    render(<HorizontalGallery items={[video1]} />);
    const video = document.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "/clip.mp4");
    expect(video).toHaveAttribute("preload", "metadata");
    expect(video).toHaveAttribute("controls");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("playsinline");
  });

  it("the rendered <video> never has a poster attribute — the video shows its own frame only", () => {
    render(<HorizontalGallery items={[video1]} />);
    expect(document.querySelector("video")).not.toHaveAttribute("poster");
  });

  it("the video item's container has no <img> at all — nothing is ever pre-loaded as a poster", () => {
    const { container } = render(<HorizontalGallery items={[video1]} />);
    const item = container.querySelector(".horizontal-gallery-video-item")!;
    expect(item.querySelector("img")).not.toBeInTheDocument();
  });

  it("uses the video's accessibleLabel as its aria-label", () => {
    render(<HorizontalGallery items={[video1]} />);
    expect(document.querySelector("video")).toHaveAttribute("aria-label", "A short clip");
  });

  it("a video item is not wrapped in a lightbox-opening button — clicking it does not open the image lightbox", () => {
    render(<HorizontalGallery items={[video1]} />);
    expect(screen.queryByRole("button", { name: /Open gallery image/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("HorizontalGallery — loading state (before the video's own frame is available)", () => {
  it("shows a neutral loading overlay (no image) before loadeddata/canplay fires", () => {
    const { container } = render(<HorizontalGallery items={[video1]} />);
    const overlay = container.querySelector(".horizontal-gallery-video-loading");
    expect(overlay).toBeInTheDocument();
    expect(overlay!.querySelector("img")).not.toBeInTheDocument();
  });

  it("clears the loading overlay once the video fires loadeddata", () => {
    const { container } = render(<HorizontalGallery items={[video1]} />);
    fireEvent(document.querySelector("video")!, new Event("loadeddata"));
    expect(container.querySelector(".horizontal-gallery-video-loading")).not.toBeInTheDocument();
  });

  it("clears the loading overlay once the video fires canplay (either event is sufficient)", () => {
    const { container } = render(<HorizontalGallery items={[video1]} />);
    fireEvent(document.querySelector("video")!, new Event("canplay"));
    expect(container.querySelector(".horizontal-gallery-video-loading")).not.toBeInTheDocument();
  });

  it("does not show the loading overlay if the video element already has a current frame when it mounts (cached media)", () => {
    // Simulate jsdom's HTMLMediaElement already reporting readyState >=
    // HAVE_CURRENT_DATA at mount time, matching a cached video whose
    // loadeddata/canplay may already have fired before this component's
    // ref callback runs.
    const originalDescriptor = Object.getOwnPropertyDescriptor(window.HTMLMediaElement.prototype, "readyState");
    Object.defineProperty(window.HTMLMediaElement.prototype, "readyState", { configurable: true, get: () => 4 });
    try {
      const { container } = render(<HorizontalGallery items={[video1]} />);
      expect(container.querySelector(".horizontal-gallery-video-loading")).not.toBeInTheDocument();
    } finally {
      if (originalDescriptor) Object.defineProperty(window.HTMLMediaElement.prototype, "readyState", originalDescriptor);
    }
  });

  it("the video itself is still rendered (and loading) while the overlay is up — not hidden/removed", () => {
    render(<HorizontalGallery items={[video1]} />);
    expect(document.querySelector("video")).toBeInTheDocument();
  });
});

describe("HorizontalGallery — mixed photo/video order and lightbox isolation", () => {
  it("preserves the original mixed order in the DOM (photo, video, photo)", () => {
    const { container } = render(<HorizontalGallery items={[photo1, video1, photo2]} />);
    const track = container.querySelector(".horizontal-gallery-track")!;
    const children = Array.from(track.children);
    expect(children).toHaveLength(3);
    expect(children[0]!.querySelector("img")).toHaveAttribute("src", "/photo1.jpg");
    expect(children[1]!.querySelector("video")).toHaveAttribute("src", "/clip.mp4");
    expect(children[2]!.querySelector("img")).toHaveAttribute("src", "/photo2.jpg");
  });

  it("the lightbox only ever contains photos — opening it from the photo after a video navigates among photos only, video excluded from the count", async () => {
    render(<HorizontalGallery items={[photo1, video1, photo2]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 2" }));
    // "2 / 2" — 2 photos total (video1 excluded), this is the 2nd photo.
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("the main track counter counts all mixed items (photos + videos together), not photos only", () => {
    render(<HorizontalGallery items={[photo1, video1, photo2]} />);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });
});

describe("HorizontalGallery — runtime video failure (onError) — preserves state, never a silent removal, never a poster", () => {
  it("on video error: the <video> element is removed and a localized message appears, with no image anywhere", () => {
    const { container } = render(<HorizontalGallery items={[video1]} />);
    const video = document.querySelector("video")!;
    fireEvent.error(video);

    expect(document.querySelector("video")).not.toBeInTheDocument();
    expect(screen.getByText("Video unavailable")).toBeInTheDocument();
    const fallback = container.querySelector(".horizontal-gallery-video-fallback")!;
    expect(fallback).toBeInTheDocument();
    expect(fallback.querySelector("img")).not.toBeInTheDocument();
  });

  it("respects the locale prop for the failure message", () => {
    render(<HorizontalGallery items={[video1]} locale="uk" />);
    fireEvent.error(document.querySelector("video")!);
    expect(screen.getByText("Відео недоступне")).toBeInTheDocument();
  });

  it("also removes the loading overlay once the item enters the error state — no stray loading UI behind the error message", () => {
    const { container } = render(<HorizontalGallery items={[video1]} />);
    fireEvent.error(document.querySelector("video")!);
    expect(container.querySelector(".horizontal-gallery-video-loading")).not.toBeInTheDocument();
  });

  it("keeps the item in the gallery and preserves the position counter — no reflow/index shift like a dropped item", () => {
    render(<HorizontalGallery items={[photo1, video1, photo2]} />);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    fireEvent.error(document.querySelector("video")!);
    // Still 3 items — the errored video keeps its slot instead of being removed.
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    const track = document.querySelector(".horizontal-gallery-track")!;
    expect(track.children).toHaveLength(3);
  });

  it("one broken video does not affect a neighboring photo", () => {
    render(<HorizontalGallery items={[photo1, video1]} />);
    fireEvent.error(document.querySelector("video")!);
    expect(screen.getByAltText("First photo")).toBeInTheDocument();
  });

  it("one broken video does not affect a neighboring second video", () => {
    const video2: HorizontalGalleryItem = { kind: "video", src: "/clip2.mp4", accessibleLabel: "Second clip" };
    render(<HorizontalGallery items={[video1, video2]} />);
    const [firstVideo] = document.querySelectorAll("video");
    fireEvent.error(firstVideo!);
    // The second video is untouched — still a real <video>, not an error fallback.
    const videos = document.querySelectorAll("video");
    expect(videos).toHaveLength(1);
    expect(videos[0]).toHaveAttribute("src", "/clip2.mp4");
  });
});

describe("HorizontalGallery — invalid/broken items never produce a blank card or crash", () => {
  it("an item with an empty src is dropped entirely, not rendered as a blank card", () => {
    const broken: HorizontalGalleryItem = { kind: "image", src: "", alt: "Broken" };
    render(<HorizontalGallery items={[photo1, broken]} />);
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("a gallery containing only a broken item renders nothing (no crash, no empty card)", () => {
    const broken: HorizontalGalleryItem = { kind: "video", src: "", accessibleLabel: "Broken" };
    const { container } = render(<HorizontalGallery items={[broken]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
