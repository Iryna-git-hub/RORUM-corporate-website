"use client";

import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { PrivacyPolicyContent } from "@/components/PrivacyPolicyContent";
import { RichText } from "@/components/RichText";
import { useFormContent } from "@/components/FormContentProvider";
import { useLocale } from "@/lib/useLocale";

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) =>
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true",
  );
}

export function PrivacyPolicyModal({
  onAgree,
  onClose,
  returnFocusRef,
  titleId,
}: {
  onAgree: () => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  titleId: string;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const { messages, privacyPolicy } = useFormContent();
  const { locale } = useLocale();
  const lastUpdatedText = privacyPolicy.lastUpdated
    ? new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(new Date(privacyPolicy.lastUpdated))
    : null;

  useEffect(() => {
    const applicationDialog = returnFocusRef.current?.closest<HTMLElement>(
      "[data-application-modal]",
    );
    const previousAriaHidden = applicationDialog?.getAttribute("aria-hidden");
    const originalOverflow = document.body.style.overflow;

    closeButtonRef.current?.focus();
    if (applicationDialog) {
      applicationDialog.inert = true;
      applicationDialog.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
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
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (applicationDialog) {
        applicationDialog.inert = false;
        if (previousAriaHidden === null || previousAriaHidden === undefined) {
          applicationDialog.removeAttribute("aria-hidden");
        } else {
          applicationDialog.setAttribute("aria-hidden", previousAriaHidden);
        }
      }
    };
  }, [onClose, returnFocusRef]);

  return createPortal(
    <div
      className="fixed inset-0 z-[170] grid place-items-center p-[clamp(16px,3vw,36px)] bg-[rgba(var(--rgb-dark-brown),0.58)] backdrop-blur-[12px] max-sm:items-stretch max-sm:p-0"
      data-privacy-policy-modal="true"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="relative grid grid-rows-[auto_minmax(0,1fr)_auto] w-[min(780px,100%)] max-h-[min(900px,calc(100dvh-32px))] overflow-hidden rounded-[8px] bg-white text-text-primary shadow-[0_32px_90px_rgba(var(--rgb-dark-brown),0.34)] max-sm:w-full max-sm:max-h-dvh max-sm:min-h-dvh max-sm:rounded-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="relative pt-[clamp(24px,4vw,36px)] pr-[clamp(68px,9vw,84px)] pb-5 pl-[clamp(22px,4vw,36px)] border-b border-border max-sm:pt-6 max-sm:pr-17 max-sm:pb-4.5 max-sm:pl-4.5">
          <div>
            <h2
              id={titleId}
              className="font-heading text-text-primary tracking-[-0.03em] m-0 mb-2.5 text-[clamp(2rem,5vw,2.6rem)] font-light leading-none"
            >
              {privacyPolicy.title}
            </h2>
            <p className="m-0 text-sm leading-[1.55]">{privacyPolicy.subtitle}</p>
            {lastUpdatedText ? (
              <p className="mt-1.75 text-light-green text-xs font-bold leading-[1.55]">
                {lastUpdatedText}
              </p>
            ) : null}
          </div>
          <button
            ref={closeButtonRef}
            className="absolute top-4.5 right-4.5 w-10.5 h-10.5 inline-flex items-center justify-center border border-[rgba(var(--rgb-brown),0.16)] rounded-full bg-white text-dark-brown transition-[border-color,color,transform] duration-180 ease-[ease] hover:border-red hover:text-red hover:-translate-y-px focus-visible:border-red focus-visible:text-red focus-visible:-translate-y-px focus-visible:outline-none"
            type="button"
            aria-label={`${messages.closeLabel} ${privacyPolicy.title}`}
            onClick={onClose}
          >
            <X aria-hidden="true" strokeWidth={1.8} />
          </button>
        </header>

        <div
          className="policy-content w-full overflow-y-auto overscroll-contain pt-1.5 px-[clamp(22px,4vw,36px)] pb-7 outline-none [scrollbar-gutter:stable] focus-visible:shadow-[inset_0_0_0_2px_rgba(var(--rgb-light-green),0.32)] max-sm:pt-1 max-sm:px-4.5 max-sm:pb-6"
          aria-label={`${privacyPolicy.title} content`}
          tabIndex={0}
        >
          {privacyPolicy.body ? <RichText value={privacyPolicy.body} /> : <PrivacyPolicyContent />}
        </div>

        <footer className="py-4.5 px-[clamp(22px,4vw,36px)] border-t border-border bg-cream max-sm:pt-3.5 max-sm:px-4.5 max-sm:pb-[calc(14px+env(safe-area-inset-bottom))]">
          <button
            className="inline-flex items-center justify-center min-h-10.5 w-full px-6 py-0 border border-cta-red rounded-pill bg-cta-red text-white text-[12.5px] lg:text-[13px] font-bold tracking-[0.02em] uppercase cursor-pointer transition duration-180 ease-[ease] hover:-translate-y-px hover:bg-cta-red-hover hover:border-cta-red-hover hover:text-white focus-visible:bg-cta-red-hover focus-visible:border-cta-red-hover focus-visible:text-white active:bg-primary-darker active:border-primary-darker"
            type="button"
            onClick={onAgree}
          >
            {messages.agreeButtonLabel}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
