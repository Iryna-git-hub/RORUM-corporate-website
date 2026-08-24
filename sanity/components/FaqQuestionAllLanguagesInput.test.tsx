// Component-level tests for the real FaqQuestionAllLanguagesInput code —
// mounts it with React Testing Library, mocking only `useFormValue`.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { insert, set } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { FaqQuestionAllLanguagesInput } from "./FaqQuestionAllLanguagesInput";

const mockUseFormValue = vi.fn();
vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return { ...actual, useFormValue: (path: unknown[]) => mockUseFormValue(path) };
});

function renderInput(props: import("sanity").ArrayOfObjectsInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <FaqQuestionAllLanguagesInput {...props} />
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

const QUESTION_TITLE_PATH = ["sections", { _key: "group1" }, "items", { _key: "q0" }, "title"];
const QUESTION_TEXT_PATH = ["sections", { _key: "group1" }, "items", { _key: "q0" }, "text"];
const CATEGORY_TITLE_PATH = ["sections", { _key: "group1" }, "title"];
const OTHER_ITEM_TITLE_PATH = ["sections", { _key: "hero" }, "items", { _key: "trust0" }, "title"];

/** Distinguishes the exact top-level `["sections"]` document read from a longer parent-path lookup, unlike a naive `path[0] === "sections"` check. */
function mockFormValue(documentId: string | undefined, sections: unknown[] | undefined, parentByPath: (path: unknown[]) => unknown) {
  mockUseFormValue.mockImplementation((path: unknown[]) => {
    if (path.length === 1 && path[0] === "_id") return documentId;
    if (path.length === 1 && path[0] === "sections") return sections;
    return parentByPath(path);
  });
}

const QUESTION_SECTIONS = [{ _key: "group1", sectionKey: "group-x", sectionKind: "faqCategory", items: [{ _key: "q0" }] }];
const OTHER_SECTIONS = [{ _key: "hero", sectionKey: "hero", sectionKind: "hero", items: [{ _key: "trust0" }] }];

beforeEach(() => {
  mockUseFormValue.mockReset();
});
afterEach(() => {
  cleanup();
});

describe("FaqQuestionAllLanguagesInput — scoping", () => {
  it("a FAQ question's Question (title) field: shows the always-present EN/DA/UK rows", () => {
    mockFormValue("page-faq", QUESTION_SECTIONS, () => ({ _key: "q0", itemKey: "q0" }));
    const { props } = fakeProps({ path: QUESTION_TITLE_PATH } as never);
    renderInput(props);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Danish")).toBeInTheDocument();
    expect(screen.getByText("Ukrainian")).toBeInTheDocument();
  });

  it("a FAQ question's Answer (text) field: also shows the always-present EN/DA/UK rows, as a TextArea", () => {
    mockFormValue("page-faq", QUESTION_SECTIONS, () => ({ _key: "q0", itemKey: "q0" }));
    const { props } = fakeProps({ path: QUESTION_TEXT_PATH, schemaType: { name: "internationalizedArrayText" } } as never);
    renderInput(props);
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
  });

  it("a FAQ category's own Title field: also shows the always-present EN/DA/UK rows", () => {
    mockFormValue("page-faq", QUESTION_SECTIONS, () => ({ _key: "group1", sectionKind: "faqCategory" }));
    const { props } = fakeProps({ path: CATEGORY_TITLE_PATH } as never);
    renderInput(props);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Danish")).toBeInTheDocument();
    expect(screen.getByText("Ukrainian")).toBeInTheDocument();
  });

  it("a non-FAQ item's title (e.g. Home's hero trust badge): falls through to EventLocaleAwareInput, which itself passes through to the default input for a non-event document", () => {
    mockFormValue("page-home", OTHER_SECTIONS, () => ({ _key: "trust0", itemKey: "trust0" }));
    const { props } = fakeProps({ path: OTHER_ITEM_TITLE_PATH } as never);
    renderInput(props);
    expect(screen.getByTestId("rendered-default")).toBeInTheDocument();
    expect(screen.queryByText("English")).not.toBeInTheDocument();
  });

  it("an unrecognized/missing path (e.g. a test double with no path): falls through to EventLocaleAwareInput, never assumed to be FAQ", () => {
    mockFormValue(undefined, undefined, () => undefined);
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByTestId("rendered-default")).toBeInTheDocument();
    expect(screen.queryByText("English")).not.toBeInTheDocument();
  });
});

describe("FaqQuestionAllLanguagesInput — lazy creation, never a silent auto-mutation from merely opening a field", () => {
  it("with an empty value, no onChange is called just from rendering", () => {
    mockFormValue("page-faq", QUESTION_SECTIONS, () => ({ _key: "q0", itemKey: "q0" }));
    const { props, onChange } = fakeProps({ path: QUESTION_TITLE_PATH } as never);
    renderInput(props);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("typing into a previously-missing language's row inserts exactly one new entry with that language and value", async () => {
    mockFormValue("page-faq", QUESTION_SECTIONS, () => ({ _key: "q0", itemKey: "q0" }));
    const { props, onChange } = fakeProps({ path: QUESTION_TITLE_PATH } as never);
    renderInput(props);
    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[0]!, "H");
    expect(onChange).toHaveBeenCalledTimes(1);
    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof insert>;
    expect(patch.type).toBe("insert");
    const entry = patch.items[0] as { language: string; value: string };
    expect(entry.language).toBe("en");
    expect(entry.value).toBe("H");
  });

  it("typing into an existing language's row sets that entry's value, not a new insert", async () => {
    mockFormValue("page-faq", QUESTION_SECTIONS, () => ({ _key: "q0", itemKey: "q0" }));
    const existing = [{ _key: "en", _type: "internationalizedArrayStringValue", language: "en", value: "Existing" }];
    const { props, onChange } = fakeProps({ path: QUESTION_TITLE_PATH, value: existing } as never);
    renderInput(props);
    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[0]!, "!");
    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof set>;
    expect(patch.type).toBe("set");
  });
});

describe("FaqQuestionAllLanguagesInput — readOnly is respected", () => {
  it("readOnly disables all 3 inputs", () => {
    mockFormValue("page-faq", QUESTION_SECTIONS, () => ({ _key: "q0", itemKey: "q0" }));
    const { props } = fakeProps({ path: QUESTION_TITLE_PATH, readOnly: true } as never);
    renderInput(props);
    for (const input of screen.getAllByRole("textbox")) {
      expect(input).toHaveAttribute("readonly");
    }
  });
});
