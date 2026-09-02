// Component-level tests for the booking form's package selector and
// Additional Services checkboxes — proving both now read from the caller-
// supplied `packageOptions`/`serviceOptions` (the same canonical,
// Sanity-backed arrays app/[locale]/(site)/host-at-rorum/page.tsx builds
// from `packagesSection.items`/`inquiryForm.items`) rather than the old
// hardcoded, English-only `bookingPackageOptions`/`bookingServiceOptions`
// arrays, and that the submitted VALUE is always the stable identifier —
// never the (renameable, localized) label.
import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  await userEvent.selectOptions(screen.getByLabelText(/Package/), "package0");
  await userEvent.type(screen.getByLabelText(/Comment/), "A quiet morning meeting");
}

async function fillDecoration() {
  await userEvent.type(screen.getByLabelText(/Full Name/), "Erik Vestergaard");
  await userEvent.type(screen.getByLabelText(/Phone number/), "+45 98 76 54 32");
  await userEvent.type(screen.getByLabelText(/^Email/), "erik@example.com");
  await userEvent.type(screen.getByLabelText(/Event date/), "2099-01-01");
  await userEvent.type(screen.getByLabelText(/Message/), "Florals and candles for 20 guests");
  await userEvent.click(screen.getByRole("checkbox"));
}

describe("InquiryForm — unified Formspree delivery", () => {
  it("booking: submits through submitToFormspree with the Host at RORUM form_name + standardized subject + locale, and NO fake setTimeout", async () => {
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

    expect(await screen.findByText("Host request received!")).toBeInTheDocument();
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(1);
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.get("form_name")).toBe("Host at RORUM inquiry");
    expect(fd.get("subject")).toBe("[RoRUM] Host at RORUM inquiry — Jane Doe");
    expect(fd.get("_subject")).toBe("[RoRUM] Host at RORUM inquiry — Jane Doe");
    expect(fd.get("locale")).toBe("uk");
    expect(fd.get("package")).toBe("package0");
    expect(fd.get("name")).toBe("Jane Doe");
  });

  it("decoration: uses the Event Decoration form_name + subject", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<InquiryForm type="decoration" title="Plan your decoration" successMessage="Decoration request received!" />);
    await fillDecoration();
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));

    expect(await screen.findByText("Decoration request received!")).toBeInTheDocument();
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.get("form_name")).toBe("Event Decoration inquiry");
    expect(fd.get("subject")).toBe("[RoRUM] Event Decoration inquiry — Erik Vestergaard");
  });

  it("decoration: a failed submit shows the localized generic error (not just the booking branch), no success, input kept", async () => {
    submitToFormspreeMock.mockRejectedValue(new Error("FORMSPREE_SUBMISSION_FAILED"));
    render(<InquiryForm type="decoration" title="Plan your decoration" successMessage="Decoration request received!" />);
    await fillDecoration();
    await userEvent.click(screen.getByRole("button", { name: /Send inquiry/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Something went wrong sending/i);
    expect(screen.queryByText("Decoration request received!")).not.toBeInTheDocument();
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
