import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/uk/work-with-us" }));

const { submitToFormspreeMock } = vi.hoisted(() => ({
  submitToFormspreeMock: vi.fn<(formData: FormData) => Promise<void>>(),
}));
vi.mock("@/lib/formspree", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/formspree")>();
  return {
    ...actual,
    isFormspreeConfigured: () => false,
    submitToFormspree: (formData: FormData) => submitToFormspreeMock(formData),
  };
});

import { WorkWithUsApplicationButton, type WorkWithUsApplicationFormContent } from "./WorkWithUsApplicationForm";
import type { SelectableOption } from "./InquiryForm";

beforeEach(() => {
  submitToFormspreeMock.mockReset();
  submitToFormspreeMock.mockRejectedValue(new Error("FORMSPREE_NOT_CONFIGURED"));
});
afterEach(() => cleanup());

const content: WorkWithUsApplicationFormContent = {
  modalTitle: "Apply to work with us",
  modalTitleSent: "Thank you — we received your application",
  description: "Tell us about yourself.",
  descriptionSent: "We'll be in touch.",
  errorMessage: "Could not send your application.",
  fullNamePlaceholder: "e.g. Anna Jensen",
  emailPlaceholder: "e.g. anna@example.com",
  phonePlaceholder: "e.g. +45 12 34 56 78",
  roleInterestLabel: "What kind of role are you interested in?",
  experienceLabel: "Tell us about your experience and skills",
  experiencePlaceholder: "Experience placeholder",
  whyRorumLabel: "Why would you like to work with RORUM?",
  whyRorumPlaceholder: "Why RORUM placeholder",
  linksLabel: "Links",
  linksPlaceholder: "LinkedIn, portfolio, or personal website",
};

const roleOptions: SelectableOption[] = [
  { value: "role0", label: "Social media & content" },
  { value: "role1", label: "Event planning & coordination" },
  { value: "role2", label: "Event support / practical help" },
  { value: "role7", label: "Other" },
];

async function openModal() {
  await userEvent.click(screen.getByRole("button", { name: /Apply now/i }));
}

async function fillRequiredFields(roleLabels: string[] = ["Social media & content"]) {
  await userEvent.type(screen.getByLabelText(/Full Name/), "Anna Holm");
  await userEvent.type(screen.getByLabelText(/^Email/), "anna@example.com");
  await userEvent.type(screen.getByLabelText(/Phone number/), "+45 60 60 60 60");
  for (const label of roleLabels) {
    await userEvent.click(screen.getByRole("checkbox", { name: label }));
  }
  await userEvent.type(screen.getByLabelText(/Tell us about your experience/), "Five years in hospitality.");
  await userEvent.type(screen.getByLabelText(/Why would you like to work with RORUM/), "I love the community.");
  await userEvent.click(screen.getByRole("checkbox", { name: /agree to the Privacy policy|read and agree/i }));
}

describe("WorkWithUsApplicationForm — no CV upload remains", () => {
  it("has no file input, no upload/dropzone UI, and no accept= attribute anywhere in the modal", async () => {
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("textbox", { name: /cv|resume/i })).not.toBeInTheDocument();
    expect(dialog.querySelector('input[type="file"]')).toBeNull();
    expect(dialog.querySelector("[accept]")).toBeNull();
    expect(screen.queryByText(/PDF, DOC, or DOCX/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/remove file/i)).not.toBeInTheDocument();
  });

  it("submits with no binary/file field — no 'cv' entry ever exists in the FormData", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    await screen.findByRole("dialog");
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.has("cv")).toBe(false);
    expect([...fd.keys()]).not.toContain("cv");
    const cvLike = [...fd.entries()].filter(([, value]) => value instanceof File);
    expect(cvLike).toEqual([]);
  });
});

