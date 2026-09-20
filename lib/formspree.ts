const endpointPlaceholder = "https://formspree.io/f/FORM_ID_PLACEHOLDER";

export const formspreeConfig = {
  endpoint:
    process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT?.trim() || endpointPlaceholder,
};

export function isFormspreeConfigured(): boolean {
  return formspreeConfig.endpoint !== endpointPlaceholder;
}

export async function submitToFormspree(formData: FormData): Promise<void> {
  if (!isFormspreeConfigured()) {
    throw new Error("FORMSPREE_NOT_CONFIGURED");
  }

  const response = await fetch(formspreeConfig.endpoint, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("FORMSPREE_SUBMISSION_FAILED");
  }
}

// --- One shared Formspree configuration for every RORUM website form -------
//
// All forms POST to the SAME endpoint (NEXT_PUBLIC_FORMSPREE_ENDPOINT), one
// Formspree form, one recipient. The recipient email is configured on the
// Formspree form itself — it is NEVER hardcoded in a component or submitted by
// the browser. See .env.example / SANITY_MIGRATION.md §20 for the owner setup.
//
// `subject` values are intentionally English regardless of the visitor's
// locale, so the recipient has one consistent, searchable/filterable naming
// convention in Gmail. `[RoRUM]` prefix + form type first, always — an
// optional " — {name}" is appended by applyFormspreeMetadata(), never the
// only identifier.

export interface FormspreeFormMeta {
  /** Standardized English email subject (before any name suffix). No longer sent as a separate `form_name` field — see `applyFormspreeMetadata`. */
  formName: string;
  /** Standardized English email subject (before any name suffix). */
  subject: string;
  /** Append " — {name}" to the subject when the form has a `name` value. */
  appendName: boolean;
}

export const RORUM_FORMS = {
  contact: {
    formName: "Contact request",
    subject: "[RoRUM] Contact request",
    appendName: true,
  },
  volunteer: {
    formName: "Volunteer application",
    subject: "[RoRUM] Volunteer application",
    appendName: true,
  },
  workWithUs: {
    formName: "Work With Us application",
    subject: "[RoRUM] Work With Us",
    appendName: true,
  },
  catering: {
    formName: "Catering inquiry",
    subject: "[RoRUM] Catering inquiry",
    appendName: true,
  },
  eventDecoration: {
    formName: "Event Decoration inquiry",
    subject: "[RoRUM] Event Decoration inquiry",
    appendName: true,
  },
  hostAtRorum: {
    formName: "Host at RORUM inquiry",
    subject: "[RoRUM] Host at RORUM inquiry",
    appendName: true,
  },
} as const satisfies Record<string, FormspreeFormMeta>;

export type RorumFormKey = keyof typeof RORUM_FORMS;

const LOCALE_ENGLISH_NAMES: Record<string, string> = {
  en: "English",
  da: "Danish",
  uk: "Ukrainian",
};

// Explicit IANA zone, not the applicant's own device/browser timezone —
// without this, `toLocaleString` silently falls back to the RUNTIME's local
// timezone, which is whatever timezone the visitor's device happens to be
// set to (anywhere in the world), not RoRUM's own. "Europe/Copenhagen" makes
// `Intl` apply Denmark's actual DST rules (CET/UTC+1 in winter, CEST/UTC+2
// in summer) automatically — this is a single conversion (the `Date`'s
// underlying UTC instant -> Copenhagen wall-clock time for display), not a
// double conversion; `new Date()` itself carries no timezone, only an
// instant. Note this is independent of, and often WON'T match, what
// Formspree's own dashboard shows for the same submission — that renders in
// UTC (not configurable), so during Danish summer time it reads exactly 2
// hours earlier than this field, by design.
const SUBMITTED_AT_TIME_ZONE = "Europe/Copenhagen";

/** Always English, regardless of `locale` — this is a note for the RoRUM team, not visitor-facing content. */
function formatSubmittedAt(date: Date = new Date()): string {
  return date.toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: SUBMITTED_AT_TIME_ZONE,
  });
}

