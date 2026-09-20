// Component-level tests for the booking form's package selector and
// Additional Services checkboxes — proving both now read from the caller-
// supplied `packageOptions`/`serviceOptions` (the same canonical,
// Sanity-backed arrays app/[locale]/(site)/host-at-rorum/page.tsx builds
// from `packagesSection.items`/`inquiryForm.items`) rather than the old
// hardcoded, English-only `bookingPackageOptions`/`bookingServiceOptions`
// arrays, and that the submitted VALUE is always the stable identifier —
// never the (renameable, localized) label.
import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/uk/host-at-rorum" }));

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

import { InquiryForm } from "./InquiryForm";

beforeEach(() => {
  submitToFormspreeMock.mockReset();
  submitToFormspreeMock.mockRejectedValue(new Error("FORMSPREE_NOT_CONFIGURED"));
});
afterEach(() => cleanup());

describe("InquiryForm (booking) — package selector reads the canonical, Sanity-backed packageOptions", () => {
  it("renders each supplied package option with its own stable value distinct from its label", () => {
    render(
      <InquiryForm
        type="booking"
        title="Apply to Host"
        packageOptions={[
          { value: "package0", label: "Morning session" },
          { value: "package1", label: "Afternoon session" },
        ]}
      />,
    );
    const morning = screen.getByRole("option", { name: "Morning session" }) as HTMLOptionElement;
    expect(morning.value).toBe("package0");
    const afternoon = screen.getByRole("option", { name: "Afternoon session" }) as HTMLOptionElement;
    expect(afternoon.value).toBe("package1");
  });

  it("renaming a package's label (same value) still submits the same stable value — the label is display-only", () => {
    const { rerender } = render(
      <InquiryForm type="booking" title="Apply to Host" packageOptions={[{ value: "package0", label: "Morning session" }]} />,
    );
    expect((screen.getByRole("option", { name: "Morning session" }) as HTMLOptionElement).value).toBe("package0");

    rerender(<InquiryForm type="booking" title="Apply to Host" packageOptions={[{ value: "package0", label: "Formiddagssession" }]} />);
    expect((screen.getByRole("option", { name: "Formiddagssession" }) as HTMLOptionElement).value).toBe("package0");
  });

  it("a package removed from the supplied options no longer renders, even though it used to", () => {
    const { rerender } = render(
      <InquiryForm
        type="booking"
        title="Apply to Host"
        packageOptions={[
          { value: "package0", label: "Morning session" },
          { value: "package1", label: "Afternoon session" },
        ]}
      />,
    );
    expect(screen.getByRole("option", { name: "Afternoon session" })).toBeInTheDocument();

    rerender(<InquiryForm type="booking" title="Apply to Host" packageOptions={[{ value: "package0", label: "Morning session" }]} />);
    expect(screen.queryByRole("option", { name: "Afternoon session" })).not.toBeInTheDocument();
  });

  it("always includes a 'Not sure yet' option in addition to the supplied packages", () => {
    render(<InquiryForm type="booking" title="Apply to Host" packageOptions={[{ value: "package0", label: "Morning session" }]} />);
    expect(screen.getByRole("option", { name: "Not sure yet" })).toBeInTheDocument();
  });

  it("falls back to the built-in package options when none are supplied (Sanity unavailable)", () => {
    render(<InquiryForm type="booking" title="Apply to Host" />);
    expect(screen.getByRole("option", { name: "Morning session" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Afternoon session" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Full day session" })).toBeInTheDocument();
  });
});