describe("WorkWithUsApplicationForm — Full name/Email/Phone placeholders are examples, not label repeats", () => {
  it("Full name/Email/Phone placeholders come from content.*Placeholder and are NOT the field labels", async () => {
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    const nameField = screen.getByLabelText(/Full Name/) as HTMLInputElement;
    const emailField = screen.getByLabelText(/^Email/) as HTMLInputElement;
    const phoneField = screen.getByLabelText(/Phone number/) as HTMLInputElement;

    expect(nameField.placeholder).toBe(content.fullNamePlaceholder);
    expect(emailField.placeholder).toBe(content.emailPlaceholder);
    expect(phoneField.placeholder).toBe(content.phonePlaceholder);

    // Regression guard: placeholders must never just repeat the visible label.
    expect(nameField.placeholder.toLowerCase()).not.toBe("full name");
    expect(emailField.placeholder.toLowerCase()).not.toBe("email");
    expect(phoneField.placeholder.toLowerCase()).not.toBe("phone");
  });
});

describe("WorkWithUsApplicationForm — required-field validation", () => {
  it("requires Full name, Email, Phone, at least one role, Experience, Why RORUM, and Privacy consent", async () => {
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    expect(await screen.findAllByText(/is required/)).not.toHaveLength(0);
    expect(submitToFormspreeMock).not.toHaveBeenCalled();
  });

  it("validates email format", async () => {
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await userEvent.type(screen.getByLabelText(/^Email/), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it("validates phone format", async () => {
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await userEvent.type(screen.getByLabelText(/Phone number/), "abc");
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));
    expect(await screen.findByText(/valid phone/i)).toBeInTheDocument();
  });

  it("requires at least one role — shows an error and blocks submit when none checked", async () => {
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await userEvent.type(screen.getByLabelText(/Full Name/), "Anna Holm");
    await userEvent.type(screen.getByLabelText(/^Email/), "anna@example.com");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 60 60 60 60");
    await userEvent.type(screen.getByLabelText(/Tell us about your experience/), "Experience text");
    await userEvent.type(screen.getByLabelText(/Why would you like to work with RORUM/), "Why text");
    await userEvent.click(screen.getByRole("checkbox", { name: /agree to the Privacy policy|read and agree/i }));
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    const roleError = await screen.findByText((text) => text.includes(content.roleInterestLabel) && text.includes("is required"));
    expect(roleError).toHaveAttribute("role", "alert");
    expect(submitToFormspreeMock).not.toHaveBeenCalled();
  });

  it("Experience and skills is required", async () => {
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));
    await screen.findAllByText(/is required/);
    expect(screen.getByLabelText(/Tell us about your experience/)).toHaveAttribute("aria-invalid", "true");
  });

  it("Why RORUM is required", async () => {
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));
    await screen.findAllByText(/is required/);
    expect(screen.getByLabelText(/Why would you like to work with RORUM/)).toHaveAttribute("aria-invalid", "true");
  });

  it("Links is optional — submitting without it produces no validation error and no privacy/role errors are conflated with it", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    await screen.findByRole("dialog");
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    // Dropped entirely when blank — never a bare empty value shipped.
    expect(fd.has("Links")).toBe(false);
  });

  it("Links submits exactly as typed when the applicant does fill it in", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await fillRequiredFields();
    await userEvent.type(screen.getByLabelText(/^Links/), "https://linkedin.com/in/anna-holm");
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    await screen.findByRole("dialog");
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.get("Links")).toBe("https://linkedin.com/in/anna-holm");
  });

  it("requires privacy consent", async () => {
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await userEvent.type(screen.getByLabelText(/Full Name/), "Anna Holm");
    await userEvent.type(screen.getByLabelText(/^Email/), "anna@example.com");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 60 60 60 60");
    await userEvent.click(screen.getByRole("checkbox", { name: "Social media & content" }));
    await userEvent.type(screen.getByLabelText(/Tell us about your experience/), "Experience text");
    await userEvent.type(screen.getByLabelText(/Why would you like to work with RORUM/), "Why text");
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    expect(await screen.findByText(/agree to the Privacy policy/i)).toBeInTheDocument();
    expect(submitToFormspreeMock).not.toHaveBeenCalled();
    expect(screen.queryByText(content.modalTitleSent)).not.toBeInTheDocument();
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe("Anna Holm");
  });

  it("the consent checkbox is unchecked by default when the modal opens", async () => {
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    expect(
      (screen.getByRole("checkbox", { name: /agree to the Privacy policy|read and agree/i }) as HTMLInputElement)
        .checked,
    ).toBe(false);
  });

  it("blocks keyboard-only submission (Enter in a text field) exactly like a mouse click", async () => {
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await userEvent.type(screen.getByLabelText(/^Email/), "anna@example.com");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 60 60 60 60");
    await userEvent.click(screen.getByRole("checkbox", { name: "Social media & content" }));
    await userEvent.type(screen.getByLabelText(/Tell us about your experience/), "Experience text");
    await userEvent.type(screen.getByLabelText(/Why would you like to work with RORUM/), "Why text");
    // Enter inside a single-line <input> implicitly submits the form.
    await userEvent.type(screen.getByLabelText(/Full Name/), "Anna Holm{Enter}");

    expect(await screen.findByText(/agree to the Privacy policy/i)).toBeInTheDocument();
    expect(submitToFormspreeMock).not.toHaveBeenCalled();
  });

  it("checking consent after a blocked attempt allows submission without re-entering anything else, with Consent: Yes in the payload", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await userEvent.type(screen.getByLabelText(/Full Name/), "Anna Holm");
    await userEvent.type(screen.getByLabelText(/^Email/), "anna@example.com");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 60 60 60 60");
    await userEvent.click(screen.getByRole("checkbox", { name: "Social media & content" }));
    await userEvent.type(screen.getByLabelText(/Tell us about your experience/), "Experience text");
    await userEvent.type(screen.getByLabelText(/Why would you like to work with RORUM/), "Why text");
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));
    expect(submitToFormspreeMock).not.toHaveBeenCalled();

    const consent = screen.getByRole("checkbox", { name: /agree to the Privacy policy|read and agree/i });
    await userEvent.click(consent);
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    await screen.findByRole("dialog");
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.get("Consent")).toBe("Yes");
    expect(fd.get("Name")).toBe("Anna Holm");
  });

  it("reopening the modal after a previous successful submission still starts with consent unchecked", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "Done" }));

    await openModal();
    expect(
      (screen.getByRole("checkbox", { name: /agree to the Privacy policy|read and agree/i }) as HTMLInputElement)
        .checked,
    ).toBe(false);
  });
});

