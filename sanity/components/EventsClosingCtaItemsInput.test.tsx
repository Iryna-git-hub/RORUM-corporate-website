import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ArrayOfObjectsInputProps } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { EventsClosingCtaItemsInput } from "./EventsClosingCtaItemsInput";

const mockUseFormValue = vi.fn();
vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return { ...actual, useFormValue: (path: string[]) => mockUseFormValue(path) };
});
vi.mock("sanity/router", () => ({
  IntentLink: ({ intent, params, text, ...rest }: { intent: string; params: Record<string, string>; text?: string }) => (
    <a data-testid="edit-shared-form-messages" data-intent={intent} data-params={JSON.stringify(params)} {...rest}>
      {text}
    </a>
  ),
}));

function renderInput(props: ArrayOfObjectsInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <EventsClosingCtaItemsInput {...props} />
    </ThemeProvider>,
  );
}

function fakeProps(overrides: Partial<ArrayOfObjectsInputProps> = {}) {
  const onChange = vi.fn();
  const renderDefault = vi.fn(() => <div data-testid="rendered-default" />);
  const props = {
    path: ["sections", { _key: "closingCta" }, "items"],
    members: [],
    value: [],
    onChange,
    renderDefault,
    schemaType: { name: "array", jsonType: "array" },
    ...overrides,
  } as unknown as ArrayOfObjectsInputProps;
  return { props, onChange, renderDefault };
}

function mockFormValue(documentId: string | undefined, sectionKey: string | undefined) {
  mockUseFormValue.mockImplementation((path: unknown[]) => {
    if (path.length === 1 && path[0] === "_id") return documentId;
    return { sectionKey };
  });
}

beforeEach(() => {
  mockUseFormValue.mockReset();
});
afterEach(() => {
  cleanup();
});

describe("EventsClosingCtaItemsInput — scoping", () => {
  it("non-page-events document: passthrough to the default array input, unmodified", () => {
    mockFormValue("page-home", "closingCta");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
  });

  it("page-events but a different section (e.g. filters): passthrough — closingCta is this file's only scoped section", () => {
    mockFormValue("page-events", "filters");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
  });
});

describe("EventsClosingCtaItemsInput — read-only explanation instead of a fake editable field (Section 12)", () => {
  it("shows a read-only note explaining the live prompt comes from Shared form messages, not this page", () => {
    mockFormValue("page-events", "closingCta");
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByText(/Shared form messages/)).toBeInTheDocument();
  });

  it("provides a working 'Edit shared form messages' IntentLink — never patches page-events itself", () => {
    mockFormValue("page-events", "closingCta");
    const { props, onChange } = fakeProps();
    renderInput(props);
    const link = screen.getByTestId("edit-shared-form-messages");
    expect(link).toHaveAttribute("data-intent", "edit");
    expect(JSON.parse(link.getAttribute("data-params")!)).toEqual({ id: "formMessages", type: "formMessages" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not render the native items array editor at all for this section", () => {
    mockFormValue("page-events", "closingCta");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).not.toHaveBeenCalled();
  });
});
