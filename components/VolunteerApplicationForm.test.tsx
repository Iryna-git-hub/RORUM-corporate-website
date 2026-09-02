import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/da/volunteer" }));

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

import { VolunteerApplicationButton } from "./VolunteerApplicationForm";

beforeEach(() => {
  submitToFormspreeMock.mockReset();
  submitToFormspreeMock.mockRejectedValue(new Error("FORMSPREE_NOT_CONFIGURED"));
});
afterEach(() => cleanup());

async function openAndFill() {
  await userEvent.click(screen.getByRole("button", { name: /Apply to volunteer/i }));
  await userEvent.type(screen.getByLabelText(/Full Name/), "Mette Larsen");
  await userEvent.type(screen.getByLabelText(/Phone number/), "+45 11 22 33 44");
  await userEvent.type(screen.getByLabelText(/^Email/), "mette@example.com");
  await userEvent.type(screen.getByLabelText(/Message/), "I'd love to help at events");
  await userEvent.click(screen.getByRole("checkbox"));
}

describe("VolunteerApplicationForm — unified Formspree delivery", () => {
  it("submits through the shared helper with the Volunteer form_name + standardized English subject + locale", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<VolunteerApplicationButton content={{ modalTitle: "Volunteer", messagePlaceholder: "", successMessage: "Application sent!", errorMessage: "err" }} />);
    await openAndFill();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    expect(await screen.findByText("Application sent!")).toBeInTheDocument();
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(1);
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.get("form_name")).toBe("Volunteer application");
    expect(fd.get("subject")).toBe("[RoRUM] Volunteer application — Mette Larsen");
    expect(fd.get("_subject")).toBe("[RoRUM] Volunteer application — Mette Larsen");
    expect(fd.get("locale")).toBe("da");
    expect(fd.get("name")).toBe("Mette Larsen");
    expect(fd.get("email")).toBe("mette@example.com");
    expect(fd.get("message")).toBe("I'd love to help at events");
  });

  it("a failed submit shows no success and preserves the typed values", async () => {
    submitToFormspreeMock.mockRejectedValue(new Error("FORMSPREE_SUBMISSION_FAILED"));
    render(<VolunteerApplicationButton content={{ modalTitle: "V", messagePlaceholder: "", successMessage: "Application sent!", errorMessage: "Could not send your application." }} />);
    await openAndFill();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    expect(await screen.findByText("Could not send your application.")).toBeInTheDocument();
    expect(screen.queryByText("Application sent!")).not.toBeInTheDocument();
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe("Mette Larsen");
  });

  it("no endpoint configured: shows the localized 'not set up' notice, never a success", async () => {
    render(<VolunteerApplicationButton content={{ modalTitle: "V", messagePlaceholder: "", successMessage: "Application sent!", errorMessage: "err" }} />);
    await openAndFill();
    await userEvent.click(screen.getByRole("button", { name: /Send Application/i }));

    expect(await screen.findByText(/isn't fully set up yet/i)).toBeInTheDocument();
    expect(screen.queryByText("Application sent!")).not.toBeInTheDocument();
  });

  it("double submit in flight only calls the delivery helper once", async () => {
    let resolve: () => void = () => {};
    submitToFormspreeMock.mockImplementation(() => new Promise<void>((r) => { resolve = r; }));
    const { container } = render(<VolunteerApplicationButton content={{ modalTitle: "V", messagePlaceholder: "", successMessage: "ok", errorMessage: "err" }} />);
    await openAndFill();
    const form = container.querySelector("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    resolve();
    expect(await screen.findByText("ok")).toBeInTheDocument();
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(1);
  });
});
