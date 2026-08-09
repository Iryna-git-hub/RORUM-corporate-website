"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export function MembershipBenefitsGrid({ children }: { children: ReactNode }) {
  const gridRef = useRef<HTMLDivElement | null>(null);
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
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.18 },
    );

    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  return (
    // `wecoda-benefits-grid`/`is-animation-ready`/`is-visible` are kept:
    // the scroll-triggered stagger animation (per-item `--benefit-index`
    // transition-delay) stays hand-authored CSS, matching this project's
    // allowance for complex animations. The grid layout itself is Tailwind.
    <div
      ref={gridRef}
      className={`wecoda-benefits-grid grid grid-cols-3 gap-[clamp(18px,2.2vw,26px)] items-stretch max-lg:grid-cols-2 max-sm:grid-cols-1 ${
        animationReady ? "is-animation-ready" : ""
      } ${visible ? "is-visible" : ""}`.trim()}
    >
      {children}
    </div>
  );
}
