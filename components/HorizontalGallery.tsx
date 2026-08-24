"use client";

import type { MouseEvent, TouchEvent, WheelEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { getUiText } from "@/lib/uiText";

export type HorizontalGalleryItem =
  | { kind: "image"; src: string; alt: string }
  | { kind: "video"; src: string; accessibleLabel: string };

/**
 * Mixed-media lightbox decision: videos are playable directly inline in the
 * main gallery track (a real <video controls>, not wrapped in a
 * lightbox-opening button) — they never open in the lightbox. The lightbox
 * itself is unchanged and photo-only, fed a derived, photo-only subset of
 * `items` so a video is never counted or navigated to as a lightbox slide.
 * This avoids either faking video support inside the photo-only lightbox UI
 * (drag-slide/prev-next transitions, image `<img>` markup) or leaving a
 * video as an inert, unopenable thumbnail.
 */
export function HorizontalGallery({ items, locale = "en" }: { items: HorizontalGalleryItem[]; locale?: Locale }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<number | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const [brokenSrcs, setBrokenSrcs] = useState<Set<string>>(() => new Set());
  // Separate from `brokenSrcs`: a photo that fails to load has no useful
  // partial state, so it's fully removed (see removeUnavailableItem below).
  // A video that fails at runtime keeps its slot and its place in the
  // index/counter — only markVideoError below writes to this set.
  const [videoErrors, setVideoErrors] = useState<Set<string>>(() => new Set());
  // Srcs whose <video> has decoded its own first frame (loadeddata/canplay)
  // — drives the loading overlay below. No poster is ever substituted while
  // a video is loading; see markVideoReady's own comment for why.
  const [videoReady, setVideoReady] = useState<Set<string>>(() => new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // The full mixed (photo + video), ordered, still-valid set — drives the
  // main track, the arrow buttons, and the position counter.
  const availableItems = useMemo(
    () => items.filter((item) => typeof item.src === "string" && item.src.trim() && !brokenSrcs.has(item.src)),
    [brokenSrcs, items],
  );
  // Photo-only subset, in the same relative order — drives the lightbox exclusively.
  const photoItems = useMemo(
    () => availableItems.filter((item): item is Extract<HorizontalGalleryItem, { kind: "image" }> => item.kind === "image"),
    [availableItems],
  );

  const safeCurrentIndex = Math.min(
    currentIndex,
    Math.max(availableItems.length - 1, 0),
  );
  const safeLightboxIndex =
    lightboxIndex === null
      ? null
      : Math.min(lightboxIndex, Math.max(photoItems.length - 1, 0));

  const syncCurrentIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const children = Array.from(track.children) as HTMLElement[];
    if (children.length === 0) {
      setCurrentIndex(0);
      return;
    }

    const scrollLeft = track.scrollLeft;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    children.forEach((item, index) => {
      const distance = Math.abs(item.offsetLeft - scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setCurrentIndex(closestIndex);
  }, []);

  const moveTrack = useCallback(
    (direction: number) => {
      const track = trackRef.current;
      if (!track) return;

      const children = Array.from(track.children) as HTMLElement[];
      if (children.length === 0) return;

      const nextIndex = Math.min(
        Math.max(currentIndex + direction, 0),
        children.length - 1,
      );
      const nextItem = children[nextIndex];
      if (!nextItem) return;

      track.scrollTo({ left: nextItem.offsetLeft, behavior: "smooth" });
      setCurrentIndex(nextIndex);
    },
    [currentIndex],
  );

  // Applies to both kinds, keyed by src — an item (photo or video) that
  // fails to load is dropped from the rendered set (never shown as a blank
  // card, never crashes the rest of the gallery), with a development-only
  // console warning so the broken reference is discoverable without
  // surfacing anything to site visitors.
  const removeUnavailableItem = useCallback((src: string) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`HorizontalGallery: dropping an item whose media failed to load (src: ${src}).`);
    }
    setBrokenSrcs((current) => {
      if (current.has(src)) return current;
      const next = new Set(current);
      next.add(src);
      return next;
    });
    setCurrentIndex((current) => Math.max(0, current - 1));
  }, []);

  // A video that fails at runtime (bad codec, network error, corrupted
  // upload, etc.) is NOT dropped like a broken photo: doing so would shift
  // every later slide's index out from under a visitor mid-browse and, if
  // it were the item they were looking at, replace it with something
  // unrelated. Instead the slide stays in place, in `availableItems`, and
  // renders a neutral surface plus a short localized "video unavailable"
  // message instead of the unusable <video> element — no poster or other
  // image is ever substituted (see mediaItem.ts's posterImage field, now
  // unused site-wide: a separate poster can crop/frame the subject
  // differently than the video itself and mislead about what's broken).
  const markVideoError = useCallback((src: string) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`HorizontalGallery: video failed to play at runtime, showing fallback (src: ${src}).`);
    }
    setVideoErrors((current) => {
      if (current.has(src)) return current;
      const next = new Set(current);
      next.add(src);
      return next;
    });
  }, []);

  // Fires on the earliest point a browser has the video's own first frame
  // ready to paint (`loadeddata`, readyState >= HAVE_CURRENT_DATA) or is
  // ready to play (`canplay`) — whichever comes first. Removes the neutral
  // loading overlay so the video's own frame becomes visible; nothing is
  // ever downloaded or shown in its place before that (no poster, no
  // generated thumbnail — see the render below).
  const markVideoReady = useCallback((src: string) => {
    setVideoReady((current) => {
      if (current.has(src)) return current;
      const next = new Set(current);
      next.add(src);
      return next;
    });
  }, []);

  // Cached media can reach HAVE_CURRENT_DATA before React's own
  // loadeddata/canplay listeners are attached (element creation and native
  // event dispatch aren't guaranteed to interleave the same way on every
  // browser) — this ref callback checks the element's readyState the
  // moment it mounts, as a defensive backstop so an already-buffered video
  // never gets stuck showing the loading overlay forever.
  const checkVideoAlreadyReady = useCallback(
    (src: string) => (el: HTMLVideoElement | null) => {
      if (el && el.readyState >= 2) markVideoReady(src);
    },
    [markVideoReady],
  );

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    requestAnimationFrame(() => openerRef.current?.focus?.());
  }, []);

  const moveLightbox = useCallback(
    (direction: number) => {
      setLightboxIndex((current) => {
        if (current === null) return current;
        if (photoItems.length === 0) return null;
        const next =
          (current + direction + photoItems.length) %
          photoItems.length;
        return next;
      });
    },
    [photoItems.length],
  );

  function handleDragStart(clientX: number) {
    dragStartRef.current = clientX;
  }

  function handleDragEnd(clientX: number) {
    if (dragStartRef.current === null) return;
    const deltaX = clientX - dragStartRef.current;
    dragStartRef.current = null;
    if (Math.abs(deltaX) < 42) return;
    moveLightbox(deltaX < 0 ? 1 : -1);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (
      Math.abs(event.deltaX) <= Math.abs(event.deltaY) ||
      Math.abs(event.deltaX) < 32
    )
      return;
    event.preventDefault();
    moveLightbox(event.deltaX > 0 ? 1 : -1);
  }

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") moveLightbox(-1);
      if (event.key === "ArrowRight") moveLightbox(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, photoItems.length, moveLightbox, closeLightbox]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  useEffect(() => {
    syncCurrentIndex();
    const track = trackRef.current;
    if (!track) return;

    track.addEventListener("scroll", syncCurrentIndex, { passive: true });
    window.addEventListener("resize", syncCurrentIndex);

    return () => {
      track.removeEventListener("scroll", syncCurrentIndex);
      window.removeEventListener("resize", syncCurrentIndex);
    };
  }, [availableItems.length, syncCurrentIndex]);

  if (availableItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className="horizontal-gallery">
        <div className="horizontal-gallery-frame">
          {availableItems.length > 1 ? (
            <>
              <button
                className="absolute top-1/2 left-3.5 z-2 inline-flex h-10.5 w-10.5 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-[rgba(var(--rgb-dark-brown),0.42)] text-white backdrop-blur-[6px] transition-[background-color,opacity,transform] duration-180 ease-out hover:bg-[rgba(var(--rgb-dark-brown),0.56)] hover:outline-none focus-visible:bg-[rgba(var(--rgb-dark-brown),0.56)] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgba(var(--rgb-cream),0.85)] disabled:opacity-[0.38] disabled:cursor-default enabled:hover:scale-[1.03] enabled:focus-visible:scale-[1.03] max-sm:h-10 max-sm:w-10 max-sm:left-2.5"
                type="button"
                onClick={() => moveTrack(-1)}
                aria-label="Previous slide"
                disabled={safeCurrentIndex === 0}
              >
                <ChevronLeft aria-hidden="true" strokeWidth={2.2} className="h-5 w-5" />
              </button>
              <button
                className="absolute top-1/2 right-3.5 z-2 inline-flex h-10.5 w-10.5 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-[rgba(var(--rgb-dark-brown),0.42)] text-white backdrop-blur-[6px] transition-[background-color,opacity,transform] duration-180 ease-out hover:bg-[rgba(var(--rgb-dark-brown),0.56)] hover:outline-none focus-visible:bg-[rgba(var(--rgb-dark-brown),0.56)] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgba(var(--rgb-cream),0.85)] disabled:opacity-[0.38] disabled:cursor-default enabled:hover:scale-[1.03] enabled:focus-visible:scale-[1.03] max-sm:h-10 max-sm:w-10 max-sm:right-2.5"
                type="button"
                onClick={() => moveTrack(1)}
                aria-label="Next slide"
                disabled={safeCurrentIndex === availableItems.length - 1}
              >
                <ChevronRight aria-hidden="true" strokeWidth={2.2} className="h-5 w-5" />
              </button>
              <div
                className="absolute bottom-3.5 right-3.5 z-2 min-w-14.5 rounded-pill bg-[rgba(var(--rgb-dark-brown),0.42)] px-2.5 py-1.5 text-center text-xs font-bold tracking-[0.06em] text-white backdrop-blur-[6px] max-sm:bottom-2.5 max-sm:right-2.5 max-sm:px-2.25 max-sm:py-1.25"
                aria-live="polite"
              >
                {safeCurrentIndex + 1} / {availableItems.length}
              </div>
            </>
          ) : null}
          <div className="horizontal-gallery-track" ref={trackRef}>
            {availableItems.map((item, index) =>
              item.kind === "video" ? (
                <div key={`${item.src}-${index}`} className="horizontal-gallery-item horizontal-gallery-video-item">
                  {videoErrors.has(item.src) ? (
                    <div className="horizontal-gallery-video-fallback" role="img" aria-label={item.accessibleLabel}>
                      <p className="horizontal-gallery-video-fallback-message">{getUiText("videoUnavailable", locale)}</p>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={checkVideoAlreadyReady(item.src)}
                        src={item.src}
                        controls
                        playsInline
                        preload="metadata"
                        aria-label={item.accessibleLabel}
                        onLoadedData={() => markVideoReady(item.src)}
                        onCanPlay={() => markVideoReady(item.src)}
                        onError={() => markVideoError(item.src)}
                      >
                        <track kind="captions" />
                      </video>
                      {videoReady.has(item.src) ? null : (
                        <div className="horizontal-gallery-video-loading" aria-hidden="true">
                          <div className="horizontal-gallery-video-loading-spinner" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <button
                  key={`${item.src}-${index}`}
                  className="horizontal-gallery-item"
                  type="button"
                  onClick={(event) => {
                    openerRef.current = event.currentTarget;
                    const photoIndex = photoItems.indexOf(item);
                    setLightboxIndex(photoIndex === -1 ? 0 : photoIndex);
                  }}
                  aria-label={`Open gallery image ${photoItems.indexOf(item) + 1}`}
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    draggable="false"
                    onError={() => removeUnavailableItem(item.src)}
                  />
                </button>
              ),
            )}
          </div>
        </div>
      </div>
      {safeLightboxIndex !== null ? (
        <div
          className="fixed inset-0 z-2000 grid place-items-center overflow-hidden px-6 py-11 max-sm:px-0 max-sm:py-3"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            className="absolute inset-0 border-0 bg-black/68"
            type="button"
            onClick={closeLightbox}
            aria-label="Close image preview"
          />
          <div
            className="relative z-1 grid h-[min(calc(100dvh-88px),720px)] w-[min(1320px,100%)] cursor-grab touch-pan-y place-items-center overflow-hidden active:cursor-grabbing max-sm:h-[min(calc(100dvh-112px),620px)] max-sm:w-screen max-sm:grid-cols-1 max-sm:overflow-visible"
            onTouchStart={(event: TouchEvent<HTMLDivElement>) =>
              handleDragStart(event.touches[0]?.clientX ?? 0)
            }
            onTouchEnd={(event: TouchEvent<HTMLDivElement>) =>
              handleDragEnd(event.changedTouches[0]?.clientX ?? 0)
            }
            onMouseDown={(event: MouseEvent<HTMLDivElement>) => handleDragStart(event.clientX)}
            onMouseUp={(event: MouseEvent<HTMLDivElement>) => handleDragEnd(event.clientX)}
            onMouseLeave={(event: MouseEvent<HTMLDivElement>) => handleDragEnd(event.clientX)}
            onWheel={handleWheel}
          >
            <button
              className="gallery-lightbox-close"
              type="button"
              onClick={closeLightbox}
              aria-label="Close image preview"
            >
              Close
            </button>
            <div
              className="absolute left-1/2 top-5.5 z-4 -translate-x-1/2 rounded-pill bg-[rgba(var(--rgb-dark-brown),0.54)] px-3 py-2 text-[12px] font-black tracking-[0.04em] text-cream"
              aria-live="polite"
            >
              {safeLightboxIndex + 1} / {photoItems.length}
            </div>
            <button
              className="gallery-lightbox-nav gallery-lightbox-nav-prev"
              type="button"
              onClick={() => moveLightbox(-1)}
              aria-label="Previous image"
            >
              Previous
            </button>
            <button
              className="gallery-lightbox-nav gallery-lightbox-nav-next"
              type="button"
              onClick={() => moveLightbox(1)}
              aria-label="Next image"
            >
              Next
            </button>
            <div className="gallery-lightbox-slider">
              <div className="gallery-lightbox-slide gallery-lightbox-slide-prev">
                <img
                  src={
                    photoItems[
                      (safeLightboxIndex - 1 + photoItems.length) %
                        photoItems.length
                    ]!.src
                  }
                  alt={
                    photoItems[
                      (safeLightboxIndex - 1 + photoItems.length) %
                        photoItems.length
                    ]!.alt
                  }
                  draggable="false"
                  onError={() =>
                    removeUnavailableItem(
                      photoItems[
                        (safeLightboxIndex - 1 + photoItems.length) %
                          photoItems.length
                      ]!.src,
                    )
                  }
                />
              </div>
              <div
                className="gallery-lightbox-slide gallery-lightbox-slide-active"
                key={photoItems[safeLightboxIndex]!.src}
              >
                <img
                  src={photoItems[safeLightboxIndex]!.src}
                  alt={photoItems[safeLightboxIndex]!.alt}
                  draggable="false"
                  onError={() =>
                    removeUnavailableItem(photoItems[safeLightboxIndex]!.src)
                  }
                />
              </div>
              <div className="gallery-lightbox-slide gallery-lightbox-slide-next">
                <img
                  src={
                    photoItems[
                      (safeLightboxIndex + 1) % photoItems.length
                    ]!.src
                  }
                  alt={
                    photoItems[
                      (safeLightboxIndex + 1) % photoItems.length
                    ]!.alt
                  }
                  draggable="false"
                  onError={() =>
                    removeUnavailableItem(
                      photoItems[
                        (safeLightboxIndex + 1) % photoItems.length
                      ]!.src,
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
