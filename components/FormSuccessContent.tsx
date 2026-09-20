"use client";

import type { ReactNode } from "react";
import { CircleCheckBig } from "lucide-react";

const DONE_BUTTON_CLASS =
  "inline-flex items-center justify-center justify-self-stretch self-center min-h-10.5 w-full px-6 py-0 border border-cta-red rounded-pill bg-cta-red text-white text-[12.5px] lg:text-[13px] font-bold tracking-[0.02em] uppercase cursor-pointer transition duration-180 ease-[ease] hover:-translate-y-px hover:bg-cta-red-hover hover:border-cta-red-hover hover:text-white focus-visible:bg-cta-red-hover focus-visible:border-cta-red-hover focus-visible:text-white active:bg-primary-darker active:border-primary-darker";

/**
 * The ONE success body every RORUM form shows after a confirmed Formspree
 * delivery — a success icon, a title (the shared chrome default from
 * `messages.successTitle`, or a form-specific override like Work With Us's
 * own Sanity-authored `modalTitleSent`), the form's own success message, and
 * a single "Done" action.
 *
 * Deliberately renders no dialog/close chrome of its own (no X, no
 * role="dialog") — it's always rendered inside an existing modal shell
 * (`FormSuccessModal` for page-embedded forms, or directly swapped into an
 * already-open `ApplicationModal` for Volunteer/Work With Us), so a second
 * copy of that chrome here would mean a form-success flow could end up with
 * two competing close affordances, or worse, a nested dialog.
 */
export function FormSuccessContent({
  titleId,
  title,
  message,
  doneLabel,
  onDone,
}: {
  titleId: string;
  title: ReactNode;
  message: ReactNode;
  doneLabel: string;
  onDone: () => void;
}) {
  return (
    <div className="grid gap-4.5">
      <CircleCheckBig aria-hidden="true" className="w-11 h-11 text-light-green" strokeWidth={1.6} />
      <h2
        id={titleId}
        className="font-heading m-0 text-text-primary text-[2.4rem] leading-[0.98] font-light tracking-normal"
      >
        {title}
      </h2>
      <p className="m-0 text-text-primary text-[15px] leading-[1.65]">{message}</p>
      <button className={DONE_BUTTON_CLASS} type="button" onClick={onDone}>
        {doneLabel}
      </button>
    </div>
  );
}
