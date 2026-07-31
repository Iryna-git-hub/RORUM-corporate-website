"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { ApplicationModal } from "@/components/ApplicationModal";
import { PrivacyConsent, validatePrivacyConsent } from "@/components/PrivacyConsent";

const acceptedExtensions = [".pdf", ".doc", ".docx"];
const acceptedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const maxFileSize = 10 * 1024 * 1024;

function isAcceptedFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return (
    acceptedMimeTypes.includes(file.type) ||
    acceptedExtensions.some((extension) => fileName.endsWith(extension))
  );
}

function CvUploadDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [sent, setSent] = useState(false);

  function validateForm(formData: FormData): Record<string, string> {
    const nextErrors: Record<string, string> = {};
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (!name) nextErrors.name = "Full Name is required.";
    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!phone) {
      nextErrors.phone = "Phone number is required.";
    } else if (!/^[+()\d\s.-]{7,20}$/.test(phone)) {
      nextErrors.phone = "Please enter a valid phone number.";
    }
    if (!selectedFile) nextErrors.file = "Please upload your CV.";
    const privacyError = validatePrivacyConsent(formData);
    if (privacyError) nextErrors.privacyConsent = privacyError;

    return nextErrors;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
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

  // TODO: Connect this to a real upload endpoint or form service when the
  // backend is available. Currently a placeholder that always "succeeds"
  // after a short delay without sending the CV anywhere.
  async function submitCvApplication(): Promise<void> {
    await new Promise((resolve) => window.setTimeout(resolve, 500));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextErrors = validateForm(formData);

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      await submitCvApplication();
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
    const fileInput =
      dialogRef.current?.querySelector<HTMLInputElement>("#cv-upload");
    if (fileInput) fileInput.value = "";
  }

  return (
    <ApplicationModal
      titleId="cv-modal-title"
      descriptionId={sent ? undefined : "cv-modal-description"}
      closeLabel="Close CV application dialog"
      onClose={onClose}
    >
      <div ref={dialogRef}>
        {sent ? (
          <div className="grid gap-4.5">
            <h2
              id="cv-modal-title"
              className="m-0 text-text-primary text-[2.4rem] leading-[0.98] font-light tracking-normal"
            >
              Thank you — we received your CV
            </h2>
            <p className="m-0 text-text-primary text-[15px] leading-[1.65]">
              Thank you for reaching out and sharing your story with RORUM.
              We’ll keep your details in mind for future collaborations, roles,
              or opportunities.
            </p>
            <button
              className="inline-flex items-center justify-center justify-self-stretch self-center min-h-10.5 w-full px-6 py-0 border border-red rounded-pill bg-red text-white text-[12.5px] desktop:text-[13px] font-bold tracking-[0.02em] uppercase cursor-pointer transition duration-180 ease-[ease] hover:-translate-y-px hover:bg-cta-red-hover hover:border-cta-red-hover hover:text-white focus-visible:bg-cta-red-hover focus-visible:border-cta-red-hover focus-visible:text-white active:bg-primary-darker active:border-primary-darker"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        ) : (
          <form className="cv-modal-form" onSubmit={handleSubmit} noValidate>
            <div className="cv-modal-heading">
              <h2 id="cv-modal-title" className="heading">
                Send your CV
              </h2>
              <p id="cv-modal-description">
                We’d love to hear from you. Upload your CV and tell us a little
                about yourself — we’ll keep your details in mind for future
                collaborations, roles, or opportunities at RORUM.
              </p>
            </div>

            <label htmlFor="cv-name">
              <span className="cv-field-label">
                Full Name<span className="required-marker" aria-hidden="true">*</span>
              </span>
              <input
                id="cv-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Full Name"
                required
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "cv-name-error" : undefined}
              />
              {errors.name ? (
                <small className="text-accent text-xs font-bold" id="cv-name-error">
                  {errors.name}
                </small>
              ) : null}
            </label>

            <div className="cv-modal-grid">
              <label htmlFor="cv-email">
                <span className="cv-field-label">
                  Email<span className="required-marker" aria-hidden="true">*</span>
                </span>
                <input
                  id="cv-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "cv-email-error" : undefined}
                />
                {errors.email ? (
                  <small className="text-accent text-xs font-bold" id="cv-email-error">
                    {errors.email}
                  </small>
                ) : null}
              </label>

              <label htmlFor="cv-phone">
                <span className="cv-field-label">
                  Phone number<span className="required-marker" aria-hidden="true">*</span>
                </span>
                <input
                  id="cv-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "cv-phone-error" : undefined}
                />
                {errors.phone ? (
                  <small className="text-accent text-xs font-bold" id="cv-phone-error">
                    {errors.phone}
                  </small>
                ) : null}
              </label>
            </div>

            <label className="cv-upload-label" htmlFor="cv-upload">
              <span className="cv-field-label">
                Upload your CV<span className="required-marker" aria-hidden="true">*</span>
              </span>
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
                required
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
              <small className="text-accent text-xs font-bold" id="cv-file-error" role="alert">
                {errors.file}
              </small>
            ) : null}

            <label htmlFor="cv-message">
              Short message
              <textarea
                id="cv-message"
                name="message"
                rows={4}
                placeholder="Tell us briefly what kind of collaboration you are interested in."
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
    </ApplicationModal>
  );
}

export function CvUploadButton({
  children = "Send your CV",
  className = "btn",
}: {
  children?: ReactNode;
  className?: string;
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
      {open ? <CvUploadDialog onClose={closeModal} /> : null}
    </>
  );
}
