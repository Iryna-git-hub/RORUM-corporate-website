// Component-level tests for the booking form's package selector and
// Additional Services checkboxes — proving both now read from the caller-
// supplied `packageOptions`/`serviceOptions` (the same canonical,
// Sanity-backed arrays app/[locale]/(site)/host-at-rorum/page.tsx builds
// from `packagesSection.items`/`inquiryForm.items`) rather than the old
// hardcoded, English-only `bookingPackageOptions`/`bookingServiceOptions`
// arrays, and that the submitted VALUE is always the stable identifier —
// never the (renameable, localized) label.
import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { InquiryForm } from "./InquiryForm";

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
