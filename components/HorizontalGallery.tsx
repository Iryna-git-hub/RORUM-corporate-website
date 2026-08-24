"use client";

import type { MouseEvent, TouchEvent, WheelEvent } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { getUiText } from "@/lib/uiText";

export type HorizontalGalleryItem =
  | { id: string; kind: "image"; src: string; alt: string }
  | { id: string; kind: "video"; src: string; accessibleLabel: string };

/**
 * Mixed-media Lightbox decision (superseded an earlier photo-only design —
 * see MIGRATION_REPORT.md): photos and videos are equal members of ONE
 * ordered collection, in both the main track and the Lightbox. A video's
 * small gallery card is a non-interactive preview (its own frame, no
 * poster) with a separate `<button>` "Open video" overlay — the button
 * opens the Lightbox at that video's exact position in the shared order;
 * the small card itself never carries native `<video controls>`, so the
 * main track's drag/swipe/scroll never has to fight a nested interactive
 * media element. Inside the Lightbox, the ACTIVE slide is the only one with
 * real `<video controls>`; the previous/next preview slides show a
 * non-interactive frame (or the neutral error surface), matching the
 * "don't fake interactivity you don't support yet" principle used
 * throughout this component.
 */

function isInteractiveMediaTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "VIDEO" || target.closest("video") !== null;
}

/**
 * Shared rendering for a video that participates in the loading/error state
 * machine — used by the main-track preview and the Lightbox's active slide.
 * `interactive` controls whether this renders real `<video controls>` (the
 * Lightbox's active slide) or a silent, `aria-hidden` preview frame (the
 * main-track card, which gets its accessible name from a sibling opener
 * button instead). Never renders a poster/thumbnail/substitute image in
 * either mode, in either the loading or the error state.
 */
function VideoWithState({
  item,
  locale,
  videoReady,
  videoErrors,
  onReady,
  onError,
  interactive,
  videoRef,
}: {
  item: Extract<HorizontalGalleryItem, { kind: "video" }>;
  locale: Locale;
  videoReady: Set<string>;
  videoErrors: Set<string>;
  onReady: (id: string) => void;
  onError: (id: string) => void;
  interactive: boolean;
  videoRef?: (el: HTMLVideoElement | null) => void;
}) {
  // Memoized so this ref callback keeps the same identity across ordinary
  // re-renders (only changing when the item/handlers genuinely change) —
  // an inline `ref={(el) => ...}` would get a NEW function identity every
  // render, and React treats a changed ref prop as "detach the old ref,
  // attach the new one" even when the underlying DOM node hasn't actually
  // unmounted. That would call `videoRef`'s own null-check (see
  // HorizontalGallery's `setActiveLightboxVideo`) on every unrelated
  // re-render — spuriously pausing playback that never actually stopped.
  const setVideoElement = useCallback(
    (el: HTMLVideoElement | null) => {
      // Cached media can reach HAVE_CURRENT_DATA before React's own
      // loadeddata/canplay listeners are attached — this backstop checks
      // readyState the moment the element mounts so an already-buffered
      // video never gets stuck showing the loading overlay forever.
      if (el && el.readyState >= 2) onReady(item.id);
      videoRef?.(el);
    },
    [item.id, onReady, videoRef],
  );

  if (videoErrors.has(item.id)) {
    return (
      <div
        className="horizontal-gallery-video-fallback"
        role={interactive ? "img" : undefined}
        aria-label={interactive ? item.accessibleLabel : undefined}
        aria-hidden={interactive ? undefined : true}
      >
        <p className="horizontal-gallery-video-fallback-message">{getUiText("videoUnavailable", locale)}</p>
      </div>
    );
  }
  return (
    <>
      <video
        ref={setVideoElement}
        src={item.src}
        controls={interactive || undefined}
        playsInline
        preload="metadata"
        aria-label={interactive ? item.accessibleLabel : undefined}
        aria-hidden={interactive ? undefined : true}
        tabIndex={interactive ? 0 : -1}
        className={interactive ? undefined : "horizontal-gallery-video-preview"}
        onLoadedData={() => onReady(item.id)}
        onCanPlay={() => onReady(item.id)}
        onError={() => onError(item.id)}
      >
        <track kind="captions" />
      </video>
      {videoReady.has(item.id) ? null : (
        <div className="horizontal-gallery-video-loading" aria-hidden="true">
          <div className="horizontal-gallery-video-loading-spinner" />
        </div>
      )}
    </>
  );
}

