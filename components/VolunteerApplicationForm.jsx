"use client";

import { useCallback, useRef, useState } from "react";
import { ApplicationModal } from "@/components/ApplicationModal";
import {
  PrivacyConsent,
  validatePrivacyConsent,
} from "@/components/PrivacyConsent";
import { formspreeConfig, submitToFormspree } from "@/lib/formspree";

const requiredFields = [
  ["name", "Full Name"],
  ["email", "Email"],
  ["phone", "Phone number"],
  ["message", "Message"],
];

function validateField(name, value, label) {
  const stringValue = String(value ?? "").trim();

  if (!stringValue) return `${label} is required.`;
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
    return "Please enter a valid email address.";
  }
  if (name === "phone" && !/^[+()\d\s.-]{7,20}$/.test(stringValue)) {
    return "Please enter a valid phone number.";
  }

  return "";
}

function FieldError({ id, message }) {
  return message ? (
    <small className="form-error" id={id} role="alert">
      {message}
    </small>
  ) : null;
}

function VolunteerApplicationDialog({ onClose }) {
  const submissionLock = useRef(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submissionLock.current || sent) return;

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
    setSubmitError("");
    if (Object.keys(nextErrors).length) return;

    submissionLock.current = true;
    setIsSubmitting(true);

    try {
      await submitToFormspree(formData);
      setSent(true);
      form.reset();
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message === "FORMSPREE_NOT_CONFIGURED"
          ? "Applications are temporarily unavailable because Formspree has not been configured yet. Please try again later."
          : "We could not send your application. Please check your connection and try again.",
      );
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <ApplicationModal
      titleId="volunteer-modal-title"
      closeLabel="Close volunteer application dialog"
      onClose={onClose}
    >
    <form
      className="form volunteer-application-form cv-modal-form"
      action={formspreeConfig.endpoint}
      method="post"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isSubmitting}
    >
      <input type="hidden" name="form_name" value="Volunteer With Us" />
      <input
        type="hidden"
        name="subject"
        value="New Volunteer With Us application"
      />
      <div className="form-heading">
        <h2 id="volunteer-modal-title" className="heading form-title">
          Volunteer With Us
        </h2>
      </div>

      {sent ? (
        <div className="success" role="status">
          Thank you. Your volunteer application has been sent to the RORUM
          team.
        </div>
      ) : null}

      {submitError ? (
        <div className="form-submit-error" role="alert">
          {submitError}
        </div>
      ) : null}

      <label htmlFor="volunteer-name">
        Full Name<span className="required-marker" aria-hidden="true">*</span>
        <input
          id="volunteer-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Full Name"
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "volunteer-name-error" : undefined}
        />
        <FieldError id="volunteer-name-error" message={errors.name} />
      </label>

      <div className="form-grid">
        <label htmlFor="volunteer-email">
          Email<span className="required-marker" aria-hidden="true">*</span>
          <input
            id="volunteer-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email ? "volunteer-email-error" : undefined
            }
          />
          <FieldError id="volunteer-email-error" message={errors.email} />
        </label>

        <label htmlFor="volunteer-phone">
          Phone number<span className="required-marker" aria-hidden="true">*</span>
          <input
            id="volunteer-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+45 12 34 56 78"
            required
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={
              errors.phone ? "volunteer-phone-error" : undefined
            }
          />
          <FieldError id="volunteer-phone-error" message={errors.phone} />
        </label>
      </div>

      <label htmlFor="volunteer-message">
        Message<span className="required-marker" aria-hidden="true">*</span>
        <textarea
          id="volunteer-message"
          name="message"
          rows={6}
          placeholder="Tell us what kinds of activities you would be interested in helping with and how you would like to contribute."
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? "volunteer-message-error" : undefined
          }
        />
        <FieldError id="volunteer-message-error" message={errors.message} />
      </label>

      <PrivacyConsent
        id="volunteer-privacy"
        error={errors.privacyConsent}
      />

      <button className="btn" type="submit" disabled={isSubmitting || sent}>
        {isSubmitting
          ? "Sending..."
          : sent
            ? "Application Sent"
            : "Send Application"}
      </button>
    </form>
    </ApplicationModal>
  );
}

export function VolunteerApplicationButton({
  children = "Apply to volunteer",
  className = "btn",
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  const closeModal = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        className={className}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      {open ? <VolunteerApplicationDialog onClose={closeModal} /> : null}
    </>
  );
}
