"use client";

import { useEffect, useState } from "react";
import {
  PrivacyConsent,
  validatePrivacyConsent,
} from "@/components/PrivacyConsent";

const bookingPackageOptions = [
  "Morning session",
  "Afternoon session",
  "Full day session",
  "Not sure yet",
];

const bookingServiceOptions = ["Breakfast", "Snacks", "Lunch", "Coffee setup"];

function validateField(name, value, label) {
  const stringValue = String(value ?? "");
  if (!stringValue.trim()) return `${label} is required.`;
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
    return "Please enter a valid email address.";
  }
  return "";
}

function getInitialPackage(options = []) {
  if (typeof window === "undefined") return "";
  const packageName =
    new URLSearchParams(window.location.search).get("package") ?? "";
  return options.includes(packageName) ? packageName : "";
}

function FieldError({ id, message }) {
  return message ? (
    <small className="form-error" id={id}>
      {message}
    </small>
  ) : null;
}

export function InquiryForm({
  type = "default",
  title,
  intro,
  submitLabel = "Send inquiry",
}) {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedPackage, setSelectedPackage] = useState("");
  const isBooking = type === "booking";
  const isDecoration = type === "decoration";

  useEffect(() => {
    if (!isBooking || typeof window === "undefined") return undefined;
    const packageName = getInitialPackage(bookingPackageOptions);
    if (!packageName) return undefined;
    const timeoutId = window.setTimeout(
      () => setSelectedPackage(packageName),
      0,
    );
    return () => window.clearTimeout(timeoutId);
  }, [isBooking]);

  function validateRequired(formData, requiredFields) {
    const nextErrors = {};

    requiredFields.forEach(([name, label]) => {
      const error = validateField(name, formData.get(name), label);
      if (error) nextErrors[name] = error;
    });

    return nextErrors;
  }

  function onSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const requiredFields = isBooking
      ? [
          ["package", "Package"],
          ["phone", "Phone number"],
          ["email", "Email"],
          ["name", "Full Name"],
          ["message", "Comment"],
        ]
      : [
          ["name", "Full Name"],
          ["phone", "Phone number"],
          ["email", "Email"],
          ["eventDate", "Event date"],
          ["message", "Message"],
        ];
    const nextErrors = validateRequired(formData, requiredFields);
    if (isBooking) {
      const guests = String(formData.get("guests") ?? "").trim();
      if (guests) {
        const guestCount = Number(guests);
        if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 30) {
          nextErrors.guests = "Please enter a whole number between 1 and 30.";
        }
      }
    } else {
      const privacyError = validatePrivacyConsent(formData);
      if (privacyError) nextErrors.privacyConsent = privacyError;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setSent(false);
      return;
    }

    setSent(true);
    setSelectedPackage("");
    form.reset();
  }

  if (isBooking) {
    return (
      <form className="form card card-pad" onSubmit={onSubmit} noValidate>
        <div className="form-heading">
          <h2 className="heading form-title">{title}</h2>
          {intro ? <p>{intro}</p> : null}
        </div>
        {sent ? (
          <div className="success" role="status">
            Thank you. Your Host at RORUM request is ready for the RORUM team.
          </div>
        ) : null}

        <label htmlFor="booking-name">
          Full Name<span aria-hidden="true">*</span>
          <input
            id="booking-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Full Name"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "booking-name-error" : undefined}
          />
          <FieldError id="booking-name-error" message={errors.name} />
        </label>
        <div className="form-grid">
          <label htmlFor="booking-phone">
            Phone number<span aria-hidden="true">*</span>
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
            />
            <FieldError id="booking-phone-error" message={errors.phone} />
          </label>
          <label htmlFor="booking-email">
            Email<span aria-hidden="true">*</span>
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
            />
            <FieldError id="booking-email-error" message={errors.email} />
          </label>
        </div>

        <div className="form-grid">
          <label htmlFor="booking-package">
            Package<span aria-hidden="true">*</span>
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
            >
              <option value="" disabled>
                Select package
              </option>
              {bookingPackageOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <FieldError id="booking-package-error" message={errors.package} />
          </label>
          <label htmlFor="booking-date">
            Event date
            <input
              id="booking-date"
              name="eventDate"
              type="date"
            />
          </label>
        </div>

        <div className="form-grid">
          <label htmlFor="booking-time">
            Event time
            <input
              id="booking-time"
              name="eventTime"
              type="time"
            />
          </label>
          <label htmlFor="booking-guests">
            Number of people
            <input
              id="booking-guests"
              name="guests"
              type="number"
              min="1"
              max="30"
              inputMode="numeric"
              placeholder="Approx. number"
              aria-invalid={Boolean(errors.guests)}
              aria-describedby={
                errors.guests ? "booking-guests-error" : undefined
              }
            />
            <FieldError id="booking-guests-error" message={errors.guests} />
          </label>
        </div>

        <fieldset className="checkbox-group">
          <legend>Additional services</legend>
          {bookingServiceOptions.map((service) => (
            <label key={service}>
              <input
                name="additionalServices"
                type="checkbox"
                value={service}
              />
              <span>{service}</span>
            </label>
          ))}
        </fieldset>

        <label htmlFor="booking-message">
          Comment<span aria-hidden="true">*</span>
          <textarea
            id="booking-message"
            name="message"
            rows={5}
            placeholder="Tell us about your meeting format, timing and preferences."
            required
            aria-required="true"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={
              errors.message ? "booking-message-error" : undefined
            }
          />
          <FieldError id="booking-message-error" message={errors.message} />
        </label>

        <PrivacyConsent id="booking-privacy" required={false} />

        <button className="btn" type="submit">
          {submitLabel}
        </button>
      </form>
    );
  }

  return (
    <form className="form card card-pad" onSubmit={onSubmit} noValidate>
      <div className="form-heading">
        <h2 className="heading form-title">{title}</h2>
        {intro ? <p>{intro}</p> : null}
      </div>
      {sent ? (
        <div className="success" role="status">
          Thank you. Your request is ready for the RORUM team.
        </div>
      ) : null}

      <label htmlFor={`${type}-name`}>
        Full Name<span aria-hidden="true">*</span>
        <input
          id={`${type}-name`}
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Full Name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${type}-name-error` : undefined}
        />
        <FieldError id={`${type}-name-error`} message={errors.name} />
      </label>
      <div className="form-grid">
        <label htmlFor={`${type}-phone`}>
          Phone number<span aria-hidden="true">*</span>
          <input
            id={`${type}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+45 12 34 56 78"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${type}-phone-error` : undefined}
          />
          <FieldError id={`${type}-phone-error`} message={errors.phone} />
        </label>
        <label htmlFor={`${type}-email`}>
          Email<span aria-hidden="true">*</span>
          <input
            id={`${type}-email`}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${type}-email-error` : undefined}
          />
          <FieldError id={`${type}-email-error`} message={errors.email} />
        </label>
      </div>
      <div className="form-grid">
        <label htmlFor={`${type}-date`}>
          Event date<span aria-hidden="true">*</span>
          <input
            id={`${type}-date`}
            name="eventDate"
            type="date"
            aria-invalid={Boolean(errors.eventDate)}
            aria-describedby={
              errors.eventDate ? `${type}-date-error` : undefined
            }
          />
          <FieldError id={`${type}-date-error`} message={errors.eventDate} />
        </label>
      </div>

      <label htmlFor={`${type}-message`}>
        Message<span aria-hidden="true">*</span>
        <textarea
          id={`${type}-message`}
          name="message"
          rows={5}
          placeholder={
            isDecoration
              ? "Describe your event, location and desired visual setup."
              : "Tell us a little about your request."
          }
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? `${type}-message-error` : undefined
          }
        />
        <FieldError id={`${type}-message-error`} message={errors.message} />
      </label>

      <PrivacyConsent id={`${type}-privacy`} error={errors.privacyConsent} />

      <button className="btn" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
