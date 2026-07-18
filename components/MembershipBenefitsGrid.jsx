"use client";

import { useEffect, useRef, useState } from "react";

export function MembershipBenefitsGrid({ children }) {
  const gridRef = useRef(null);
  const [animationReady, setAnimationReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const grid = gridRef.current;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!grid || prefersReducedMotion || !("IntersectionObserver" in window)) {
      return undefined;
    }

    setAnimationReady(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.18 },
    );

    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={gridRef}
      className={`wecoda-benefits-grid ${
        animationReady ? "is-animation-ready" : ""
      } ${visible ? "is-visible" : ""}`.trim()}
    >
      {children}
    </div>
  );
}
