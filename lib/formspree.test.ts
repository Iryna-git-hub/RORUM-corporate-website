import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyFormspreeMetadata,
  formspreeConfig,
  humanizeFormFields,
  isFormspreeConfigured,
  resolveMultiOptionLabels,
  resolveOptionLabel,
  RORUM_FORMS,
  submitToFormspree,
  type LabeledOption,
} from "./formspree";

// This project ships WITHOUT a real Formspree endpoint (`.env.example`'s
// placeholder), so every form's submit path must fail *before* any network
// call. These tests lock that guarantee down — see lib/useFormspreeSubmit.ts,
// which every form component now submits through.

afterEach(() => vi.restoreAllMocks());

describe("formspree helper — unconfigured (the project's current, shipped state)", () => {
  it("isFormspreeConfigured() is false when NEXT_PUBLIC_FORMSPREE_ENDPOINT is the placeholder / unset", () => {
    expect(isFormspreeConfigured()).toBe(false);
  });

  it("submitToFormspree() rejects with FORMSPREE_NOT_CONFIGURED and makes ZERO network requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("submitToFormspree must not touch the network when no endpoint is configured");
    });

    await expect(submitToFormspree(new FormData())).rejects.toThrow("FORMSPREE_NOT_CONFIGURED");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("formspree helper — configured endpoint", () => {
  const REAL_ENDPOINT = "https://formspree.io/f/abcdwxyz";

  beforeEach(() => {
    // The endpoint is read once at module load; override the resolved value.
    formspreeConfig.endpoint = REAL_ENDPOINT;
  });
  afterEach(() => {
    formspreeConfig.endpoint = "https://formspree.io/f/FORM_ID_PLACEHOLDER";
  });

  it("isFormspreeConfigured() is true and submitToFormspree() POSTs multipart FormData to that exact endpoint", async () => {
    expect(isFormspreeConfigured()).toBe(true);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    const fd = new FormData();
    fd.set("email", "a@b.com");
    await submitToFormspree(fd);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe(REAL_ENDPOINT);
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBe(fd);
  });

  it("a non-ok Formspree response rejects with FORMSPREE_SUBMISSION_FAILED (never a silent success)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 422 }));
    await expect(submitToFormspree(new FormData())).rejects.toThrow("FORMSPREE_SUBMISSION_FAILED");
  });
});

describe("applyFormspreeMetadata — standardized metadata for every form", () => {
  it("stamps exactly ONE subject field: Formspree's own documented `subject` (never the legacy `_subject`)", () => {
    for (const [key, meta] of Object.entries(RORUM_FORMS)) {
      const fd = new FormData();
      applyFormspreeMetadata(fd, key as keyof typeof RORUM_FORMS);
      expect(fd.get("subject")).toBe(meta.subject);
      expect(fd.has("_subject")).toBe(false);
      expect(String(fd.get("subject"))).toMatch(/^\[RoRUM] /);
    }
  });

  it("never sends form_name — the subject line already identifies the form type", () => {
    for (const key of Object.keys(RORUM_FORMS)) {
      const fd = new FormData();
      applyFormspreeMetadata(fd, key as keyof typeof RORUM_FORMS);
      expect(fd.has("form_name")).toBe(false);
    }
  });

  it("the six required forms are all present with the exact approved subjects", () => {
    expect(RORUM_FORMS.contact).toMatchObject({ formName: "Contact request", subject: "[RoRUM] Contact request" });
    expect(RORUM_FORMS.volunteer).toMatchObject({ formName: "Volunteer application", subject: "[RoRUM] Volunteer application" });
    expect(RORUM_FORMS.workWithUs).toMatchObject({ formName: "Work With Us application", subject: "[RoRUM] Work With Us" });
    expect(RORUM_FORMS.catering).toMatchObject({ formName: "Catering inquiry", subject: "[RoRUM] Catering inquiry" });
    expect(RORUM_FORMS.eventDecoration).toMatchObject({ formName: "Event Decoration inquiry", subject: "[RoRUM] Event Decoration inquiry" });
    expect(RORUM_FORMS.hostAtRorum).toMatchObject({ formName: "Host at RORUM inquiry", subject: "[RoRUM] Host at RORUM inquiry" });
  });

  it("appends ' — {name}' to the subject when a name is present, form type still first", () => {
    const fd = new FormData();
    fd.set("name", "Jane Doe");
    applyFormspreeMetadata(fd, "catering");
    expect(fd.get("subject")).toBe("[RoRUM] Catering inquiry — Jane Doe");
    // the form type must always be visible first
    expect(String(fd.get("subject")).indexOf("Catering inquiry")).toBeLessThan(
      String(fd.get("subject")).indexOf("Jane Doe"),
    );
  });

  it("does not append a name suffix when the name is blank / missing", () => {
    const fd = new FormData();
    applyFormspreeMetadata(fd, "volunteer");
    expect(fd.get("subject")).toBe("[RoRUM] Volunteer application");
    const fd2 = new FormData();
    fd2.set("name", "   ");
    applyFormspreeMetadata(fd2, "volunteer");
    expect(fd2.get("subject")).toBe("[RoRUM] Volunteer application");
  });

  it("options.name overrides formData's own `name` field for the subject suffix (for callers that relabel `name` away first)", () => {
    const fd = new FormData();
    applyFormspreeMetadata(fd, "workWithUs", { name: "Iryna Lopatina" });
    expect(fd.get("subject")).toBe("[RoRUM] Work With Us — Iryna Lopatina");
  });

  it("never adds a recipient email, or the legacy _replyto/_to/recipient fields (that lives on the Formspree form, not the payload — Reply-To comes from a literal `email` field, never renamed)", () => {
    const fd = new FormData();
    fd.set("name", "Jane");
    fd.set("email", "visitor@example.com");
    applyFormspreeMetadata(fd, "contact", { locale: "en" });
    const serialized = [...fd.entries()].map(([k, v]) => `${k}=${String(v)}`).join("\n");
    expect(serialized).not.toMatch(/lopatina\.iryna@gmail\.com/i);
    expect(fd.has("_replyto")).toBe(false);
    expect(fd.has("_to")).toBe(false);
    expect(fd.has("recipient")).toBe(false);
    expect(fd.get("email")).toBe("visitor@example.com");
  });
});