/**
 * The Lightbox's previous/next preview slide for a video: a silent,
 * non-interactive frame — no controls, no autoplay, never focusable, never
 * announced (the active slide is the only one a screen-reader user is
 * meant to reach). Deliberately simpler than `VideoWithState`: no loading
 * overlay here (avoids visual noise on a de-emphasized, partially-scaled
 * preview slide — see globals.css's `.gallery-lightbox-slide-prev/-next`),
 * though a successful load/error still updates the shared, id-keyed
 * ready/error state so the main-track card and an eventual active-slide
 * view of the same item benefit from it too.
 */
function NeighborVideoPreview({
  item,
  videoErrors,
  onReady,
  onError,
}: {
  item: Extract<HorizontalGalleryItem, { kind: "video" }>;
  videoErrors: Set<string>;
  onReady: (id: string) => void;
  onError: (id: string) => void;
}) {
  if (videoErrors.has(item.id)) {
    return <div className="horizontal-gallery-video-fallback" aria-hidden="true" />;
  }
  return (
    <video
      src={item.src}
      playsInline
      preload="metadata"
      tabIndex={-1}
      aria-hidden="true"
      className="horizontal-gallery-video-preview"
      onLoadedData={() => onReady(item.id)}
      onCanPlay={() => onReady(item.id)}
      onError={() => onError(item.id)}
    >
      <track kind="captions" />
    </video>
  );
}