// Fields with a name Formspree treats as special, or that this helper itself
// manages separately — never renamed by `humanizeFormFields`:
//  - `email`   — Formspree's OFFICIAL, documented Reply-To trigger (a field
//                literally named `email`; see
//                help.formspree.io/articles/building-your-form/email-reply-to-address).
//                Renaming it away silently breaks Reply-To.
//  - `subject` — Formspree's OFFICIAL, documented email-Subject trigger (see
//                help.formspree.io/articles/building-your-form/email-subject-line).
//                Set by `applyFormspreeMetadata` below; must stay lowercase.
//  - `privacyConsent` — folded into the "Submission details" block's
//                `Consent` field by `applyFormspreeMetadata`, not shown as-is.
const HUMANIZE_SKIP = new Set(["email", "subject", "privacyConsent"]);

// The handful of fields whose mechanical camelCase→"Title Case" split
// (below) wouldn't read naturally — everything else across all 6 forms
// (name, phone, message, eventDate, eventTime, guests, package,
// additionalServices, experience, links) already comes out right without an
// override; see lib/formspree.test.ts for the full table.
const FIELD_LABEL_OVERRIDES: Record<string, string> = {
  roleInterest: "Interested in",
  whyRorum: "Why RoRUM?",
};

/**
 * "eventDate" -> "Event Date", "additionalServices" -> "Additional
 * Services", "guests" -> "Guests". Used by `humanizeFormFields` as the
 * fallback for any field without an explicit `FIELD_LABEL_OVERRIDES` entry —
 * covers custom fields a manager adds in Sanity (e.g. Contact's
 * CMS-configurable field list) that this file can't know about in advance.
 */
function humanizeFieldName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Relabels every field in `formData` to a human-readable key — "name" ->
 * "Name", "eventDate" -> "Event Date", etc. (override table first, then the
 * mechanical splitter above) — EXCEPT the fields in `HUMANIZE_SKIP`.
 *
 * IMPORTANT, verified against a real Formspree Free-plan account: Formspree
 * renders the notification email and dashboard fields ALPHABETICALLY BY
 * FIELD NAME, not in FormData submission order, and this is not configurable
 * on the Free plan. So this function controls each field's LABEL (this is
 * genuinely achievable — the field name IS the label on the default
 * template) but NOT its position. Do not rename fields to force a display
 * order (e.g. numeric prefixes) — that reads as broken, robotic labels to
 * the RoRUM team and was explicitly ruled out.
 *
 * Called once, by `useFormspreeSubmit.submit()`, for every RORUM form — so
 * every component gets consistent labels for free, with zero changes to the
 * component itself.
 */
export function humanizeFormFields(formData: FormData): void {
  for (const key of [...formData.keys()]) {
    if (HUMANIZE_SKIP.has(key)) continue;
    const label = FIELD_LABEL_OVERRIDES[key] ?? humanizeFieldName(key);
    if (label === key) continue;
    const value = formData.get(key);
    formData.delete(key);
    if (value !== null) formData.set(label, value);
  }
}

/**
 * The "Submission details" block every RORUM form now gets — appended AFTER
 * the form's own (already humanized) fields. Reads `privacyConsent` off the
 * FormData and removes it (replaced by `Consent`); also removes any raw
 * `locale`/`page_url`/`form_name` a caller's no-JS-fallback hidden inputs may
 * have left behind, so nothing technical survives alongside it.
 */
function applySubmissionDetails(formData: FormData, locale?: string): void {
  const consentRaw = formData.get("privacyConsent");
  formData.delete("privacyConsent");
  formData.delete("locale");
  formData.delete("page_url");
  formData.delete("form_name");

  formData.set("Language", locale ? LOCALE_ENGLISH_NAMES[locale] ?? locale : "Unknown");
  formData.set("Page", typeof window !== "undefined" ? window.location?.href ?? "" : "");
  formData.set("Consent", consentRaw === "on" || consentRaw === "true" ? "Yes" : "No");
  formData.set("Submitted", formatSubmittedAt());
}