describe("applyFormspreeMetadata — Submission details block (every form, uniformly)", () => {
  it("omits form_name/locale/page_url and instead appends a human-readable Submission details block", () => {
    const fd = new FormData();
    fd.set("privacyConsent", "on");
    applyFormspreeMetadata(fd, "workWithUs", { locale: "uk", name: "Iryna Lopatina" });

    expect(fd.has("form_name")).toBe(false);
    expect(fd.has("locale")).toBe(false);
    expect(fd.has("page_url")).toBe(false);
    expect(fd.has("privacyConsent")).toBe(false);

    expect(fd.get("Language")).toBe("Ukrainian");
    expect(fd.get("Consent")).toBe("Yes");
    expect(typeof fd.get("Submitted")).toBe("string");
    expect(String(fd.get("Submitted")).length).toBeGreaterThan(0);
  });

  it("applies identically to a non-Work-With-Us form (e.g. contact)", () => {
    const fd = new FormData();
    applyFormspreeMetadata(fd, "contact", { locale: "da" });
    expect(fd.get("Language")).toBe("Danish");
    expect(fd.get("Consent")).toBe("No");
    expect(typeof fd.get("Submitted")).toBe("string");
    expect(fd.has("locale")).toBe(false);
  });

  it("maps all three locales to their English names", () => {
    for (const [locale, label] of [["en", "English"], ["da", "Danish"], ["uk", "Ukrainian"]] as const) {
      const fd = new FormData();
      applyFormspreeMetadata(fd, "workWithUs", { locale });
      expect(fd.get("Language")).toBe(label);
    }
  });

  it('maps missing/unchecked consent to "No"', () => {
    const fd = new FormData();
    applyFormspreeMetadata(fd, "workWithUs", { locale: "en" });
    expect(fd.get("Consent")).toBe("No");
  });

  it("Submission details fields are appended AFTER the caller's own (already humanized) fields", () => {
    const fd = new FormData();
    fd.set("Name", "Iryna Lopatina");
    fd.set("email", "iryna@example.com");
    applyFormspreeMetadata(fd, "workWithUs", { locale: "en", name: "Iryna Lopatina" });
    const keys = [...fd.keys()];
    expect(keys.indexOf("Name")).toBeLessThan(keys.indexOf("Language"));
    expect(keys.indexOf("email")).toBeLessThan(keys.indexOf("Consent"));
  });
});