describe("WorkWithUsApplicationForm — role-interest multi-select", () => {
  it("allows selecting more than one role", async () => {
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await userEvent.click(screen.getByRole("checkbox", { name: "Social media & content" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Event support / practical help" }));
    expect(screen.getByRole("checkbox", { name: "Social media & content" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Event support / practical help" })).toBeChecked();
  });

  it("'Other' is present and selectable", async () => {
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    const other = screen.getByRole("checkbox", { name: "Other" });
    await userEvent.click(other);
    expect(other).toBeChecked();
  });

  it("submits human-readable role LABELS, never the internal 'roleN' value, in the SAME order the options were rendered", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    // Check out of visual order to prove the payload follows OPTION order, not click order.
    await fillRequiredFields(["Other", "Social media & content", "Event support / practical help"]);
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    await screen.findByRole("dialog");
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.get("Interested in")).toBe("Social media & content, Event support / practical help, Other");
    expect(String(fd.get("Interested in"))).not.toMatch(/role0|role1|role2|role7/);
  });

  it("no duplicate values can be produced — each checkbox contributes its value at most once", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await fillRequiredFields(["Social media & content"]);
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));
    await screen.findByRole("dialog");
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.get("Interested in")).toBe("Social media & content");
  });
});

describe("WorkWithUsApplicationForm — multiline text preservation (hard requirement)", () => {
  it("Experience and skills: single newlines survive unchanged in the actual submitted FormData", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await userEvent.type(screen.getByLabelText(/Full Name/), "Anna Holm");
    await userEvent.type(screen.getByLabelText(/^Email/), "anna@example.com");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 60 60 60 60");
    await userEvent.click(screen.getByRole("checkbox", { name: "Social media & content" }));
    const multiline = "I have worked in hospitality for five years.\nI have experience with customer service.";
    await userEvent.type(screen.getByLabelText(/Tell us about your experience/), multiline);
    await userEvent.type(screen.getByLabelText(/Why would you like to work with RORUM/), "Because I love it.");
    await userEvent.click(screen.getByRole("checkbox", { name: /agree to the Privacy policy|read and agree/i }));
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    await screen.findByRole("dialog");
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.get("Experience")).toBe(multiline);
  });

  it("Experience and skills: blank-line paragraph breaks and bullet-like lines survive unchanged, never collapsed to one line", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await userEvent.type(screen.getByLabelText(/Full Name/), "Anna Holm");
    await userEvent.type(screen.getByLabelText(/^Email/), "anna@example.com");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 60 60 60 60");
    await userEvent.click(screen.getByRole("checkbox", { name: "Social media & content" }));
    const experienceField = screen.getByLabelText(/Tell us about your experience/) as HTMLTextAreaElement;
    // fireEvent bypasses userEvent's per-keystroke typing (which is slow and
    // unnecessary here) and sets the textarea's raw value directly — this is
    // exactly what a browser does when a user types multi-line text, so it's
    // a faithful way to get a realistic multi-paragraph value into the field.
    const multiParagraph =
      "I have worked in hospitality for five years.\nI have experience with customer service.\n\nI can also help with:\n- food preparation\n- event setup\n- social media";
    fireEvent.change(experienceField, { target: { value: multiParagraph } });
    await userEvent.type(screen.getByLabelText(/Why would you like to work with RORUM/), "Because I love it.");
    await userEvent.click(screen.getByRole("checkbox", { name: /agree to the Privacy policy|read and agree/i }));
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    await screen.findByRole("dialog");
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    // Exact equality — proves nothing was collapsed, joined, flattened, or
    // JSON/HTML-encoded. Only an outer .trim() would ever be acceptable, and
    // this string has no leading/trailing whitespace to trim in the first
    // place, so exact equality is the correct assertion.
    expect(fd.get("Experience")).toBe(multiParagraph);
    const value = String(fd.get("Experience"));
    expect(value.split("\n")).toHaveLength(7);
    expect(value).toContain("\n\n");
    expect(value).not.toMatch(/ {2,}/);
  });

  it("Why RORUM: newlines and paragraph breaks also survive unchanged", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await userEvent.type(screen.getByLabelText(/Full Name/), "Anna Holm");
    await userEvent.type(screen.getByLabelText(/^Email/), "anna@example.com");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 60 60 60 60");
    await userEvent.click(screen.getByRole("checkbox", { name: "Social media & content" }));
    await userEvent.type(screen.getByLabelText(/Tell us about your experience/), "Experience text");
    const whyField = screen.getByLabelText(/Why would you like to work with RORUM/) as HTMLTextAreaElement;
    const whyMultiline = "RORUM's community focus resonates with me.\n\nI'd like to contribute my skills.";
    fireEvent.change(whyField, { target: { value: whyMultiline } });
    await userEvent.click(screen.getByRole("checkbox", { name: /agree to the Privacy policy|read and agree/i }));
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    await screen.findByRole("dialog");
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.get("Why RoRUM?")).toBe(whyMultiline);
  });

  it("outer whitespace on the raw field is untouched (the app never trims the submitted value itself — only validation reads a local trimmed copy)", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await userEvent.type(screen.getByLabelText(/Full Name/), "Anna Holm");
    await userEvent.type(screen.getByLabelText(/^Email/), "anna@example.com");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 60 60 60 60");
    await userEvent.click(screen.getByRole("checkbox", { name: "Social media & content" }));
    const experienceField = screen.getByLabelText(/Tell us about your experience/) as HTMLTextAreaElement;
    fireEvent.change(experienceField, { target: { value: "  Padded on both sides.  " } });
    await userEvent.type(screen.getByLabelText(/Why would you like to work with RORUM/), "Why text");
    await userEvent.click(screen.getByRole("checkbox", { name: /agree to the Privacy policy|read and agree/i }));
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    await screen.findByRole("dialog");
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    // The component's own validation never calls formData.set(...) to
    // rewrite this field — whatever the textarea produced is exactly what
    // ships. (Field-level outer trimming, if the owner wants it, is a
    // Formspree/display concern, not something this test mandates either
    // way — it only proves the app itself doesn't mutate the value.)
    expect(fd.get("Experience")).toBe("  Padded on both sides.  ");
  });
});

