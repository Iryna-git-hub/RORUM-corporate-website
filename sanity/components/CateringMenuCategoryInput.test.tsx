// Component-level tests for the real CateringMenuCategoryInput code —
// mounts it with React Testing Library, mocking only useFormValue. Uses the
// REAL IconPickerInput underneath (not mocked), so selecting an icon here
// exercises the actual search + selection + patch-translation path.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { set, unset } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { CateringMenuCategoryInput } from "./CateringMenuCategoryInput";

const mockUseFormValue = vi.fn();
vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return { ...actual, useFormValue: (path: string[]) => mockUseFormValue(path) };
});

function renderInput(props: import("sanity").ObjectInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <CateringMenuCategoryInput {...props} />
    </ThemeProvider>,
  );
}

function fakeProps(overrides: Partial<import("sanity").ObjectInputProps> = {}) {
  const onChange = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderDefault = vi.fn((_props: import("sanity").ObjectInputProps) => <div data-testid="rendered-default" />);
  const props = {
    value: { sectionKind: "menuCategory", items: [{ _key: "categoryIcon", itemKey: "categoryIcon", icon: "Sandwich" }] },
    onChange,
    renderDefault,
    schemaType: { name: "pageSection" },
    ...overrides,
  } as unknown as import("sanity").ObjectInputProps;
  return { props, onChange, renderDefault };
}

function mockDocumentId(id: string | undefined) {
  mockUseFormValue.mockImplementation((path: string[]) => (path[0] === "_id" ? id : undefined));
}

beforeEach(() => {
  mockUseFormValue.mockReset();
});
afterEach(() => {
  cleanup();
});

describe("CateringMenuCategoryInput — scoping", () => {
  it("a non-menuCategory section on page-catering-menu-examples (e.g. banner): delegates unchanged, no Icon field shown", () => {
    mockDocumentId("page-catering-menu-examples");
    const { props, renderDefault } = fakeProps({ value: { sectionKind: "hero", items: [] } } as never);
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Icon")).not.toBeInTheDocument();
  });

  it("a menuCategory section on a different document: delegates unchanged", () => {
    mockDocumentId("page-catering");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Icon")).not.toBeInTheDocument();
  });

  it("a menuCategory section on page-catering-menu-examples: shows the Icon field", () => {
    mockDocumentId("page-catering-menu-examples");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Icon")).toBeInTheDocument();
  });

  it("draft id (drafts.page-catering-menu-examples) is also recognized", () => {
    mockDocumentId("drafts.page-catering-menu-examples");
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByText("Icon")).toBeInTheDocument();
  });
});

describe("CateringMenuCategoryInput — field order: Icon precedes the default (Label/Title/Text/Dishes) block", () => {
  it("the Icon card appears before rendered-default in DOM order", () => {
    mockDocumentId("page-catering-menu-examples");
    const { props } = fakeProps();
    renderInput(props);
    const iconHeading = screen.getByText("Icon");
    const defaultBlock = screen.getByTestId("rendered-default");
    // DOCUMENT_POSITION_FOLLOWING (4): defaultBlock comes AFTER iconHeading.
    expect(iconHeading.compareDocumentPosition(defaultBlock) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("CateringMenuCategoryInput — icon selection patches the canonical nested value", () => {
  it("selecting a new icon emits set() targeting items[_key=categoryIcon].icon — not a new top-level field", async () => {
    mockDocumentId("page-catering-menu-examples");
    const { props, onChange } = fakeProps();
    renderInput(props);

    const searchBox = screen.getByPlaceholderText(/search icon/i);
    await userEvent.type(searchBox, "ChefHat");
    await userEvent.click(screen.getByTitle("ChefHat", { exact: true }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const expected = set("ChefHat", ["items", { _key: "categoryIcon" }, "icon"]);
    expect(onChange.mock.calls[0]![0]).toEqual(expected);
  });

  it("clearing the icon emits unset() targeting the same canonical path", async () => {
    mockDocumentId("page-catering-menu-examples");
    const { props, onChange } = fakeProps();
    renderInput(props);
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const expected = unset(["items", { _key: "categoryIcon" }, "icon"]);
    expect(onChange.mock.calls[0]![0]).toEqual(expected);
  });

  it("icon selection never touches the item's own _key/itemKey — rename/reorder of the category cannot disturb it", async () => {
    mockDocumentId("page-catering-menu-examples");
    const { props, onChange } = fakeProps();
    renderInput(props);
    const searchBox = screen.getByPlaceholderText(/search icon/i);
    await userEvent.type(searchBox, "Flame");
    await userEvent.click(screen.getByTitle("Flame", { exact: true }));
    const patch = onChange.mock.calls[0]![0] as { path: unknown[] };
    expect(patch.path).toEqual(["items", { _key: "categoryIcon" }, "icon"]);
  });
});

describe("CateringMenuCategoryInput — defensive handling of a malformed category", () => {
  it("shows a clear message instead of crashing when categoryIcon is missing", () => {
    mockDocumentId("page-catering-menu-examples");
    const { props } = fakeProps({ value: { sectionKind: "menuCategory", items: [] } } as never);
    renderInput(props);
    expect(screen.getByText(/Icon item not found/i)).toBeInTheDocument();
  });
});

describe("CateringMenuCategoryInput — default block receives value/onChange untouched", () => {
  it("renderDefault is called with the exact same props object references (no cloning/mutation)", () => {
    mockDocumentId("page-catering-menu-examples");
    const { props, renderDefault, onChange } = fakeProps();
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.value).toBe(props.value);
    expect(passed.onChange).toBe(onChange);
  });
});
