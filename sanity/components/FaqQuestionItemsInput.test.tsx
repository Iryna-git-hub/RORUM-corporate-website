// Component-level tests for the real FaqQuestionItemsInput code — mounts it
// with React Testing Library, mocking only `useFormValue`. Proves clicking
// "+ Add question" produces a real `insert` patch shaped exactly like a
// valid, minimal contentItem matching contentItem.ts's "FAQ question" role.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { insert } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { FaqQuestionItemsInput } from "./FaqQuestionItemsInput";

const mockUseFormValue = vi.fn();
vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return { ...actual, useFormValue: (path: string[]) => mockUseFormValue(path) };
});

function renderInput(props: import("sanity").ArrayOfObjectsInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <FaqQuestionItemsInput {...props} />
    </ThemeProvider>,
  );
}

function fakeProps(overrides: Partial<import("sanity").ArrayOfObjectsInputProps> = {}) {
  const onChange = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the param type drives `.mock.calls[n][0]`'s inferred type, not its usage in the body.
  const renderDefault = vi.fn((_props: import("sanity").ArrayOfObjectsInputProps) => <div data-testid="rendered-default" />);
  const props = {
    path: ["sections", { _key: "group-1" }, "items"],
    members: [],
    value: [],
    onChange,
    renderDefault,
    schemaType: { name: "array", jsonType: "array", options: { sortable: true } },
    ...overrides,
  } as unknown as import("sanity").ArrayOfObjectsInputProps;
  return { props, onChange, renderDefault };
}

/** The enclosing section lookup (`useFormValue(parentPath)`) resolves to `{sectionKind}`. */
function mockSectionKind(sectionKind: string | undefined) {
  mockUseFormValue.mockImplementation(() => ({ sectionKind }));
}

beforeEach(() => {
  mockUseFormValue.mockReset();
});
afterEach(() => {
  cleanup();
});

describe("FaqQuestionItemsInput — scoping", () => {
  it("a non-faqCategory section's items (e.g. menuFormats): passthrough, no button — items is shared by every section", () => {
    mockSectionKind("iconGrid");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "+ Add question" })).not.toBeInTheDocument();
  });

  it("a faqCategory section's items: shows the custom Add question UI plus the default list", () => {
    mockSectionKind("faqCategory");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "+ Add question" })).toBeInTheDocument();
  });
});

describe("FaqQuestionItemsInput — Add question produces a fully valid, minimal item", () => {
  it("clicking Add question inserts exactly one contentItem with a generated qN itemKey — no title/text/icon/image/href/label/value left for the manager", async () => {
    mockSectionKind("faqCategory");
    const { props, onChange } = fakeProps();
    renderInput(props);

    await userEvent.click(screen.getByRole("button", { name: "+ Add question" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof insert>;
    expect(patch.type).toBe("insert");
    expect(patch.position).toBe("after");
    expect(patch.path).toEqual([-1]);
    expect(patch.items).toHaveLength(1);

    const item = patch.items[0] as { _key: string; _type: string; itemKey: string };
    expect(item._type).toBe("contentItem");
    // Digits-only suffix — must match contentItem.ts's `/^(q\d*)?$/` FAQ
    // question role pattern.
    expect(item.itemKey).toMatch(/^q\d+$/);
    expect(item._key).toBe(item.itemKey);
    expect(item).not.toHaveProperty("title");
    expect(item).not.toHaveProperty("text");
    expect(item).not.toHaveProperty("icon");
    expect(item).not.toHaveProperty("image");
    expect(item).not.toHaveProperty("href");
    expect(item).not.toHaveProperty("label");
    expect(item).not.toHaveProperty("value");
  });

  it("two questions added in the same session get different, unique itemKey values", async () => {
    mockSectionKind("faqCategory");
    const { props, onChange } = fakeProps();
    renderInput(props);
    const button = screen.getByRole("button", { name: "+ Add question" });
    await userEvent.click(button);
    await userEvent.click(button);
    expect(onChange).toHaveBeenCalledTimes(2);
    const key1 = (onChange.mock.calls[0]![0] as ReturnType<typeof insert>).items[0] as { itemKey: string };
    const key2 = (onChange.mock.calls[1]![0] as ReturnType<typeof insert>).items[0] as { itemKey: string };
    expect(key1.itemKey).not.toBe(key2.itemKey);
  });
});

describe("FaqQuestionItemsInput — the generic array add path is disabled (no CSS hiding)", () => {
  it("on a faqCategory section, renderDefault receives a schemaType with add/addBefore/addAfter/duplicate/copy disabled, remove/reorder still enabled", () => {
    mockSectionKind("faqCategory");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    const disabled = (passed.schemaType as unknown as { options?: { disableActions?: string[] } }).options?.disableActions;
    expect(disabled).toEqual(expect.arrayContaining(["add", "addBefore", "addAfter", "duplicate", "copy"]));
    expect(disabled).not.toContain("remove");
  });

  it("a non-faqCategory section keeps the original schemaType untouched — no disableActions added", () => {
    mockSectionKind("menuCategory");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.schemaType).toBe(props.schemaType);
  });
});

describe("FaqQuestionItemsInput — existing questions are untouched", () => {
  it("rendering with existing members never mutates value/onChange — the default list is delegated to renderDefault exactly as received", () => {
    mockSectionKind("faqCategory");
    const members = [{ kind: "item", key: "q0", item: { value: { _key: "q0", itemKey: "q0" } } }] as unknown as import("sanity").ArrayOfObjectsInputProps["members"];
    const { props, renderDefault, onChange } = fakeProps({ members });
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.members).toBe(props.members);
    expect(passed.value).toBe(props.value);
    expect(passed.onChange).toBe(onChange);
  });
});
