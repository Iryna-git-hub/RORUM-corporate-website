export function validatePrivacyConsent(formData) {
  return formData.get("privacyConsent") === "on"
    ? ""
    : "Please agree to the Privacy Policy before submitting.";
}

export function PrivacyConsent({ error, id = "privacy-consent" }) {
  return (
    <div className="privacy-consent-field">
      <label htmlFor={id}>
        <input
          id={id}
          name="privacyConsent"
          type="checkbox"
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span>
          I agree to the{" "}
          <a href="/privacy-policy" target="_blank" rel="noreferrer">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      {error ? (
        <small className="form-error" id={`${id}-error`} role="alert">
          {error}
        </small>
      ) : null}
    </div>
  );
}
