"use client";

import type { ReactNode } from "react";
import { ApplicationModal } from "@/components/ApplicationModal";
import { FormSuccessContent } from "@/components/FormSuccessContent";

/**
 * The shared success experience for PAGE-EMBEDDED forms (Contact, Catering,
 * Event Decoration, Host at RORUM) — opens the same accessible modal shell
 * every other popup on the site already uses (`ApplicationModal`, with its
 * dialog semantics, focus trap, Escape/backdrop close and body scroll lock)
 * around the shared `FormSuccessContent` body.
 *
 * Forms that are already rendered inside an `ApplicationModal` (Volunteer,
 * Work With Us) must NOT use this component — stacking a second dialog on top
 * of the one they're already in would create a nested-dialog focus trap.
 * They render `FormSuccessContent` directly as their existing modal's
 * content instead.
 */
export function FormSuccessModal({
  titleId,
  title,
  message,
  doneLabel,
  closeLabel,
  onClose,
}: {
  titleId: string;
  title: ReactNode;
  message: ReactNode;
  doneLabel: string;
  closeLabel: string;
  onClose: () => void;
}) {
  return (
    <ApplicationModal titleId={titleId} closeLabel={closeLabel} onClose={onClose}>
      <FormSuccessContent titleId={titleId} title={title} message={message} doneLabel={doneLabel} onDone={onClose} />
    </ApplicationModal>
  );
}
