// Component-level tests for the real HorizontalGallery rendering logic —
// proves photos and videos are equal members of ONE ordered Lightbox
// (superseded an earlier photo-only Lightbox design), stable per-item ids
// (not src alone) drive loading/error/removal state, a video's small
// gallery card is a non-interactive preview with a real "Open video" button
// opener (never a nested-interactive <video controls> inside another
// button), only the Lightbox's active slide is ever an interactive
// <video controls>, playback is explicitly paused on every navigate/close/
// unmount path, gesture/keyboard handling never fights the active video's
// own controls, and — per the poster-removal product decision — no video
// ever shows, loads, or requests a separate poster/thumbnail image at any
// point, in any context.
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { HorizontalGallery, type HorizontalGalleryItem } from "./HorizontalGallery";

beforeEach(() => {
  // jsdom has no real scroll-container layout — HorizontalGallery calls
  // Element.scrollTo when the prev/next arrow buttons are clicked.
  window.HTMLElement.prototype.scrollTo = vi.fn();
  // jsdom doesn't implement real media playback — HorizontalGallery calls
  // pause() on every Lightbox exit path regardless of whether a test is
  // specifically asserting on it, which would otherwise log a "Not
  // implemented" warning for every such test. Individual tests that DO
  // assert on pause()/play() re-wrap these with their own vi.spyOn.
  vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const photo1: HorizontalGalleryItem = { id: "photo1", kind: "image", src: "/photo1.jpg", alt: "First photo" };
const photo2: HorizontalGalleryItem = { id: "photo2", kind: "image", src: "/photo2.jpg", alt: "Second photo" };
const video1: HorizontalGalleryItem = { id: "video1", kind: "video", src: "/clip.mp4", accessibleLabel: "A short clip" };

function openVideoLightbox() {
  return userEvent.click(screen.getByRole("button", { name: "Open video: A short clip" }));
}

// The visible "Close" button and the full-bleed backdrop button both carry
// the same "Close media preview" accessible name by design (both close the
// dialog) — `.gallery-lightbox-close` disambiguates to the one meaningful
// focus target when a test needs "the" close button specifically.
function getLightboxCloseButton(): HTMLElement {
  return screen.getByRole("dialog").querySelector(".gallery-lightbox-close")!;
}

// The main track's own position counter and the Lightbox's counter can
// show the identical text simultaneously (the main track never unmounts
// while the Lightbox is open) — scope to the open dialog to disambiguate.
function getLightboxCounterText(): string {
  return screen.getByRole("dialog").querySelector('[aria-live="polite"]')!.textContent!;
}

describe("HorizontalGallery — empty and photo-only (no regression)", () => {
  it("renders nothing (no crash) for an empty item list", () => {
    const { container } = render(<HorizontalGallery items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("a photo-only gallery renders every image and opens the Lightbox on click, unchanged from before", async () => {
    render(<HorizontalGallery items={[photo1, photo2]} />);
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "/photo1.jpg");
    expect(images[0]).toHaveAttribute("alt", "First photo");

    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    expect(screen.getByRole("dialog", { name: "Media preview" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("HorizontalGallery — main-track video card is a non-interactive preview with a real opener button", () => {
  it("the preview <video> has no controls attribute", () => {
    render(<HorizontalGallery items={[video1]} />);
    expect(document.querySelector("video")).not.toHaveAttribute("controls");
  });

  it("the preview <video> is aria-hidden and not focusable — the opener button carries the accessible name instead", () => {
    render(<HorizontalGallery items={[video1]} />);
    const video = document.querySelector("video")!;
    expect(video).toHaveAttribute("aria-hidden", "true");
    expect(video).toHaveAttribute("tabindex", "-1");
    expect(video).not.toHaveAttribute("aria-label");
  });

  it("no autoplay, playsInline, preload=metadata — preserved from before", () => {
    render(<HorizontalGallery items={[video1]} />);
    const video = document.querySelector("video")!;
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "metadata");
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

  it("a real, keyboard-focusable button overlay opens the video, accessibly named 'Open video: <label>'", () => {
    render(<HorizontalGallery items={[video1]} />);
    const opener = screen.getByRole("button", { name: "Open video: A short clip" });
    expect(opener.tagName).toBe("BUTTON");
    expect(opener).toHaveAttribute("type", "button");
  });

  it("clicking the opener opens the Lightbox with a real interactive <video controls>", async () => {
    render(<HorizontalGallery items={[video1]} />);
    await openVideoLightbox();
    const dialog = screen.getByRole("dialog", { name: "Media preview" });
    const activeVideo = dialog.querySelector(".gallery-lightbox-slide-active video");
    expect(activeVideo).toBeInTheDocument();
    expect(activeVideo).toHaveAttribute("controls");
  });

  it("keyboard activation (Enter) of the opener also opens the Lightbox", async () => {
    render(<HorizontalGallery items={[video1]} />);
    const opener = screen.getByRole("button", { name: "Open video: A short clip" });
    opener.focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "Media preview" })).toBeInTheDocument();
  });
});

describe("HorizontalGallery — canonical mixed-media index (one ordered array, no photo-only subset)", () => {
  it("preserves the original mixed order in the DOM (photo, video, photo)", () => {
    const { container } = render(<HorizontalGallery items={[photo1, video1, photo2]} />);
    const track = container.querySelector(".horizontal-gallery-track")!;
    const children = Array.from(track.children);
    expect(children).toHaveLength(3);
    expect(children[0]!.querySelector("img")).toHaveAttribute("src", "/photo1.jpg");
    expect(children[1]!.querySelector("video")).toHaveAttribute("src", "/clip.mp4");
    expect(children[2]!.querySelector("img")).toHaveAttribute("src", "/photo2.jpg");
  });

  it("the main track counter counts all mixed items together (photos + videos)", () => {
    render(<HorizontalGallery items={[photo1, video1, photo2]} />);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("clicking photo1 opens the Lightbox at its mixed index (1/3), not a photo-relative index", async () => {
    render(<HorizontalGallery items={[photo1, video1, photo2]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    expect(getLightboxCounterText()).toBe("1 / 3");
  });

  it("Next from photo1 lands on the video (2/3), with the video rendered as the active slide", async () => {
    render(<HorizontalGallery items={[photo1, video1, photo2]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    await userEvent.click(screen.getByRole("button", { name: "Next media" }));
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector(".gallery-lightbox-slide-active video")).toBeInTheDocument();
    expect(dialog.querySelector(".gallery-lightbox-slide-active img")).not.toBeInTheDocument();
  });

  it("Next again lands on photo2 (3/3) — the video is not skipped over", async () => {
    render(<HorizontalGallery items={[photo1, video1, photo2]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    await userEvent.click(screen.getByRole("button", { name: "Next media" }));
    await userEvent.click(screen.getByRole("button", { name: "Next media" }));
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector(".gallery-lightbox-slide-active img")).toHaveAttribute("src", "/photo2.jpg");
  });

  it("clicking the video preview directly opens the Lightbox at its exact mixed index (2/3)", async () => {
    render(<HorizontalGallery items={[photo1, video1, photo2]} />);
    await openVideoLightbox();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("does not show 2/2 merely because there are two photographs — the video counts", async () => {
    render(<HorizontalGallery items={[photo1, video1, photo2]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    expect(screen.queryByText("2 / 2")).not.toBeInTheDocument();
    expect(getLightboxCounterText()).toBe("1 / 3");
  });
});

describe("HorizontalGallery — stable media identity (id, not src alone)", () => {
  it("two items sharing the same src remain independent — an error on one does not affect the other", () => {
    const dup1: HorizontalGalleryItem = { id: "dup-a", kind: "video", src: "/same.mp4", accessibleLabel: "Clip A" };
    const dup2: HorizontalGalleryItem = { id: "dup-b", kind: "video", src: "/same.mp4", accessibleLabel: "Clip B" };
    render(<HorizontalGallery items={[dup1, dup2]} />);
    const videos = document.querySelectorAll("video");
    expect(videos).toHaveLength(2);
    fireEvent.error(videos[0]!);
    expect(screen.getByText("Video unavailable")).toBeInTheDocument();
    // The second, distinct-id item is untouched — still a real preview <video>.
    expect(document.querySelectorAll("video")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Open video: Clip B" })).toBeInTheDocument();
  });

  it("elements are keyed by id — React does not warn about duplicate/missing keys for same-src items", () => {
    const dup1: HorizontalGalleryItem = { id: "dup-a", kind: "image", src: "/same.jpg", alt: "A" };
    const dup2: HorizontalGalleryItem = { id: "dup-b", kind: "image", src: "/same.jpg", alt: "B" };
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<HorizontalGallery items={[dup1, dup2]} />);
    const keyWarning = errorSpy.mock.calls.some((call) => String(call[0]).includes("key"));
    errorSpy.mockRestore();
    expect(keyWarning).toBe(false);
  });
});

describe("HorizontalGallery — Lightbox mixed-media rendering", () => {
  it("dialog and controls use media-neutral labels, not image-only wording", async () => {
    render(<HorizontalGallery items={[photo1]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    expect(screen.getByRole("dialog", { name: "Media preview" })).toBeInTheDocument();
    // Exactly one accessible Close command — the backdrop closes on click
    // but is a non-interactive, aria-hidden div, not a second Close button.
    expect(screen.getAllByRole("button", { name: "Close media preview" })).toHaveLength(1);
  });

  it("Previous/Next buttons are labeled 'Previous media'/'Next media'", async () => {
    render(<HorizontalGallery items={[photo1, video1]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    expect(screen.getByRole("button", { name: "Previous media" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next media" })).toBeInTheDocument();
  });

  it("an active video is announced with its own accessibleLabel, never as an image", async () => {
    render(<HorizontalGallery items={[video1]} />);
    await openVideoLightbox();
    const activeVideo = screen.getByRole("dialog").querySelector(".gallery-lightbox-slide-active video")!;
    expect(activeVideo).toHaveAttribute("aria-label", "A short clip");
  });

  it("neighbor slides render a silent, aria-hidden video preview with no controls", async () => {
    render(<HorizontalGallery items={[photo1, video1, photo2]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    const dialog = screen.getByRole("dialog");
    const nextSlideVideo = dialog.querySelector(".gallery-lightbox-slide-next video");
    expect(nextSlideVideo).toBeInTheDocument();
    expect(nextSlideVideo).not.toHaveAttribute("controls");
    expect(nextSlideVideo).toHaveAttribute("aria-hidden", "true");
    expect(nextSlideVideo).toHaveAttribute("tabindex", "-1");
  });

  it("active video loading/error state uses the same neutral, no-image treatment as the main-track preview", async () => {
    render(<HorizontalGallery items={[video1]} />);
    await openVideoLightbox();
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector(".horizontal-gallery-video-loading")).toBeInTheDocument();
    const activeVideo = dialog.querySelector(".gallery-lightbox-slide-active video")!;
    fireEvent.error(activeVideo);
    expect(within(dialog).getByText("Video unavailable")).toBeInTheDocument();
    expect(dialog.querySelector(".gallery-lightbox-slide-active video")).not.toBeInTheDocument();
    expect(dialog.querySelector(".gallery-lightbox-slide-active img")).not.toBeInTheDocument();
  });

  it("an error recorded via the main-track preview also shows the fallback when later opened in the Lightbox (shared, id-keyed state)", async () => {
    render(<HorizontalGallery items={[video1]} />);
    fireEvent.error(document.querySelector("video")!);
    expect(screen.getByText("Video unavailable")).toBeInTheDocument();
    // The opener button stays rendered even once the preview has errored —
    // clicking it still opens the Lightbox, which shows the SAME shared,
    // id-keyed error state rather than re-attempting (and potentially
    // re-erroring) a fresh <video> element.
    await userEvent.click(screen.getByRole("button", { name: "Open video: A short clip" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Video unavailable")).toBeInTheDocument();
    expect(dialog.querySelector(".gallery-lightbox-slide-active video")).not.toBeInTheDocument();
  });
});

describe("HorizontalGallery — playback lifecycle (explicit pause on every exit path)", () => {
  it("pauses the active video when navigating Next", async () => {
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    render(<HorizontalGallery items={[video1, photo1]} />);
    await openVideoLightbox();
    await userEvent.click(screen.getByRole("button", { name: "Next media" }));
    expect(pauseSpy).toHaveBeenCalled();
    pauseSpy.mockRestore();
  });

  it("pauses the active video when navigating Previous", async () => {
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    render(<HorizontalGallery items={[photo1, video1]} />);
    await openVideoLightbox();
    await userEvent.click(screen.getByRole("button", { name: "Previous media" }));
    expect(pauseSpy).toHaveBeenCalled();
    pauseSpy.mockRestore();
  });

  it("pauses the active video on ArrowRight/ArrowLeft keyboard navigation", async () => {
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    render(<HorizontalGallery items={[video1, photo1]} />);
    await openVideoLightbox();
    pauseSpy.mockClear();
    await userEvent.keyboard("{ArrowRight}");
    expect(pauseSpy).toHaveBeenCalled();
    pauseSpy.mockRestore();
  });

  it("pauses the active video on Close button click", async () => {
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    render(<HorizontalGallery items={[video1]} />);
    await openVideoLightbox();
    await userEvent.click(getLightboxCloseButton());
    expect(pauseSpy).toHaveBeenCalled();
    pauseSpy.mockRestore();
  });

  it("pauses the active video on Escape", async () => {
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    render(<HorizontalGallery items={[video1]} />);
    await openVideoLightbox();
    await userEvent.keyboard("{Escape}");
    expect(pauseSpy).toHaveBeenCalled();
    pauseSpy.mockRestore();
  });

  it("pauses the active video when the component unmounts while the Lightbox is open", async () => {
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const { unmount } = render(<HorizontalGallery items={[video1]} />);
    await openVideoLightbox();
    pauseSpy.mockClear();
    unmount();
    expect(pauseSpy).toHaveBeenCalled();
    pauseSpy.mockRestore();
  });

  it("does not call play() automatically when the video opens — no autoplay", async () => {
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    render(<HorizontalGallery items={[video1]} />);
    await openVideoLightbox();
    expect(playSpy).not.toHaveBeenCalled();
    playSpy.mockRestore();
  });

  it("re-rendering with unrelated state changes does not call pause() on an untouched active video", async () => {
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const { rerender } = render(<HorizontalGallery items={[video1]} locale="en" />);
    await openVideoLightbox();
    pauseSpy.mockClear();
    rerender(<HorizontalGallery items={[video1]} locale="en" />);
    expect(pauseSpy).not.toHaveBeenCalled();
    pauseSpy.mockRestore();
  });
});

describe("HorizontalGallery — gesture guard (video controls never trigger a swipe/navigate)", () => {
  it("a mousedown+mouseup drag gesture starting ON the active video does not navigate the Lightbox", async () => {
    render(<HorizontalGallery items={[video1, photo1]} />);
    await openVideoLightbox();
    const dialog = screen.getByRole("dialog");
    const activeVideo = dialog.querySelector(".gallery-lightbox-slide-active video")!;
    const slider = dialog.querySelector(".gallery-lightbox-slider")!.parentElement!;
    fireEvent.mouseDown(activeVideo, { clientX: 500 });
    fireEvent.mouseUp(slider, { clientX: 300 });
    expect(getLightboxCounterText()).toBe("1 / 2");
  });

  it("a mousedown+mouseup drag gesture starting OUTSIDE the video still navigates normally (regression)", async () => {
    render(<HorizontalGallery items={[photo1, photo2]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    const dialog = screen.getByRole("dialog");
    const slider = dialog.querySelector(".gallery-lightbox-slider")!.parentElement!;
    fireEvent.mouseDown(slider, { clientX: 500 });
    fireEvent.mouseUp(slider, { clientX: 300 });
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });
});

describe("HorizontalGallery — keyboard guard (arrow keys don't fight the active video's own controls)", () => {
  it("ArrowLeft/ArrowRight do not navigate the Lightbox while the active video has focus", async () => {
    render(<HorizontalGallery items={[video1, photo1]} />);
    await openVideoLightbox();
    const dialog = screen.getByRole("dialog");
    const activeVideo = dialog.querySelector(".gallery-lightbox-slide-active video")! as HTMLVideoElement;
    act(() => {
      activeVideo.focus();
    });
    await userEvent.keyboard("{ArrowRight}");
    expect(getLightboxCounterText()).toBe("1 / 2");
  });

  it("ArrowLeft/ArrowRight still navigate normally once focus leaves the video", async () => {
    render(<HorizontalGallery items={[video1, photo1]} />);
    await openVideoLightbox();
    const closeButton = getLightboxCloseButton();
    act(() => {
      closeButton.focus();
    });
    await userEvent.keyboard("{ArrowRight}");
    expect(getLightboxCounterText()).toBe("2 / 2");
  });

  it("Escape still closes even while the active video has focus", async () => {
    render(<HorizontalGallery items={[video1]} />);
    await openVideoLightbox();
    const dialog = screen.getByRole("dialog");
    const activeVideo = dialog.querySelector(".gallery-lightbox-slide-active video")! as HTMLVideoElement;
    act(() => {
      activeVideo.focus();
    });
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("focus returns to the exact video opener button after closing", async () => {
    render(<HorizontalGallery items={[photo1, video1]} />);
    const opener = screen.getByRole("button", { name: "Open video: A short clip" });
    await userEvent.click(opener);
    await userEvent.keyboard("{Escape}");
    // Focus restore happens inside requestAnimationFrame — wait for it
    // rather than asserting synchronously.
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("moves focus into the dialog (the Close button) when the Lightbox opens", async () => {
    render(<HorizontalGallery items={[photo1]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    expect(getLightboxCloseButton()).toHaveFocus();
  });
});

describe("HorizontalGallery — Lightbox focus trap (Tab/Shift+Tab never reach the page behind the modal)", () => {
  it("Tab from the last focusable element cycles to the first", async () => {
    render(<HorizontalGallery items={[photo1, photo2]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    const nextButton = screen.getByRole("button", { name: "Next media" });
    act(() => {
      nextButton.focus();
    });
    // No video in this gallery, so the last focusable element is "Next".
    await userEvent.tab();
    expect(getLightboxCloseButton()).toHaveFocus();
  });

  it("Shift+Tab from the first focusable element (Close) cycles to the last", async () => {
    render(<HorizontalGallery items={[photo1, photo2]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    getLightboxCloseButton().focus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Next media" })).toHaveFocus();
  });

  it("Tab cycles through Close -> Previous -> Next -> Close for a photo-only pair (no video tab stop)", async () => {
    render(<HorizontalGallery items={[photo1, photo2]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    getLightboxCloseButton().focus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Previous media" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Next media" })).toHaveFocus();
    await userEvent.tab();
    expect(getLightboxCloseButton()).toHaveFocus();
  });

  it("the active video is included as a Tab stop when present", async () => {
    render(<HorizontalGallery items={[video1, photo1]} />);
    await openVideoLightbox();
    getLightboxCloseButton().focus();
    await userEvent.tab(); // Previous
    await userEvent.tab(); // Next
    await userEvent.tab(); // active video
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector(".gallery-lightbox-slide-active video")).toHaveFocus();
  });

  it("background controls (outside the dialog) never receive focus via Tab while the Lightbox is open", async () => {
    render(
      <>
        <button type="button">Background button</button>
        <HorizontalGallery items={[photo1, photo2]} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    getLightboxCloseButton().focus();
    // Tab all the way around a full cycle plus one extra — should never land on "Background button".
    for (let i = 0; i < 5; i++) await userEvent.tab();
    expect(screen.getByRole("button", { name: "Background button" })).not.toHaveFocus();
  });

  it("one-item gallery: the focus trap still cycles safely (no crash, Close stays reachable)", async () => {
    render(<HorizontalGallery items={[photo1]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    getLightboxCloseButton().focus();
    await userEvent.tab();
    await userEvent.tab();
    expect(getLightboxCloseButton()).toBeInTheDocument();
  });
});

describe("HorizontalGallery — duplicate Close control fix (backdrop is non-interactive)", () => {
  it("exactly one accessible control is named 'Close media preview'", async () => {
    render(<HorizontalGallery items={[photo1]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    expect(screen.getAllByRole("button", { name: "Close media preview" })).toHaveLength(1);
  });

  it("the backdrop is not a button and is hidden from the accessibility tree", async () => {
    const { container } = render(<HorizontalGallery items={[photo1]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    const backdrop = container.querySelector(".fixed.inset-0.z-2000 > .absolute.inset-0.bg-black\\/68");
    expect(backdrop).toBeInTheDocument();
    expect(backdrop?.tagName).not.toBe("BUTTON");
    expect(backdrop).toHaveAttribute("aria-hidden", "true");
  });

  it("clicking the backdrop closes the Lightbox", async () => {
    const { container } = render(<HorizontalGallery items={[photo1]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    const backdrop = container.querySelector(".fixed.inset-0.z-2000 > .absolute.inset-0.bg-black\\/68") as HTMLElement;
    await userEvent.click(backdrop);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clicking inside the Lightbox content does not close it", async () => {
    render(<HorizontalGallery items={[photo1, photo2]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open gallery image 1" }));
    const dialog = screen.getByRole("dialog");
    const activeSlide = dialog.querySelector(".gallery-lightbox-slide-active")!;
    await userEvent.click(activeSlide);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
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
    const video2: HorizontalGalleryItem = { id: "video2", kind: "video", src: "/clip2.mp4", accessibleLabel: "Second clip" };
    render(<HorizontalGallery items={[video1, video2]} />);
    const [firstVideo] = document.querySelectorAll("video");
    fireEvent.error(firstVideo!);
    // The second video is untouched — still a real preview <video>, not an error fallback.
    const videos = document.querySelectorAll("video");
    expect(videos).toHaveLength(1);
    expect(videos[0]).toHaveAttribute("src", "/clip2.mp4");
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

describe("HorizontalGallery — invalid/broken items never produce a blank card or crash", () => {
  it("an item with an empty src is dropped entirely, not rendered as a blank card", () => {
    const broken: HorizontalGalleryItem = { id: "broken", kind: "image", src: "", alt: "Broken" };
    render(<HorizontalGallery items={[photo1, broken]} />);
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("a gallery containing only a broken item renders nothing (no crash, no empty card)", () => {
    const broken: HorizontalGalleryItem = { id: "broken", kind: "video", src: "", accessibleLabel: "Broken" };
    const { container } = render(<HorizontalGallery items={[broken]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
