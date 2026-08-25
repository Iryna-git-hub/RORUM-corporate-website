// Component-level tests for the Community Membership donation panel's Bank
// Details list — proving the "always shows a Copy button, even for a row
// with no value / not meant to be copied" defect stays fixed at the
// component boundary: a Copy button renders only when `copyable` is true,
// it copies the row's exact value (via a mocked Clipboard API — jsdom has
// no real clipboard), it's keyboard-activatable, and it shows localized
// success feedback that reverts automatically. The live-data half of the
// fix (page.tsx deriving `copyable` from Sanity's `copyEnabled` field
// instead of hardcoding `true`) is exercised by the Playwright build/render
// checks, not here — this file only proves the component's own contract.
import { describe, expect, it, afterEach, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { WecodaDonationSection, defaultBankFields, type BankField } from "./WecodaDonationSection";

afterEach(() => cleanup());

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

const qrSrc = "/images/membership-week/wecoda-donation-qr.jpg";

describe("WecodaDonationSection — Bank Details Copy button visibility", () => {
  it("renders a Copy button only for rows with copyable: true — never for a row with no value or copyable unset/false", () => {
    mockClipboard();
    const bankFields: BankField[] = [
      { label: "Beneficiary", value: "WECODA" },
      { label: "Account No.", value: "14165789", copyable: true },
      { label: "Empty Row", value: "", copyable: true },
      { label: "IBAN", value: "DK96 3000 0014 1657 89", copyable: true },
      { label: "SWIFT/BIC", value: "DABADKKK", copyable: false },
    ];
    render(<WecodaDonationSection qrSrc={qrSrc} bankFields={bankFields} />);

    expect(screen.getAllByRole("button", { name: /^Copy /i })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Copy Account No." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy IBAN" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy Empty Row" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy Beneficiary" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy SWIFT/BIC" })).not.toBeInTheDocument();
  });

  it("the real default bank fields show exactly 2 Copy buttons — Account No. and IBAN", () => {
    mockClipboard();
    render(<WecodaDonationSection qrSrc={qrSrc} bankFields={defaultBankFields} />);
    expect(screen.getAllByRole("button", { name: /^Copy /i })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Copy Account No." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy IBAN" })).toBeInTheDocument();
  });

  it("no Copy button renders at all when every row is non-copyable", () => {
    mockClipboard();
    const bankFields: BankField[] = [
      { label: "Beneficiary", value: "WECODA" },
      { label: "CVR", value: "46365208" },
    ];
    render(<WecodaDonationSection qrSrc={qrSrc} bankFields={bankFields} />);
    expect(screen.queryByRole("button", { name: /^Copy /i })).not.toBeInTheDocument();
  });
});

describe("WecodaDonationSection — Copy button behavior (mocked Clipboard API)", () => {
  it("clicking Copy writes the row's exact value to the clipboard", async () => {
    const writeText = mockClipboard();
    render(<WecodaDonationSection qrSrc={qrSrc} bankFields={defaultBankFields} />);

    await userEvent.click(screen.getByRole("button", { name: "Copy IBAN" }));
    expect(writeText).toHaveBeenCalledExactlyOnceWith("DK96 3000 0014 1657 89");
  });

  it("after copying, the button shows localized success feedback and reverts to Copy after the timeout", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockClipboard();
    render(<WecodaDonationSection qrSrc={qrSrc} bankFields={defaultBankFields} />);

    await userEvent.click(screen.getByRole("button", { name: "Copy Account No." }));
    expect(await screen.findByRole("button", { name: "Account No. copied" })).toBeInTheDocument();
    expect(screen.getByText("Copied")).toBeInTheDocument();

    vi.advanceTimersByTime(1800);
    expect(await screen.findByRole("button", { name: "Copy Account No." })).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("copying one row's value never marks a different copyable row as copied", async () => {
    mockClipboard();
    render(<WecodaDonationSection qrSrc={qrSrc} bankFields={defaultBankFields} />);

    await userEvent.click(screen.getByRole("button", { name: "Copy IBAN" }));
    expect(await screen.findByRole("button", { name: "IBAN copied" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy Account No." })).toBeInTheDocument();
  });

  it("the Copy button is keyboard-activatable (Tab + Enter), not mouse-only", async () => {
    const writeText = mockClipboard();
    render(<WecodaDonationSection qrSrc={qrSrc} bankFields={defaultBankFields} />);

    const copyButton = screen.getByRole("button", { name: "Copy Account No." });
    copyButton.focus();
    expect(copyButton).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(writeText).toHaveBeenCalledExactlyOnceWith("14165789");
  });

  it("still shows success feedback even when the Clipboard API is unavailable/rejects (manual copy remains possible)", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });
    render(<WecodaDonationSection qrSrc={qrSrc} bankFields={defaultBankFields} />);

    await userEvent.click(screen.getByRole("button", { name: "Copy IBAN" }));
    expect(await screen.findByRole("button", { name: "IBAN copied" })).toBeInTheDocument();
  });
});
