// Component-level unit tests for the REAL CateringOfferItemsInput code —
// mounts it with React Testing Library, mocking only `useFormValue` (the
// one thing that needs a live Studio form context). Proves the actual
// Studio component lifecycle a manager would experience: clicking "+ Add
// offering category" produces a real `insert` patch shaped exactly like a
// valid, minimal contentItem — no technical field, no irrelevant generic
// field — not merely that such a shape is acceptable if inserted directly
// via the Sanity API.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { insert } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { CateringOfferItemsInput } from "./CateringOfferItemsInput";

const mockUseFormValue = vi.fn();
vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return { ...actual, useFormValue: (path: string[]) => mockUseFormValue(path) };
});

function renderInput(props: import("sanity").ArrayOfObjectsInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <CateringOfferItemsInput {...props} />
    </ThemeProvider>,
  );
}

function fakeProps(overrides: Partial<import("sanity").ArrayOfObjectsInputProps> = {}) {
  const onChange = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the param type drives `.mock.calls[n][0]`'s inferred type, not its usage in the body.
  const renderDefault = vi.fn((_props: import("sanity").ArrayOfObjectsInputProps) => <div data-testid="rendered-default" />);
  const props = {
    path: ["sections", { _key: "philosophy" }, "items"],
    members: [],
    value: [],
    onChange,
    renderDefault,
    schemaType: { name: "array", jsonType: "array", options: { sortable: true } },
    ...overrides,
  } as unknown as import("sanity").ArrayOfObjectsInputProps;
  return { props, onChange, renderDefault };
}

/** `useFormValue(["_id"])` resolves to `documentId`; any other path (the enclosing section lookup) resolves to `{sectionKey}`. */
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

describe("CateringOfferItemsInput — scoping", () => {
  it("non-page-catering document: passthrough to the default array input, unmodified", () => {
    mockFormValue("page-home", "philosophy");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("+ Add offering category")).not.toBeInTheDocument();
  });

  it("page-catering but a different section (e.g. menuFormats): passthrough, no button — items is shared by every section", () => {
    mockFormValue("page-catering", "menuFormats");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "+ Add offering category" })).not.toBeInTheDocument();
  });

  it("page-catering, section philosophy (published id): shows the custom Add offering UI plus the default list", () => {
    mockFormValue("page-catering", "philosophy");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "+ Add offering category" })).toBeInTheDocument();
  });

  it("drafts.page-catering (draft id), section philosophy: also recognized, same as the published id", () => {
    mockFormValue("drafts.page-catering", "philosophy");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "+ Add offering category" })).toBeInTheDocument();
  });
});

