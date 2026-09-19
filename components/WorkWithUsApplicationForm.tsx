"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { ApplicationModal } from "@/components/ApplicationModal";
import { FormSuccessContent } from "@/components/FormSuccessContent";
import { PrivacyConsent, validatePrivacyConsent } from "@/components/PrivacyConsent";
import { useFormContent } from "@/components/FormContentProvider";
import { useFormspreeSubmit } from "@/lib/useFormspreeSubmit";
import { resolveMultiOptionLabels } from "@/lib/formspree";
import type { SelectableOption } from "@/components/InquiryForm";

// The Work With Us application modal — a fully text-based application form
// (no file upload; the previous CV-attachment flow was removed because the
// Formspree form does not have file uploads enabled, see the diagnostic in
// git history). Delivers through the shared `useFormspreeSubmit("workWithUs")`
// hook — one Formspree endpoint/form/recipient, same as every other RORUM
// form. Submission carries `form_name: "Work With Us application"` and
// `subject: "[RoRUM] Work With Us application — {name}"` (this convention
// predates and is unrelated to the CV-upload removal).

export interface WorkWithUsApplicationFormContent {
  modalTitle: string;
  modalTitleSent: string;
  description: string;
  descriptionSent: string;
  errorMessage: string;
  /** Example-style placeholder for Full name (e.g. "e.g. Anna Jensen") — demonstrates the expected format; never a repeat of the field label. */
  fullNamePlaceholder: string;
  /** Example-style placeholder for Email (e.g. "e.g. anna@example.com"). */
  emailPlaceholder: string;
  /** Example-style placeholder for Phone (e.g. "e.g. +45 12 34 56 78"). */
  phonePlaceholder: string;
  roleInterestLabel: string;
  experienceLabel: string;
  experiencePlaceholder: string;
  whyRorumLabel: string;
  whyRorumPlaceholder: string;
  linksLabel: string;
  linksPlaceholder: string;
}

const defaultContent: WorkWithUsApplicationFormContent = {
  modalTitle: "Apply to work with us",
  modalTitleSent: "Thank you — we received your application",
  description:
    "We'd love to hear from you. Tell us about yourself and how you'd like to get involved — we'll keep your details in mind for future collaborations, roles, or opportunities at RORUM.",
  descriptionSent:
    "Thank you for reaching out and sharing your story with RORUM. We'll keep your details in mind for future collaborations, roles, or opportunities.",
  errorMessage: "Something went wrong while sending your application. Please try again.",
  fullNamePlaceholder: "e.g. Anna Jensen",
  emailPlaceholder: "e.g. anna@example.com",
  phonePlaceholder: "e.g. +45 12 34 56 78",
  roleInterestLabel: "What kind of role are you interested in?",
  experienceLabel: "Tell us about your experience and skills",
  experiencePlaceholder:
    "Tell us briefly about your relevant experience, practical skills, and what you are good at.",
  whyRorumLabel: "Why would you like to work with RORUM?",
  whyRorumPlaceholder: "Tell us what interests you about RORUM and why you would like to work with us.",
  linksLabel: "Links",
  linksPlaceholder: "LinkedIn, portfolio, or personal website",
};

// Fallback only — used when the caller doesn't supply `roleOptions` (Sanity
// unavailable/not yet migrated). The canonical, Sanity-backed source is
// app/[locale]/(site)/work-with-us/page.tsx's own `roleOptions`, read from
// `page-work-with-us`'s "Apply Form" section (technical key `applyForm`)'s
// "role0".."role7" rows — same value/label array pattern InquiryForm.tsx's
// `packageOptions`/`serviceOptions` already established (stable `value`,
// localized `label`).
const FALLBACK_ROLE_OPTIONS: SelectableOption[] = [
  { value: "role0", label: "Social media & content" },
  { value: "role1", label: "Event planning & coordination" },
  { value: "role2", label: "Event support / practical help" },
  { value: "role3", label: "Kitchen & food preparation" },
  { value: "role4", label: "Catering / serving at events" },
  { value: "role5", label: "Community activities" },
  { value: "role6", label: "Administration & coordination" },
  { value: "role7", label: "Other" },
];

const LABEL_CLASS =
  "grid gap-1.75 text-[rgba(var(--rgb-dark-brown),0.5)] text-[0.82rem] font-semibold";
const FIELD_LABEL_CLASS = "inline-flex items-baseline w-fit";
const REQUIRED_MARK_CLASS = "ml-0.5 text-cta-red";
const INPUT_BASE_CLASS =
  "w-full border border-[rgba(var(--rgb-brown),0.18)] rounded-none bg-white text-text-primary text-base font-medium outline-none focus:border-light-green focus:shadow-[0_0_0_2px_rgba(var(--rgb-light-green),0.12)]";
