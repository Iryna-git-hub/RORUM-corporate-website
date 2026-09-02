import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/da/contact" }));

// Mock ONLY the network boundary (`submitToFormspree`). The real
// `applyFormspreeMetadata` / `RORUM_FORMS` still run, so these tests exercise
// the whole chain — subject + form_name construction included. Default: behave
// like the currently-unconfigured helper (reject before any network call).
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

import { ContactForm } from "./ContactForm";
import type { RawPageSection } from "@/lib/sanity-sections";

beforeEach(() => {
  submitToFormspreeMock.mockReset();
  submitToFormspreeMock.mockRejectedValue(new Error("FORMSPREE_NOT_CONFIGURED"));
});
afterEach(() => cleanup());

function i18n(en: string) {
  return [{ _key: "en", language: "en", value: en }];
}

describe("ContactForm — dynamic field rendering (Task 7/8)", () => {
  it("with no formSection prop, renders the original 4 hardcoded fields (Full Name, Phone number, Email, Message)", () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
  });

  it("with a configured formSection, renders exactly the configured fields, in stored order, with a City field added and Message removed", () => {
    const formSection = {
      _key: "form",
      items: [
        { _key: "field-name", itemKey: "field-name", value: "text", title: i18n("Full Name") },
        { _key: "field-city", itemKey: "field-city", value: "text", title: i18n("City") },
        { _key: "field-email", itemKey: "field-email", value: "email", title: i18n("Email") },
      ],
    } as unknown as RawPageSection;
    render(<ContactForm formSection={formSection} />);
    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Message/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Phone number/)).not.toBeInTheDocument();
  });

  it("a multiline-type field renders as a textarea, others as inputs", () => {
    const formSection = {
      _key: "form",
      items: [{ _key: "field-notes", itemKey: "field-notes", value: "multiline", title: i18n("Notes") }],
    } as unknown as RawPageSection;
    render(<ContactForm formSection={formSection} />);
    expect(screen.getByLabelText(/Notes/).tagName).toBe("TEXTAREA");
  });
});

describe("ContactForm — validation derived from field type", () => {
  it("submitting empty required fields shows a required-field error for each", async () => {
    render(<ContactForm />);
    await userEvent.click(screen.getByRole("button", { name: /Send message/ }));
    expect(await screen.findAllByText(/is required/)).not.toHaveLength(0);
  });

  it("an email-type field rejects an invalid email", async () => {
    const formSection = {
      _key: "form",
      items: [{ _key: "field-email", itemKey: "field-email", value: "email", title: i18n("Email") }],
    } as unknown as RawPageSection;
    render(<ContactForm formSection={formSection} />);
    await userEvent.type(screen.getByLabelText(/^Email/), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: /Send message/ }));
    expect(await screen.findByText(/valid email/)).toBeInTheDocument();
  });

  it("a removed field is never validated — submitting without it produces no error for it", async () => {
    const formSection = {
      _key: "form",
      items: [{ _key: "field-city", itemKey: "field-city", value: "text", title: i18n("City") }],
    } as unknown as RawPageSection;
    render(<ContactForm formSection={formSection} />);
    await userEvent.type(screen.getByLabelText(/City/), "Copenhagen");
    await userEvent.click(screen.getByRole("button", { name: /Send message/ }));
    expect(screen.queryByText(/Email.*is required/)).not.toBeInTheDocument();
  });

});

async function fillValidContactForm() {
  await userEvent.type(screen.getByLabelText(/Full Name/), "Jane Doe");
  await userEvent.type(screen.getByLabelText(/Phone number/), "+45 12 34 56 78");
  await userEvent.type(screen.getByLabelText(/^Email/), "jane@example.com");
  await userEvent.type(screen.getByLabelText(/Message/), "Hello there");
  await userEvent.click(screen.getByRole("checkbox"));
  await userEvent.click(screen.getByRole("button", { name: /Send message/ }));
}

