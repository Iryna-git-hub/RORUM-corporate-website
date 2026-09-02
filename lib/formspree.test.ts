import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyFormspreeMetadata,
  formspreeConfig,
  isFormspreeConfigured,
  RORUM_FORMS,
  submitToFormspree,
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
  it("stamps the human-readable form_name and the English [RoRUM] subject for each form key", () => {
    for (const [key, meta] of Object.entries(RORUM_FORMS)) {
      const fd = new FormData();
      applyFormspreeMetadata(fd, key as keyof typeof RORUM_FORMS);
      expect(fd.get("form_name")).toBe(meta.formName);
      expect(fd.get("subject")).toBe(meta.subject);
      expect(fd.get("_subject")).toBe(meta.subject);
      expect(String(fd.get("subject"))).toMatch(/^\[RoRUM] /);
    }
  });

  it("the six required forms are all present with the exact approved strings", () => {
    expect(RORUM_FORMS.contact).toMatchObject({ formName: "Contact request", subject: "[RoRUM] Contact request" });
    expect(RORUM_FORMS.volunteer).toMatchObject({ formName: "Volunteer application", subject: "[RoRUM] Volunteer application" });
    expect(RORUM_FORMS.workWithUs).toMatchObject({ formName: "Work With Us application", subject: "[RoRUM] Work With Us application" });
    expect(RORUM_FORMS.catering).toMatchObject({ formName: "Catering inquiry", subject: "[RoRUM] Catering inquiry" });
    expect(RORUM_FORMS.eventDecoration).toMatchObject({ formName: "Event Decoration inquiry", subject: "[RoRUM] Event Decoration inquiry" });
    expect(RORUM_FORMS.hostAtRorum).toMatchObject({ formName: "Host at RORUM inquiry", subject: "[RoRUM] Host at RORUM inquiry" });
  });

  it("appends ' — {name}' to the subject when a name is present, form type still first", () => {
    const fd = new FormData();
    fd.set("name", "Jane Doe");
    applyFormspreeMetadata(fd, "catering");
    expect(fd.get("subject")).toBe("[RoRUM] Catering inquiry — Jane Doe");
    expect(fd.get("_subject")).toBe("[RoRUM] Catering inquiry — Jane Doe");
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

  it("records the visitor locale when provided", () => {
    const fd = new FormData();
    applyFormspreeMetadata(fd, "contact", { locale: "da" });
    expect(fd.get("locale")).toBe("da");
  });

  it("never adds a recipient email (that lives on the Formspree form, not the payload)", () => {
    const fd = new FormData();
    fd.set("name", "Jane");
    fd.set("email", "visitor@example.com");
    applyFormspreeMetadata(fd, "contact", { locale: "en" });
    const serialized = [...fd.entries()].map(([k, v]) => `${k}=${String(v)}`).join("\n");
    expect(serialized).not.toMatch(/lopatina\.iryna@gmail\.com/i);
    expect(fd.has("_replyto")).toBe(false);
    expect(fd.has("_to")).toBe(false);
    expect(fd.has("recipient")).toBe(false);
  });
});
