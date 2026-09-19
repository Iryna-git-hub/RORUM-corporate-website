import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/catering" }));

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

import { CateringInquiryForm } from "./CateringInquiryForm";

beforeEach(() => {
  submitToFormspreeMock.mockReset();
  submitToFormspreeMock.mockRejectedValue(new Error("FORMSPREE_NOT_CONFIGURED"));
});
afterEach(() => cleanup());

// See ContactForm.test.tsx's fillValidContactForm() for why every field is
// `.clear()`ed first — makes this helper safe to call twice in the same
// test (fill → submit → success → Done → fill again) after the shared
// hook's native `form.reset()`, which userEvent doesn't otherwise notice.
async function fill() {
  const name = screen.getByLabelText(/Full Name/);
  await userEvent.clear(name);
  await userEvent.type(name, "Sofia Berg");
  const phone = screen.getByLabelText(/Phone number/);
  await userEvent.clear(phone);
  await userEvent.type(phone, "+45 55 55 55 55");
  const email = screen.getByLabelText(/^Email/);
  await userEvent.clear(email);
  await userEvent.type(email, "sofia@example.com");
  const eventDate = screen.getByLabelText(/Event date/);
  await userEvent.clear(eventDate);
  await userEvent.type(eventDate, "2099-05-01");
  const message = screen.getByLabelText(/Message/);
  await userEvent.clear(message);
  await userEvent.type(message, "Lunch for 30 people");
  const consent = screen.getByRole("checkbox") as HTMLInputElement;
  if (!consent.checked) await userEvent.click(consent);
}

describe("CateringInquiryForm — unified Formspree delivery", () => {
  it("submits through submitToFormspree with the Catering form_name + standardized subject + fields + locale, and shows an accessible success MODAL (not an inline banner)", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<CateringInquiryForm successMessage="Catering request received!" />);
    await fill();
    await userEvent.click(screen.getByRole("button", { name: /Request Catering/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Catering request received!")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(1);
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.get("form_name")).toBe("Catering inquiry");
    expect(fd.get("subject")).toBe("[RoRUM] Catering inquiry — Sofia Berg");
    expect(fd.get("_subject")).toBe("[RoRUM] Catering inquiry — Sofia Berg");
    expect(fd.get("locale")).toBe("en");
    expect(fd.get("eventDate")).toBe("2099-05-01");
    expect(fd.get("message")).toBe("Lunch for 30 people");
  });

  it("Done closes the success modal, returns focus to the submit button, and the form can be submitted again", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<CateringInquiryForm successMessage="Catering request received!" />);
    await fill();
    await userEvent.click(screen.getByRole("button", { name: /Request Catering/i }));
    await screen.findByRole("dialog");

    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /Request Catering/i })).toHaveFocus());

    await fill();
    await userEvent.click(screen.getByRole("button", { name: /Request Catering/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(2);
  });

  it("does NOT show success or reset before a valid submission is attempted", async () => {
    render(<CateringInquiryForm successMessage="Catering request received!" />);
    await userEvent.click(screen.getByRole("button", { name: /Request Catering/i }));
    expect(screen.queryByText("Catering request received!")).not.toBeInTheDocument();
    expect(await screen.findAllByText(/is required/)).not.toHaveLength(0);
  });

  it("a failed submit: no success, generic localized error, values preserved", async () => {
    submitToFormspreeMock.mockRejectedValue(new Error("FORMSPREE_SUBMISSION_FAILED"));
    render(<CateringInquiryForm successMessage="Catering request received!" />);
    await fill();
    await userEvent.click(screen.getByRole("button", { name: /Request Catering/i }));

    expect(await screen.findByText(/Something went wrong sending/i)).toBeInTheDocument();
    expect(screen.queryByText("Catering request received!")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe("Sofia Berg");
  });

  it("no endpoint configured: localized 'not set up' notice, no success", async () => {
    render(<CateringInquiryForm successMessage="Catering request received!" />);
    await fill();
    await userEvent.click(screen.getByRole("button", { name: /Request Catering/i }));
    expect(await screen.findByText(/isn't fully set up yet/i)).toBeInTheDocument();
    expect(screen.queryByText("Catering request received!")).not.toBeInTheDocument();
  });

  it("double submit in flight only calls the delivery helper once", async () => {
    let resolve: () => void = () => {};
    submitToFormspreeMock.mockImplementation(() => new Promise<void>((r) => { resolve = r; }));
    const { container } = render(<CateringInquiryForm successMessage="ok" />);
    await fill();
    const form = container.querySelector("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    resolve();
    expect(await screen.findByText("ok")).toBeInTheDocument();
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(1);
  });
});
