"use client";

import { useEffect, useState } from "react";
import {
  PrivacyConsent,
  validatePrivacyConsent,
} from "@/components/PrivacyConsent";

const requiredFields = [
  ["package", "Package"],
  ["phone", "Phone number"],
  ["email", "Email"],
  ["name", "Full name"],
  ["message", "Request"],
];

const packageOptions = [
  "Single session",
  "Evening series",
  "Weekend event",
  "Not sure yet",
];

function getInitialPackage() {
  if (typeof window === "undefined") return "";
  const packageName =
    new URLSearchParams(window.location.search).get("package") ?? "";
  return packageOptions.includes(packageName) ? packageName : "";
}

function validateField(name, value, label) {
  const stringValue = String(value ?? "");
  if (!stringValue.trim()) return `${label} is required.`;
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
    return "Please enter a valid email address.";
  }
  return "";
}

function FieldError({ id, message }) {
  return message ? (
    <small className="form-error" id={id}>
      {message}
    </small>
  ) : null;
}

export function HostEventInquiryForm() {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedPackage, setSelectedPackage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const packageName = getInitialPackage();
    if (!packageName) return undefined;
    const timeoutId = window.setTimeout(
      () => setSelectedPackage(packageName),
      0,
    );
    return () => window.clearTimeout(timeoutId);
  }, []);

  function onSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextErrors = {};

    requiredFields.forEach(([name, label]) => {
      const error = validateField(name, formData.get(name), label);
      if (error) nextErrors[name] = error;
    });
    const privacyError = validatePrivacyConsent(formData);
    if (privacyError) nextErrors.privacyConsent = privacyError;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setSent(false);
      return;
    }

    setSent(true);
    setSelectedPackage("");
    form.reset();
  }

  return (
    <form
      className="form host-event-form card card-pad"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="form-heading">
        <h2 className="heading form-title">Tell us about your event</h2>
        <p>
          Choose a package and share your contact details. We&apos;ll get back
          to you soon.
        </p>
      </div>
      {sent ? (
        <div className="success" role="status">
          Thank you. We&apos;ve received your inquiry and will contact you soon.
        </div>
      ) : null}

      <label htmlFor="host-name">
        Full name<span aria-hidden="true">*</span>
        <input
          id="host-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "host-name-error" : undefined}
        />
        <FieldError id="host-name-error" message={errors.name} />
      </label>
      <div className="form-grid">
        <label htmlFor="host-phone">
          Phone number<span aria-hidden="true">*</span>
          <input
            id="host-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+45 12 34 56 78"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "host-phone-error" : undefined}
          />
          <FieldError id="host-phone-error" message={errors.phone} />
        </label>
        <label htmlFor="host-email">
          Email<span aria-hidden="true">*</span>
          <input
            id="host-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "host-email-error" : undefined}
          />
          <FieldError id="host-email-error" message={errors.email} />
        </label>
      </div>

      <label htmlFor="host-package">
        Package<span aria-hidden="true">*</span>
        <select
          id="host-package"
          name="package"
          value={selectedPackage}
          onChange={(event) => setSelectedPackage(event.target.value)}
          aria-invalid={Boolean(errors.package)}
          aria-describedby={errors.package ? "host-package-error" : undefined}
        >
          <option value="" disabled>
            Select package
          </option>
          {packageOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <FieldError id="host-package-error" message={errors.package} />
      </label>

      <label htmlFor="host-message">
        Request<span aria-hidden="true">*</span>
        <textarea
          id="host-message"
          name="message"
          rows={5}
          placeholder="Tell us briefly what you would like to host."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "host-message-error" : undefined}
        />
        <FieldError id="host-message-error" message={errors.message} />
      </label>

      <PrivacyConsent id="host-privacy" error={errors.privacyConsent} />

      <button className="btn host-form-submit" type="submit">
        Send event inquiry
      </button>
      <p className="form-microcopy">
        We&apos;ll only use your details to respond to your request.
      </p>
    </form>
  );
}
