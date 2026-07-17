"use client";

import { useState } from "react";
import {
  PrivacyConsent,
  validatePrivacyConsent,
} from "@/components/PrivacyConsent";

const requiredFields = [
  ["name", "Full Name"],
  ["phone", "Phone number"],
  ["email", "Email"],
  ["eventDate", "Event date"],
  ["message", "Message"],
];

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

export function CateringInquiryForm() {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});

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
    form.reset();
  }

  return (
    <form
      className="form catering-form card card-pad"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="form-heading">
        <h2 className="heading form-title">Request catering</h2>
      </div>
      {sent ? (
        <div className="success" role="status">
          Thank you. We&apos;ve received your catering request and will contact
          you soon.
        </div>
      ) : null}

      <label htmlFor="catering-name">
        Full Name<span aria-hidden="true">*</span>
        <input
          id="catering-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Full Name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "catering-name-error" : undefined}
        />
        <FieldError id="catering-name-error" message={errors.name} />
      </label>
      <div className="form-grid">
        <label htmlFor="catering-phone">
          Phone number<span aria-hidden="true">*</span>
          <input
            id="catering-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+45 12 34 56 78"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "catering-phone-error" : undefined}
          />
          <FieldError id="catering-phone-error" message={errors.phone} />
        </label>
        <label htmlFor="catering-email">
          Email<span aria-hidden="true">*</span>
          <input
            id="catering-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "catering-email-error" : undefined}
          />
          <FieldError id="catering-email-error" message={errors.email} />
        </label>
      </div>
      <div className="form-grid">
        <label htmlFor="catering-date">
          Event date<span aria-hidden="true">*</span>
          <input
            id="catering-date"
            name="eventDate"
            type="date"
            aria-invalid={Boolean(errors.eventDate)}
            aria-describedby={
              errors.eventDate ? "catering-date-error" : undefined
            }
          />
          <FieldError id="catering-date-error" message={errors.eventDate} />
        </label>
      </div>

      <label htmlFor="catering-message">
        Message<span aria-hidden="true">*</span>
        <textarea
          id="catering-message"
          name="message"
          rows={5}
          placeholder="Describe your event, timing and catering wishes."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? "catering-message-error" : undefined
          }
        />
        <FieldError id="catering-message-error" message={errors.message} />
      </label>

      <PrivacyConsent id="catering-privacy" error={errors.privacyConsent} />

      <button className="btn" type="submit">
        Request Catering
      </button>
      <p className="form-microcopy">
        We&apos;ll only use your details to respond to your catering request.
      </p>
    </form>
  );
}
