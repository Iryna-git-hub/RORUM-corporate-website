"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  PrivacyConsent,
  validatePrivacyConsent,
} from "@/components/PrivacyConsent";
import { useFormContent } from "@/components/FormContentProvider";
import { useFormspreeSubmit } from "@/lib/useFormspreeSubmit";
import type { RorumFormKey } from "@/lib/formspree";

// Fallback only — used when the caller doesn't supply `packageOptions`
// (Sanity unavailable/not yet migrated). The canonical, Sanity-backed
// source is `app/[locale]/(site)/host-at-rorum/page.tsx`'s own
// `packageOptions`, derived from the SAME `packagesSection.items` array
// PackageGrid's cards already use — one source, not two independently
// maintained lists (see MIGRATION_REPORT.md for the defect this replaces:
// this array used to be the ONLY source, with no `value` distinct from its
// display text, so `?package=` deep-linking broke the moment a package was
// renamed).
const FALLBACK_PACKAGE_OPTIONS = [
  { value: "package0", label: "Morning session" },
  { value: "package1", label: "Afternoon session" },
  { value: "package2", label: "Full day session" },
];
const NOT_SURE_OPTION = { value: "not-sure", label: "Not sure yet" };

// Fallback only — used when the caller doesn't supply `serviceOptions`. The
// canonical, localized source is the same page's own `serviceOptions`,
// read from `page-host-at-rorum`'s `inquiryForm` section's own
// "service0".."service3" rows.
const FALLBACK_SERVICE_OPTIONS = [
  { value: "service0", label: "Breakfast" },
  { value: "service1", label: "Snacks" },
  { value: "service2", label: "Lunch" },
  { value: "service3", label: "Coffee setup" },
];

const CARD_FORM_CLASS =
  "grid gap-4 border-0 rounded-none bg-white p-[clamp(20px,3vw,4rem)] text-text-primary shadow-[0_16px_34px_rgba(var(--rgb-brown),0.09)] overflow-hidden";
const FORM_HEADING_CLASS = "grid gap-2 mb-1";
const FORM_TITLE_CLASS =
  "m-0 font-body text-[clamp(17px,1.35vw,20px)] font-[800] leading-tight tracking-normal normal-case text-text-primary";
const FORM_INTRO_CLASS = "m-0 text-[15px] leading-[1.65] text-text-primary";
const SUCCESS_CLASS =
  "border border-[rgba(var(--rgb-light-green),0.28)] rounded-none bg-[rgba(var(--rgb-beige),0.24)] p-3.5 text-primary-dark font-bold";
const ERROR_CLASS =
  "border border-[rgba(var(--rgb-red),0.24)] bg-[rgba(var(--rgb-red),0.08)] p-3.5 text-accent text-sm font-bold leading-[1.55]";
const FORM_GRID_CLASS = "grid grid-cols-2 gap-3.5 max-sm:grid-cols-1";
const LABEL_CLASS =
  "block text-[rgba(var(--rgb-dark-brown),0.5)] font-semibold text-[0.82rem]";
const REQUIRED_MARK_CLASS = "ml-0.5 text-[rgba(var(--rgb-red),0.62)]";
const INPUT_CLASS =
  "block w-full mt-1.75 border border-beige rounded-none bg-white px-[13px] py-3 text-text-primary text-base font-medium leading-[1.45] placeholder:text-[rgba(var(--rgb-dark-brown),0.38)] placeholder:font-medium placeholder:opacity-100 focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(var(--rgb-light-green),0.24)] aria-[invalid=true]:border-accent aria-[invalid=true]:outline-none aria-[invalid=true]:shadow-[0_0_0_2px_rgba(var(--rgb-red),0.16)]";
