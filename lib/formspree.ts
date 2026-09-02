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
