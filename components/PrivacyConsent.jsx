"use client";

import { useRef, useState } from "react";
import { PrivacyPolicyModal } from "@/components/PrivacyPolicyModal";

export function validatePrivacyConsent(formData) {
  return formData.get("privacyConsent") === "on"
    ? ""
    : "Please agree to the Privacy policy before submitting.";
}

export function PrivacyConsent({ error, id = "privacy-consent" }) {
  const [policyOpen, setPolicyOpen] = useState(false);
  const checkboxRef = useRef(null);
  const policyButtonRef = useRef(null);

  function closePolicy() {
    setPolicyOpen(false);
    requestAnimationFrame(() => policyButtonRef.current?.focus());
  }

  function agreeToPolicy() {
    if (checkboxRef.current) checkboxRef.current.checked = true;
    closePolicy();
  }

  return (
    <div className="privacy-consent-field">
      <div className="privacy-consent-control">
        <input
          ref={checkboxRef}
          id={id}
          name="privacyConsent"
          type="checkbox"
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span className="privacy-consent-copy">
          <label htmlFor={id}>I have read and agree to the</label>{" "}
          <button
            ref={policyButtonRef}
            className="privacy-policy-trigger"
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
        <small className="form-error" id={`${id}-error`} role="alert">
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
