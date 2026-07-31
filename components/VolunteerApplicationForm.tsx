"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { ApplicationModal } from "@/components/ApplicationModal";
import {
  PrivacyConsent,
  validatePrivacyConsent,
} from "@/components/PrivacyConsent";
import { formspreeConfig, submitToFormspree } from "@/lib/formspree";

const requiredFields: [name: string, label: string][] = [
  ["name", "Full Name"],
  ["email", "Email"],
  ["phone", "Phone number"],
  ["message", "Message"],
];

function validateField(
  name: string,
  value: FormDataEntryValue | null,
  label: string,
): string {
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

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <small className="text-accent text-xs font-bold" id={id} role="alert">
      {message}
    </small>
  ) : null;
}

function VolunteerApplicationDialog({ onClose }: { onClose: () => void }) {
  const submissionLock = useRef(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current || sent) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextErrors: Record<string, string> = {};

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
    } catch (error: unknown) {
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
      className="form cv-modal-form"
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
      <div className="grid gap-2 mb-1">
        <h2 id="volunteer-modal-title" className="heading form-title">
          Volunteer With Us
        </h2>
      </div>

      {sent ? (
        <div
          className="border border-[rgba(var(--rgb-light-green),0.28)] rounded-none bg-[rgba(var(--rgb-beige),0.24)] p-3.5 text-primary-dark font-bold"
          role="status"
        >
          Thank you. Your volunteer application has been sent to the RORUM
          team.
        </div>
      ) : null}

      {submitError ? (
        <div
          className="border border-[rgba(var(--rgb-red),0.24)] bg-[rgba(var(--rgb-red),0.08)] p-3.5 text-accent text-sm font-bold leading-[1.55]"
          role="alert"
        >
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
}: {
  children?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

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