describe("InquiryForm (booking) — Additional Services checkboxes read the canonical, localized serviceOptions", () => {
  it("renders each supplied service with its own label and stable checkbox value", () => {
    render(
      <InquiryForm
        type="booking"
        title="Apply to Host"
        serviceOptions={[
          { value: "service0", label: "Morgenmad" },
          { value: "service1", label: "Snacks" },
        ]}
      />,
    );
    const breakfast = screen.getByRole("checkbox", { name: "Morgenmad" }) as HTMLInputElement;
    expect(breakfast.value).toBe("service0");
    const snacks = screen.getByRole("checkbox", { name: "Snacks" }) as HTMLInputElement;
    expect(snacks.value).toBe("service1");
  });

  it("a hidden/removed service option disappears from the form", () => {
    const { rerender } = render(
      <InquiryForm
        type="booking"
        title="Apply to Host"
        serviceOptions={[
          { value: "service0", label: "Breakfast" },
          { value: "service1", label: "Snacks" },
        ]}
      />,
    );
    expect(screen.getByRole("checkbox", { name: "Snacks" })).toBeInTheDocument();

    rerender(<InquiryForm type="booking" title="Apply to Host" serviceOptions={[{ value: "service0", label: "Breakfast" }]} />);
    expect(screen.queryByRole("checkbox", { name: "Snacks" })).not.toBeInTheDocument();
  });

  it("renaming a service's label preserves its stable submitted value", () => {
    const { rerender } = render(
      <InquiryForm type="booking" title="Apply to Host" serviceOptions={[{ value: "service0", label: "Breakfast" }]} />,
    );
    expect((screen.getByRole("checkbox", { name: "Breakfast" }) as HTMLInputElement).value).toBe("service0");

    rerender(<InquiryForm type="booking" title="Apply to Host" serviceOptions={[{ value: "service0", label: "Сніданок" }]} />);
    expect((screen.getByRole("checkbox", { name: "Сніданок" }) as HTMLInputElement).value).toBe("service0");
  });

  it("falls back to the built-in service options when none are supplied", () => {
    render(<InquiryForm type="booking" title="Apply to Host" />);
    expect(screen.getByRole("checkbox", { name: "Breakfast" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Coffee setup" })).toBeInTheDocument();
  });
});

// --- Unified Formspree delivery (Task 4) ------------------------------------

async function fillBooking() {
  await userEvent.type(screen.getByLabelText(/Full Name/), "Jane Doe");
  await userEvent.type(screen.getByLabelText(/Phone number/), "+45 12 34 56 78");
  await userEvent.type(screen.getByLabelText(/^Email/), "jane@example.com");
  // Package is optional (Phase 7); Event date is required.
  await userEvent.selectOptions(screen.getByLabelText(/Package/), "package0");
  await userEvent.type(screen.getByLabelText(/Event date/), "2099-01-01");
  await userEvent.type(screen.getByLabelText(/Comment/), "A quiet morning meeting");
  // Privacy consent is mandatory on every form, booking included (a real bug
  // once let this form through without it — see the dedicated describe
  // block below) — this helper must check it so every OTHER booking test
  // still exercises a genuinely valid, deliverable submission.
  const consent = screen.getByRole("checkbox", { name: /read and agree|agree to the Privacy policy/i }) as HTMLInputElement;
  if (!consent.checked) await userEvent.click(consent);
}

// See ContactForm.test.tsx's fillValidContactForm() for why every field is
// `.clear()`ed first — makes this helper safe to call twice in the same
// test (fill → submit → success → Done → fill again) after the shared
// hook's native `form.reset()`, which userEvent doesn't otherwise notice.
async function fillDecoration() {
  const name = screen.getByLabelText(/Full Name/);
  await userEvent.clear(name);
  await userEvent.type(name, "Erik Vestergaard");
  const phone = screen.getByLabelText(/Phone number/);
  await userEvent.clear(phone);
  await userEvent.type(phone, "+45 98 76 54 32");
  const email = screen.getByLabelText(/^Email/);
  await userEvent.clear(email);
  await userEvent.type(email, "erik@example.com");
  const eventDate = screen.getByLabelText(/Event date/);
  await userEvent.clear(eventDate);
  await userEvent.type(eventDate, "2099-01-01");
  const message = screen.getByLabelText(/Message/);
  await userEvent.clear(message);
  await userEvent.type(message, "Florals and candles for 20 guests");
  const consent = screen.getByRole("checkbox") as HTMLInputElement;
  if (!consent.checked) await userEvent.click(consent);
}

describe("InquiryForm — unified Formspree delivery", () => {
  it("booking: submits through submitToFormspree with the Host at RORUM form_name + standardized subject + locale, shows an accessible success MODAL (not an inline banner), and NO fake setTimeout", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(
      <InquiryForm
        type="booking"
        title="Apply to Host"
        successMessage="Host request received!"
        packageOptions={[{ value: "package0", label: "Morning session" }]}
      />,
    );
    await fillBooking();
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Host request received!")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(1);
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.has("form_name")).toBe(false);
    expect(fd.get("subject")).toBe("[RoRUM] Host at RORUM inquiry — Jane Doe");
    expect(fd.has("_subject")).toBe(false);
    expect(fd.has("locale")).toBe(false);
    expect(fd.get("Language")).toBe("Ukrainian");
    // Payload quality: the submitted value is the visible LABEL shown in the
    // <option>, never the internal "package0" id — see lib/formspree.ts's
    // resolveOptionLabel().
    expect(fd.get("Package")).toBe("Morning session");
    expect(fd.get("Name")).toBe("Jane Doe");
    // Regression guard: this form once let a submission through with NO
    // consent check at all (see the dedicated "requires privacy consent"
    // describe block below) — a genuinely valid submission must record it.
    expect(fd.get("Consent")).toBe("Yes");
  });

  it("decoration: uses the Event Decoration subject, and shows the accessible success modal", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<InquiryForm type="decoration" title="Plan your decoration" successMessage="Decoration request received!" />);
    await fillDecoration();
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Decoration request received!")).toBeInTheDocument();
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.has("form_name")).toBe(false);
    expect(fd.get("subject")).toBe("[RoRUM] Event Decoration inquiry — Erik Vestergaard");
    expect(fd.has("_subject")).toBe(false);
    expect(fd.get("Consent")).toBe("Yes");
  });

  it("decoration: Done closes the success modal, returns focus to the submit button, and the form can be submitted again", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<InquiryForm type="decoration" title="Plan your decoration" successMessage="Decoration request received!" />);
    await fillDecoration();
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));
    await screen.findByRole("dialog");

    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /Send inquiry/i })).toHaveFocus());

    await fillDecoration();
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(2);
  });

  it("decoration: a failed submit shows the localized generic error (not just the booking branch), no success, input kept", async () => {
    submitToFormspreeMock.mockRejectedValue(new Error("FORMSPREE_SUBMISSION_FAILED"));
    render(<InquiryForm type="decoration" title="Plan your decoration" successMessage="Decoration request received!" />);
    await fillDecoration();
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Something went wrong sending/i);
    expect(screen.queryByText("Decoration request received!")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe("Erik Vestergaard");
    expect((screen.getByLabelText(/Message/) as HTMLTextAreaElement).value).toBe("Florals and candles for 20 guests");
  });

  it("decoration: with no endpoint configured, shows the localized 'not set up' notice, makes no network call, shows no success", async () => {
    // beforeEach default rejects with FORMSPREE_NOT_CONFIGURED (thrown before any fetch)
    render(<InquiryForm type="decoration" title="Plan your decoration" successMessage="Decoration request received!" />);
    await fillDecoration();
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/isn't fully set up yet/i);
    expect(screen.queryByText("Decoration request received!")).not.toBeInTheDocument();
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(1); // the helper is called, but it throws before fetch (see lib/formspree.test.ts)
  });

  it("success resets the form (fields cleared, package select cleared)", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(
      <InquiryForm type="booking" title="Apply to Host" successMessage="ok" packageOptions={[{ value: "package0", label: "Morning session" }]} />,
    );
    await fillBooking();
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));
    await screen.findByText("ok");
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/Package/) as HTMLSelectElement).value).toBe("");
  });

  it("a failed submit shows no success and keeps every typed value", async () => {
    submitToFormspreeMock.mockRejectedValue(new Error("FORMSPREE_SUBMISSION_FAILED"));
    render(
      <InquiryForm type="booking" title="Apply to Host" successMessage="Host request received!" packageOptions={[{ value: "package0", label: "Morning session" }]} />,
    );
    await fillBooking();
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));

    expect(await screen.findByText(/Something went wrong sending/i)).toBeInTheDocument();
    expect(screen.queryByText("Host request received!")).not.toBeInTheDocument();
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe("Jane Doe");
    expect((screen.getByLabelText(/Comment/) as HTMLTextAreaElement).value).toBe("A quiet morning meeting");
  });

  it("with no endpoint configured: shows the localized 'not set up' notice, no success, no reset", async () => {
    // beforeEach default rejects with FORMSPREE_NOT_CONFIGURED
    render(
      <InquiryForm type="booking" title="Apply to Host" successMessage="Host request received!" packageOptions={[{ value: "package0", label: "Morning session" }]} />,
    );
    await fillBooking();
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));

    expect(await screen.findByText(/isn't fully set up yet/i)).toBeInTheDocument();
    expect(screen.queryByText("Host request received!")).not.toBeInTheDocument();
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe("Jane Doe");
  });

  it("does not double-submit when the form is submitted twice in flight", async () => {
    let resolve: () => void = () => {};
    submitToFormspreeMock.mockImplementation(() => new Promise<void>((r) => { resolve = r; }));
    const { container } = render(
      <InquiryForm type="booking" title="Apply to Host" successMessage="ok" packageOptions={[{ value: "package0", label: "Morning session" }]} />,
    );
    await fillBooking();
    const form = container.querySelector("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    resolve();
    expect(await screen.findByText("ok")).toBeInTheDocument();
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(1);
  });
});