describe("ContactForm — truthful submission behavior: no email delivery is configured (Phase A)", () => {
  it("a valid submission with delivery not configured shows the 'not set up' notice and does NOT show a success state", async () => {
    render(<ContactForm successMessage="All good!" />);
    await fillValidContactForm();

    expect(await screen.findByText("This form isn't fully set up yet — please contact us directly.")).toBeInTheDocument();
    expect(screen.getByText(/isn't fully set up yet/i)).toHaveAttribute("role", "alert");
    expect(screen.queryByText("All good!")).not.toBeInTheDocument();
  });

  it("a failed submit does NOT reset the form — the user keeps their typed text", async () => {
    render(<ContactForm />);
    await fillValidContactForm();
    await screen.findByText(/isn't fully set up yet/i);
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe("Jane Doe");
    expect((screen.getByLabelText(/Message/) as HTMLTextAreaElement).value).toBe("Hello there");
  });

  it("a network/server failure (not 'not configured') shows the generic retry message, never a false success", async () => {
    submitToFormspreeMock.mockRejectedValue(new Error("FORMSPREE_SUBMISSION_FAILED"));
    render(<ContactForm successMessage="All good!" />);
    await fillValidContactForm();
    expect(await screen.findByText("Something went wrong sending your message. Please try again, or contact us directly.")).toBeInTheDocument();
    expect(screen.queryByText(/isn't fully set up yet/i)).not.toBeInTheDocument();
    expect(screen.queryByText("All good!")).not.toBeInTheDocument();
  });

  it("the 'not configured' path specifically shows the 'not set up' notice, not the generic error", async () => {
    // default beforeEach mock already rejects with FORMSPREE_NOT_CONFIGURED
    render(<ContactForm />);
    await fillValidContactForm();
    expect(await screen.findByText(/isn't fully set up yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong sending/i)).not.toBeInTheDocument();
  });
});

describe("ContactForm — real delivery path (Formspree helper mocked)", () => {
  it("when submitToFormspree resolves, the success message shows and the form resets", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<ContactForm successMessage="Delivered!" />);
    await fillValidContactForm();

    expect(await screen.findByText("Delivered!")).toBeInTheDocument();
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe("");
  });

  it("passes the submitted field values + standardized metadata to the shared delivery helper", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<ContactForm />);
    await fillValidContactForm();
    await screen.findByText(/Your message is ready/i);
    const sentData = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(sentData.get("name")).toBe("Jane Doe");
    expect(sentData.get("email")).toBe("jane@example.com");
    expect(sentData.get("message")).toBe("Hello there");
    // Standardized, English, form-type-first, name appended:
    expect(sentData.get("form_name")).toBe("Contact request");
    expect(sentData.get("subject")).toBe("[RoRUM] Contact request — Jane Doe");
    expect(sentData.get("_subject")).toBe("[RoRUM] Contact request — Jane Doe");
    // locale comes from the mocked pathname "/da/contact"
    expect(sentData.get("locale")).toBe("da");
    // the recipient address is never in the payload
    expect([...sentData.keys()]).not.toContain("_replyto");
  });

  it("re-submitting the form while a submit is in flight only calls the delivery helper once (submissionLock, not just the disabled button)", async () => {
    let resolveSubmit: () => void = () => {};
    submitToFormspreeMock.mockImplementation(() => new Promise<void>((r) => { resolveSubmit = r; }));
    const { container } = render(<ContactForm successMessage="Delivered!" />);
    await userEvent.type(screen.getByLabelText(/Full Name/), "Jane Doe");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 12 34 56 78");
    await userEvent.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/Message/), "Hello there");
    await userEvent.click(screen.getByRole("checkbox"));

    const form = container.querySelector("form")!;
    // `fireEvent.submit` bypasses the disabled button entirely — the only
    // thing that can stop the second submission is the `submissionLock` ref.
    fireEvent.submit(form);
    fireEvent.submit(form);
    resolveSubmit();

    expect(await screen.findByText("Delivered!")).toBeInTheDocument();
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(1);
  });
});

describe("ContactForm — Privacy consent shown/required settings (Task 9)", () => {
  it("privacyConsent.shown=false: the checkbox is not rendered at all, and submitting never blocks on it", async () => {
    render(<ContactForm formSection={{ _key: "form", items: [] } as unknown as RawPageSection} privacyConsent={{ shown: false, required: true }} />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("privacyConsent.required=false: submitting without checking it produces no privacy error", async () => {
    const formSection = { _key: "form", items: [{ _key: "field-name", itemKey: "field-name", value: "text", title: i18n("Full Name") }] } as unknown as RawPageSection;
    render(<ContactForm formSection={formSection} privacyConsent={{ shown: true, required: false }} />);
    await userEvent.type(screen.getByLabelText(/Full Name/), "Jane");
    await userEvent.click(screen.getByRole("button", { name: /Send message/ }));
    expect(screen.queryByText(/agree to the Privacy policy/i)).not.toBeInTheDocument();
  });
});

describe("ContactForm — removing exactly one configured field removes only that field (verification round)", () => {
  it("a 4-field config with Email removed renders Name/Phone/Message but not Email, and validation never runs for Email", async () => {
    const formSection = {
      _key: "form",
      items: [
        { _key: "field-name", itemKey: "field-name", value: "text", title: i18n("Full Name") },
        { _key: "field-phone", itemKey: "field-phone", value: "phone", title: i18n("Phone number") },
        { _key: "field-message", itemKey: "field-message", value: "multiline", title: i18n("Message") },
      ],
    } as unknown as RawPageSection;
    render(<ContactForm formSection={formSection} privacyConsent={{ shown: false, required: false }} />);

    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Email/)).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Full Name/), "Jane");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 12 34 56 78");
    await userEvent.type(screen.getByLabelText(/Message/), "Hi");
    await userEvent.click(screen.getByRole("button", { name: /Send message/ }));
    // No leftover "Email is required" error — Email was never part of this
    // config, so it's never validated, only Name/Phone/Message were.
    expect(screen.queryByText(/Email.*required/i)).not.toBeInTheDocument();
  });
});
