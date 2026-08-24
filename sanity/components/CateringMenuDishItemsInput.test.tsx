// Component-level tests for the real CateringMenuDishItemsInput code —
// mounts it with React Testing Library, mocking only useFormValue.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { insert } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { CateringMenuDishItemsInput } from "./CateringMenuDishItemsInput";

const mockUseFormValue = vi.fn();
// Chained onto ContactDetailsOrderInput (via CateringOfferItemsInput ->
// FaqQuestionItemsInput), which calls useClient() unconditionally for its
// read-only contactInfo preview fetch — stubbed since there's no real
// Studio SourceProvider in this unit-test environment.
vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return {
    ...actual,
    useFormValue: (path: string[]) => mockUseFormValue(path),
    useClient: () => ({ fetch: () => Promise.resolve(null) }),
  };
});

function renderInput(props: import("sanity").ArrayOfObjectsInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <CateringMenuDishItemsInput {...props} />
    </ThemeProvider>,
  );
}

function fakeProps(overrides: Partial<import("sanity").ArrayOfObjectsInputProps> = {}) {
  const onChange = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the param type drives `.mock.calls[n][0]`'s inferred type.
  const renderDefault = vi.fn((_props: import("sanity").ArrayOfObjectsInputProps) => <div data-testid="rendered-default" />);
  const props = {
    path: ["sections", { _key: "category-a" }, "items"],
    members: [],
    value: [],
    onChange,
    renderDefault,
    schemaType: { name: "array", jsonType: "array", options: { sortable: true } },
    ...overrides,
  } as unknown as import("sanity").ArrayOfObjectsInputProps;
  return { props, onChange, renderDefault };
}

/** `useFormValue(["_id"])` -> documentId; any other path (parent section lookup) -> `{sectionKind}`. */
function mockFormValue(documentId: string | undefined, sectionKind: string | undefined) {
  mockUseFormValue.mockImplementation((path: unknown[]) => {
    if (path.length === 1 && path[0] === "_id") return documentId;
    return { sectionKind };
  });
}

function itemMember(key: string, value: Record<string, unknown>) {
  return { kind: "item", key, item: { value: { _key: key, ...value } } };
}

beforeEach(() => {
  mockUseFormValue.mockReset();
});
afterEach(() => {
  cleanup();
});

describe("CateringMenuDishItemsInput — scoping", () => {
  it("non-menuCategory section on page-catering-menu-examples (e.g. banner): delegates through to the default input, no dish UI", () => {
    mockFormValue("page-catering-menu-examples", "hero");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "+ Add dish" })).not.toBeInTheDocument();
  });

  it("menuCategory section on a different document: delegates through, no dish UI", () => {
    mockFormValue("page-home", "menuCategory");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "+ Add dish" })).not.toBeInTheDocument();
  });

  it("menuCategory section on page-catering-menu-examples: shows the + Add dish control", () => {
    mockFormValue("page-catering-menu-examples", "menuCategory");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "+ Add dish" })).toBeInTheDocument();
  });

  it("draft id (drafts.page-catering-menu-examples) is also recognized", () => {
    mockFormValue("drafts.page-catering-menu-examples", "menuCategory");
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByRole("button", { name: "+ Add dish" })).toBeInTheDocument();
  });

  it("page-catering's own philosophy items (a totally different scope) still work via the chained CateringOfferItemsInput, unaffected", () => {
    mockFormValue("page-catering", "split");
    const { props, renderDefault } = fakeProps({ path: ["sections", { _key: "philosophy" }, "items"] } as never);
    renderInput(props);
    // CateringOfferItemsInput only activates for sectionKey "philosophy" —
    // our mock only supplies sectionKind, so it falls through to renderDefault too.
    expect(renderDefault).toHaveBeenCalledTimes(1);
  });
});

