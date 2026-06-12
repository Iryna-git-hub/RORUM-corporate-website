"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function HorizontalGallery({ images }) {
  const trackRef = useRef(null);
  const dragStartRef = useRef(null);
  const openerRef = useRef(null);
  const [brokenImages, setBrokenImages] = useState(() => new Set());
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const availableImages = useMemo(
    () =>
      images.filter(
        (image) => typeof image === "string" && image.trim() && !brokenImages.has(image),
      ),
    [brokenImages, images],
  );
  const safeCurrentIndex = Math.min(
    currentIndex,
    Math.max(availableImages.length - 1, 0),
  );
  const safeLightboxIndex =
    lightboxIndex === null
      ? null
      : Math.min(lightboxIndex, Math.max(availableImages.length - 1, 0));

  const syncCurrentIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = Array.from(track.children);
    if (items.length === 0) {
      setCurrentIndex(0);
      return;
    }

    const scrollLeft = track.scrollLeft;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    items.forEach((item, index) => {
      const distance = Math.abs(item.offsetLeft - scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setCurrentIndex(closestIndex);
  }, []);

  const moveTrack = useCallback(
    (direction) => {
      const track = trackRef.current;
      if (!track) return;

      const items = Array.from(track.children);
      if (items.length === 0) return;

      const nextIndex = Math.min(
        Math.max(currentIndex + direction, 0),
        items.length - 1,
      );
      const nextItem = items[nextIndex];
      if (!nextItem) return;

      track.scrollTo({ left: nextItem.offsetLeft, behavior: "smooth" });
      setCurrentIndex(nextIndex);
    },
    [currentIndex],
  );

  const removeUnavailableImage = useCallback((image) => {
    setBrokenImages((current) => {
      if (current.has(image)) return current;
      const next = new Set(current);
      next.add(image);
      return next;
    });
    setCurrentIndex((current) => Math.max(0, current - 1));
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    requestAnimationFrame(() => openerRef.current?.focus?.());
  }, []);

  const moveLightbox = useCallback(
    (direction) => {
      setLightboxIndex((current) => {
        if (current === null) return current;
        if (availableImages.length === 0) return null;
        const next =
          (current + direction + availableImages.length) %
          availableImages.length;
        return next;
      });
    },
    [availableImages.length],
  );

  function handleDragStart(clientX) {
    dragStartRef.current = clientX;
  }

  function handleDragEnd(clientX) {
    if (dragStartRef.current === null) return;
    const deltaX = clientX - dragStartRef.current;
    dragStartRef.current = null;
    if (Math.abs(deltaX) < 42) return;
    moveLightbox(deltaX < 0 ? 1 : -1);
  }

  function handleWheel(event) {
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
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") moveLightbox(-1);
      if (event.key === "ArrowRight") moveLightbox(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, availableImages.length, moveLightbox, closeLightbox]);

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
  }, [availableImages.length, syncCurrentIndex]);

  if (availableImages.length === 0) {
    return null;
  }

  return (
    <>
      <div className="horizontal-gallery">
        <div className="horizontal-gallery-frame">
          {availableImages.length > 1 ? (
            <>
              <button
                className="horizontal-gallery-nav horizontal-gallery-nav-prev"
                type="button"
                onClick={() => moveTrack(-1)}
                aria-label="Previous slide"
                disabled={safeCurrentIndex === 0}
              >
                <ChevronLeft aria-hidden="true" strokeWidth={2.2} />
              </button>
              <button
                className="horizontal-gallery-nav horizontal-gallery-nav-next"
                type="button"
                onClick={() => moveTrack(1)}
                aria-label="Next slide"
                disabled={safeCurrentIndex === availableImages.length - 1}
              >
                <ChevronRight aria-hidden="true" strokeWidth={2.2} />
              </button>
              <div className="horizontal-gallery-counter" aria-live="polite">
                {safeCurrentIndex + 1} / {availableImages.length}
              </div>
            </>
          ) : null}
          <div className="horizontal-gallery-track" ref={trackRef}>
            {availableImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                className="horizontal-gallery-item"
                type="button"
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setLightboxIndex(index);
                }}
                aria-label={`Open gallery image ${index + 1}`}
              >
                <img
                  src={image}
                  alt=""
                  draggable="false"
                  onError={() => removeUnavailableImage(image)}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      {safeLightboxIndex !== null ? (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            className="gallery-lightbox-backdrop"
            type="button"
            onClick={closeLightbox}
            aria-label="Close image preview"
          />
          <div
            className="gallery-lightbox-content"
            onTouchStart={(event) =>
              handleDragStart(event.touches[0]?.clientX ?? 0)
            }
            onTouchEnd={(event) =>
              handleDragEnd(event.changedTouches[0]?.clientX ?? 0)
            }
            onMouseDown={(event) => handleDragStart(event.clientX)}
            onMouseUp={(event) => handleDragEnd(event.clientX)}
            onMouseLeave={(event) => handleDragEnd(event.clientX)}
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
            <div className="gallery-lightbox-counter" aria-live="polite">
              {safeLightboxIndex + 1} / {availableImages.length}
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
                    availableImages[
                      (safeLightboxIndex - 1 + availableImages.length) %
                        availableImages.length
                    ]
                  }
                  alt=""
                  draggable="false"
                  onError={() =>
                    removeUnavailableImage(
                      availableImages[
                        (safeLightboxIndex - 1 + availableImages.length) %
                          availableImages.length
                      ],
                    )
                  }
                />
              </div>
              <div
                className="gallery-lightbox-slide gallery-lightbox-slide-active"
                key={availableImages[safeLightboxIndex]}
              >
                <img
                  src={availableImages[safeLightboxIndex]}
                  alt=""
                  draggable="false"
                  onError={() =>
                    removeUnavailableImage(availableImages[safeLightboxIndex])
                  }
                />
              </div>
              <div className="gallery-lightbox-slide gallery-lightbox-slide-next">
                <img
                  src={
                    availableImages[
                      (safeLightboxIndex + 1) % availableImages.length
                    ]
                  }
                  alt=""
                  draggable="false"
                  onError={() =>
                    removeUnavailableImage(
                      availableImages[
                        (safeLightboxIndex + 1) % availableImages.length
                      ],
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