// --- Privacy consent is mandatory — regression coverage for the bug where
// the booking (Host at RORUM) variant let a submission through with NO
// consent check at all: `PrivacyConsent required={false}` + no
// `validatePrivacyConsent()` call. Both the component's own validation AND
// the shared `useFormspreeSubmit` hook's centralized guard are covered here,
// for both InquiryForm variants (booking and decoration/default). ------------

describe("InquiryForm — privacy consent is mandatory (no exceptions)", () => {
  it("booking: blocks submission when consent is unchecked — no Formspree call, no success dialog, localized error, input preserved", async () => {
    render(
      <InquiryForm
        type="booking"
        title="Apply to Host"
        successMessage="Host request received!"
        packageOptions={[{ value: "package0", label: "Morning session" }]}
      />,
    );
    await userEvent.type(screen.getByLabelText(/Full Name/), "Jane Doe");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 12 34 56 78");
    await userEvent.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/Event date/), "2099-01-01");
    await userEvent.type(screen.getByLabelText(/Comment/), "A quiet morning meeting");
    // Deliberately left unchecked.
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));

    expect(await screen.findByText(/agree to the Privacy policy/i)).toBeInTheDocument();
    expect(submitToFormspreeMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe("Jane Doe");
    expect((screen.getByLabelText(/Comment/) as HTMLTextAreaElement).value).toBe("A quiet morning meeting");
  });

  it("booking: the consent checkbox is unchecked by default and is keyboard-accessible (Space toggles it)", async () => {
    render(<InquiryForm type="booking" title="Apply to Host" packageOptions={[{ value: "package0", label: "Morning session" }]} />);
    const consent = screen.getByRole("checkbox", { name: /read and agree|agree to the Privacy policy/i }) as HTMLInputElement;
    expect(consent.checked).toBe(false);
    consent.focus();
    await userEvent.keyboard(" ");
    expect(consent.checked).toBe(true);
  });

  it("booking: submitting via keyboard (Enter) without consent is blocked exactly like a mouse click", async () => {
    render(
      <InquiryForm
        type="booking"
        title="Apply to Host"
        packageOptions={[{ value: "package0", label: "Morning session" }]}
      />,
    );
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 12 34 56 78");
    await userEvent.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/Event date/), "2099-01-01");
    await userEvent.type(screen.getByLabelText(/Comment/), "A quiet morning meeting");
    // Enter inside a single-line <input> implicitly submits the form (unlike
    // inside the Comment <textarea>, which would just insert a newline) —
    // this is the keyboard-only submission path the task asked to cover.
    await userEvent.type(screen.getByLabelText(/Full Name/), "Jane Doe{Enter}");

    expect(await screen.findByText(/agree to the Privacy policy/i)).toBeInTheDocument();
    expect(submitToFormspreeMock).not.toHaveBeenCalled();
  });

  it("booking: checking consent AFTER a blocked attempt allows submission without re-entering anything else", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(
      <InquiryForm
        type="booking"
        title="Apply to Host"
        successMessage="Host request received!"
        packageOptions={[{ value: "package0", label: "Morning session" }]}
      />,
    );
    await userEvent.type(screen.getByLabelText(/Full Name/), "Jane Doe");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 12 34 56 78");
    await userEvent.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/Event date/), "2099-01-01");
    await userEvent.type(screen.getByLabelText(/Comment/), "A quiet morning meeting");
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));
    expect(submitToFormspreeMock).not.toHaveBeenCalled();

    const consent = screen.getByRole("checkbox", { name: /read and agree|agree to the Privacy policy/i });
    await userEvent.click(consent);
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Host request received!")).toBeInTheDocument();
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.get("Name")).toBe("Jane Doe");
    expect(fd.get("Consent")).toBe("Yes");
  });

  it("decoration: blocks submission when consent is unchecked — no Formspree call, no success dialog, localized error, input preserved", async () => {
    render(<InquiryForm type="decoration" title="Plan your decoration" successMessage="Decoration request received!" />);
    await userEvent.type(screen.getByLabelText(/Full Name/), "Erik Vestergaard");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 98 76 54 32");
    await userEvent.type(screen.getByLabelText(/^Email/), "erik@example.com");
    await userEvent.type(screen.getByLabelText(/Event date/), "2099-01-01");
    await userEvent.type(screen.getByLabelText(/Message/), "Florals and candles for 20 guests");
    // Deliberately left unchecked.
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));

    expect(await screen.findByText(/agree to the Privacy policy/i)).toBeInTheDocument();
    expect(submitToFormspreeMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe("Erik Vestergaard");
  });

  it("decoration: the consent checkbox is unchecked by default", async () => {
    render(<InquiryForm type="decoration" title="Plan your decoration" />);
    const consent = screen.getByRole("checkbox", { name: /read and agree|agree to the Privacy policy/i }) as HTMLInputElement;
    expect(consent.checked).toBe(false);
  });

  it("the Privacy Policy link inside the consent copy is present and opens the policy (both InquiryForm variants)", async () => {
    for (const type of ["booking", "decoration"] as const) {
      cleanup();
      render(<InquiryForm type={type} title="Test" packageOptions={[{ value: "package0", label: "Morning session" }]} />);
      const policyButton = screen.getByRole("button", { name: /Privacy policy/i });
      expect(policyButton).toBeInTheDocument();
      await userEvent.click(policyButton);
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    }
  });
});

