"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import {
  PrivacyConsent,
  validatePrivacyConsent,
} from "@/components/PrivacyConsent";

const requiredFields: [name: string, label: string][] = [
  ["name", "Full Name"],
  ["phone", "Phone number"],
  ["email", "Email"],
  ["eventDate", "Event date"],
  ["message", "Message"],
];

function validateField(
  name: string,
  value: FormDataEntryValue | null,
  label: string,
): string {
  const stringValue = String(value ?? "");
  if (!stringValue.trim()) return `${label} is required.`;
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
    return "Please enter a valid email address.";
  }
  return "";
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <small className="block mt-1.75 text-accent text-xs font-bold" id={id}>
      {message}
    </small>
  ) : null;
}

export function CateringInquiryForm() {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    if (Object.keys(nextErrors).length) {
      setSent(false);
      return;
    }

    setSent(true);
    form.reset();
  }

  const labelClasses =
    "block text-[rgba(var(--rgb-dark-brown),0.5)] font-semibold text-[0.82rem]";
  const requiredMarkClasses = "ml-0.5 text-[rgba(var(--rgb-red),0.62)]";
  const inputClasses =
    "block w-full mt-1.75 border border-beige rounded-none bg-white px-[13px] py-3 text-text-primary text-base font-medium leading-[1.45] placeholder:text-[rgba(var(--rgb-dark-brown),0.38)] placeholder:font-medium placeholder:opacity-100 focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(var(--rgb-light-green),0.24)] aria-[invalid=true]:border-accent aria-[invalid=true]:outline-none aria-[invalid=true]:shadow-[0_0_0_2px_rgba(var(--rgb-red),0.16)]";

  return (
    <form
      className="grid gap-4 border-0 rounded-none bg-white shadow-[0_16px_34px_rgba(var(--rgb-brown),0.09)] text-text-primary overflow-hidden p-[clamp(20px,3vw,4rem)]"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="grid gap-2 mb-1">
        <h2 className="m-0 font-body text-[clamp(17px,1.35vw,20px)] leading-tight font-black tracking-normal normal-case text-text-primary">
          Request catering
        </h2>
      </div>
      {sent ? (
        <div
          className="border border-[rgba(var(--rgb-light-green),0.28)] rounded-none bg-[rgba(var(--rgb-beige),0.24)] p-3.5 text-primary-dark font-bold"
          role="status"
        >
          Thank you. We&apos;ve received your catering request and will contact
          you soon.
        </div>
      ) : null}

      <label htmlFor="catering-name" className={labelClasses}>
        Full Name<span aria-hidden="true" className={requiredMarkClasses}>*</span>
        <input
          id="catering-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Full Name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "catering-name-error" : undefined}
          className={inputClasses}
        />
        <FieldError id="catering-name-error" message={errors.name} />
      </label>
      <div className="grid grid-cols-2 gap-3.5 max-tablet:grid-cols-1">
        <label htmlFor="catering-phone" className={labelClasses}>
          Phone number<span aria-hidden="true" className={requiredMarkClasses}>*</span>
          <input
            id="catering-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+45 12 34 56 78"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "catering-phone-error" : undefined}
            className={inputClasses}
          />
          <FieldError id="catering-phone-error" message={errors.phone} />
        </label>
        <label htmlFor="catering-email" className={labelClasses}>
          Email<span aria-hidden="true" className={requiredMarkClasses}>*</span>
          <input
            id="catering-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "catering-email-error" : undefined}
            className={inputClasses}
          />
          <FieldError id="catering-email-error" message={errors.email} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3.5 max-tablet:grid-cols-1">
        <label htmlFor="catering-date" className={labelClasses}>
          Event date<span aria-hidden="true" className={requiredMarkClasses}>*</span>
          <input
            id="catering-date"
            name="eventDate"
            type="date"
            aria-invalid={Boolean(errors.eventDate)}
            aria-describedby={
              errors.eventDate ? "catering-date-error" : undefined
            }
            className={inputClasses}
          />
          <FieldError id="catering-date-error" message={errors.eventDate} />
        </label>
      </div>

      <label htmlFor="catering-message" className={labelClasses}>
        Message<span aria-hidden="true" className={requiredMarkClasses}>*</span>
        <textarea
          id="catering-message"
          name="message"
          rows={5}
          placeholder="Describe your event, timing and catering wishes."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? "catering-message-error" : undefined
          }
          className={inputClasses}
        />
        <FieldError id="catering-message-error" message={errors.message} />
      </label>

      <PrivacyConsent id="catering-privacy" error={errors.privacyConsent} />

      <button
        className="inline-flex items-center justify-center justify-self-stretch self-center min-h-10.5 w-full px-6 py-0 border border-cta-red rounded-pill bg-cta-red text-white text-[12.5px] desktop:text-[13px] font-bold tracking-[0.02em] uppercase cursor-pointer transition duration-180 ease-[ease] hover:-translate-y-px hover:bg-cta-red-hover hover:border-cta-red-hover hover:text-white focus-visible:bg-cta-red-hover focus-visible:border-cta-red-hover focus-visible:text-white active:bg-primary-darker active:border-primary-darker disabled:cursor-not-allowed disabled:opacity-[0.62] disabled:transform-none"
        type="submit"
      >
        Request Catering
      </button>
      <p className="m-0 -mt-1 text-text-muted text-xs font-bold">
        We&apos;ll only use your details to respond to your catering request.
      </p>
    </form>
  );
}
