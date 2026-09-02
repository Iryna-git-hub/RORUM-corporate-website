"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { ApplicationModal } from "@/components/ApplicationModal";
import {
  PrivacyConsent,
  validatePrivacyConsent,
} from "@/components/PrivacyConsent";
import { useFormContent } from "@/components/FormContentProvider";
import { formspreeConfig, isFormspreeConfigured } from "@/lib/formspree";
import { useFormspreeSubmit } from "@/lib/useFormspreeSubmit";

export interface VolunteerFormContent {
  modalTitle: string;
  messagePlaceholder: string;
  successMessage: string;
  errorMessage: string;
}

const defaultVolunteerFormContent: VolunteerFormContent = {
  modalTitle: "Volunteer With Us",
  messagePlaceholder:
    "Tell us what kinds of activities you would be interested in helping with and how you would like to contribute.",
  successMessage: "Thank you. Your volunteer application has been sent to the RORUM team.",
  errorMessage: "We could not send your application. Please check your connection and try again.",
};

// Matches InquiryForm.tsx's field styling exactly: both forms render the
// same visual design, just from a different starting cascade (this one used
// to combine legacy `.form`/`.cv-modal-form` classes; that cascade's winning
// declarations - worked out property-by-property - are what these encode).
const LABEL_CLASS =
  "block text-[rgba(var(--rgb-dark-brown),0.5)] font-semibold text-[0.82rem]";
const REQUIRED_MARK_CLASS = "ml-0.5 text-[rgba(var(--rgb-red),0.62)]";
const INPUT_CLASS =
  "block w-full mt-1.75 border border-beige rounded-none bg-white px-[13px] py-3 text-text-primary text-base font-medium leading-[1.45] placeholder:text-[rgba(var(--rgb-dark-brown),0.38)] placeholder:font-medium placeholder:opacity-100 focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(var(--rgb-light-green),0.24)] aria-[invalid=true]:border-accent aria-[invalid=true]:outline-none aria-[invalid=true]:shadow-[0_0_0_2px_rgba(var(--rgb-red),0.16)]";
const SUBMIT_BUTTON_CLASS =
  "inline-flex items-center justify-center justify-self-stretch self-center min-h-10.5 w-full px-6 py-0 border border-cta-red rounded-pill bg-cta-red text-white text-[12.5px] lg:text-[13px] font-bold tracking-[0.02em] uppercase cursor-pointer transition duration-180 ease-[ease] hover:-translate-y-px hover:bg-cta-red-hover hover:border-cta-red-hover hover:text-white focus-visible:bg-cta-red-hover focus-visible:border-cta-red-hover focus-visible:text-white active:bg-primary-darker active:border-primary-darker disabled:cursor-not-allowed disabled:opacity-[0.62] disabled:transform-none";

