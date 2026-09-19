"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { PrivacyConsent, validatePrivacyConsent } from "@/components/PrivacyConsent";
import { useFormContent } from "@/components/FormContentProvider";
import { FormSuccessModal } from "@/components/FormSuccessModal";
import { useLocale } from "@/lib/useLocale";
import { useFormspreeSubmit } from "@/lib/useFormspreeSubmit";
import { resolveContactFormFields, type ContactFormFieldType } from "@/lib/sanityContact";
import type { RawPageSection } from "@/lib/sanity-sections";
import type { ResolvedPrivacyConsentSettings } from "@/lib/sanityContact";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Matches VolunteerApplicationForm.tsx's own phone validation exactly — the
// established pattern for this site's other forms.
const PHONE_PATTERN = /^[+()\d\s.-]{7,20}$/;

function validateField(
  type: ContactFormFieldType,
  value: FormDataEntryValue | null,
  label: string,
  requiredFieldTemplate: string,
  invalidEmailMessage: string,
  invalidPhoneMessage: string,
): string {
  const stringValue = String(value ?? "").trim();
  if (!stringValue) return requiredFieldTemplate.replace("{field}", label);
  if (type === "email" && !EMAIL_PATTERN.test(stringValue)) return invalidEmailMessage;
  if (type === "phone" && !PHONE_PATTERN.test(stringValue)) return invalidPhoneMessage;
  return "";
}

const INPUT_CLASS =
  "block w-full mt-1.75 border border-beige rounded-none bg-white px-[13px] py-3 text-text-primary text-base font-medium leading-[1.45] placeholder:text-[rgba(var(--rgb-dark-brown),0.38)] placeholder:font-medium placeholder:opacity-100 focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(var(--rgb-light-green),0.24)] aria-[invalid=true]:border-accent aria-[invalid=true]:outline-none aria-[invalid=true]:shadow-[0_0_0_2px_rgba(var(--rgb-red),0.16)]";
const LABEL_CLASS = "block text-[rgba(var(--rgb-dark-brown),0.5)] font-semibold text-[0.82rem]";

const HTML_INPUT_TYPE: Record<ContactFormFieldType, string> = {
  text: "text",
  email: "email",
  phone: "tel",
  multiline: "text",
};

/**
 * Renders from the ordered field configuration resolved by
 * resolveContactFormFields() — see lib/sanityContact.ts and
 * contentItem.ts's "Contact form field" role. `formSection` is the raw
 * page-contact form section (server-fetched, passed through as a plain
 * serializable prop); when absent (Sanity unavailable / page not migrated),
 * the original hardcoded Name/Phone/Email/Message fields render unchanged.
 *
 * DELIVERY: like every RORUM form, this submits through the shared
 * `useFormspreeSubmit("contact")` hook → one Formspree endpoint, one form,
 * one recipient (configured on Formspree, never in code). Email subject:
 * `[RoRUM] Contact request — {name}`; the hook also relabels every field to
 * a human-readable key and appends a "Submission details" group — see
 * lib/formspree.ts. No endpoint is configured in this project yet
 * (`NEXT_PUBLIC_FORMSPREE_ENDPOINT` is the placeholder), so a valid submit
 * shows `formNotConfiguredMessage`, keeps the user's text, and never shows a
 * success state until a real endpoint is set and the POST succeeds.
 */