describe("CateringMenuDishItemsInput — + Add dish produces a minimal, correctly-shaped dish", () => {
  it("+ Add dish is below the dish list in DOM order", () => {
    mockFormValue("page-catering-menu-examples", "menuCategory");
    const members = [itemMember("dish0", { itemKey: "dish0" })] as unknown as import("sanity").ArrayOfObjectsInputProps["members"];
    const { props } = fakeProps({ members });
    renderInput(props);
    const listNode = screen.getByTestId("rendered-default");
    const button = screen.getByRole("button", { name: "+ Add dish" });
    expect(listNode.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("clicking + Add dish inserts one contentItem with _type contentItem, a unique itemKey matching the dish role pattern, and no title/text/image/icon/link fields pre-set", async () => {
    mockFormValue("page-catering-menu-examples", "menuCategory");
    const { props, onChange } = fakeProps();
    renderInput(props);
    await userEvent.click(screen.getByRole("button", { name: "+ Add dish" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof insert>;
    expect(patch.type).toBe("insert");
    expect(patch.position).toBe("after");
    expect(patch.path).toEqual([-1]);
    const dish = patch.items[0] as { _key: string; _type: string; itemKey: string };
    expect(dish._type).toBe("contentItem");
    expect(dish.itemKey).toMatch(/^dish\d+$/);
    expect(dish._key).toBe(dish.itemKey);
    expect(dish).not.toHaveProperty("title");
    expect(dish).not.toHaveProperty("text");
    expect(dish).not.toHaveProperty("image");
    expect(dish).not.toHaveProperty("icon");
    expect(dish).not.toHaveProperty("href");
    expect(dish).not.toHaveProperty("value");
  });

  it("two dishes added in the same session get unique itemKeys", async () => {
    mockFormValue("page-catering-menu-examples", "menuCategory");
    const { props, onChange } = fakeProps();
    renderInput(props);
    const button = screen.getByRole("button", { name: "+ Add dish" });
    await userEvent.click(button);
    await userEvent.click(button);
    const key1 = (onChange.mock.calls[0]![0] as ReturnType<typeof insert>).items[0] as { itemKey: string };
    const key2 = (onChange.mock.calls[1]![0] as ReturnType<typeof insert>).items[0] as { itemKey: string };
    expect(key1.itemKey).not.toBe(key2.itemKey);
  });
});

describe("CateringMenuDishItemsInput — categoryIcon is filtered out of the Dishes list", () => {
  it("the reserved categoryIcon item is not passed to renderDefault's members — only real dishes appear", () => {
    mockFormValue("page-catering-menu-examples", "menuCategory");
    const members = [
      itemMember("categoryIcon", { itemKey: "categoryIcon", icon: "Sandwich" }),
      itemMember("dish0", { itemKey: "dish0" }),
      itemMember("dish1", { itemKey: "dish1" }),
    ] as unknown as import("sanity").ArrayOfObjectsInputProps["members"];
    const { renderDefault, props } = fakeProps({ members });
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    const passedMembers = passed.members as unknown as { item: { value: { itemKey?: string } } }[];
    expect(passedMembers).toHaveLength(2);
    expect(passedMembers.map((m) => m.item.value.itemKey)).toEqual(["dish0", "dish1"]);
  });

  it("props.value (the real underlying array, used for patches) is passed through completely untouched, still including categoryIcon", () => {
    mockFormValue("page-catering-menu-examples", "menuCategory");
    const value = [
      { _key: "categoryIcon", itemKey: "categoryIcon", icon: "Sandwich" },
      { _key: "dish0", itemKey: "dish0" },
    ];
    const { renderDefault, props } = fakeProps({ value } as never);
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.value).toBe(props.value);
  });

  it("an ArrayItemError member is never hidden, even alongside categoryIcon", () => {
    mockFormValue("page-catering-menu-examples", "menuCategory");
    const members = [
      itemMember("categoryIcon", { itemKey: "categoryIcon" }),
      { kind: "error", key: "broken-item" },
    ] as unknown as import("sanity").ArrayOfObjectsInputProps["members"];
    const { renderDefault, props } = fakeProps({ members });
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    const passedMembers = passed.members as unknown as { kind: string }[];
    expect(passedMembers).toHaveLength(1);
    expect(passedMembers[0]!.kind).toBe("error");
  });
});

describe("CateringMenuDishItemsInput — the generic array add path is disabled (no CSS hiding)", () => {
  it("renderDefault receives add/addBefore/addAfter/duplicate/copy disabled; remove stays enabled", () => {
    mockFormValue("page-catering-menu-examples", "menuCategory");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    const disabled = (passed.schemaType as unknown as { options?: { disableActions?: string[] } }).options?.disableActions;
    expect(disabled).toEqual(expect.arrayContaining(["add", "addBefore", "addAfter", "duplicate", "copy"]));
    expect(disabled).not.toContain("remove");
  });

  it("existing options (e.g. sortable, for native drag-reorder) are preserved", () => {
    mockFormValue("page-catering-menu-examples", "menuCategory");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect((passed.schemaType as unknown as { options?: { sortable?: boolean } }).options?.sortable).toBe(true);
  });
});
