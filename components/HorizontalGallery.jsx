"use client";

import { useEffect, useRef, useState } from "react";

export function HorizontalGallery({ images }) {
  const trackRef = useRef(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  function scrollGallery(direction) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * Math.round(track.clientWidth * 0.82),
      behavior: "smooth",
    });
  }

  function moveLightbox(direction) {
    setLightboxIndex((current) => {
      if (current === null) return current;
      return (current + direction + images.length) % images.length;
    });
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
  }, [lightboxIndex, images.length]);

  return (
    <>
      <div className="horizontal-gallery">
        <div className="gallery-controls" aria-label="Gallery controls">
          <button type="button" onClick={() => scrollGallery(-1)} aria-label="Previous image">
            Previous
          </button>
          <button type="button" onClick={() => scrollGallery(1)} aria-label="Next image">
            Next
          </button>
        </div>
        <div className="horizontal-gallery-frame">
          <div className="horizontal-gallery-track" ref={trackRef}>
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                className="horizontal-gallery-item"
                type="button"
                onClick={() => setLightboxIndex(index)}
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
          <div className="gallery-lightbox-content">
            <button className="gallery-lightbox-close" type="button" onClick={() => setLightboxIndex(null)} aria-label="Close image preview">Close</button>
            <button className="gallery-lightbox-nav gallery-lightbox-prev" type="button" onClick={() => moveLightbox(-1)} aria-label="Previous image">Previous</button>
            <img src={images[lightboxIndex]} alt="" />
            <button className="gallery-lightbox-nav gallery-lightbox-next" type="button" onClick={() => moveLightbox(1)} aria-label="Next image">Next</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
