"use client";

import { useState } from "react";

const requiredFields = [
  ["name", "Name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["subject", "Subject"],
  ["message", "Message"]
];

function validateField(name, value, label) {
  if (!String(value ?? "").trim()) return `${label} is required.`;
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address.";
  return "";
}

export function ContactForm() {
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
    <form className="form contact-form card card-pad" onSubmit={onSubmit} noValidate>
      <div className="form-heading">
        <h2 className="heading form-title">We want to hear from you</h2>
      </div>
      {sent ? <div className="success" role="status">Thank you. Your message is ready for the RORUM team.</div> : null}
      <div className="form-grid">
        <label htmlFor="contact-name">
          Name<span aria-hidden="true">*</span>
          <input id="contact-name" name="name" type="text" autoComplete="name" placeholder="Your full name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "contact-name-error" : undefined}/>
          {errors.name ? <small className="form-error" id="contact-name-error">{errors.name}</small> : null}
        </label>
        <label htmlFor="contact-email">
          Email<span aria-hidden="true">*</span>
          <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "contact-email-error" : undefined}/>
          {errors.email ? <small className="form-error" id="contact-email-error">{errors.email}</small> : null}
        </label>
      </div>
      <div className="form-grid">
        <label htmlFor="contact-phone">
          Phone<span aria-hidden="true">*</span>
          <input id="contact-phone" name="phone" type="tel" autoComplete="tel" placeholder="+45 12 34 56 78" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "contact-phone-error" : undefined}/>
          {errors.phone ? <small className="form-error" id="contact-phone-error">{errors.phone}</small> : null}
        </label>
        <label htmlFor="contact-subject">
          Subject<span aria-hidden="true">*</span>
          <input id="contact-subject" name="subject" type="text" placeholder="What is this about?" aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? "contact-subject-error" : undefined}/>
          {errors.subject ? <small className="form-error" id="contact-subject-error">{errors.subject}</small> : null}
        </label>
      </div>
      <label htmlFor="contact-message">
        Message<span aria-hidden="true">*</span>
        <textarea id="contact-message" name="message" rows={5} placeholder="Tell us a little about your request, timing and preferences." aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "contact-message-error" : undefined}/>
        {errors.message ? <small className="form-error" id="contact-message-error">{errors.message}</small> : null}
      </label>
      <button className="btn contact-submit" type="submit">Send message</button>
    </form>
  );
}
