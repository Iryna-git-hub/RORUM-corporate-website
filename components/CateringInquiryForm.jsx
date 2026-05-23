"use client";
import { useState } from "react";

const requiredFields = [
  ["name", "Full name"],
  ["email", "Email"],
  ["phone", "Phone number"],
  ["location", "Event location"],
  ["cateringType", "Catering type"]
];

function validateField(name, value, label) {
  if (!String(value ?? "").trim()) return `${label} is required.`;
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address.";
  return "";
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

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setSent(false);
      return;
    }

    setSent(true);
    form.reset();
  }

  return (
    <form className="form catering-form card card-pad" onSubmit={onSubmit} noValidate>
      <div className="form-heading">
        <h2 className="heading form-title">Request catering</h2>
        <p>Tell us a little about your event and we&apos;ll get back to you with a suitable catering option.</p>
      </div>
      {sent ? <div className="success" role="status">Thank you — we&apos;ve received your catering request. The RORUM team will contact you soon.</div> : null}
      <div className="form-grid">
        <label htmlFor="catering-name">
          Full name<span aria-hidden="true">*</span>
          <input id="catering-name" name="name" type="text" autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "catering-name-error" : undefined}/>
          {errors.name ? <small className="form-error" id="catering-name-error">{errors.name}</small> : null}
        </label>
        <label htmlFor="catering-email">
          Email<span aria-hidden="true">*</span>
          <input id="catering-email" name="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "catering-email-error" : undefined}/>
          {errors.email ? <small className="form-error" id="catering-email-error">{errors.email}</small> : null}
        </label>
      </div>
      <div className="form-grid">
        <label htmlFor="catering-phone">
          Phone number<span aria-hidden="true">*</span>
          <input id="catering-phone" name="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "catering-phone-error" : undefined}/>
          {errors.phone ? <small className="form-error" id="catering-phone-error">{errors.phone}</small> : null}
        </label>
        <label htmlFor="catering-date">
          Event date
          <input id="catering-date" name="eventDate" type="date"/>
        </label>
      </div>
      <div className="form-grid">
        <label htmlFor="catering-location">
          Event location<span aria-hidden="true">*</span>
          <select id="catering-location" name="location" defaultValue="" aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? "catering-location-error" : undefined}>
            <option value="" disabled>Select location</option>
            {["At RORUM", "External location", "Not sure yet"].map((option) => <option key={option}>{option}</option>)}
          </select>
          {errors.location ? <small className="form-error" id="catering-location-error">{errors.location}</small> : null}
        </label>
        <label htmlFor="catering-guests">
          Number of guests
          <input id="catering-guests" name="guests" type="number" min="1" inputMode="numeric"/>
        </label>
      </div>
      <label htmlFor="catering-type">
        Catering type<span aria-hidden="true">*</span>
        <select id="catering-type" name="cateringType" defaultValue="" aria-invalid={Boolean(errors.cateringType)} aria-describedby={errors.cateringType ? "catering-type-error" : undefined}>
          <option value="" disabled>Select catering type</option>
          {["Coffee setup", "Light morning catering", "Snacks and fruit", "Lunch options", "Custom catering", "Not sure yet"].map((option) => <option key={option}>{option}</option>)}
        </select>
        {errors.cateringType ? <small className="form-error" id="catering-type-error">{errors.cateringType}</small> : null}
      </label>
      <label htmlFor="catering-message">
        Message
        <textarea id="catering-message" name="message" rows={5} placeholder="Tell us about your event, timing, location and food preferences."/>
      </label>
      <button className="btn" type="submit">Request Catering</button>
      <p className="form-microcopy">We&apos;ll only use your details to respond to your catering request.</p>
    </form>
  );
}
