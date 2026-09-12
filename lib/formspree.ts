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
  /** Human-readable form identifier — sent as `form_name`. */
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
    subject: "[RoRUM] Work With Us application",
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

/**
 * Adds the standardized metadata every RORUM submission carries, in place, to
 * the FormData built from the form element:
 *
 * - `form_name`   — human-readable form identifier (RORUM_FORMS[key].formName)
 * - `subject`     — English subject, form type first, optional " — {name}"
 * - `_subject`    — same value; Formspree's field for the actual email Subject
 * - `locale`      — the visitor's locale ("en" | "da" | "uk"), when known
 * - `page_url`    — the page the form was submitted from (browser only)
 *
 * Purely synchronous string work — no network. The recipient address is NOT
 * added here (or anywhere in the app); it lives on the Formspree form.
 */
export function applyFormspreeMetadata(
  formData: FormData,
  form: RorumFormKey,
  options: { locale?: string } = {},
): void {
  const meta = RORUM_FORMS[form];

  let subject: string = meta.subject;
  if (meta.appendName) {
    const name = String(formData.get("name") ?? "").trim();
    if (name) subject = `${subject} — ${name}`;
  }

  formData.set("form_name", meta.formName);
  formData.set("subject", subject);
  formData.set("_subject", subject);

  if (options.locale) formData.set("locale", options.locale);
  if (typeof window !== "undefined" && window.location?.href) {
    formData.set("page_url", window.location.href);
  }
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
