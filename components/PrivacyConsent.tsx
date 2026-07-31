"use client";

import { useRef, useState } from "react";
import { PrivacyPolicyModal } from "@/components/PrivacyPolicyModal";

export function validatePrivacyConsent(formData: FormData): string {
  return formData.get("privacyConsent") === "on"
    ? ""
    : "Please agree to the Privacy policy before submitting.";
}

export function PrivacyConsent({
  error,
  id = "privacy-consent",
  required = true,
}: {
  error?: string;
  id?: string;
  required?: boolean;
}) {
  const [policyOpen, setPolicyOpen] = useState(false);
  const checkboxRef = useRef<HTMLInputElement | null>(null);
  const policyButtonRef = useRef<HTMLButtonElement | null>(null);

  function closePolicy() {
    setPolicyOpen(false);
    requestAnimationFrame(() => policyButtonRef.current?.focus());
  }

  function agreeToPolicy() {
    if (checkboxRef.current) checkboxRef.current.checked = true;
    closePolicy();
  }

  return (
    // Kept as the legacy `.privacy-consent-field` class: globals.css uses it
    // as an ancestor selector for `.privacy-consent-field input`, including a
    // `::before` pseudo-element that draws the custom checkbox's checkmark.
    // Per the rule-6 exception this class must stay so that unlayered rule
    // keeps matching; the div's own display/gap are already fully set by
    // that same retained rule, so no Tailwind utilities are added here.
    <div className="privacy-consent-field">
      <div className="grid grid-cols-[18px_minmax(0,1fr)] items-center gap-2.5">
        <input
          ref={checkboxRef}
          id={id}
          name="privacyConsent"
          type="checkbox"
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {/*
          Kept as the legacy `.privacy-consent-copy` class: globals.css styles
          the nested <label> purely via the descendant selectors
          `.privacy-consent-copy label` / `.form .privacy-consent-copy label` /
          `.cv-modal-form .privacy-consent-copy label` (this component is
          rendered inside both `.form` and `.cv-modal-form` contexts in other
          files). Removing this class would break the label's inherited
          typography there, so it's retained unchanged; the span's own
          color/font/line-height are already fully covered by the same
          unlayered rule.
        */}
        <span className="privacy-consent-copy">
          <label htmlFor={id}>I have read and agree to the</label>{" "}
          <button
            ref={policyButtonRef}
            className="inline m-0 p-0 border-0 bg-transparent text-red font-[inherit] [font-size:inherit] leading-[inherit] [font-style:inherit] font-extrabold underline underline-offset-[3px] cursor-pointer transition-colors duration-180 ease-[ease] hover:text-[rgba(var(--rgb-red),0.68)] focus-visible:text-[rgba(var(--rgb-red),0.68)] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[3px]"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={policyOpen}
            onClick={() => setPolicyOpen(true)}
          >
            Privacy Policy
          </button>
          .
        </span>
      </div>
      {error ? (
        <small className="text-accent text-xs font-bold" id={`${id}-error`} role="alert">
          {error}
        </small>
      ) : null}
      {policyOpen ? (
        <PrivacyPolicyModal
          titleId={`${id}-policy-title`}
          returnFocusRef={policyButtonRef}
          onAgree={agreeToPolicy}
          onClose={closePolicy}
        />
      ) : null}
    </div>
  );
}
