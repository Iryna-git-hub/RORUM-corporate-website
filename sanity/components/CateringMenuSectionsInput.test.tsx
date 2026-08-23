// Component-level unit tests for the REAL CateringMenuSectionsInput code —
// mounts it with React Testing Library, mocking only `useFormValue` (the
// one thing that needs a live Studio form context). Proves the actual
// Studio component lifecycle a manager would experience: clicking "+ Add
// category" produces a real `insert` patch shaped exactly like a valid
// pageSection/menuCategory/categoryIcon, not merely that such a shape is
// acceptable if inserted directly via the Sanity API.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { insert } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { CateringMenuSectionsInput } from "./CateringMenuSectionsInput";

const mockUseFormValue = vi.fn();
vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return { ...actual, useFormValue: (path: string[]) => mockUseFormValue(path) };
});

function renderInput(props: import("sanity").ArrayOfObjectsInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <CateringMenuSectionsInput {...props} />
    </ThemeProvider>,
  );
}

function fakeProps(overrides: Partial<import("sanity").ArrayOfObjectsInputProps> = {}) {
  const onChange = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the param type drives `.mock.calls[n][0]`'s inferred type, not its usage in the body.
  const renderDefault = vi.fn((_props: import("sanity").ArrayOfObjectsInputProps) => <div data-testid="rendered-default" />);
  const props = {
    members: [],
    value: [],
    onChange,
    renderDefault,
    schemaType: { name: "array", jsonType: "array", options: { sortable: true } },
    ...overrides,
  } as unknown as import("sanity").ArrayOfObjectsInputProps;
  return { props, onChange, renderDefault };
}

function setDocumentId(id: string | undefined) {
  mockUseFormValue.mockImplementation((path: string[]) => (path[0] === "_id" ? id : undefined));
}

beforeEach(() => {
  mockUseFormValue.mockReset();
});
afterEach(() => {
  cleanup();
});

describe("CateringMenuSectionsInput — scoping", () => {
  it("non-catering-menu-examples document: passthrough to the default array input, unmodified", () => {
    setDocumentId("page-home");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("+ Add category")).not.toBeInTheDocument();
  });

  it("page-catering-menu-examples (published id): shows the custom Add category UI plus the default list", () => {
    setDocumentId("page-catering-menu-examples");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "+ Add category" })).toBeInTheDocument();
  });

  it("drafts.page-catering-menu-examples (draft id): also recognized, same as the published id", () => {
    setDocumentId("drafts.page-catering-menu-examples");
    const { renderDefault, props } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "+ Add category" })).toBeInTheDocument();
  });
});

describe("CateringMenuSectionsInput — Add category produces a fully valid section", () => {
  it("clicking Add category inserts exactly one pageSection with sectionKind menuCategory, a generated sectionKey, and a categoryIcon item — no technical field left for the manager to fill in", async () => {
    setDocumentId("page-catering-menu-examples");
    const { props, onChange } = fakeProps();
    renderInput(props);

    await userEvent.click(screen.getByRole("button", { name: "+ Add category" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof insert>;
    expect(patch.type).toBe("insert");
    expect(patch.position).toBe("after");
    expect(patch.path).toEqual([-1]);
    expect(patch.items).toHaveLength(1);

    const section = patch.items[0] as {
      _key: string;
      _type: string;
      sectionKey: string;
      sectionKind: string;
      items: { _key: string; _type: string; itemKey: string; icon: string }[];
    };
    expect(section._type).toBe("pageSection");
    expect(section.sectionKind).toBe("menuCategory");
    expect(section.sectionKey).toBeTruthy();
    expect(section._key).toBe(section.sectionKey);
    expect(section.items).toHaveLength(1);
    expect(section.items[0]!.itemKey).toBe("categoryIcon");
    expect(section.items[0]!.icon).toBeTruthy();

    // No title/label/text/media/actions set — an empty, ready-to-fill-in
    // category, never a raw/undefined sectionKind for the manager to see.
    expect(section).not.toHaveProperty("title");
    expect(section).not.toHaveProperty("label");
  });

  it("two categories added in the same session get different, unique sectionKey values", async () => {
    setDocumentId("page-catering-menu-examples");
    const { props, onChange } = fakeProps();
    renderInput(props);

    const button = screen.getByRole("button", { name: "+ Add category" });
    await userEvent.click(button);
    await userEvent.click(button);

    expect(onChange).toHaveBeenCalledTimes(2);
    const key1 = (onChange.mock.calls[0]![0] as ReturnType<typeof insert>).items[0] as { sectionKey: string };
    const key2 = (onChange.mock.calls[1]![0] as ReturnType<typeof insert>).items[0] as { sectionKey: string };
    expect(key1.sectionKey).not.toBe(key2.sectionKey);
  });

  it("the inserted section's sectionKey is stable-looking (prefixed, not a bare random number) and never empty", async () => {
    setDocumentId("page-catering-menu-examples");
    const { props, onChange } = fakeProps();
    renderInput(props);
    await userEvent.click(screen.getByRole("button", { name: "+ Add category" }));
    const section = (onChange.mock.calls[0]![0] as ReturnType<typeof insert>).items[0] as { sectionKey: string };
    expect(section.sectionKey).toMatch(/^menuCategory-.+/);
  });
});

describe("CateringMenuSectionsInput — existing categories are untouched", () => {
  it("rendering with existing members never mutates value/onChange — the default list is delegated to renderDefault exactly as received", () => {
    setDocumentId("page-catering-menu-examples");
    const members = [{ kind: "item", key: "ukrainian", item: { value: { _key: "ukrainian", sectionKey: "category-ukrainian" } } }] as unknown as import("sanity").ArrayOfObjectsInputProps["members"];
    const { props, renderDefault, onChange } = fakeProps({ members });
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.members).toBe(props.members);
    expect(passed.value).toBe(props.value);
    expect(passed.onChange).toBe(onChange);
  });
});

describe("CateringMenuSectionsInput — the generic array add path is disabled (no CSS hiding)", () => {
  it("on page-catering-menu-examples, renderDefault receives a schemaType with add/addBefore/addAfter/duplicate/copy disabled — Sanity's own supported ArrayOptions.disableActions, not a CSS selector", () => {
    setDocumentId("page-catering-menu-examples");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    const disabled = (passed.schemaType as unknown as { options?: { disableActions?: string[] } }).options?.disableActions;
    expect(disabled).toEqual(expect.arrayContaining(["add", "addBefore", "addAfter", "duplicate", "copy"]));
    // "remove" (delete) must stay enabled — never in the disabled list.
    expect(disabled).not.toContain("remove");
  });

  it("the schemaType's other existing options (e.g. sortable, for native drag-reorder) are preserved, not replaced", () => {
    setDocumentId("page-catering-menu-examples");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    const options = (passed.schemaType as unknown as { options?: { sortable?: boolean } }).options;
    expect(options?.sortable).toBe(true);
  });

  it("non-catering-menu-examples documents keep the original schemaType untouched — no disableActions added", () => {
    setDocumentId("page-home");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.schemaType).toBe(props.schemaType);
  });
});
