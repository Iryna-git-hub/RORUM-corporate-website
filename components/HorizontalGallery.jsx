"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function HorizontalGallery({ images }) {
  const trackRef = useRef(null);
  const dragStartRef = useRef(null);
  const openerRef = useRef(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    requestAnimationFrame(() => openerRef.current?.focus?.());
  }, []);

  const moveLightbox = useCallback(
    (direction) => {
      setLightboxIndex((current) => {
        if (current === null) return current;
        const next = (current + direction + images.length) % images.length;
        return next;
      });
    },
    [images.length],
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
  }, [lightboxIndex, images.length, moveLightbox, closeLightbox]);

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
  }, [images.length, syncCurrentIndex]);

  return (
    <>
      <div className="horizontal-gallery">
        <div className="horizontal-gallery-frame">
          {images.length > 1 ? (
            <>
              <button
                className="horizontal-gallery-nav horizontal-gallery-nav-prev"
                type="button"
                onClick={() => moveTrack(-1)}
                aria-label="Previous slide"
                disabled={currentIndex === 0}
              >
                <ChevronLeft aria-hidden="true" strokeWidth={2.2} />
              </button>
              <button
                className="horizontal-gallery-nav horizontal-gallery-nav-next"
                type="button"
                onClick={() => moveTrack(1)}
                aria-label="Next slide"
                disabled={currentIndex === images.length - 1}
              >
                <ChevronRight aria-hidden="true" strokeWidth={2.2} />
              </button>
              <div className="horizontal-gallery-counter" aria-live="polite">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          ) : null}
          <div className="horizontal-gallery-track" ref={trackRef}>
            {images.map((image, index) => (
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
                <img src={image} alt="" draggable="false" />
              </button>
            ))}
          </div>
        </div>
      </div>
      {lightboxIndex !== null ? (
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
              {lightboxIndex + 1} / {images.length}
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
                    images[(lightboxIndex - 1 + images.length) % images.length]
                  }
                  alt=""
                  draggable="false"
                />
              </div>
              <div
                className="gallery-lightbox-slide gallery-lightbox-slide-active"
                key={images[lightboxIndex]}
              >
                <img src={images[lightboxIndex]} alt="" draggable="false" />
              </div>
              <div className="gallery-lightbox-slide gallery-lightbox-slide-next">
                <img
                  src={images[(lightboxIndex + 1) % images.length]}
                  alt=""
                  draggable="false"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