describe("WorkWithUsApplicationForm — success / error / resubmission", () => {
  it("a successful submit shows the shared success content IN PLACE — no second/nested dialog — and carries the standardized Work With Us metadata (subject unchanged from before)", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    const dialogs = await screen.findAllByRole("dialog");
    expect(dialogs).toHaveLength(1);
    const dialog = dialogs[0]!;
    expect(within(dialog).getByText(content.modalTitleSent)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Full Name/)).not.toBeInTheDocument();

    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    // Exactly one subject field — Formspree's own documented `subject`,
    // never the legacy `_subject`.
    expect(fd.get("subject")).toBe("[RoRUM] Work With Us — Anna Holm");
    expect(fd.has("_subject")).toBe(false);
    expect(fd.has("form_name")).toBe(false);
    expect(fd.has("locale")).toBe(false);
    // Human-readable, grouped "Submission details" instead.
    expect(fd.get("Language")).toBe("Ukrainian");
    expect(fd.get("Consent")).toBe("Yes");
    expect(typeof fd.get("Submitted")).toBe("string");
    expect(String(fd.get("Submitted")).length).toBeGreaterThan(0);
    // Reply-To still works: `email` is Formspree's OWN documented trigger
    // field, so it's deliberately never relabeled (no `_replyto` needed/sent).
    expect(fd.get("email")).toBe("anna@example.com");
    expect(fd.has("_replyto")).toBe(false);
    // Main application content, human-readable, all present — NOTE: this
    // deliberately does NOT assert a specific key ORDER. Verified against a
    // real Formspree Free-plan account, the notification email/dashboard
    // renders fields ALPHABETICALLY regardless of FormData order, so
    // FormData order isn't part of the actual contract — see lib/formspree.ts.
    expect(fd.get("Name")).toBe("Anna Holm");
    expect(fd.get("email")).toBe("anna@example.com");
    expect(fd.get("Phone")).toBe("+45 60 60 60 60");
    expect(fd.get("Interested in")).toBe("Social media & content");
    expect(fd.get("Experience")).toBe("Five years in hospitality.");
    expect(fd.get("Why RoRUM?")).toBe("I love the community.");
    expect(fd.has("privacyConsent")).toBe(false);
    expect(fd.has("roleInterest")).toBe(false);
    expect(fd.has("whyRorum")).toBe(false);
  });

  it("a failed submit shows the inline error (role=alert), no success, and preserves every typed value", async () => {
    submitToFormspreeMock.mockRejectedValue(new Error("FORMSPREE_SUBMISSION_FAILED"));
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    expect(await screen.findByText(content.errorMessage)).toHaveAttribute("role", "alert");
    expect(screen.queryByText(content.modalTitleSent)).not.toBeInTheDocument();
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe("Anna Holm");
    expect((screen.getByLabelText(/Tell us about your experience/) as HTMLTextAreaElement).value).toBe(
      "Five years in hospitality.",
    );
  });

  it("no endpoint configured: localized 'not set up' notice, no success", async () => {
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));
    expect(await screen.findByText(/isn't fully set up yet/i)).toBeInTheDocument();
    expect(screen.queryByText(content.modalTitleSent)).not.toBeInTheDocument();
  });

  it("double submit in flight only calls the delivery helper once", async () => {
    let resolve: () => void = () => {};
    submitToFormspreeMock.mockImplementation(() => new Promise<void>((r) => { resolve = r; }));
    const { container } = render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await fillRequiredFields();
    const form = container.querySelector("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    resolve();
    await screen.findByRole("dialog");
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(1);
  });

  it("Done closes the whole modal and returns focus to the trigger; reopening shows a fresh form, not the previous success state", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));
    await screen.findByRole("dialog");

    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /Apply now/i })).toHaveFocus());

    await openModal();
    expect(await screen.findByLabelText(/Full Name/)).toHaveValue("");
    expect(screen.queryByText(content.modalTitleSent)).not.toBeInTheDocument();
  });

  it("resubmission after Done actually works (form fully unmounts/remounts fresh, so no stale 'already sent' guard)", { timeout: 15000 }, async () => {
    // Two full open->fill->submit cycles — the heaviest test in this file;
    // the explicit timeout avoids flaking under full-suite parallel load
    // (it's comfortably under the default 5s when run in isolation).
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<WorkWithUsApplicationButton content={content} roleOptions={roleOptions} />);
    await openModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "Done" }));

    await openModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));
    await screen.findByRole("dialog");
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(2);
  });
});