describe("CateringOfferItemsInput — Add offering category produces a fully valid, minimal item", () => {
  it("clicking Add offering category inserts exactly one contentItem with a generated formatN itemKey and a default icon — no title/text/image/href/label/value left for the manager, no technical field required", async () => {
    mockFormValue("page-catering", "philosophy");
    const { props, onChange } = fakeProps({ value: [] } as never);
    renderInput(props);

    await userEvent.click(screen.getByRole("button", { name: "+ Add offering category" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof insert>;
    expect(patch.type).toBe("insert");
    expect(patch.position).toBe("after");
    expect(patch.path).toEqual([-1]);
    expect(patch.items).toHaveLength(1);

    const item = patch.items[0] as { _key: string; _type: string; itemKey: string; icon: string };
    expect(item._type).toBe("contentItem");
    // Digits-only suffix — must match contentItem.ts's `/^(format\d*)?$/`
    // role pattern, or the new item would match no role and every generic
    // field would become visible again (the exact regression this whole
    // fix exists to prevent).
    expect(item.itemKey).toMatch(/^format\d+$/);
    expect(item._key).toBe(item.itemKey);
    expect(item.icon).toBeTruthy();
    expect(item).not.toHaveProperty("title");
    expect(item).not.toHaveProperty("text");
    expect(item).not.toHaveProperty("image");
    expect(item).not.toHaveProperty("href");
    expect(item).not.toHaveProperty("label");
    expect(item).not.toHaveProperty("value");
  });

  it("still produces a valid, uniquely-keyed item when existing format0..format5 bullets are already present", async () => {
    mockFormValue("page-catering", "philosophy");
    const existing = ["tailoredNote", "format0", "format1", "format2", "format3", "format4", "format5"].map((itemKey) => ({ _key: itemKey, itemKey }));
    const { props, onChange } = fakeProps({ value: existing } as never);
    renderInput(props);
    await userEvent.click(screen.getByRole("button", { name: "+ Add offering category" }));
    const item = (onChange.mock.calls[0]![0] as ReturnType<typeof insert>).items[0] as { itemKey: string };
    expect(item.itemKey).toMatch(/^format\d+$/);
    expect(existing.some((e) => e.itemKey === item.itemKey)).toBe(false);
  });

  it("two categories added in the same session get different, unique itemKey values", async () => {
    mockFormValue("page-catering", "philosophy");
    const { props, onChange } = fakeProps({ value: [] } as never);
    renderInput(props);
    const button = screen.getByRole("button", { name: "+ Add offering category" });
    await userEvent.click(button);
    await userEvent.click(button);
    expect(onChange).toHaveBeenCalledTimes(2);
    const key1 = (onChange.mock.calls[0]![0] as ReturnType<typeof insert>).items[0] as { itemKey: string };
    const key2 = (onChange.mock.calls[1]![0] as ReturnType<typeof insert>).items[0] as { itemKey: string };
    expect(key1.itemKey).not.toBe(key2.itemKey);
  });
});

describe("CateringOfferItemsInput — existing bullets are untouched", () => {
  it("rendering with existing members never mutates value/onChange — the default list is delegated to renderDefault exactly as received", () => {
    mockFormValue("page-catering", "philosophy");
    const members = [{ kind: "item", key: "format0", item: { value: { _key: "format0", itemKey: "format0" } } }] as unknown as import("sanity").ArrayOfObjectsInputProps["members"];
    const { props, renderDefault, onChange } = fakeProps({ members });
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.members).toBe(props.members);
    expect(passed.value).toBe(props.value);
    expect(passed.onChange).toBe(onChange);
  });
});

describe("CateringOfferItemsInput — the generic array add path is disabled (no CSS hiding)", () => {
  it("on page-catering's philosophy section, renderDefault receives a schemaType with add/addBefore/addAfter/duplicate/copy disabled — Sanity's own supported ArrayOptions.disableActions, not a CSS selector", () => {
    mockFormValue("page-catering", "philosophy");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    const disabled = (passed.schemaType as unknown as { options?: { disableActions?: string[] } }).options?.disableActions;
    expect(disabled).toEqual(expect.arrayContaining(["add", "addBefore", "addAfter", "duplicate", "copy"]));
    // "remove" (delete) must stay enabled — never in the disabled list.
    expect(disabled).not.toContain("remove");
  });

  it("the schemaType's other existing options (e.g. sortable, for native drag-reorder) are preserved, not replaced", () => {
    mockFormValue("page-catering", "philosophy");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    const options = (passed.schemaType as unknown as { options?: { sortable?: boolean } }).options;
    expect(options?.sortable).toBe(true);
  });

  it("a different section on page-catering keeps the original schemaType untouched — no disableActions added", () => {
    mockFormValue("page-catering", "steps");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.schemaType).toBe(props.schemaType);
  });
});

describe("CateringOfferItemsInput — the Add control is below the list, in real DOM order (no CSS positioning trick)", () => {
  it("with an empty list, the Add offering category button still renders (there is nothing above it but the section intro text)", () => {
    mockFormValue("page-catering", "philosophy");
    const { props } = fakeProps({ value: [], members: [] } as never);
    renderInput(props);
    expect(screen.getByRole("button", { name: "+ Add offering category" })).toBeInTheDocument();
  });

  it("with a populated list, the rendered default list markup precedes the Add button in DOM order — a real element-order difference, not a CSS reorder", () => {
    mockFormValue("page-catering", "philosophy");
    const members = [
      { kind: "item", key: "format0", item: { value: { _key: "format0", itemKey: "format0" } } },
      { kind: "item", key: "format1", item: { value: { _key: "format1", itemKey: "format1" } } },
    ] as unknown as import("sanity").ArrayOfObjectsInputProps["members"];
    const { props } = fakeProps({ members });
    renderInput(props);

    const listNode = screen.getByTestId("rendered-default");
    const button = screen.getByRole("button", { name: "+ Add offering category" });
    // compareDocumentPosition: DOCUMENT_POSITION_FOLLOWING (4) means `button`
    // comes AFTER `listNode` in the actual DOM tree.
    expect(listNode.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("the Add button's own help text is bilingual (English + Ukrainian) and describes appending to the end of the list", () => {
    mockFormValue("page-catering", "philosophy");
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByText(/Adds a new offering card at the end of the list\./)).toBeInTheDocument();
    expect(screen.getByText(/Додає нову картку пропозиції в кінець списку\./)).toBeInTheDocument();
  });
});