export function ContactForm({
  formTitle = "We want to hear from you",
  successMessage = "Thank you. Your message is ready for the RORUM team.",
  submitLabel = "Send message",
  formSection,
  privacyConsent,
}: {
  formTitle?: string;
  successMessage?: string;
  submitLabel?: string;
  formSection?: RawPageSection;
  privacyConsent?: ResolvedPrivacyConsentSettings;
}) {
  // Accepted only so app/[locale]/(site)/contact/page.tsx doesn't need
  // touching — see the comment on showPrivacyConsent/requirePrivacyConsent
  // below for why this is intentionally never read.
  void privacyConsent;
  const { messages } = useFormContent();
  const { locale } = useLocale();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { sent, isSubmitting, submitError, submit, setSubmitError, resetSuccess } = useFormspreeSubmit("contact");
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);

  function closeSuccessModal() {
    resetSuccess();
    requestAnimationFrame(() => submitButtonRef.current?.focus());
  }

  const fields = resolveContactFormFields(formSection, messages, locale);
  // Privacy consent is mandatory on every RORUM form, no exceptions — the
  // Sanity `privacyConsent.shown`/`.required` toggle can no longer waive or
  // hide it: a manager setting either to false used to let a real submission
  // through with no consent recorded at all, and `shown: false` hid the
  // ONLY way to grant it — honoring that value here was itself a bypass, not
  // a legitimate configuration. `useFormspreeSubmit.submit()` also refuses
  // delivery without consent, as a second, independent safety net.
  const showPrivacyConsent = true;
  const requirePrivacyConsent = true;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextErrors: Record<string, string> = {};

    for (const field of fields) {
      const error = validateField(field.type, formData.get(field.name), field.label, messages.requiredFieldTemplate, messages.invalidEmailMessage, messages.invalidPhoneMessage);
      if (error) nextErrors[field.name] = error;
    }
    if (showPrivacyConsent && requirePrivacyConsent) {
      const privacyError = validatePrivacyConsent(formData, messages.privacyConsentRequiredMessage);
      if (privacyError) nextErrors.privacyConsent = privacyError;
    }

    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length) return;

    // Delivery, success/error state and form reset are all owned by the shared
    // hook — success is shown only after Formspree confirms the POST.
    await submit(formData, form);
  }

  return (
    <>
    <form
      className="grid gap-4 border-0 rounded-none bg-white shadow-[0_16px_34px_rgba(var(--rgb-brown),0.09)] text-text-primary overflow-hidden p-[clamp(20px,3vw,4rem)]"
      // No `action`/`method` — delivery is JS-only, same as every other
      // RORUM form (Volunteer/Work With Us/Catering/Event Decoration/Host at
      // RORUM never had a native fallback either). This form USED to also
      // set a native `action` as a no-JS fallback, but with `noValidate`
      // also set (needed so the JS path's own localized validation, not the
      // browser's native tooltips, runs), that fallback had no client-side
      // validation of ANY kind — required fields, privacy consent included
      // — a real gap confirmed with JavaScript disabled. Closing it by
      // removing the native fallback entirely was simpler and safer than
      // trying to make `required` selectively survive `noValidate`.
      onSubmit={onSubmit}
      noValidate
      aria-busy={isSubmitting}
    >
      <div className="grid gap-2 mb-1">
        <h2 className="m-0 font-body text-[clamp(17px,1.35vw,20px)] leading-tight font-extrabold tracking-normal normal-case text-text-primary">
          {formTitle}
        </h2>
      </div>
      {submitError ? (
        <div
          className="border border-[rgba(var(--rgb-red),0.24)] bg-[rgba(var(--rgb-red),0.08)] p-3.5 text-accent text-sm font-bold leading-[1.55]"
          role="alert"
        >
          {submitError}
        </div>
      ) : null}
      {fields.map((field) => {
        const inputId = `contact-${field.name}`;
        const errorId = `${inputId}-error`;
        const error = errors[field.name];
        return (
          <label key={field.name} htmlFor={inputId} className={LABEL_CLASS}>
            {field.label}
            <span aria-hidden="true" className="ml-0.5 text-[rgba(var(--rgb-red),0.62)]">
              *
            </span>
            {field.type === "multiline" ? (
              <textarea
                id={inputId}
                name={field.name}
                rows={5}
                placeholder={field.placeholder}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className={INPUT_CLASS}
              />
            ) : (
              <input
                id={inputId}
                name={field.name}
                type={HTML_INPUT_TYPE[field.type]}
                autoComplete={field.type === "email" ? "email" : field.type === "phone" ? "tel" : undefined}
                placeholder={field.placeholder}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className={INPUT_CLASS}
              />
            )}
            {error ? (
              <small className="block mt-1.75 text-accent text-xs font-bold" id={errorId} role="alert">
                {error}
              </small>
            ) : null}
          </label>
        );
      })}
      {showPrivacyConsent ? (
        <PrivacyConsent id="contact-privacy" error={errors.privacyConsent} required={requirePrivacyConsent} />
      ) : null}
      <button
        ref={submitButtonRef}
        className="inline-flex items-center justify-center justify-self-stretch self-center min-h-10.5 w-full px-6 py-0 border border-cta-red rounded-pill bg-cta-red text-white text-[12.5px] lg:text-[13px] font-bold tracking-[0.02em] uppercase cursor-pointer transition duration-180 ease-[ease] hover:-translate-y-px hover:bg-cta-red-hover hover:border-cta-red-hover hover:text-white focus-visible:bg-cta-red-hover focus-visible:border-cta-red-hover focus-visible:text-white active:bg-primary-darker active:border-primary-darker disabled:cursor-not-allowed disabled:opacity-[0.62] disabled:transform-none"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? messages.sendingLabel : submitLabel}
      </button>
    </form>
    {sent ? (
      <FormSuccessModal
        titleId="contact-success-title"
        title={messages.successTitle}
        message={successMessage}
        doneLabel={messages.doneLabel}
        closeLabel={messages.closeLabel}
        onClose={closeSuccessModal}
      />
    ) : null}
    </>
  );
}
