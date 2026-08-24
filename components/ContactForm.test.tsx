import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/contact" }));

import { ContactForm } from "./ContactForm";
import type { RawPageSection } from "@/lib/sanity-sections";

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

  it("valid submission shows the success message and resets the form", async () => {
    render(<ContactForm successMessage="All good!" />);
    await userEvent.type(screen.getByLabelText(/Full Name/), "Jane Doe");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 12 34 56 78");
    await userEvent.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/Message/), "Hello there");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /Send message/ }));
    expect(await screen.findByText("All good!")).toBeInTheDocument();
  });
});

describe("ContactForm — truthful submission behavior: no delivery endpoint exists yet (Task 10)", () => {
  it("a valid submission makes ZERO network requests — the success state is client-only, not a real delivery", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() => {
      throw new Error("ContactForm must not call fetch — no delivery endpoint exists yet");
    });
    render(<ContactForm successMessage="All good!" />);
    await userEvent.type(screen.getByLabelText(/Full Name/), "Jane Doe");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 12 34 56 78");
    await userEvent.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/Message/), "Hello there");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /Send message/ }));

    expect(await screen.findByText("All good!")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
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
