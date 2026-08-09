"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) =>
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true",
  );
}

export function ApplicationModal({
  children,
  closeLabel,
  descriptionId,
  onClose,
  titleId,
}: {
  children: ReactNode;
  closeLabel: string;
  descriptionId?: string;
  onClose: () => void;
  titleId: string;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (document.querySelector('[data-privacy-policy-modal="true"]')) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements(dialogRef.current);
      if (!focusableElements.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0]!;
      const lastElement = focusableElements[focusableElements.length - 1]!;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-140 grid place-items-center p-[clamp(20px,4vw,48px)] bg-[rgba(var(--rgb-dark-brown),0.48)] backdrop-blur-[10px] max-sm:items-stretch max-sm:p-0"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="relative w-[min(760px,100%)] max-h-[min(880px,calc(100dvh-40px))] overflow-y-auto rounded-[8px] bg-white p-[clamp(26px,4vw,44px)] text-text-primary shadow-[0_28px_80px_rgba(var(--rgb-dark-brown),0.28)] max-sm:w-full max-sm:max-h-dvh max-sm:min-h-dvh max-sm:rounded-none max-sm:pt-6.5 max-sm:px-4 max-sm:pb-8.5"
        data-application-modal="true"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <button
          ref={closeButtonRef}
          className="absolute top-3.5 right-3.5 w-10.5 h-10.5 inline-flex items-center justify-center border border-[rgba(var(--rgb-brown),0.16)] rounded-full bg-white text-dark-brown transition duration-180 ease-[ease] hover:-translate-y-px hover:border-red hover:text-red hover:outline-none focus-visible:-translate-y-px focus-visible:border-red focus-visible:text-red focus-visible:outline-none"
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
        >
          <X aria-hidden="true" strokeWidth={1.8} />
        </button>
        {children}
      </div>
    </div>
  );
}