export function HorizontalGallery({ items, locale = "en" }: { items: HorizontalGalleryItem[]; locale?: Locale }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<number | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  // Tracks whichever <video> is currently the Lightbox's ACTIVE slide (only
  // one video can ever be playing at a time — neighbor previews and the
  // main-track preview never have controls/autoplay, so nothing else is
  // ever capable of producing audio). Read synchronously by moveLightbox/
  // closeLightbox (pausing BEFORE the state change that will replace the
  // active slide) and, as the case that actually needs it — a full
  // component unmount — by its own ref callback's own null-check below
  // (see that callback's comment for why a cleanup effect can't do this
  // reliably).
  const activeLightboxVideoRef = useRef<HTMLVideoElement | null>(null);
  // Stable identity (empty deps — only touches the ref, never reads
  // reactive state) is what makes this safe to pass as `VideoWithState`'s
  // `videoRef` prop: React only calls a ref callback with `null` then the
  // new element when the DOM node is genuinely mounting/unmounting, or
  // when the ref PROP's own identity changes between renders. An inline
  // arrow function here would change identity every render and trigger a
  // spurious detach-then-reattach (and therefore a spurious pause) on
  // every unrelated re-render — see VideoWithState's own `setVideoElement`
  // comment for the other half of this.
  const setActiveLightboxVideo = useCallback((el: HTMLVideoElement | null) => {
    if (el === null) activeLightboxVideoRef.current?.pause();
    activeLightboxVideoRef.current = el;
  }, []);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  // Keyed by item.id (never src alone) — two items sharing a source URL
  // must still be independent, e.g. an intentionally repeated photo/video.
  const [brokenIds, setBrokenIds] = useState<Set<string>>(() => new Set());
  const [videoErrors, setVideoErrors] = useState<Set<string>>(() => new Set());
  const [videoReady, setVideoReady] = useState<Set<string>>(() => new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // The single canonical ordered (photo + video) set — drives EVERYTHING:
  // main-track order/counter, Lightbox index/counter, Previous/Next,
  // Arrow/swipe/wheel navigation, and the Lightbox's previous/active/next
  // previews. There is deliberately no second, photo-only array to keep in
  // sync with this one — `lightboxIndex` always refers to a position in
  // THIS array.
  const availableItems = useMemo(
    () => items.filter((item) => typeof item.src === "string" && item.src.trim() && !brokenIds.has(item.id)),
    [brokenIds, items],
  );

  const safeCurrentIndex = Math.min(
    currentIndex,
    Math.max(availableItems.length - 1, 0),
  );
  const safeLightboxIndex =
    lightboxIndex === null
      ? null
      : Math.min(lightboxIndex, Math.max(availableItems.length - 1, 0));
  const isLightboxOpen = safeLightboxIndex !== null;

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

  // Applies to both kinds, keyed by id — an item (photo or video) that
  // fails to load is dropped from the rendered set (never shown as a blank
  // card, never crashes the rest of the gallery), with a development-only
  // console warning so the broken reference is discoverable without
  // surfacing anything to site visitors.
  const removeUnavailableItem = useCallback((id: string) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`HorizontalGallery: dropping an item whose media failed to load (id: ${id}).`);
    }
    setBrokenIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
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
  // unused site-wide). Keyed by id so the SAME error state applies
  // consistently wherever this item is shown (main-track preview or
  // Lightbox active slide).
  const markVideoError = useCallback((id: string) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`HorizontalGallery: video failed to play at runtime, showing fallback (id: ${id}).`);
    }
    setVideoErrors((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const markVideoReady = useCallback((id: string) => {
    setVideoReady((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const closeLightbox = useCallback(() => {
    // Stops playback on every exit path that funnels through here (Close
    // button, backdrop click, Escape) — see the ref's own comment.
    activeLightboxVideoRef.current?.pause();
    setLightboxIndex(null);
    requestAnimationFrame(() => openerRef.current?.focus?.());
  }, []);

  const moveLightbox = useCallback(
    (direction: number) => {
      // Stops playback on every exit path that funnels through here
      // (Previous/Next buttons, swipe, wheel, ArrowLeft/ArrowRight) —
      // called unconditionally (not just when the outgoing slide was a
      // video) since pausing a non-playing element is a harmless no-op.
      activeLightboxVideoRef.current?.pause();
      setLightboxIndex((current) => {
        if (current === null) return current;
        if (availableItems.length === 0) return null;
        const next =
          (current + direction + availableItems.length) %
          availableItems.length;
        return next;
      });
    },
    [availableItems.length],
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
    if (isInteractiveMediaTarget(event.target)) return;
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
      // Escape always closes, even while the video/its controls have
      // focus — this check must run before the focused-in-video guard
      // below.
      if (event.key === "Escape") {
        closeLightbox();
        return;
      }
      // While focus is inside the active <video> (or its native controls),
      // arrow keys are the browser's own seek/volume shortcuts — the
      // Lightbox must not also interpret them as slide navigation.
      if (isInteractiveMediaTarget(document.activeElement)) return;
      if (event.key === "ArrowLeft") moveLightbox(-1);
      if (event.key === "ArrowRight") moveLightbox(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, availableItems.length, moveLightbox, closeLightbox]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  // Moves focus into the dialog the moment it opens (not on every slide
  // change within an open session — that would steal focus away from a
  // visitor actively using the active video's controls). Depends on the
  // open/closed boolean, not the index itself, so navigating slides never
  // re-triggers this.
  useEffect(() => {
    if (!isLightboxOpen) return;
    closeButtonRef.current?.focus();
  }, [isLightboxOpen]);

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

  function renderLightboxSlide(item: HorizontalGalleryItem, variant: "active" | "neighbor") {
    if (item.kind === "image") {
      return <img src={item.src} alt={item.alt} draggable="false" onError={() => removeUnavailableItem(item.id)} />;
    }
    if (variant === "active") {
      return (
        <VideoWithState
          item={item}
          locale={locale}
          videoReady={videoReady}
          videoErrors={videoErrors}
          onReady={markVideoReady}
          onError={markVideoError}
          interactive
          videoRef={setActiveLightboxVideo}
        />
      );
    }
    return <NeighborVideoPreview item={item} videoErrors={videoErrors} onReady={markVideoReady} onError={markVideoError} />;
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
                <div key={item.id} className="horizontal-gallery-item horizontal-gallery-video-item">
                  <VideoWithState
                    item={item}
                    locale={locale}
                    videoReady={videoReady}
                    videoErrors={videoErrors}
                    onReady={markVideoReady}
                    onError={markVideoError}
                    interactive={false}
                  />
                  <button
                    type="button"
                    className="horizontal-gallery-video-opener"
                    onClick={(event) => {
                      openerRef.current = event.currentTarget;
                      setLightboxIndex(index);
                    }}
                    aria-label={`Open video: ${item.accessibleLabel}`}
                  >
                    <span className="horizontal-gallery-video-opener-icon" aria-hidden="true">
                      <Play strokeWidth={2} className="h-5 w-5 translate-x-px" fill="currentColor" />
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  key={item.id}
                  className="horizontal-gallery-item"
                  type="button"
                  onClick={(event) => {
                    openerRef.current = event.currentTarget;
                    setLightboxIndex(index);
                  }}
                  aria-label={`Open gallery image ${index + 1}`}
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    draggable="false"
                    onError={() => removeUnavailableItem(item.id)}
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
          aria-label="Media preview"
        >
          <button
            className="absolute inset-0 border-0 bg-black/68"
            type="button"
            onClick={closeLightbox}
            aria-label="Close media preview"
          />
          <div
            className="relative z-1 grid h-[min(calc(100dvh-88px),720px)] w-[min(1320px,100%)] cursor-grab touch-pan-y place-items-center overflow-hidden active:cursor-grabbing max-sm:h-[min(calc(100dvh-112px),620px)] max-sm:w-screen max-sm:grid-cols-1 max-sm:overflow-visible"
            onTouchStart={(event: TouchEvent<HTMLDivElement>) => {
              if (isInteractiveMediaTarget(event.target)) return;
              handleDragStart(event.touches[0]?.clientX ?? 0);
            }}
            onTouchEnd={(event: TouchEvent<HTMLDivElement>) =>
              handleDragEnd(event.changedTouches[0]?.clientX ?? 0)
            }
            onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
              if (isInteractiveMediaTarget(event.target)) return;
              handleDragStart(event.clientX);
            }}
            onMouseUp={(event: MouseEvent<HTMLDivElement>) => handleDragEnd(event.clientX)}
            onMouseLeave={(event: MouseEvent<HTMLDivElement>) => handleDragEnd(event.clientX)}
            onWheel={handleWheel}
          >
            <button
              ref={closeButtonRef}
              className="gallery-lightbox-close"
              type="button"
              onClick={closeLightbox}
              aria-label="Close media preview"
            >
              Close
            </button>
            <div
              className="absolute left-1/2 top-5.5 z-4 -translate-x-1/2 rounded-pill bg-[rgba(var(--rgb-dark-brown),0.54)] px-3 py-2 text-[12px] font-black tracking-[0.04em] text-cream"
              aria-live="polite"
            >
              {safeLightboxIndex + 1} / {availableItems.length}
            </div>
            <button
              className="gallery-lightbox-nav gallery-lightbox-nav-prev"
              type="button"
              onClick={() => moveLightbox(-1)}
              aria-label="Previous media"
            >
              Previous
            </button>
            <button
              className="gallery-lightbox-nav gallery-lightbox-nav-next"
              type="button"
              onClick={() => moveLightbox(1)}
              aria-label="Next media"
            >
              Next
            </button>
            <div className="gallery-lightbox-slider">
              <div className="gallery-lightbox-slide gallery-lightbox-slide-prev">
                {renderLightboxSlide(
                  availableItems[(safeLightboxIndex - 1 + availableItems.length) % availableItems.length]!,
                  "neighbor",
                )}
              </div>
              <div
                className="gallery-lightbox-slide gallery-lightbox-slide-active"
                key={availableItems[safeLightboxIndex]!.id}
              >
                {renderLightboxSlide(availableItems[safeLightboxIndex]!, "active")}
              </div>
              <div className="gallery-lightbox-slide gallery-lightbox-slide-next">
                {renderLightboxSlide(
                  availableItems[(safeLightboxIndex + 1) % availableItems.length]!,
                  "neighbor",
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