/**
 * Adds the standardized metadata every RORUM submission carries, in place, to
 * the FormData built from the form element — call AFTER `humanizeFormFields`
 * (see `useFormspreeSubmit.submit()`, the one place that calls both):
 *
 * - `subject` — Formspree's OFFICIAL, documented field for the email Subject
 *   header (help.formspree.io/articles/building-your-form/email-subject-line
 *   recommends exactly `name="subject"`). This project previously used the
 *   undocumented `_subject` convention and, before that, BOTH `subject` and
 *   `_subject` at once — the real duplicate-subject bug. Verified against a
 *   real Formspree Free-plan submission: like every other field, `subject`
 *   ALSO appears as an ordinary row in the notification body/dashboard —
 *   Formspree has no purely-hidden variant of this mechanism on the Free
 *   plan (a true custom template is a paid-plan feature — see below). That
 *   row is an accepted, unavoidable Free-plan characteristic, not something
 *   to work around with more special fields.
 * - the "Submission details" block (Language / Page / Consent / Submitted) —
 *   see `applySubmissionDetails` above.
 *
 * Purely synchronous string work — no network. The recipient address is NOT
 * added here (or anywhere in the app); it lives on the Formspree form.
 *
 * `options.name`, when passed, is used for the subject's " — {name}" suffix
 * INSTEAD of reading `formData.get("name")` — needed because
 * `humanizeFormFields` already renamed `name` to "Name" by this point.
 */
export function applyFormspreeMetadata(
  formData: FormData,
  form: RorumFormKey,
  options: { locale?: string; name?: string } = {},
): void {
  const meta: FormspreeFormMeta = RORUM_FORMS[form];

  let subject: string = meta.subject;
  if (meta.appendName) {
    const name = (options.name ?? String(formData.get("name") ?? "")).trim();
    if (name) subject = `${subject} — ${name}`;
  }

  formData.set("subject", subject);
  applySubmissionDetails(formData, options.locale);
}

// --- Payload-quality helpers for value/label option fields ------------------
//
// Some forms render native `<select>`/checkbox-group fields from a
// value/label options array (e.g. InquiryForm's booking `package` select and
// `additionalServices` checkboxes, both driven by Sanity-backed,
// locale-resolved arrays — see app/[locale]/(site)/host-at-rorum/page.tsx).
// The native DOM controls submit the stable, internal `value` (e.g.
// "package0"), never the visible label text the administrator edits in
// Sanity. These two helpers resolve a field's raw submitted value(s) against
// the SAME options array the UI rendered, in place on the FormData, so the
// email payload shows the human-readable label instead of an internal id.

export interface LabeledOption {
  value: string;
  label: string;
}

/**
 * Replaces a single-value field's submitted value with the visible label of
 * the matching option from the SAME array the UI rendered as <option>s —
 * e.g. "package0" -> "Morning session". If the submitted value doesn't
 * match any option (not selected, or a stale/unexpected value), the field
 * is removed when empty (avoids a blank line in the email) and left
 * untouched otherwise (never silently drops a real value it doesn't
 * recognize). A field absent from the FormData entirely is a no-op.
 */
export function resolveOptionLabel(formData: FormData, fieldName: string, options: LabeledOption[]): void {
  const raw = formData.get(fieldName);
  if (raw === null) return;

  const value = String(raw);
  const match = options.find((option) => option.value === value);
  if (match) {
    formData.set(fieldName, match.label);
    return;
  }
  if (!value.trim()) {
    formData.delete(fieldName);
  }
  // else: non-empty but unrecognized — leave the raw value untouched rather
  // than silently dropping something real.
}

/**
 * Replaces every entry of a multi-value (checkbox-group) field with ONE
 * combined, human-readable string of the matching options' visible labels
 * — e.g. "Brunch, Lunch, Snacks" — in the OPTIONS' defined order (not raw
 * selection order, so the result reads the same regardless of click
 * order). Any checked value that doesn't match an option is kept as its raw
 * value, appended after the resolved labels (never silently dropped).
 * Removes the field entirely from the payload when nothing was selected (no
 * blank "Additional services:" line in the email) — which, since unchecked
 * checkboxes submit nothing, is also what happens when the field is absent.
 */
export function resolveMultiOptionLabels(
  formData: FormData,
  fieldName: string,
  options: LabeledOption[],
  separator = ", ",
): void {
  const rawValues = formData.getAll(fieldName).map((value) => String(value));
  if (!rawValues.length) return;

  const rawValueSet = new Set(rawValues);
  const knownValues = new Set(options.map((option) => option.value));
  const matchedLabels = options
    .filter((option) => rawValueSet.has(option.value))
    .map((option) => option.label);
  const unmatchedRawValues = [...new Set(rawValues.filter((value) => !knownValues.has(value)))];

  formData.delete(fieldName);
  const combined = [...matchedLabels, ...unmatchedRawValues];
  if (combined.length) {
    formData.set(fieldName, combined.join(separator));
  }
}
