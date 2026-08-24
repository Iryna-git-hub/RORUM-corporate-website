// Component-level tests for the real CateringAllLanguagesInput code —
// mounts it with React Testing Library, mocking only useFormValue.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { insert, set } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { CateringAllLanguagesInput } from "./CateringAllLanguagesInput";

const mockUseFormValue = vi.fn();
vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return { ...actual, useFormValue: (path: string[]) => mockUseFormValue(path) };
});

function renderInput(props: import("sanity").ArrayOfObjectsInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <CateringAllLanguagesInput {...props} />
    </ThemeProvider>,
  );
}

function fakeProps(overrides: Partial<import("sanity").ArrayOfObjectsInputProps> = {}) {
  const onChange = vi.fn();
  const props = {
    value: [],
    onChange,
    readOnly: false,
    schemaType: { name: "internationalizedArrayString" },
    renderDefault: vi.fn(() => <div data-testid="rendered-default" />),
    ...overrides,
  } as unknown as import("sanity").ArrayOfObjectsInputProps;
  return { props, onChange };
}

function mockFormValue(values: Record<string, unknown>) {
  mockUseFormValue.mockImplementation((path: string[]) => values[path[0] ?? ""]);
}

beforeEach(() => {
  mockUseFormValue.mockReset();
});
afterEach(() => {
  cleanup();
});

describe("CateringAllLanguagesInput — scoping", () => {
  it("a non-Catering-Menu-Examples document (e.g. an event) delegates to EventLocaleAwareInput, not the always-show-3 UI", () => {
    mockFormValue({ _id: "some-event-id", _type: "event", visibleLocales: ["en"] });
    const { props } = fakeProps();
    renderInput(props);
    // EventLocaleAwareInput shows a "+ Add English" button for a missing
    // entry rather than an always-present input row — proves it's the one
    // that rendered, not this component's own unconditional-3-rows UI.
    expect(screen.getByRole("button", { name: "+ Add English" })).toBeInTheDocument();
  });

  it("a plain page document that is not page-catering-menu-examples falls through to the default input (via EventLocaleAwareInput's own passthrough)", () => {
    mockFormValue({ _id: "page-home", _type: "page" });
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByTestId("rendered-default")).toBeInTheDocument();
  });

  it("page-catering-menu-examples: shows the always-present EN/DA/UK rows, no gating", () => {
    mockFormValue({ _id: "page-catering-menu-examples" });
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Danish")).toBeInTheDocument();
    expect(screen.getByText("Ukrainian")).toBeInTheDocument();
  });

  it("draft id (drafts.page-catering-menu-examples) is also recognized", () => {
    mockFormValue({ _id: "drafts.page-catering-menu-examples" });
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Danish")).toBeInTheDocument();
    expect(screen.getByText("Ukrainian")).toBeInTheDocument();
  });
});

describe("CateringAllLanguagesInput — lazy creation, never a silent auto-mutation from merely opening a field", () => {
  it("with an empty value, no onChange is called just from rendering", () => {
    mockFormValue({ _id: "page-catering-menu-examples" });
    const { props, onChange } = fakeProps();
    renderInput(props);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("typing into a previously-missing language's row inserts exactly one new entry with that language and value", async () => {
    mockFormValue({ _id: "page-catering-menu-examples" });
    const { props, onChange } = fakeProps();
    renderInput(props);
    const inputs = screen.getAllByRole("textbox");
    // English row is first (LOCALE_ORDER).
    await userEvent.type(inputs[0]!, "H");
    expect(onChange).toHaveBeenCalled();
    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof insert>;
    expect(patch.type).toBe("insert");
    const entry = patch.items[0] as { language: string; value: string; _key: string };
    expect(entry.language).toBe("en");
    expect(entry._key).toBe("en");
  });

  it("typing into an EXISTING entry's row emits set() on that entry's own _key path, not a new insert", async () => {
    mockFormValue({ _id: "page-catering-menu-examples" });
    const value = [{ _key: "en", _type: "internationalizedArrayStringValue", language: "en", value: "Hell" }];
    const { props, onChange } = fakeProps({ value } as never);
    renderInput(props);
    const enInput = screen.getByDisplayValue("Hell");
    await userEvent.type(enInput, "o");
    expect(onChange).toHaveBeenCalled();
    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof set>;
    expect(patch.type).toBe("set");
    expect(patch.path).toEqual([{ _key: "en" }, "value"]);
  });
});

describe("CateringAllLanguagesInput — multiline vs single-line", () => {
  it("internationalizedArrayText uses a multiline textarea", () => {
    mockFormValue({ _id: "page-catering-menu-examples" });
    const { props } = fakeProps({ schemaType: { name: "internationalizedArrayText" } } as never);
    const { container } = renderInput(props);
    expect(container.querySelector("textarea")).toBeInTheDocument();
  });

  it("internationalizedArrayString uses a single-line text input", () => {
    mockFormValue({ _id: "page-catering-menu-examples" });
    const { props } = fakeProps();
    const { container } = renderInput(props);
    expect(container.querySelector("textarea")).not.toBeInTheDocument();
    expect(container.querySelectorAll('input[type="text"]').length).toBeGreaterThan(0);
  });
});

describe("CateringAllLanguagesInput — readOnly", () => {
  it("all 3 rows are read-only when the field is read-only", () => {
    mockFormValue({ _id: "page-catering-menu-examples" });
    const { props } = fakeProps({ readOnly: true } as never);
    renderInput(props);
    for (const input of screen.getAllByRole("textbox")) {
      expect(input).toHaveAttribute("readonly");
    }
  });
});
