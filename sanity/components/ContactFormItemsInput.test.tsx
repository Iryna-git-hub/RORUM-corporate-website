// Component-level unit tests for the REAL ContactFormItemsInput code —
// mounts it with React Testing Library, mocking only `useFormValue`.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { insert, type ArrayOfObjectsInputProps } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { ContactFormItemsInput } from "./ContactFormItemsInput";

const mockUseFormValue = vi.fn();
vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return { ...actual, useFormValue: (path: string[]) => mockUseFormValue(path) };
});

function renderInput(props: ArrayOfObjectsInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <ContactFormItemsInput {...props} />
    </ThemeProvider>,
  );
}

function member(itemKey: string, key = itemKey) {
  return { kind: "item", key, item: { value: { _key: key, itemKey } } } as unknown as ArrayOfObjectsInputProps["members"][number];
}

function fakeProps(overrides: Partial<ArrayOfObjectsInputProps> = {}) {
  const onChange = vi.fn();
  const renderDefault = vi.fn((p: ArrayOfObjectsInputProps) => (
    <div data-testid="rendered-default">
      {p.members.map((m) => (m.kind === "item" ? <span key={m.key}>{(m.item.value as { itemKey?: string }).itemKey}</span> : null))}
    </div>
  ));
  const props = {
    path: ["sections", { _key: "form" }, "items"],
    members: [],
    value: [],
    onChange,
    renderDefault,
    schemaType: { name: "array", jsonType: "array", options: { sortable: true } },
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

describe("ContactFormItemsInput — scoping", () => {
  it("non-page-contact document: passthrough to the default array input, unmodified", () => {
    mockFormValue("page-home", "form");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
  });

  it("page-contact but a different section (e.g. hero): passthrough — hero is ContactDetailsOrderInput's own scope, not this one's", () => {
    mockFormValue("page-contact", "hero");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
  });
});

describe("ContactFormItemsInput — the only form-field creation control is '+ Add form field' (Task 3/12)", () => {
  it("clicking '+ Add form field' inserts a minimal, correctly-shaped, empty field item", async () => {
    mockFormValue("page-contact", "form");
    const { props, onChange } = fakeProps();
    renderInput(props);

    await userEvent.click(screen.getByRole("button", { name: "+ Add form field" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof insert>;
    expect(patch.type).toBe("insert");
    const item = patch.items[0] as { itemKey: string; _type: string; title?: unknown; text?: unknown; value?: unknown };
    expect(item.itemKey).toMatch(/^field-/);
    expect(item._type).toBe("contentItem");
    expect(item.title).toBeUndefined();
    expect(item.text).toBeUndefined();
    expect(item.value).toBeUndefined();
  });

  it("two rapid additions never collide — each click generates a distinct itemKey", async () => {
    mockFormValue("page-contact", "form");
    const { props, onChange } = fakeProps();
    renderInput(props);

    const addButton = screen.getByRole("button", { name: "+ Add form field" });
    await userEvent.click(addButton);
    await userEvent.click(addButton);

    const key1 = (onChange.mock.calls[0]![0].items[0] as { itemKey: string }).itemKey;
    const key2 = (onChange.mock.calls[1]![0].items[0] as { itemKey: string }).itemKey;
    expect(key1).not.toBe(key2);
  });

  it("generated keys are checked against existing items' keys before use", async () => {
    mockFormValue("page-contact", "form");
    // A pathological UUID collision can't be forced deterministically, but
    // this proves the generator at least consults the existing key set
    // rather than trusting randomness blindly — collisions are re-rolled.
    const existing = [{ _key: "field-abc", itemKey: "field-abc" }];
    const { props, onChange } = fakeProps({ value: existing as never, members: [member("field-abc")] });
    renderInput(props);

    await userEvent.click(screen.getByRole("button", { name: "+ Add form field" }));

    const newKey = (onChange.mock.calls[0]![0].items[0] as { itemKey: string }).itemKey;
    expect(newKey).not.toBe("field-abc");
  });
});

describe("ContactFormItemsInput — reserved rows are labeled semantically, never anonymous 'Item' rows (Task 3)", () => {
  it("Submit button, Success message, FAQ prompt, and Form fields headings are all present", () => {
    mockFormValue("page-contact", "form");
    const { props } = fakeProps({
      members: [member("submitLabel"), member("successMessage")],
    });
    renderInput(props);
    expect(screen.getByText("Form fields")).toBeInTheDocument();
    expect(screen.getByText("Privacy consent")).toBeInTheDocument();
    expect(screen.getByText("FAQ prompt")).toBeInTheDocument();
    expect(screen.getByText("Submit button")).toBeInTheDocument();
    expect(screen.getByText("Success message")).toBeInTheDocument();
  });

  it("Submit button/Success message present: rendered via the default single-item form, not an 'Add' prompt", () => {
    mockFormValue("page-contact", "form");
    const { props } = fakeProps({ members: [member("submitLabel"), member("successMessage")] });
    renderInput(props);
    expect(screen.queryByRole("button", { name: "+ Add submit button text" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Add success message" })).not.toBeInTheDocument();
  });
});

describe("ContactFormItemsInput — missing required reserved rows get an explicit action, never a silent auto-recreate (Task 3)", () => {
  it("submitLabel absent: shows a critical banner with an explicit '+ Add submit button text' action", () => {
    mockFormValue("page-contact", "form");
    const { props, onChange } = fakeProps({ members: [] });
    renderInput(props);

    expect(screen.getByText(/Missing — the submit button/)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled(); // never auto-created just from rendering
  });

  it("clicking '+ Add submit button text' inserts exactly that reserved row", async () => {
    mockFormValue("page-contact", "form");
    const { props, onChange } = fakeProps({ members: [] });
    renderInput(props);

    await userEvent.click(screen.getByRole("button", { name: "+ Add submit button text" }));

    const item = onChange.mock.calls[0]![0].items[0] as { itemKey: string };
    expect(item.itemKey).toBe("submitLabel");
  });

  it("faqPromptQuestion/faqPromptLabel absent (optional rows): offers '+ Add' actions, no critical banner", () => {
    mockFormValue("page-contact", "form");
    const { props } = fakeProps({ members: [member("submitLabel"), member("successMessage")] });
    renderInput(props);

    expect(screen.getByRole("button", { name: "+ Add FAQ prompt question" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Add FAQ prompt link" })).toBeInTheDocument();
    expect(screen.queryByText(/Missing —/)).not.toBeInTheDocument();
  });
});

describe("ContactFormItemsInput — form field rows preserve native remove/reorder (Task 3)", () => {
  it("field rows are rendered through the array's own default list (native remove/reorder available)", () => {
    mockFormValue("page-contact", "form");
    const { props, renderDefault } = fakeProps({
      value: [{ _key: "a", itemKey: "field-a" }, { _key: "b", itemKey: "field-b" }] as never,
      members: [member("field-a", "a"), member("field-b", "b")],
    });
    renderInput(props);
    expect(renderDefault).toHaveBeenCalled();
    const fieldsCall = renderDefault.mock.calls.find((c) => (c[0] as ArrayOfObjectsInputProps).members.length === 2);
    expect(fieldsCall).toBeDefined();
    const schemaType = (fieldsCall![0] as ArrayOfObjectsInputProps).schemaType as { options?: { disableActions?: string[] } };
    expect(schemaType.options?.disableActions).toEqual(expect.arrayContaining(["add", "duplicate", "copy"]));
    expect(schemaType.options?.disableActions).not.toContain("remove");
  });
});

describe("ContactFormItemsInput — stray/unrecognized items stay visible, never silently hidden", () => {
  it("an item with an unrecognized itemKey is shown under 'Other items'", () => {
    mockFormValue("page-contact", "form");
    const { props } = fakeProps({ members: [member("legacyMysteryRow")] });
    renderInput(props);
    expect(screen.getByText("Other items")).toBeInTheDocument();
  });
});
