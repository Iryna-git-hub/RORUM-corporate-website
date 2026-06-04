"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { PrivacyConsent, validatePrivacyConsent } from "@/components/PrivacyConsent";

const acceptedExtensions = [".pdf", ".doc", ".docx"];
const acceptedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const maxFileSize = 10 * 1024 * 1024;

function isAcceptedFile(file) {
  const fileName = file.name.toLowerCase();
  return (
    acceptedMimeTypes.includes(file.type) ||
    acceptedExtensions.some((extension) => fileName.endsWith(extension))
  );
}

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("hidden"));
}

function CvUploadDialog({ open, onClose }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements(dialogRef.current);
      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  function validateForm(formData) {
    const nextErrors = {};
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    if (!name) nextErrors.name = "Name is required.";
    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!selectedFile) nextErrors.file = "Please upload your CV.";
    const privacyError = validatePrivacyConsent(formData);
    if (privacyError) nextErrors.privacyConsent = privacyError;

    return nextErrors;
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] ?? null;
    setSubmitError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!isAcceptedFile(file)) {
      setSelectedFile(null);
      setErrors((currentErrors) => ({
        ...currentErrors,
        file: "Please upload a PDF, DOC, or DOCX file.",
      }));
      event.target.value = "";
      return;
    }

    if (file.size > maxFileSize) {
      setSelectedFile(null);
      setErrors((currentErrors) => ({
        ...currentErrors,
        file: "Please keep your file under 10 MB.",
      }));
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors.file;
      return nextErrors;
    });
  }

  async function submitCvApplication() {
    // TODO: Connect this to a real upload endpoint or form service when the backend is available.
    await new Promise((resolve) => window.setTimeout(resolve, 500));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextErrors = validateForm(formData);

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      await submitCvApplication(formData);
      setSent(true);
      form.reset();
      setSelectedFile(null);
    } catch {
      setSubmitError(
        "Something went wrong while sending your CV. Please try again, or contact us directly at rorum2025@gmail.com.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function removeFile() {
    setSelectedFile(null);
    const fileInput = dialogRef.current?.querySelector("#cv-upload");
    if (fileInput) fileInput.value = "";
  }

  return (
    <div
      className="cv-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="cv-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-modal-title"
      >
        <button
          ref={closeButtonRef}
          className="cv-modal-close"
          type="button"
          aria-label="Close CV upload modal"
          onClick={onClose}
        >
          <X aria-hidden="true" strokeWidth={1.8} />
        </button>

        {sent ? (
          <div className="cv-modal-success">
            <h2 id="cv-modal-title" className="heading">
              Thank you — we received your CV
            </h2>
            <p>
              Thank you for reaching out and sharing your story with RORUM.
              We’ll keep your details in mind for future collaborations, roles,
              or opportunities.
            </p>
            <button className="btn" type="button" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form className="cv-modal-form" onSubmit={handleSubmit} noValidate>
            <div className="cv-modal-heading">
              <h2 id="cv-modal-title" className="heading">
                Send your CV
              </h2>
              <p>
                We’d love to hear from you. Upload your CV and tell us a little
                about yourself — we’ll keep your details in mind for future
                collaborations, roles, or opportunities at RORUM.
              </p>
            </div>

            <div className="cv-modal-instructions">
              <p>You can upload:</p>
              <ul>
                <li>your CV or resume</li>
                <li>a short portfolio, if relevant</li>
                <li>a PDF introduction about yourself</li>
              </ul>
              <p>
                <strong>Accepted formats:</strong>
                <br />
                PDF, DOC, DOCX
              </p>
              <p>
                <strong>Recommended:</strong>
                <br />
                Please keep your file under 10 MB.
              </p>
            </div>

            <div className="cv-modal-grid">
              <label htmlFor="cv-name">
                Name<span aria-hidden="true">*</span>
                <input
                  id="cv-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "cv-name-error" : undefined}
                />
                {errors.name ? (
                  <small className="form-error" id="cv-name-error">
                    {errors.name}
                  </small>
                ) : null}
              </label>

              <label htmlFor="cv-email">
                Email<span aria-hidden="true">*</span>
                <input
                  id="cv-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "cv-email-error" : undefined}
                />
                {errors.email ? (
                  <small className="form-error" id="cv-email-error">
                    {errors.email}
                  </small>
                ) : null}
              </label>
            </div>

            <label className="cv-upload-label" htmlFor="cv-upload">
              Upload your CV<span aria-hidden="true">*</span>
              <span className="cv-upload-dropzone">
                <Upload aria-hidden="true" strokeWidth={1.7} />
                <span>
                  {selectedFile
                    ? selectedFile.name
                    : "Choose a PDF, DOC, or DOCX file"}
                </span>
              </span>
              <input
                id="cv-upload"
                name="cv"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                aria-invalid={Boolean(errors.file)}
                aria-describedby={errors.file ? "cv-file-error" : undefined}
                onChange={handleFileChange}
              />
            </label>
            {selectedFile ? (
              <button
                className="cv-remove-file"
                type="button"
                onClick={removeFile}
              >
                Remove file
              </button>
            ) : null}
            {errors.file ? (
              <small className="form-error" id="cv-file-error" role="alert">
                {errors.file}
              </small>
            ) : null}

            <label htmlFor="cv-message">
              Short message
              <textarea
                id="cv-message"
                name="message"
                rows={4}
                placeholder="Tell us briefly why you feel connected to RORUM or what kind of collaboration you are interested in."
              />
            </label>

            <PrivacyConsent id="cv-privacy" error={errors.privacyConsent} />

            {submitError ? (
              <p className="cv-submit-error" role="alert">
                Something went wrong while sending your CV. Please try again, or
                contact us directly at{" "}
                <a href="mailto:rorum2025@gmail.com">rorum2025@gmail.com</a>.
              </p>
            ) : null}

            <button className="btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Submit CV"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function CvUploadButton({ children = "Send your CV", className = "btn" }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

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
      {open ? <CvUploadDialog open={open} onClose={closeModal} /> : null}
    </>
  );
}