const SELECT_CLASS =
  "block w-full mt-1.75 appearance-none cursor-pointer border border-[rgba(var(--rgb-beige),0.7)] rounded-none bg-white bg-no-repeat [background-image:url('data:image/svg+xml,%3Csvg_width=%2714%27_height=%2714%27_viewBox=%270_0_14_14%27_xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath_d=%27M3_5.25_7_9l4-3.75%27_fill=%27none%27_stroke=%27%23555C43%27_stroke-width=%271.7%27_stroke-linecap=%27round%27_stroke-linejoin=%27round%27/%3E%3C/svg%3E')] [background-position:right_14px_center] [background-size:14px_14px] py-3 pl-[13px] pr-[42px] text-text-primary text-base font-medium leading-[1.45] hover:border-[rgba(var(--rgb-light-green),0.72)] hover:bg-[rgba(var(--rgb-cream),0.42)] focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(var(--rgb-light-green),0.24)] aria-[invalid=true]:border-accent aria-[invalid=true]:outline-none aria-[invalid=true]:shadow-[0_0_0_2px_rgba(var(--rgb-red),0.16)]";
const OPTION_CLASS =
  "bg-white text-text-primary font-medium checked:bg-cream checked:text-red disabled:text-[rgba(var(--rgb-dark-brown),0.42)]";
const SUBMIT_BUTTON_CLASS =
  "inline-flex items-center justify-center justify-self-stretch self-center min-h-10.5 w-full px-6 py-0 border border-cta-red rounded-pill bg-cta-red text-white text-[12.5px] lg:text-[13px] font-bold tracking-[0.02em] uppercase cursor-pointer transition duration-180 ease-[ease] hover:-translate-y-px hover:bg-cta-red-hover hover:border-cta-red-hover hover:text-white focus-visible:bg-cta-red-hover focus-visible:border-cta-red-hover focus-visible:text-white active:bg-primary-darker active:border-primary-darker disabled:cursor-not-allowed disabled:opacity-[0.62] disabled:transform-none";

function validateField(
  name: string,
  value: FormDataEntryValue | null,
  label: string,
  requiredFieldTemplate: string,
  invalidEmailMessage: string,
): string {
  const stringValue = String(value ?? "");
  if (!stringValue.trim()) return requiredFieldTemplate.replace("{field}", label);
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
    return invalidEmailMessage;
  }
  return "";
}

function getInitialPackage(options: string[] = []): string {
  if (typeof window === "undefined") return "";
  const packageName =
    new URLSearchParams(window.location.search).get("package") ?? "";
  return options.includes(packageName) ? packageName : "";
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <small className="text-accent text-xs font-bold" id={id}>
      {message}
    </small>
  ) : null;
}

export type InquiryFormType = "default" | "booking" | "decoration";

// Which shared Formspree configuration each rendered variant delivers as.
// "default" isn't used by any current page (Catering has its own
// CateringInquiryForm) but is kept mapped for completeness.
const FORMSPREE_KEY_BY_TYPE: Record<InquiryFormType, RorumFormKey> = {
  booking: "hostAtRorum",
  decoration: "eventDecoration",
  default: "catering",
};

export interface SelectableOption {
  /** Stable, non-localized identifier — the submitted form value and the `?package=` deep-link value. Never changes when the label is edited/renamed. */
  value: string;
  label: string;
}

