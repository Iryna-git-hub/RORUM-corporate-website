"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { PrivacyPolicyContent } from "@/components/PrivacyPolicyContent";

function getFocusableElements(container) {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) =>
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true",
  );
}

export function PrivacyPolicyModal({ onAgree, onClose, returnFocusRef, titleId }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const applicationDialog = returnFocusRef.current?.closest(
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

    function handleKeyDown(event) {
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

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

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
        if (previousAriaHidden === null) {
          applicationDialog.removeAttribute("aria-hidden");
        } else {
          applicationDialog.setAttribute("aria-hidden", previousAriaHidden);
        }
      }
    };
  }, [onClose, returnFocusRef]);

  return createPortal(
    <div
      className="privacy-policy-modal-backdrop"
      data-privacy-policy-modal="true"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="privacy-policy-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="privacy-policy-modal-header">
          <div>
            <h2 id={titleId} className="heading">
              Privacy Policy
            </h2>
            <p>How RORUM handles personal information submitted through this website.</p>
            <p className="privacy-policy-modal-updated">Last updated: May 2026</p>
          </div>
          <button
            ref={closeButtonRef}
            className="cv-modal-close privacy-policy-modal-close"
            type="button"
            aria-label="Close Privacy Policy"
            onClick={onClose}
          >
            <X aria-hidden="true" strokeWidth={1.8} />
          </button>
        </header>

        <div
          className="policy-content privacy-policy-modal-content"
          aria-label="Privacy Policy content"
          tabIndex={0}
        >
          <PrivacyPolicyContent />
        </div>

        <footer className="privacy-policy-modal-footer">
          <button className="btn" type="button" onClick={onAgree}>
            I Have Read and Agree
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