const INPUT_CLASS = `${INPUT_BASE_CLASS} min-h-11 px-[13px]`;
const TEXTAREA_CLASS = `${INPUT_BASE_CLASS} min-h-36 py-3 px-[13px] resize-y`;
const SUBMIT_BUTTON_CLASS =
  "inline-flex items-center justify-center justify-self-stretch self-center min-h-10.5 w-full px-6 py-0 border border-red rounded-pill bg-red text-white text-[12.5px] font-bold tracking-[0.02em] uppercase cursor-pointer transition duration-180 ease-[ease] hover:-translate-y-px hover:bg-cta-red-hover hover:border-cta-red-hover hover:text-white focus-visible:bg-cta-red-hover focus-visible:border-cta-red-hover focus-visible:text-white active:bg-primary-darker active:border-primary-darker disabled:opacity-[0.62]";

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <small className="text-accent text-xs font-bold" id={id} role="alert">
      {message}
    </small>
  ) : null;
}

function WorkWithUsDialog({
  onClose,
  content = defaultContent,
  roleOptions = FALLBACK_ROLE_OPTIONS,
}: {
  onClose: () => void;
  content?: WorkWithUsApplicationFormContent;
  roleOptions?: SelectableOption[];
}) {
  const { messages } = useFormContent();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { sent, isSubmitting, submitError, submit, setSubmitError } = useFormspreeSubmit(
    "workWithUs",
    { failedMessage: content.errorMessage },
  );

  function validateForm(formData: FormData): Record<string, string> {
    const nextErrors: Record<string, string> = {};
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    // Only used to check "is anything meaningfully there" — the ORIGINAL
    // untrimmed FormData entry (with every internal newline/blank line the
    // applicant typed) is what actually gets submitted; this local copy is
    // never written back.
    const experience = String(formData.get("experience") ?? "").trim();
    const whyRorum = String(formData.get("whyRorum") ?? "").trim();
    const roles = formData.getAll("roleInterest");
    const required = (field: string) => messages.requiredFieldTemplate.replace("{field}", field);

    if (!name) nextErrors.name = required(messages.fullNameLabel);
    if (!email) {
      nextErrors.email = required(messages.emailLabel);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = messages.invalidEmailMessage;
    }
    if (!phone) {
      nextErrors.phone = required(messages.phoneLabel);
    } else if (!/^[+()\d\s.-]{7,20}$/.test(phone)) {
      nextErrors.phone = messages.invalidPhoneMessage;
    }
    if (!roles.length) nextErrors.roleInterest = required(content.roleInterestLabel);
    if (!experience) nextErrors.experience = required(content.experienceLabel);
    if (!whyRorum) nextErrors.whyRorum = required(content.whyRorumLabel);
    const privacyError = validatePrivacyConsent(formData, messages.privacyConsentRequiredMessage);
    if (privacyError) nextErrors.privacyConsent = privacyError;

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextErrors = validateForm(formData);

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    // Payload quality: submit the visible role LABELS (e.g. "Social media &
    // content"), never the internal, non-localized checkbox `value` (e.g.
    // "role0") — resolved against the SAME options array rendered below, via
    // the shared resolver every other multi-checkbox field on this site
    // already uses (see InquiryForm.tsx's Additional Services).
    resolveMultiOptionLabels(formData, "roleInterest", roleOptions);

    // Optional field: drop it entirely when blank rather than submitting an
    // empty value — avoids a bare "Links:" line in the email. Matches
    // resolveOptionLabel()'s own established convention for optional fields.
    if (!String(formData.get("links") ?? "").trim()) formData.delete("links");

    // Delivery / success / error state / form reset are all owned by the
    // shared hook — same one every other RORUM form uses. `experience` and
    // `whyRorum` ride along in `formData` exactly as the textarea produced
    // them: `new FormData(form)` never collapses or rewrites a textarea's
    // value, so every newline and blank-line paragraph break the applicant
    // typed reaches Formspree unchanged.
    await submit(formData, form);
  }

  return (
    // `key` forces a remount (not just a content update) across the
    // form/success swap — ApplicationModal's own mount effect (moving focus
    // to its close button, the only success announcement a screen reader
    // gets now that there's no separate role="status") only runs on mount,
    // not on a same-element update.
    <ApplicationModal
      key={sent ? "success" : "form"}
      titleId={sent ? "wwu-success-title" : "wwu-modal-title"}
      descriptionId={sent ? undefined : "wwu-modal-description"}
      closeLabel={messages.closeLabel}
      onClose={onClose}
    >
      {sent ? (
        <FormSuccessContent
          titleId="wwu-success-title"
          title={content.modalTitleSent}
          message={content.descriptionSent}
          doneLabel={messages.doneLabel}
          onDone={onClose}
        />
      ) : (
        <form className="grid gap-4.5" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-3 pr-12 max-sm:pr-11.5">
            <h2
              id="wwu-modal-title"
              className="font-heading m-0 text-text-primary text-[2.4rem] leading-[0.98] font-light tracking-normal"
            >
              {content.modalTitle}
            </h2>
            <p className="m-0 text-text-primary text-[15px] leading-[1.65]" id="wwu-modal-description">
              {content.description}
            </p>
          </div>

          <label htmlFor="wwu-name" className={LABEL_CLASS}>
            <span className={FIELD_LABEL_CLASS}>
              {messages.fullNameLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
            </span>
            <input
              id="wwu-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={content.fullNamePlaceholder}
              required
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "wwu-name-error" : undefined}
              className={INPUT_CLASS}
            />
            <FieldError id="wwu-name-error" message={errors.name} />
          </label>

          <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
            <label htmlFor="wwu-email" className={LABEL_CLASS}>
              <span className={FIELD_LABEL_CLASS}>
                {messages.emailLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
              </span>
              <input
                id="wwu-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={content.emailPlaceholder}
                required
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "wwu-email-error" : undefined}
                className={INPUT_CLASS}
              />
              <FieldError id="wwu-email-error" message={errors.email} />
            </label>

            <label htmlFor="wwu-phone" className={LABEL_CLASS}>
              <span className={FIELD_LABEL_CLASS}>
                {messages.phoneLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
              </span>
              <input
                id="wwu-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder={content.phonePlaceholder}
                required
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "wwu-phone-error" : undefined}
                className={INPUT_CLASS}
              />
              <FieldError id="wwu-phone-error" message={errors.phone} />
            </label>
          </div>

          <fieldset
            className="grid grid-cols-2 gap-x-3 gap-y-2.5 m-0 p-0 border-0 max-sm:grid-cols-1"
            aria-describedby={errors.roleInterest ? "wwu-role-error" : undefined}
          >
            <legend className="col-span-full mb-0.5 text-[rgba(var(--rgb-dark-brown),0.5)] text-[0.82rem] font-semibold">
              {content.roleInterestLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
            </legend>
            {roleOptions.map((role) => (
              <label
                key={role.value}
                className="flex items-center justify-start gap-2.5 min-h-10 py-2.25 px-2.75 bg-[rgba(var(--rgb-beige),0.18)] border border-[rgba(var(--rgb-beige),0.3)] rounded-none cursor-pointer"
              >
                <input
                  name="roleInterest"
                  type="checkbox"
                  value={role.value}
                  aria-invalid={Boolean(errors.roleInterest)}
                  className="appearance-none flex-none w-4.5 h-4.5 min-w-4.5 grid place-content-center border border-[rgba(var(--rgb-red),0.48)] bg-white cursor-pointer before:content-[''] before:w-2.5 before:h-2.5 before:bg-red before:scale-0 before:transition-transform before:duration-140 checked:before:scale-100"
                />
                <span className="min-w-0 text-text-primary text-base font-medium leading-[1.45]">
                  {role.label}
                </span>
              </label>
            ))}
          </fieldset>
          <FieldError id="wwu-role-error" message={errors.roleInterest} />

          <label htmlFor="wwu-experience" className={LABEL_CLASS}>
            <span className={FIELD_LABEL_CLASS}>
              {content.experienceLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
            </span>
            <textarea
              id="wwu-experience"
              name="experience"
              rows={6}
              placeholder={content.experiencePlaceholder}
              required
              aria-invalid={Boolean(errors.experience)}
              aria-describedby={errors.experience ? "wwu-experience-error" : undefined}
              className={TEXTAREA_CLASS}
            />
            <FieldError id="wwu-experience-error" message={errors.experience} />
          </label>

          <label htmlFor="wwu-why-rorum" className={LABEL_CLASS}>
            <span className={FIELD_LABEL_CLASS}>
              {content.whyRorumLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
            </span>
            <textarea
              id="wwu-why-rorum"
              name="whyRorum"
              rows={6}
              placeholder={content.whyRorumPlaceholder}
              required
              aria-invalid={Boolean(errors.whyRorum)}
              aria-describedby={errors.whyRorum ? "wwu-why-rorum-error" : undefined}
              className={TEXTAREA_CLASS}
            />
            <FieldError id="wwu-why-rorum-error" message={errors.whyRorum} />
          </label>

          <label htmlFor="wwu-links" className={LABEL_CLASS}>
            {content.linksLabel}
            <input
              id="wwu-links"
              name="links"
              type="text"
              placeholder={content.linksPlaceholder}
              className={INPUT_CLASS}
            />
          </label>

          <PrivacyConsent id="wwu-privacy" error={errors.privacyConsent} />

          {submitError ? (
            <p className="m-0 py-3 px-3.5 bg-[rgba(var(--rgb-red),0.08)] text-red text-sm leading-[1.55] font-bold" role="alert">
              {submitError}
            </p>
          ) : null}

          <button
            className={SUBMIT_BUTTON_CLASS}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? messages.sendingLabel : messages.sendApplicationLabel}
          </button>
        </form>
      )}
    </ApplicationModal>
  );
}

export function WorkWithUsApplicationButton({
  children = "Apply now",
  className = "btn",
  content,
  roleOptions,
}: {
  children?: ReactNode;
  className?: string;
  content?: WorkWithUsApplicationFormContent;
  roleOptions?: SelectableOption[];
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const closeModal = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  function openModal() {
    setOpen(true);
  }

  return (
    <>
      <button
        ref={triggerRef}
        className={className}
        type="button"
        onClick={openModal}
        aria-haspopup="dialog"
      >
        {children}
      </button>
      {open ? <WorkWithUsDialog onClose={closeModal} content={content} roleOptions={roleOptions} /> : null}
    </>
  );
}
