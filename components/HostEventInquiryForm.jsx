"use client";
import { useEffect, useState } from "react";

const requiredFields = [
  ["name", "Full name"],
  ["email", "Email"],
  ["phone", "Phone number"],
  ["eventType", "Event type"],
  ["preferredDate", "Preferred date"],
  ["guests", "Number of guests"],
  ["package", "Package"],
  ["message", "Message"]
];

const packageOptions = ["Single Session", "Evening Series", "Weekend Event", "Not sure yet"];

function getInitialPackage() {
  if (typeof window === "undefined") return "";
  const packageName = new URLSearchParams(window.location.search).get("package") ?? "";
  return packageOptions.includes(packageName) ? packageName : "";
}

function validateField(name, value, label) {
  if (!String(value ?? "").trim()) return `${label} is required.`;
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address.";
  return "";
}

export function HostEventInquiryForm() {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedPackage, setSelectedPackage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const packageName = getInitialPackage();
    if (!packageName) return undefined;
    const timeoutId = window.setTimeout(() => setSelectedPackage(packageName), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

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
    setSelectedPackage("");
    form.reset();
  }

  return (
    <form className="form host-event-form card card-pad" onSubmit={onSubmit} noValidate>
      <div className="form-heading">
        <h2 className="heading form-title">Tell us about your event</h2>
        <p>Share a few details and we&apos;ll get back to you with the best format for your idea.</p>
      </div>
      {sent ? <div className="success" role="status">Thank you — we&apos;ve received your inquiry. The RORUM team will contact you soon to discuss the best format for your event.</div> : null}
      <div className="form-grid">
        <label htmlFor="host-name">
          Full name<span aria-hidden="true">*</span>
          <input id="host-name" name="name" type="text" autoComplete="name" placeholder="Your full name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "host-name-error" : undefined}/>
          {errors.name ? <small className="form-error" id="host-name-error">{errors.name}</small> : null}
        </label>
        <label htmlFor="host-email">
          Email<span aria-hidden="true">*</span>
          <input id="host-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "host-email-error" : undefined}/>
          {errors.email ? <small className="form-error" id="host-email-error">{errors.email}</small> : null}
        </label>
      </div>
      <div className="form-grid">
        <label htmlFor="host-phone">
          Phone number<span aria-hidden="true">*</span>
          <input id="host-phone" name="phone" type="tel" autoComplete="tel" placeholder="+45 12 34 56 78" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "host-phone-error" : undefined}/>
          {errors.phone ? <small className="form-error" id="host-phone-error">{errors.phone}</small> : null}
        </label>
        <label htmlFor="host-event-type">
          Event type<span aria-hidden="true">*</span>
          <select id="host-event-type" name="eventType" defaultValue="" aria-invalid={Boolean(errors.eventType)} aria-describedby={errors.eventType ? "host-event-type-error" : undefined}>
            <option value="" disabled>Select one</option>
            {["Workshop", "Talk", "Wellness session", "Creative class", "Community gathering", "Other"].map((option) => <option key={option}>{option}</option>)}
          </select>
          {errors.eventType ? <small className="form-error" id="host-event-type-error">{errors.eventType}</small> : null}
        </label>
      </div>
      <div className="form-grid">
        <label htmlFor="host-date">
          Preferred date<span aria-hidden="true">*</span>
          <input id="host-date" name="preferredDate" type="date" aria-invalid={Boolean(errors.preferredDate)} aria-describedby={errors.preferredDate ? "host-date-error" : undefined}/>
          {errors.preferredDate ? <small className="form-error" id="host-date-error">{errors.preferredDate}</small> : null}
        </label>
        <label htmlFor="host-guests">
          Number of guests<span aria-hidden="true">*</span>
          <input id="host-guests" name="guests" type="number" min="1" max="30" inputMode="numeric" placeholder="Approx. number" aria-invalid={Boolean(errors.guests)} aria-describedby={errors.guests ? "host-guests-error" : undefined}/>
          {errors.guests ? <small className="form-error" id="host-guests-error">{errors.guests}</small> : null}
        </label>
      </div>
      <div className="form-grid">
        <label htmlFor="host-package">
          Package<span aria-hidden="true">*</span>
          <select id="host-package" name="package" value={selectedPackage} onChange={(event) => setSelectedPackage(event.target.value)} aria-invalid={Boolean(errors.package)} aria-describedby={errors.package ? "host-package-error" : undefined}>
            <option value="" disabled>Select Package</option>
            {packageOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
          {errors.package ? <small className="form-error" id="host-package-error">{errors.package}</small> : null}
        </label>
        <label htmlFor="host-time">
          Preferred time
          <input id="host-time" name="preferredTime" type="text" placeholder="Morning, afternoon or evening"/>
        </label>
      </div>
      <fieldset className="checkbox-group">
        <legend>Additional services</legend>
        {["Catering", "Coffee setup", "Snacks", "Event Decoration"].map((service) => (
          <label key={service}>
            <input name="additionalServices" type="checkbox" value={service}/>
            <span>{service}</span>
          </label>
        ))}
      </fieldset>
      <label htmlFor="host-message">
        Message<span aria-hidden="true">*</span>
        <textarea id="host-message" name="message" rows={5} placeholder="Tell us about your event, timing, guests and atmosphere." aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "host-message-error" : undefined}/>
        {errors.message ? <small className="form-error" id="host-message-error">{errors.message}</small> : null}
      </label>
      <button className="btn host-form-submit" type="submit">Send Event Inquiry</button>
      <p className="form-microcopy">We&apos;ll only use your details to respond to your request.</p>
    </form>
  );
}
