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
    <div className="grid gap-1.5">
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
          className="appearance-none w-4.5 h-4.5 min-w-4.5 m-0 grid place-content-center border border-[rgba(var(--rgb-red),0.48)] bg-white cursor-pointer before:content-[''] before:w-2.5 before:h-2.5 before:bg-red before:scale-0 before:transition-transform before:duration-140 checked:before:scale-100 focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_2px_rgba(var(--rgb-light-green),0.24)] aria-[invalid=true]:border-accent aria-[invalid=true]:shadow-[0_0_0_2px_rgba(var(--rgb-red),0.16)]"
        />
        <span className="text-text-primary text-sm font-semibold leading-[1.45]">
          <label htmlFor={id} className="inline text-text-primary text-sm font-semibold leading-[1.45] cursor-pointer">
            I have read and agree to the
          </label>{" "}
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