describe("Submitted timestamp — Europe/Copenhagen, DST-correct, not the runtime's own timezone", () => {
  afterEach(() => vi.useRealTimers());

  it("winter (CET, UTC+1): a UTC instant is rendered one hour ahead", () => {
    // 2026-01-15T12:00:00Z -> Copenhagen is UTC+1 in January (no DST).
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    const fd = new FormData();
    applyFormspreeMetadata(fd, "contact", { locale: "en" });
    expect(fd.get("Submitted")).toBe("15 January 2026 at 13:00");
  });

  it("summer (CEST, UTC+2): the SAME wall-clock UTC hour is rendered two hours ahead — proves this isn't a fixed UTC+1 offset, DST is applied automatically", () => {
    // 2026-07-15T12:00:00Z -> Copenhagen is UTC+2 in July (DST active).
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T12:00:00Z"));
    const fd = new FormData();
    applyFormspreeMetadata(fd, "contact", { locale: "en" });
    expect(fd.get("Submitted")).toBe("15 July 2026 at 14:00");
  });

  it("is independent of the test runtime's own local timezone (fixed Europe/Copenhagen, not `Intl`'s ambient default)", () => {
    // Regression guard for the original bug: `toLocaleString(...)` with no
    // `timeZone` option silently uses the RUNTIME's local zone (the
    // applicant's own device, in production) — this pins it explicitly, so
    // the result must match a fixed Europe/Copenhagen calculation regardless
    // of TZ env var / OS setting the test happens to run under.
    vi.useFakeTimers();
    const instant = new Date("2026-07-15T12:00:00Z");
    vi.setSystemTime(instant);
    const fd = new FormData();
    applyFormspreeMetadata(fd, "contact", { locale: "en" });
    const expected = instant.toLocaleString("en-GB", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Copenhagen",
    });
    expect(fd.get("Submitted")).toBe(expected);
  });
});

describe("humanizeFormFields — consistent, human-readable labels for every form", () => {
  it("relabels every known field name across the 6 forms", () => {
    const fd = new FormData();
    fd.set("name", "Jane Doe");
    fd.set("phone", "+45 12 34 56 78");
    fd.set("message", "hello");
    fd.set("eventDate", "2099-06-01");
    fd.set("eventTime", "18:00");
    fd.set("guests", "4");
    fd.set("package", "Morning session");
    fd.set("additionalServices", "Breakfast, Lunch");
    fd.set("roleInterest", "Social media & content");
    fd.set("experience", "5 years");
    fd.set("whyRorum", "I care");
    fd.set("links", "https://example.com");
    humanizeFormFields(fd);

    expect(fd.get("Name")).toBe("Jane Doe");
    expect(fd.get("Phone")).toBe("+45 12 34 56 78");
    expect(fd.get("Message")).toBe("hello");
    expect(fd.get("Event Date")).toBe("2099-06-01");
    expect(fd.get("Event Time")).toBe("18:00");
    expect(fd.get("Guests")).toBe("4");
    expect(fd.get("Package")).toBe("Morning session");
    expect(fd.get("Additional Services")).toBe("Breakfast, Lunch");
    expect(fd.get("Interested in")).toBe("Social media & content");
    expect(fd.get("Experience")).toBe("5 years");
    expect(fd.get("Why RoRUM?")).toBe("I care");
    expect(fd.get("Links")).toBe("https://example.com");
  });

  it("never renames `email` (Formspree's Reply-To trigger), `subject`, or `privacyConsent`", () => {
    const fd = new FormData();
    fd.set("email", "a@b.com");
    fd.set("subject", "[RoRUM] Test");
    fd.set("privacyConsent", "on");
    humanizeFormFields(fd);
    expect(fd.get("email")).toBe("a@b.com");
    expect(fd.get("subject")).toBe("[RoRUM] Test");
    expect(fd.get("privacyConsent")).toBe("on");
    expect(fd.has("Email")).toBe(false);
    expect(fd.has("Subject")).toBe(false);
  });

  it("humanizes an unrecognized (e.g. manager-added Sanity Contact) field name generically", () => {
    const fd = new FormData();
    fd.set("preferredContactMethod", "Phone");
    humanizeFormFields(fd);
    expect(fd.get("Preferred Contact Method")).toBe("Phone");
  });

  it("preserves relative order when every field gets renamed (order isn't Formspree's display order — see below — but this keeps the payload legible for debugging)", () => {
    const fd = new FormData();
    fd.set("name", "Jane");
    fd.set("phone", "123");
    fd.set("message", "hi");
    humanizeFormFields(fd);
    expect([...fd.keys()]).toEqual(["Name", "Phone", "Message"]);
  });

  it("a skipped field (email) keeps its original position; renamed fields move after it, in processing order — a FormData mechanics detail, NOT something calling code should rely on, since Formspree ignores FormData order entirely", () => {
    const fd = new FormData();
    fd.set("name", "Jane");
    fd.set("email", "a@b.com");
    fd.set("phone", "123");
    humanizeFormFields(fd);
    // `email` is untouched in place; `name`/`phone` are deleted + re-set,
    // which appends them at the then-current end — this is exactly why no
    // test in this file (or anywhere else) asserts a specific overall key
    // order for a real submission's humanized FormData.
    expect([...fd.keys()]).toEqual(["email", "Name", "Phone"]);
  });
});