function validateField(
  name: string,
  value: FormDataEntryValue | null,
  label: string,
  requiredFieldTemplate: string,
  invalidEmailMessage: string,
  invalidPhoneMessage: string,
): string {
  const stringValue = String(value ?? "").trim();

  if (!stringValue) return requiredFieldTemplate.replace("{field}", label);
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
    return invalidEmailMessage;
  }
  if (name === "phone" && !/^[+()\d\s.-]{7,20}$/.test(stringValue)) {
    return invalidPhoneMessage;
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

function VolunteerApplicationDialog({
  onClose,
  content = defaultVolunteerFormContent,
}: {
  onClose: () => void;
  content?: VolunteerFormContent;
}) {
  const { messages } = useFormContent();
  const requiredFields: [name: string, label: string][] = [
    ["name", messages.fullNameLabel],
    ["email", messages.emailLabel],
    ["phone", messages.phoneLabel],
    ["message", messages.messageLabel],
  ];
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { sent, isSubmitting, submitError, submit, setSubmitError } = useFormspreeSubmit(
    "volunteer",
    { failedMessage: content.errorMessage },
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextErrors: Record<string, string> = {};

    requiredFields.forEach(([name, label]) => {
      const error = validateField(
        name,
        formData.get(name),
        label,
        messages.requiredFieldTemplate,
        messages.invalidEmailMessage,
        messages.invalidPhoneMessage,
      );
      if (error) nextErrors[name] = error;
    });

    const privacyError = validatePrivacyConsent(formData);
    if (privacyError) nextErrors.privacyConsent = privacyError;

    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length) return;

    // Delivery, success/error state and reset are owned by the shared hook.
    await submit(formData, form);
  }

  return (
    <ApplicationModal
      titleId="volunteer-modal-title"
      closeLabel="Close volunteer application dialog"
      onClose={onClose}
    >
    <form
      className="grid gap-4"
      // Only set the native action when Formspree is actually configured —
      // otherwise a no-JS submit would POST to the 404 placeholder endpoint.
      // JS submit (handleSubmit) always runs and surfaces the "not set up"
      // notice. Matches components/ContactForm.tsx.
      action={isFormspreeConfigured() ? formspreeConfig.endpoint : undefined}
      method="post"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isSubmitting}
    >
      {/* No-JS fallback metadata; the JS path re-sets these via
          applyFormspreeMetadata() (adds " — {name}", locale, page_url). */}
      <input type="hidden" name="form_name" value="Volunteer application" />
      <input type="hidden" name="subject" value="[RoRUM] Volunteer application" />
      <input type="hidden" name="_subject" value="[RoRUM] Volunteer application" />
      <div className="grid gap-2 mb-1">
        <h2
          id="volunteer-modal-title"
          className="m-0 text-text-primary font-body text-[clamp(17px,1.35vw,20px)] leading-tight font-black tracking-normal normal-case"
        >
          {content.modalTitle}
        </h2>
      </div>

      {sent ? (
        <div
          className="border border-[rgba(var(--rgb-light-green),0.28)] rounded-none bg-[rgba(var(--rgb-beige),0.24)] p-3.5 text-primary-dark font-bold"
          role="status"
        >
          {content.successMessage}
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

      <label htmlFor="volunteer-name" className={LABEL_CLASS}>
        {messages.fullNameLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
        <input
          id="volunteer-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder={messages.fullNameLabel}
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "volunteer-name-error" : undefined}
          className={INPUT_CLASS}
        />
        <FieldError id="volunteer-name-error" message={errors.name} />
      </label>

      <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
        <label htmlFor="volunteer-email" className={LABEL_CLASS}>
          {messages.emailLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
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
            className={INPUT_CLASS}
          />
          <FieldError id="volunteer-email-error" message={errors.email} />
        </label>

        <label htmlFor="volunteer-phone" className={LABEL_CLASS}>
          {messages.phoneLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
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
            className={INPUT_CLASS}
          />
          <FieldError id="volunteer-phone-error" message={errors.phone} />
        </label>
      </div>

      <label htmlFor="volunteer-message" className={LABEL_CLASS}>
        {messages.messageLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
        <textarea
          id="volunteer-message"
          name="message"
          rows={6}
          placeholder={content.messagePlaceholder}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? "volunteer-message-error" : undefined
          }
          className={INPUT_CLASS}
        />
        <FieldError id="volunteer-message-error" message={errors.message} />
      </label>

      <PrivacyConsent
        id="volunteer-privacy"
        error={errors.privacyConsent}
      />

      <button
        className={SUBMIT_BUTTON_CLASS}
        type="submit"
        disabled={isSubmitting || sent}
      >
        {isSubmitting
          ? messages.sendingLabel
          : sent
            ? messages.applicationSentLabel
            : messages.sendApplicationLabel}
      </button>
    </form>
    </ApplicationModal>
  );
}

export function VolunteerApplicationButton({
  children = "Apply to volunteer",
  className = "btn",
  content,
}: {
  children?: ReactNode;
  className?: string;
  content?: VolunteerFormContent;
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
      {open ? <VolunteerApplicationDialog onClose={closeModal} content={content} /> : null}
    </>
  );
}