// --- Payload quality: submitted package/service values are LABELS, never
// internal ids (the bug this task fixes) -----------------------------------

async function fillBookingRequired() {
  await userEvent.type(screen.getByLabelText(/Full Name/), "Jane Doe");
  await userEvent.type(screen.getByLabelText(/Phone number/), "+45 12 34 56 78");
  await userEvent.type(screen.getByLabelText(/^Email/), "jane@example.com");
  await userEvent.type(screen.getByLabelText(/Event date/), "2099-01-01");
  await userEvent.type(screen.getByLabelText(/Comment/), "A quiet morning meeting");
  const consent = screen.getByRole("checkbox", { name: /read and agree|agree to the Privacy policy/i }) as HTMLInputElement;
  if (!consent.checked) await userEvent.click(consent);
}

describe.each([
  {
    localeLabel: "EN-like",
    packageOptions: [
      { value: "package0", label: "Morning session" },
      { value: "package1", label: "Afternoon session" },
    ],
    serviceOptions: [
      { value: "service0", label: "Breakfast" },
      { value: "service1", label: "Snacks" },
      { value: "service2", label: "Lunch" },
    ],
    chosenPackageLabel: "Afternoon session",
    checkedServiceLabels: ["Breakfast", "Lunch"],
    expectedServicesJoined: "Breakfast, Lunch",
  },
  {
    localeLabel: "DA/UK-like",
    packageOptions: [
      { value: "package0", label: "Morgensession" },
      { value: "package1", label: "Eftermiddagssession" },
    ],
    serviceOptions: [
      { value: "service0", label: "Morgenmad" },
      { value: "service1", label: "Snacks" },
      { value: "service2", label: "Frokost" },
    ],
    chosenPackageLabel: "Eftermiddagssession",
    checkedServiceLabels: ["Morgenmad", "Frokost"],
    expectedServicesJoined: "Morgenmad, Frokost",
  },
])(
  "InquiryForm (booking) — payload quality ($localeLabel labels)",
  ({ packageOptions, serviceOptions, chosenPackageLabel, checkedServiceLabels, expectedServicesJoined }) => {
    it("sends the visible package LABEL and comma-joined service LABELS, never raw ids", async () => {
      submitToFormspreeMock.mockResolvedValue(undefined);
      render(
        <InquiryForm
          type="booking"
          title="Apply to Host"
          successMessage="ok"
          packageOptions={packageOptions}
          serviceOptions={serviceOptions}
        />,
      );
      await fillBookingRequired();
      await userEvent.selectOptions(screen.getByLabelText(/Package/), chosenPackageLabel);
      for (const label of checkedServiceLabels) {
        await userEvent.click(screen.getByRole("checkbox", { name: label }));
      }
      await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));
      await screen.findByText("ok");

      const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
      expect(fd.get("Package")).toBe(chosenPackageLabel);
      expect(fd.get("Additional Services")).toBe(expectedServicesJoined);
      // Raw internal option ids must never leak into the payload.
      for (const option of [...packageOptions, ...serviceOptions]) {
        expect(fd.get("Package")).not.toBe(option.value);
        expect(String(fd.get("Additional Services"))).not.toContain(option.value);
      }
      // Unaffected metadata still present and correct.
      expect(fd.has("form_name")).toBe(false);
      expect(fd.get("Language")).toBe("Ukrainian");
      expect(typeof fd.get("Page")).toBe("string");
    });
  },
);

describe("InquiryForm (booking) — payload quality: optional fields omitted when empty", () => {
  it("an unselected package and zero checked services produce NO package/additionalServices entries at all", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(
      <InquiryForm
        type="booking"
        title="Apply to Host"
        successMessage="ok"
        packageOptions={[{ value: "package0", label: "Morning session" }]}
        serviceOptions={[{ value: "service0", label: "Breakfast" }]}
      />,
    );
    await fillBookingRequired();
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));
    await screen.findByText("ok");

    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.has("package")).toBe(false);
    expect(fd.has("additionalServices")).toBe(false);
  });
});
