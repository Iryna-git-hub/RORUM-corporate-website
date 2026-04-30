"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function HorizontalGallery({ images }) {
  const trackRef = useRef(null);
  const dragStartRef = useRef(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [slideDirection, setSlideDirection] = useState(0);

  const moveLightbox = useCallback((direction) => {
    setLightboxIndex((current) => {
      if (current === null) return current;
      const next = current + direction;
      if (next < 0 || next >= images.length) return current;
      setSlideDirection(direction);
      return next;
    });
  }, [images.length]);

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
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 32) return;
    event.preventDefault();
    moveLightbox(event.deltaX > 0 ? 1 : -1);
  }

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowLeft") moveLightbox(-1);
      if (event.key === "ArrowRight") moveLightbox(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, images.length, moveLightbox]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  return (
    <>
      <div className="horizontal-gallery">
        <div className="horizontal-gallery-frame">
          <div className="horizontal-gallery-track" ref={trackRef}>
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                className="horizontal-gallery-item"
                type="button"
                onClick={() => {
                  setSlideDirection(0);
                  setLightboxIndex(index);
                }}
                aria-label={`Open gallery image ${index + 1}`}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        </div>
      </div>
      {lightboxIndex !== null ? (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Image preview">
          <button className="gallery-lightbox-backdrop" type="button" onClick={() => setLightboxIndex(null)} aria-label="Close image preview" />
          <div
            className="gallery-lightbox-content"
            onTouchStart={(event) => handleDragStart(event.touches[0]?.clientX ?? 0)}
            onTouchEnd={(event) => handleDragEnd(event.changedTouches[0]?.clientX ?? 0)}
            onMouseDown={(event) => handleDragStart(event.clientX)}
            onMouseUp={(event) => handleDragEnd(event.clientX)}
            onMouseLeave={(event) => handleDragEnd(event.clientX)}
            onWheel={handleWheel}
          >
            <button className="gallery-lightbox-close" type="button" onClick={() => setLightboxIndex(null)} aria-label="Close image preview">Close</button>
            {lightboxIndex > 0 ? (
              <button className="gallery-lightbox-side gallery-lightbox-side-prev" type="button" onClick={() => moveLightbox(-1)} aria-label="Previous image">
                <img src={images[lightboxIndex - 1]} alt="" />
              </button>
            ) : null}
            <img key={images[lightboxIndex]} className={`gallery-lightbox-main ${slideDirection < 0 ? "slide-from-left" : slideDirection > 0 ? "slide-from-right" : ""}`} src={images[lightboxIndex]} alt="" />
            <div className="gallery-lightbox-hit-zones" aria-hidden="true">
              {lightboxIndex > 0 ? <span onClick={() => moveLightbox(-1)} /> : <span />}
              {lightboxIndex < images.length - 1 ? <span onClick={() => moveLightbox(1)} /> : <span />}
            </div>
            {lightboxIndex < images.length - 1 ? (
              <button className="gallery-lightbox-side gallery-lightbox-side-next" type="button" onClick={() => moveLightbox(1)} aria-label="Next image">
                <img src={images[lightboxIndex + 1]} alt="" />
              </button>
            ) : null}
            <div className="gallery-lightbox-bottom-nav" aria-label="Image navigation">
              {lightboxIndex > 0 ? (
                <button className="gallery-lightbox-bottom-button gallery-lightbox-bottom-prev" type="button" onClick={() => moveLightbox(-1)} aria-label="Previous image">Previous</button>
              ) : <span />}
              {lightboxIndex < images.length - 1 ? (
                <button className="gallery-lightbox-bottom-button gallery-lightbox-bottom-next" type="button" onClick={() => moveLightbox(1)} aria-label="Next image">Next</button>
              ) : <span />}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
