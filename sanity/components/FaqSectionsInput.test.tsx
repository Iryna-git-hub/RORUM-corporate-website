// Component-level tests for the real FaqSectionsInput code — mounts it with
// React Testing Library, mocking only `useFormValue`. Proves the actual
// Studio lifecycle a manager would experience: clicking "+ Add FAQ category"
// produces a real `insert` patch shaped exactly like a valid, empty
// faqCategory section.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { insert } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { FaqSectionsInput } from "./FaqSectionsInput";

const mockUseFormValue = vi.fn();
vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return { ...actual, useFormValue: (path: string[]) => mockUseFormValue(path) };
});

function renderInput(props: import("sanity").ArrayOfObjectsInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <FaqSectionsInput {...props} />
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

describe("FaqSectionsInput — scoping", () => {
  it("non-page-faq document: passthrough to the default array input, unmodified", () => {
    setDocumentId("page-home");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("+ Add FAQ category")).not.toBeInTheDocument();
  });

  it("page-faq (published id): shows the custom Add FAQ category UI plus the default list", () => {
    setDocumentId("page-faq");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "+ Add FAQ category" })).toBeInTheDocument();
  });

  it("drafts.page-faq (draft id): also recognized, same as the published id", () => {
    setDocumentId("drafts.page-faq");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "+ Add FAQ category" })).toBeInTheDocument();
  });
});

describe("FaqSectionsInput — Add FAQ category produces a fully valid, empty section", () => {
  it("clicking Add FAQ category inserts exactly one pageSection with sectionKind faqCategory, a generated sectionKey, and empty items — no title pre-populated", async () => {
    setDocumentId("page-faq");
    const { props, onChange } = fakeProps();
    renderInput(props);

    await userEvent.click(screen.getByRole("button", { name: "+ Add FAQ category" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof insert>;
    expect(patch.type).toBe("insert");
    expect(patch.position).toBe("after");
    expect(patch.path).toEqual([-1]);
    expect(patch.items).toHaveLength(1);

    const section = patch.items[0] as { _key: string; _type: string; sectionKey: string; sectionKind: string; items: unknown[] };
    expect(section._type).toBe("pageSection");
    expect(section.sectionKind).toBe("faqCategory");
    expect(section.sectionKey).toBeTruthy();
    expect(section._key).toBe(section.sectionKey);
    expect(section.items).toEqual([]);
    expect(section).not.toHaveProperty("title");
    expect(section).not.toHaveProperty("label");
  });

  it("the generated sectionKey is prefixed and collision-resistant (full UUID-derived, not a small counter)", async () => {
    setDocumentId("page-faq");
    const { props, onChange } = fakeProps();
    renderInput(props);
    await userEvent.click(screen.getByRole("button", { name: "+ Add FAQ category" }));
    const section = (onChange.mock.calls[0]![0] as ReturnType<typeof insert>).items[0] as { sectionKey: string };
    expect(section.sectionKey).toMatch(/^group-[0-9a-f-]{20,}$/i);
  });

  it("two categories added in the same session get different, unique sectionKey values", async () => {
    setDocumentId("page-faq");
    const { props, onChange } = fakeProps();
    renderInput(props);
    const button = screen.getByRole("button", { name: "+ Add FAQ category" });
    await userEvent.click(button);
    await userEvent.click(button);
    expect(onChange).toHaveBeenCalledTimes(2);
    const key1 = (onChange.mock.calls[0]![0] as ReturnType<typeof insert>).items[0] as { sectionKey: string };
    const key2 = (onChange.mock.calls[1]![0] as ReturnType<typeof insert>).items[0] as { sectionKey: string };
    expect(key1.sectionKey).not.toBe(key2.sectionKey);
  });
});

describe("FaqSectionsInput — the generic array add path is disabled (no CSS hiding)", () => {
  it("on page-faq, renderDefault receives a schemaType with add/addBefore/addAfter/duplicate/copy disabled, remove/reorder still enabled", () => {
    setDocumentId("page-faq");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    const disabled = (passed.schemaType as unknown as { options?: { disableActions?: string[] } }).options?.disableActions;
    expect(disabled).toEqual(expect.arrayContaining(["add", "addBefore", "addAfter", "duplicate", "copy"]));
    expect(disabled).not.toContain("remove");
  });

  it("non-page-faq documents keep the original schemaType untouched — no disableActions added", () => {
    setDocumentId("page-home");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.schemaType).toBe(props.schemaType);
  });
});

describe("FaqSectionsInput — existing sections are untouched", () => {
  it("rendering with existing members never mutates value/onChange — the default list is delegated to renderDefault exactly as received", () => {
    setDocumentId("page-faq");
    const members = [{ kind: "item", key: "hero", item: { value: { _key: "hero", sectionKey: "hero" } } }] as unknown as import("sanity").ArrayOfObjectsInputProps["members"];
    const { props, renderDefault, onChange } = fakeProps({ members });
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.members).toBe(props.members);
    expect(passed.value).toBe(props.value);
    expect(passed.onChange).toBe(onChange);
  });
});
