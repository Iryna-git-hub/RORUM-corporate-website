"use client";
import { useState } from "react";
export function InquiryForm({ type, title, showPortfolio = false }) {
    const [sent, setSent] = useState(false);
    const [pending, setPending] = useState(false);
    async function onSubmit(event) {
        event.preventDefault();
        setPending(true);
        const form = event.currentTarget;
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        try {
            await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, type }) });
        }
        catch {
            // The MVP still shows a friendly success state if the optional backend is not configured.
        }
        setPending(false);
        setSent(true);
        form.reset();
    }
    return (<form className="form card card-pad" onSubmit={onSubmit}>
      <h2 className="heading" style={{ fontSize: "clamp(40px, 6vw, 72px)", margin: 0 }}>{title}</h2>
      {sent ? <div className="success">Thank you. Your inquiry has been received for this MVP flow.</div> : null}
      <div className="form-grid">
        <label>Full name<input name="name" required placeholder="Your name"/></label>
        <label>Email<input name="email" type="email" required placeholder="you@example.com"/></label>
      </div>
      <div className="form-grid">
        <label>Phone<input name="phone" placeholder="+45 ..."/></label>
        <label>Preferred date<input name="date" type="date"/></label>
      </div>
      <label>Inquiry focus
        <select name="focus" defaultValue="">
          <option value="" disabled>Select one</option>
          <option>Event hosting</option>
          <option>Space booking</option>
          <option>Catering</option>
          <option>Decoration and styling</option>
          <option>Community or collaboration</option>
        </select>
      </label>
      {showPortfolio ? <label>CV, LinkedIn or portfolio link<input name="portfolio" placeholder="https://"/></label> : null}
      <label>Message<textarea name="message" rows={5} required placeholder="Tell us what you are imagining."/></label>
      <button className="btn" type="submit" disabled={pending}>{pending ? "Sending..." : "Send inquiry"}</button>
    </form>);
}
