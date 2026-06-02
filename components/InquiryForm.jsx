"use client";
import { useEffect, useState } from "react";

const formConfig = {
    membership: {
        focusLabel: "Interest",
        focusOptions: ["Events", "Hosting", "Collaboration", "Community support"]
    },
    work: {
        focusLabel: "Area of interest",
        focusOptions: ["Facilitation", "Food and hospitality", "Event production", "Styling", "Creative collaboration"]
    },
    volunteer: {
        focusLabel: "Availability",
        focusOptions: ["Weekday mornings", "Weekday evenings", "Weekends", "Flexible"]
    },
    contact: {
        focusLabel: "Inquiry type",
        focusOptions: ["Host an event", "Private meeting", "Catering", "Event decoration", "Community", "General question"]
    },
    host: {
        focusLabel: "Event format",
        focusOptions: ["Workshop", "Class", "Circle", "Talk or salon", "Community gathering"]
    },
    booking: {
        packageLabel: "Package",
        packageOptions: ["Morning Session", "Afternoon Session", "Full Day Session", "Not sure yet"]
    },
    catering: {
        focusLabel: "Catering need",
        focusOptions: ["Breakfast", "Lunch", "Coffee and cake", "Evening bites", "Custom request"]
    },
    decoration: {
        focusLabel: "Styling need",
        focusOptions: ["Table styling", "Flowers", "Candles and atmosphere", "Full event styling", "Custom request"]
    },
    default: {
        focusLabel: "Inquiry type",
        focusOptions: ["Event hosting", "Private meeting", "Catering", "Event decoration", "Community"]
    }
};

function getErrorMessage(name, value, label) {
    if (!value.trim()) return `${label} is required.`;
    if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address.";
    return "";
}

function getInitialPackage(options = []) {
    if (typeof window === "undefined") return "";
    const packageName = new URLSearchParams(window.location.search).get("package") ?? "";
    return options.includes(packageName) ? packageName : "";
}

export function InquiryForm({ type = "default", title, intro, submitLabel = "Send inquiry" }) {
    const config = formConfig[type] ?? formConfig.default;
    const hasPackageSelect = Boolean(config.packageOptions?.length);
    const hasFocusSelect = Boolean(config.focusOptions?.length);
    const [sent, setSent] = useState(false);
    const [errors, setErrors] = useState({});
    const [selectedPackage, setSelectedPackage] = useState("");
    const fields = [
        { name: "name", label: "Full name", type: "text", autoComplete: "name" },
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel" }
    ];

    useEffect(() => {
        if (!hasPackageSelect || typeof window === "undefined") return undefined;
        const packageName = getInitialPackage(config.packageOptions);
        if (!packageName) return undefined;
        const timeoutId = window.setTimeout(() => setSelectedPackage(packageName), 0);
        return () => window.clearTimeout(timeoutId);
    }, [config.packageOptions, hasPackageSelect]);

    function onSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const nextErrors = {};

        fields.forEach((field) => {
            const message = getErrorMessage(field.name, String(formData.get(field.name) ?? ""), field.label);
            if (message) nextErrors[field.name] = message;
        });
        if (hasFocusSelect) {
            const focusMessage = getErrorMessage("focus", String(formData.get("focus") ?? ""), config.focusLabel);
            if (focusMessage) nextErrors.focus = focusMessage;
        }
        if (hasPackageSelect) {
            const packageMessage = getErrorMessage("package", String(formData.get("package") ?? ""), config.packageLabel);
            if (packageMessage) nextErrors.package = packageMessage;
        }
        const messageError = getErrorMessage("message", String(formData.get("message") ?? ""), "Message");
        if (messageError) nextErrors.message = messageError;

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) {
            setSent(false);
            return;
        }

        setSent(true);
        setSelectedPackage("");
        form.reset();
    }

    return (<form className="form card card-pad" onSubmit={onSubmit} noValidate>
      <div className="form-heading">
        <h2 className="heading form-title">{title}</h2>
        {intro ? <p>{intro}</p> : null}
      </div>
      {sent ? <div className="success" role="status">Thank you. Your message is ready for the RORUM team.</div> : null}
      <div className="form-grid">
        {fields.slice(0, 2).map((field) => <label key={field.name} htmlFor={`${type}-${field.name}`}>
          {field.label}<span aria-hidden="true">*</span>
          <input id={`${type}-${field.name}`} name={field.name} type={field.type} autoComplete={field.autoComplete} aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? `${type}-${field.name}-error` : undefined}/>
          {errors[field.name] ? <small className="form-error" id={`${type}-${field.name}-error`}>{errors[field.name]}</small> : null}
        </label>)}
      </div>
      <div className="form-grid">
        <label htmlFor={`${type}-phone`}>
          Phone number<span aria-hidden="true">*</span>
          <input id={`${type}-phone`} name="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? `${type}-phone-error` : undefined}/>
          {errors.phone ? <small className="form-error" id={`${type}-phone-error`}>{errors.phone}</small> : null}
        </label>
        {hasPackageSelect ? (
          <label htmlFor={`${type}-package`}>
            {config.packageLabel}<span aria-hidden="true">*</span>
            <select id={`${type}-package`} name="package" value={selectedPackage} onChange={(event) => setSelectedPackage(event.target.value)} aria-invalid={Boolean(errors.package)} aria-describedby={errors.package ? `${type}-package-error` : undefined}>
              <option value="" disabled>Select Package</option>
              {config.packageOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            {errors.package ? <small className="form-error" id={`${type}-package-error`}>{errors.package}</small> : null}
          </label>
        ) : null}
        {hasFocusSelect ? (
          <label htmlFor={`${type}-focus`}>
          {config.focusLabel}<span aria-hidden="true">*</span>
          <select id={`${type}-focus`} name="focus" defaultValue="" aria-invalid={Boolean(errors.focus)} aria-describedby={errors.focus ? `${type}-focus-error` : undefined}>
            <option value="" disabled>Select one</option>
            {config.focusOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
          {errors.focus ? <small className="form-error" id={`${type}-focus-error`}>{errors.focus}</small> : null}
          </label>
        ) : null}
      </div>
      <label htmlFor={`${type}-message`}>
        Message<span aria-hidden="true">*</span>
        <textarea id={`${type}-message`} name="message" rows={5} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? `${type}-message-error` : undefined}/>
        {errors.message ? <small className="form-error" id={`${type}-message-error`}>{errors.message}</small> : null}
      </label>
      <button className="btn" type="submit">{submitLabel}</button>
    </form>);
}
