"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { PrivacyConsent, validatePrivacyConsent } from "@/components/PrivacyConsent";

const requiredFields: [name: string, label: string][] = [
  ["name", "Full Name"],
  ["phone", "Phone number"],
  ["email", "Email"],
  ["message", "Message"],
];

function validateField(
  name: string,
  value: FormDataEntryValue | null,
  label: string,
): string {
  if (!String(value ?? "").trim()) return `${label} is required.`;
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)))
    return "Please enter a valid email address.";
  return "";
}

export function ContactForm() {
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

  return (
    <form className="form contact-form card card-pad" onSubmit={onSubmit} noValidate>
      <div className="form-heading">
        <h2 className="heading form-title">We want to hear from you</h2>
      </div>
      {sent ? <div className="success" role="status">Thank you. Your message is ready for the RORUM team.</div> : null}
      <label htmlFor="contact-name">
        Full Name<span aria-hidden="true">*</span>
        <input id="contact-name" name="name" type="text" autoComplete="name" placeholder="Full Name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "contact-name-error" : undefined}/>
        {errors.name ? <small className="form-error" id="contact-name-error">{errors.name}</small> : null}
      </label>
      <div className="form-grid">
        <label htmlFor="contact-phone">
          Phone number<span aria-hidden="true">*</span>
          <input id="contact-phone" name="phone" type="tel" autoComplete="tel" placeholder="+45 12 34 56 78" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "contact-phone-error" : undefined}/>
          {errors.phone ? <small className="form-error" id="contact-phone-error">{errors.phone}</small> : null}
        </label>
        <label htmlFor="contact-email">
          Email<span aria-hidden="true">*</span>
          <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "contact-email-error" : undefined}/>
          {errors.email ? <small className="form-error" id="contact-email-error">{errors.email}</small> : null}
        </label>
      </div>
      <label htmlFor="contact-message">
        Message<span aria-hidden="true">*</span>
        <textarea id="contact-message" name="message" rows={5} placeholder="Tell us a little about your request, timing and preferences." aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "contact-message-error" : undefined}/>
        {errors.message ? <small className="form-error" id="contact-message-error">{errors.message}</small> : null}
      </label>
      <PrivacyConsent id="contact-privacy" error={errors.privacyConsent} />
      <button className="btn contact-submit" type="submit">Send message</button>
    </form>
  );
}
