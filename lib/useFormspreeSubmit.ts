"use client";

import { useRef, useState } from "react";
import { useFormContent } from "@/components/FormContentProvider";
import { useLocale } from "@/lib/useLocale";
import {
  applyFormspreeMetadata,
  submitToFormspree,
  type RorumFormKey,
} from "@/lib/formspree";

/**
 * The one submission path every RORUM form uses. Given a validated FormData,
 * it stamps the standardized metadata (applyFormspreeMetadata), POSTs through
 * the shared submitToFormspree() helper, and drives the success / error /
 * "not configured" UI state — no component keeps its own fetch or fake
 * setTimeout.
 *
 * Contract:
 * - success is set ONLY after Formspree confirms the POST
 * - the form is reset ONLY on confirmed success (caller passes the element)
 * - on any failure the user's input is untouched; a localized message shows:
 *     FORMSPREE_NOT_CONFIGURED -> messages.formNotConfiguredMessage
 *     any other failure        -> options.failedMessage, else
 *                                 messages.formSubmitFailedMessage
 * - `submissionLock` prevents a double POST even if the button isn't disabled
 *
 * `options.failedMessage` lets a form supply its own (Sanity-managed,
 * localized) generic-failure copy — e.g. the Volunteer / Work With Us modals'
 * `errorMessage` content field — instead of the shared default.
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

    submissionLock.current = true;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      applyFormspreeMetadata(formData, form, { locale });
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

  return { sent, isSubmitting, submitError, submit, setSubmitError };
}
