"use client";

import { useRef, useState } from "react";
import { useFormContent } from "@/components/FormContentProvider";
import { useLocale } from "@/lib/useLocale";
import {
  applyFormspreeMetadata,
  humanizeFormFields,
  submitToFormspree,
  type RorumFormKey,
} from "@/lib/formspree";

/**
 * The one submission path every RORUM form uses. Given a validated FormData,
 * it relabels every field to a human-readable key (humanizeFormFields),
 * stamps the standardized metadata (applyFormspreeMetadata), POSTs through
 * the shared submitToFormspree() helper, and drives the success / error /
 * "not configured" UI state — no component keeps its own fetch or fake
 * setTimeout. Centralizing both here means every RORUM form gets the same
 * consistent, human-readable email presentation with NO changes to the
 * component itself — the component only ever deals with its own technical
 * field names (`name`, `roleInterest`, `eventDate`, ...).
 *
 * Contract:
 * - success is set ONLY after Formspree confirms the POST
 * - the form is reset ONLY on confirmed success (caller passes the element)
 * - `formData.get("privacyConsent") !== "on"` ALWAYS blocks delivery here,
 *   regardless of what the calling component already validated — a
 *   centralized floor under every form's own consent check, never bypassable
 *   by a form-specific validation gap
 * - on any failure (including missing consent) the user's input is
 *   untouched, `sent` is never set, and a localized message shows:
 *     missing/unchecked consent -> messages.privacyConsentRequiredMessage
 *     FORMSPREE_NOT_CONFIGURED  -> messages.formNotConfiguredMessage
 *     any other failure         -> options.failedMessage, else
 *                                  messages.formSubmitFailedMessage
 * - `submissionLock` prevents a double POST even if the button isn't disabled
 *
 * `options.failedMessage` lets a form supply its own (Sanity-managed,
 * localized) generic-failure copy — e.g. the Volunteer / Work With Us modals'
 * `errorMessage` content field — instead of the shared default.
 *
 * `resetSuccess()` clears `sent` without touching anything else (error state,
 * the submission lock). Callers whose success UI can be dismissed without
 * unmounting the form (the page-embedded forms' success modal) MUST call this
 * when that UI closes — `submit()` treats `sent === true` as "already
 * delivered" and no-ops, so leaving it set would silently block resubmission.
 * Forms whose success state instead lives inside a dialog that fully
 * unmounts on close (Volunteer, Work With Us) don't need it — a fresh mount
 * already starts from `sent === false`.
 */
export function useFormspreeSubmit(
  form: RorumFormKey,
  options: { failedMessage?: string } = {},
) {
  const { messages } = useFormContent();
  const { locale } = useLocale();
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submissionLock = useRef(false);

  async function submit(
    formData: FormData,
    formElement?: HTMLFormElement | null,
  ): Promise<boolean> {
    if (submissionLock.current || sent) return false;

    // Centralized safety net, in addition to (not instead of) each
    // component's own validatePrivacyConsent() check: every RORUM form must
    // have explicit consent before ANY delivery attempt. A real bug once let
    // Host at RORUM's booking form skip its consent check entirely (see
    // InquiryForm.tsx) and deliver with no consent recorded — this refuses
    // the POST here too, so a future form-specific validation gap can never
    // again result in an actual submission going out without consent. In
    // the normal case a component's own validation already caught this and
    // never calls submit() at all, so this reuses the SAME shared, already-
    // localized message every form's inline validation uses — never a
    // second, different message stacked on top of one already shown.
    if (formData.get("privacyConsent") !== "on") {
      setSubmitError(messages.privacyConsentRequiredMessage);
      return false;
    }

    submissionLock.current = true;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Captured BEFORE humanizing — that renames `name` to "Name", so
      // applyFormspreeMetadata's " — {name}" subject suffix couldn't read it
      // off the FormData afterward.
      const name = String(formData.get("name") ?? "").trim();
      humanizeFormFields(formData);
      applyFormspreeMetadata(formData, form, { locale, name });
      await submitToFormspree(formData);
      setSent(true);
      formElement?.reset();
      return true;
    } catch (error: unknown) {
      setSubmitError(
        error instanceof Error && error.message === "FORMSPREE_NOT_CONFIGURED"
          ? messages.formNotConfiguredMessage
          : options.failedMessage || messages.formSubmitFailedMessage,
      );
      return false;
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  function resetSuccess() {
    setSent(false);
  }

  return { sent, isSubmitting, submitError, submit, setSubmitError, resetSuccess };
}