export function InquiryForm({
  type = "default",
  title,
  intro,
  submitLabel = "Send inquiry",
  successMessage,
  messagePlaceholder,
  packageOptions,
  serviceOptions,
}: {
  type?: InquiryFormType;
  title: ReactNode;
  intro?: string;
  submitLabel?: string;
  successMessage?: string;
  messagePlaceholder?: string;
  /** Booking form only — canonical, Sanity-backed package options (same array PackageGrid's cards render). Falls back to FALLBACK_PACKAGE_OPTIONS when absent (Sanity unavailable). */
  packageOptions?: SelectableOption[];
  /** Booking form only — canonical, Sanity-backed Additional Services options. Falls back to FALLBACK_SERVICE_OPTIONS when absent. */
  serviceOptions?: SelectableOption[];
}) {
  const { messages } = useFormContent();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { sent, isSubmitting, submitError, submit, setSubmitError } =
    useFormspreeSubmit(FORMSPREE_KEY_BY_TYPE[type]);
  const [selectedPackage, setSelectedPackage] = useState("");
  // Memoized on the actual `packageOptions` prop (stable server-provided
  // data, never changes after mount) so the mount-only effect below can
  // safely depend on it without re-running every render.
  const resolvedPackageOptions = useMemo(
    () => [...(packageOptions?.length ? packageOptions : FALLBACK_PACKAGE_OPTIONS), NOT_SURE_OPTION],
    [packageOptions],
  );
  const resolvedServiceOptions = serviceOptions?.length ? serviceOptions : FALLBACK_SERVICE_OPTIONS;
  const isBooking = type === "booking";
  const isDecoration = type === "decoration";
  const resolvedSuccessMessage =
    successMessage ??
    (isBooking
      ? "Thank you. Your Host at RORUM request is ready for the RORUM team."
      : "Thank you. Your request is ready for the RORUM team.");
  const resolvedMessagePlaceholder =
    messagePlaceholder ??
    (isBooking
      ? "Tell us about your meeting format, timing and preferences."
      : isDecoration
        ? "Describe your event, location and desired visual setup."
        : "Tell us a little about your request.");

  useEffect(() => {
    if (!isBooking || typeof window === "undefined") return undefined;
    const packageName = getInitialPackage(resolvedPackageOptions.map((o) => o.value));
    if (!packageName) return undefined;
    const timeoutId = window.setTimeout(
      () => setSelectedPackage(packageName),
      0,
    );
    return () => window.clearTimeout(timeoutId);
  }, [isBooking, resolvedPackageOptions]);

  function validateRequired(
    formData: FormData,
    requiredFields: [string, string][],
  ): Record<string, string> {
    const nextErrors: Record<string, string> = {};

    requiredFields.forEach(([name, label]) => {
      const error = validateField(name, formData.get(name), label, messages.requiredFieldTemplate, messages.invalidEmailMessage);
      if (error) nextErrors[name] = error;
    });

    return nextErrors;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const requiredFields: [string, string][] = isBooking
      ? [
          ["package", messages.packageLabel],
          ["phone", messages.phoneLabel],
          ["email", messages.emailLabel],
          ["name", messages.fullNameLabel],
          ["message", messages.commentLabel],
        ]
      : [
          ["name", messages.fullNameLabel],
          ["phone", messages.phoneLabel],
          ["email", messages.emailLabel],
          ["eventDate", messages.eventDateLabel],
          ["message", messages.messageLabel],
        ];
    const nextErrors = validateRequired(formData, requiredFields);
    if (isBooking) {
      const guests = String(formData.get("guests") ?? "").trim();
      if (guests) {
        const guestCount = Number(guests);
        if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 30) {
          nextErrors.guests = messages.guestsRangeMessage;
        }
      }
    } else {
      const privacyError = validatePrivacyConsent(formData, messages.privacyConsentRequiredMessage);
      if (privacyError) nextErrors.privacyConsent = privacyError;
    }

    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length) return;

    // Real delivery via the shared hook. On confirmed success the hook resets
    // the form element; clear the controlled package <select> too. On failure
    // nothing is cleared and a localized error shows.
    const delivered = await submit(formData, form);
    if (delivered) setSelectedPackage("");
  }

  if (isBooking) {
    return (
      <form className={CARD_FORM_CLASS} onSubmit={onSubmit} noValidate>
        <div className={FORM_HEADING_CLASS}>
          <h2 className={FORM_TITLE_CLASS}>{title}</h2>
          {intro ? <p className={FORM_INTRO_CLASS}>{intro}</p> : null}
        </div>
        {sent ? (
          <div className={SUCCESS_CLASS} role="status">
            {resolvedSuccessMessage}
          </div>
        ) : null}
        {submitError ? (
          <div className={ERROR_CLASS} role="alert">
            {submitError}
          </div>
        ) : null}

        <label htmlFor="booking-name" className={LABEL_CLASS}>
          {messages.fullNameLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
          <input
            id="booking-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder={messages.fullNameLabel}
            required
            aria-required="true"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "booking-name-error" : undefined}
            className={INPUT_CLASS}
          />
          <FieldError id="booking-name-error" message={errors.name} />
        </label>
        <div className={FORM_GRID_CLASS}>
          <label htmlFor="booking-phone" className={LABEL_CLASS}>
            {messages.phoneLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
            <input
              id="booking-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+45 12 34 56 78"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={
                errors.phone ? "booking-phone-error" : undefined
              }
              className={INPUT_CLASS}
            />
            <FieldError id="booking-phone-error" message={errors.phone} />
          </label>
          <label htmlFor="booking-email" className={LABEL_CLASS}>
            {messages.emailLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
            <input
              id="booking-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "booking-email-error" : undefined
              }
              className={INPUT_CLASS}
            />
            <FieldError id="booking-email-error" message={errors.email} />
          </label>
        </div>

        <div className={FORM_GRID_CLASS}>
          <label htmlFor="booking-package" className={LABEL_CLASS}>
            {messages.packageLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
            <select
              id="booking-package"
              name="package"
              value={selectedPackage}
              onChange={(event) => setSelectedPackage(event.target.value)}
              required
              aria-required="true"
              aria-invalid={Boolean(errors.package)}
              aria-describedby={
                errors.package ? "booking-package-error" : undefined
              }
              className={SELECT_CLASS}
            >
              <option value="" disabled className={OPTION_CLASS}>
                {messages.selectPackagePlaceholder}
              </option>
              {resolvedPackageOptions.map((option) => (
                <option key={option.value} value={option.value} className={OPTION_CLASS}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError id="booking-package-error" message={errors.package} />
          </label>
          <label htmlFor="booking-date" className={LABEL_CLASS}>
            {messages.eventDateLabel}
            <input
              id="booking-date"
              name="eventDate"
              type="date"
              className={INPUT_CLASS}
            />
          </label>
        </div>

        <div className={FORM_GRID_CLASS}>
          <label htmlFor="booking-time" className={LABEL_CLASS}>
            {messages.eventTimeLabel}
            <input
              id="booking-time"
              name="eventTime"
              type="time"
              className={INPUT_CLASS}
            />
          </label>
          <label htmlFor="booking-guests" className={LABEL_CLASS}>
            {messages.numberOfPeopleLabel}
            <input
              id="booking-guests"
              name="guests"
              type="number"
              min="1"
              max="30"
              inputMode="numeric"
              placeholder={messages.guestsPlaceholder}
              aria-invalid={Boolean(errors.guests)}
              aria-describedby={
                errors.guests ? "booking-guests-error" : undefined
              }
              className={INPUT_CLASS}
            />
            <FieldError id="booking-guests-error" message={errors.guests} />
          </label>
        </div>

        <fieldset className="grid grid-cols-2 gap-x-3 gap-y-2.5 m-0 p-0 border-0 max-sm:grid-cols-1">
          <legend className="col-span-full mb-0.5 text-[rgba(var(--rgb-dark-brown),0.5)] text-[0.82rem] font-semibold">
            {messages.additionalServicesLabel}
          </legend>
          {resolvedServiceOptions.map((service) => (
            <label
              key={service.value}
              className="flex items-center justify-start flex-nowrap gap-2.5 min-h-10 py-2.25 px-2.75 bg-[rgba(var(--rgb-beige),0.18)] border border-[rgba(var(--rgb-beige),0.3)] rounded-none cursor-pointer"
            >
              <input
                name="additionalServices"
                type="checkbox"
                value={service.value}
                className="appearance-none flex-none w-4.5 h-4.5 min-w-4.5 m-0 grid place-content-center border border-[rgba(var(--rgb-red),0.48)] bg-white cursor-pointer before:content-[''] before:w-2.5 before:h-2.5 before:bg-red before:scale-0 before:transition-transform before:duration-140 checked:before:scale-100"
              />
              <span className="inline-flex items-center min-w-0 text-text-primary text-base font-medium leading-[1.45] whitespace-nowrap">
                {service.label}
              </span>
            </label>
          ))}
        </fieldset>

        <label htmlFor="booking-message" className={LABEL_CLASS}>
          {messages.commentLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
          <textarea
            id="booking-message"
            name="message"
            rows={5}
            placeholder={resolvedMessagePlaceholder}
            required
            aria-required="true"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={
              errors.message ? "booking-message-error" : undefined
            }
            className={INPUT_CLASS}
          />
          <FieldError id="booking-message-error" message={errors.message} />
        </label>

        <PrivacyConsent id="booking-privacy" required={false} />

        <button className={SUBMIT_BUTTON_CLASS} type="submit" disabled={isSubmitting || sent}>
          {isSubmitting ? messages.sendingLabel : submitLabel}
        </button>
      </form>
    );
  }

  return (
    <form className={CARD_FORM_CLASS} onSubmit={onSubmit} noValidate>
      <div className={FORM_HEADING_CLASS}>
        <h2 className={FORM_TITLE_CLASS}>{title}</h2>
        {intro ? <p className={FORM_INTRO_CLASS}>{intro}</p> : null}
      </div>
      {sent ? (
        <div className={SUCCESS_CLASS} role="status">
          {resolvedSuccessMessage}
        </div>
      ) : null}
      {submitError ? (
        <div className={ERROR_CLASS} role="alert">
          {submitError}
        </div>
      ) : null}

      <label htmlFor={`${type}-name`} className={LABEL_CLASS}>
        {messages.fullNameLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
        <input
          id={`${type}-name`}
          name="name"
          type="text"
          autoComplete="name"
          placeholder={messages.fullNameLabel}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${type}-name-error` : undefined}
          className={INPUT_CLASS}
        />
        <FieldError id={`${type}-name-error`} message={errors.name} />
      </label>
      <div className={FORM_GRID_CLASS}>
        <label htmlFor={`${type}-phone`} className={LABEL_CLASS}>
          {messages.phoneLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
          <input
            id={`${type}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+45 12 34 56 78"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${type}-phone-error` : undefined}
            className={INPUT_CLASS}
          />
          <FieldError id={`${type}-phone-error`} message={errors.phone} />
        </label>
        <label htmlFor={`${type}-email`} className={LABEL_CLASS}>
          {messages.emailLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
          <input
            id={`${type}-email`}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${type}-email-error` : undefined}
            className={INPUT_CLASS}
          />
          <FieldError id={`${type}-email-error`} message={errors.email} />
        </label>
      </div>
      <div className={FORM_GRID_CLASS}>
        <label htmlFor={`${type}-date`} className={LABEL_CLASS}>
          {messages.eventDateLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
          <input
            id={`${type}-date`}
            name="eventDate"
            type="date"
            aria-invalid={Boolean(errors.eventDate)}
            aria-describedby={
              errors.eventDate ? `${type}-date-error` : undefined
            }
            className={INPUT_CLASS}
          />
          <FieldError id={`${type}-date-error`} message={errors.eventDate} />
        </label>
      </div>

      <label htmlFor={`${type}-message`} className={LABEL_CLASS}>
        {messages.messageLabel}<span aria-hidden="true" className={REQUIRED_MARK_CLASS}>*</span>
        <textarea
          id={`${type}-message`}
          name="message"
          rows={5}
          placeholder={resolvedMessagePlaceholder}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? `${type}-message-error` : undefined
          }
          className={INPUT_CLASS}
        />
        <FieldError id={`${type}-message-error`} message={errors.message} />
      </label>

      <PrivacyConsent id={`${type}-privacy`} error={errors.privacyConsent} />

      <button className={SUBMIT_BUTTON_CLASS} type="submit" disabled={isSubmitting || sent}>
        {isSubmitting ? messages.sendingLabel : submitLabel}
      </button>
    </form>
  );
}
