import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

import { CvUploadButton } from "./CvUploadModal";

beforeEach(() => {
  submitToFormspreeMock.mockReset();
  submitToFormspreeMock.mockRejectedValue(new Error("FORMSPREE_NOT_CONFIGURED"));
});
afterEach(() => cleanup());

const pdf = () => new File(["%PDF-1.4 fake"], "my-resume.pdf", { type: "application/pdf" });

async function openAndFill(file: File = pdf()) {
  await userEvent.click(screen.getByRole("button", { name: /Send your CV/i }));
  await userEvent.type(screen.getByLabelText(/Full Name/), "Anna Holm");
  await userEvent.type(screen.getByLabelText(/^Email/), "anna@example.com");
  await userEvent.type(screen.getByLabelText(/Phone number/), "+45 60 60 60 60");
  await userEvent.upload(screen.getByLabelText(/Upload your CV/i), file);
  await userEvent.type(screen.getByLabelText(/Short message/i), "Interested in collaborating");
  await userEvent.click(screen.getByRole("checkbox"));
}

describe("CvUploadModal (Work With Us) — unified Formspree delivery", () => {
  it("submits through the shared helper with the Work With Us form_name + '[RoRUM] Work With Us application' subject (NOT 'CV application'), the CV file, and locale", async () => {
    submitToFormspreeMock.mockResolvedValue(undefined);
    render(<CvUploadButton content={undefined} />);
    await openAndFill();
    await userEvent.click(screen.getByRole("button", { name: /Submit CV/i }));

    await screen.findByText(/we received your CV/i);
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(1);
    const fd = submitToFormspreeMock.mock.calls[0]![0] as FormData;
    expect(fd.get("form_name")).toBe("Work With Us application");
    expect(fd.get("subject")).toBe("[RoRUM] Work With Us application — Anna Holm");
    expect(fd.get("_subject")).toBe("[RoRUM] Work With Us application — Anna Holm");
    expect(String(fd.get("subject"))).not.toMatch(/CV application/i);
    expect(fd.get("locale")).toBe("uk");
    const cv = fd.get("cv");
    expect(cv).toBeInstanceOf(File);
    expect((cv as File).name).toBe("my-resume.pdf");
    expect((cv as File).type).toBe("application/pdf");
  });

  it("rejects a non-PDF/DOC/DOCX file and never submits it", async () => {
    render(<CvUploadButton content={undefined} />);
    await userEvent.click(screen.getByRole("button", { name: /Send your CV/i }));
    await userEvent.upload(
      screen.getByLabelText(/Upload your CV/i),
      new File(["x"], "photo.png", { type: "image/png" }),
    );
    expect(await screen.findByText(/PDF, DOC, or DOCX/i)).toBeInTheDocument();
    expect(submitToFormspreeMock).not.toHaveBeenCalled();
  });

  it("rejects a file over 10 MB", async () => {
    render(<CvUploadButton content={undefined} />);
    await userEvent.click(screen.getByRole("button", { name: /Send your CV/i }));
    const big = new File([new Uint8Array(11 * 1024 * 1024)], "huge.pdf", { type: "application/pdf" });
    await userEvent.upload(screen.getByLabelText(/Upload your CV/i), big);
    expect(await screen.findByText(/under 10 MB/i)).toBeInTheDocument();
    expect(submitToFormspreeMock).not.toHaveBeenCalled();
  });

  it("requires a CV before it will submit", async () => {
    render(<CvUploadButton content={undefined} />);
    await userEvent.click(screen.getByRole("button", { name: /Send your CV/i }));
    await userEvent.type(screen.getByLabelText(/Full Name/), "Anna");
    await userEvent.type(screen.getByLabelText(/^Email/), "anna@example.com");
    await userEvent.type(screen.getByLabelText(/Phone number/), "+45 60 60 60 60");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /Submit CV/i }));
    expect(await screen.findByText(/Please upload your CV/i)).toBeInTheDocument();
    expect(submitToFormspreeMock).not.toHaveBeenCalled();
  });

  it("a failed submit shows no success and keeps the form filled", async () => {
    submitToFormspreeMock.mockRejectedValue(new Error("FORMSPREE_SUBMISSION_FAILED"));
    render(<CvUploadButton content={{
      modalTitle: "Send your CV", modalTitleSent: "Thanks!", description: "d", descriptionSent: "ds",
      messagePlaceholder: "p", dropzoneText: "Choose a file", errorMessage: "Could not send your CV.",
    }} />);
    await openAndFill();
    await userEvent.click(screen.getByRole("button", { name: /Submit CV/i }));

    expect(await screen.findByText("Could not send your CV.")).toBeInTheDocument();
    expect(screen.queryByText(/^Thanks!$/)).not.toBeInTheDocument();
    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe("Anna Holm");
  });

  it("no endpoint configured: localized 'not set up' notice, no success, no fake setTimeout resolve", async () => {
    render(<CvUploadButton content={undefined} />);
    await openAndFill();
    await userEvent.click(screen.getByRole("button", { name: /Submit CV/i }));
    expect(await screen.findByText(/isn't fully set up yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/we received your CV/i)).not.toBeInTheDocument();
  });

  it("double submit in flight only calls the delivery helper once", async () => {
    let resolve: () => void = () => {};
    submitToFormspreeMock.mockImplementation(() => new Promise<void>((r) => { resolve = r; }));
    const { container } = render(<CvUploadButton content={undefined} />);
    await openAndFill();
    const form = container.querySelector("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    resolve();
    await screen.findByText(/we received your CV/i);
    expect(submitToFormspreeMock).toHaveBeenCalledTimes(1);
  });
});