describe("resolveOptionLabel — single-value <select>/radio-style field", () => {
  const OPTIONS: LabeledOption[] = [
    { value: "package0", label: "Morning session" },
    { value: "package1", label: "Afternoon session" },
  ];

  it("resolves a matching value to its visible label", () => {
    const fd = new FormData();
    fd.set("package", "package1");
    resolveOptionLabel(fd, "package", OPTIONS);
    expect(fd.get("package")).toBe("Afternoon session");
  });

  it("leaves a non-empty, unrecognized value untouched (never silently drops a real value)", () => {
    const fd = new FormData();
    fd.set("package", "package-stale-999");
    resolveOptionLabel(fd, "package", OPTIONS);
    expect(fd.get("package")).toBe("package-stale-999");
  });

  it("removes the field when its value is empty and unmatched (no blank line in the email)", () => {
    const fd = new FormData();
    fd.set("package", "");
    resolveOptionLabel(fd, "package", OPTIONS);
    expect(fd.has("package")).toBe(false);
  });

  it("is a no-op when the field is not present in the FormData at all", () => {
    const fd = new FormData();
    fd.set("name", "Jane");
    resolveOptionLabel(fd, "package", OPTIONS);
    expect(fd.has("package")).toBe(false);
    expect(fd.get("name")).toBe("Jane");
  });
});

describe("resolveMultiOptionLabels — multi-value checkbox-group field", () => {
  const OPTIONS: LabeledOption[] = [
    { value: "service0", label: "Breakfast" },
    { value: "service1", label: "Snacks" },
    { value: "service2", label: "Lunch" },
  ];

  it("resolves every checked value to its visible label, joined with the default separator", () => {
    const fd = new FormData();
    fd.append("additionalServices", "service0");
    fd.append("additionalServices", "service2");
    resolveMultiOptionLabels(fd, "additionalServices", OPTIONS);
    expect(fd.get("additionalServices")).toBe("Breakfast, Lunch");
  });

  it("joins labels in the OPTIONS' defined order, not raw selection/insertion order", () => {
    const fd = new FormData();
    // Checked in reverse order relative to OPTIONS.
    fd.append("additionalServices", "service2");
    fd.append("additionalServices", "service0");
    resolveMultiOptionLabels(fd, "additionalServices", OPTIONS);
    expect(fd.get("additionalServices")).toBe("Breakfast, Lunch");
  });

  it("supports a custom separator", () => {
    const fd = new FormData();
    fd.append("additionalServices", "service0");
    fd.append("additionalServices", "service1");
    resolveMultiOptionLabels(fd, "additionalServices", OPTIONS, " | ");
    expect(fd.get("additionalServices")).toBe("Breakfast | Snacks");
  });

  it("keeps an unrecognized checked value as its raw string, appended after resolved labels", () => {
    const fd = new FormData();
    fd.append("additionalServices", "service0");
    fd.append("additionalServices", "service-stale-999");
    resolveMultiOptionLabels(fd, "additionalServices", OPTIONS);
    expect(fd.get("additionalServices")).toBe("Breakfast, service-stale-999");
  });

  it("removes the field entirely when nothing was selected (not present at all, as real checkboxes behave)", () => {
    const fd = new FormData();
    fd.set("name", "Jane");
    resolveMultiOptionLabels(fd, "additionalServices", OPTIONS);
    expect(fd.has("additionalServices")).toBe(false);
  });

  it("is a no-op when the field is not present in the FormData at all", () => {
    const fd = new FormData();
    fd.set("name", "Jane");
    resolveMultiOptionLabels(fd, "additionalServices", OPTIONS);
    expect(fd.has("additionalServices")).toBe(false);
    expect(fd.get("name")).toBe("Jane");
  });

  it("there is exactly one FormData entry for the field after resolution, not one per checked box", () => {
    const fd = new FormData();
    fd.append("additionalServices", "service0");
    fd.append("additionalServices", "service1");
    resolveMultiOptionLabels(fd, "additionalServices", OPTIONS);
    expect(fd.getAll("additionalServices")).toHaveLength(1);
  });
});
