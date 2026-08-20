// Component-level unit tests for the REAL EventLocaleAwareInput component
// code (not a re-implementation) — mounts it with React Testing Library
// against a jsdom environment, mocking only `sanity`'s `useFormValue` hook
// (the one thing that needs a live Studio form context) and a spy
// `renderDefault` to capture exactly what props get handed to Sanity's own
// array-of-objects rendering.
//
// These tests exist specifically to prove the "merge-preserving onChange"
// requirement structurally: this component NEVER wraps or replaces `value`/
// `onChange` — it only ever filters which `members` render. Every test below
// asserts `value`/`onChange` reach `renderDefault` by strict reference
// equality (`toBe`, not `toEqual`) — if this component ever started
// reconstructing/copying the array to "merge" values itself, these
// assertions would immediately fail, which is exactly the class of bug this
// guards against.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { EventLocaleAwareInput } from "./EventLocaleAwareInput";

const mockUseFormValue = vi.fn();
vi.mock("sanity", () => ({
  useFormValue: (path: string[]) => mockUseFormValue(path),
}));

interface FakeEntry {
  _key: string;
  _type: string;
  language?: string;
  value?: string;
}

function fakeMember(entry: FakeEntry) {
  return { kind: "item", key: entry._key, item: { value: entry } } as unknown as import("sanity").ArrayOfObjectsInputProps["members"][number];
}

function fakeProps(members: FakeEntry[], overrides: Partial<import("sanity").ArrayOfObjectsInputProps> = {}) {
  const value = members.map((m) => m) as unknown as import("sanity").ArrayOfObjectsInputProps["value"];
  const onChange = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the param type is what matters here (drives `.mock.calls[n][0]`'s inferred type below), not its usage in the body.
  const renderDefault = vi.fn((_props: import("sanity").ArrayOfObjectsInputProps) => <div data-testid="rendered-default" />);
  const props = {
    members: members.map(fakeMember),
    value,
    onChange,
    renderDefault,
    ...overrides,
  } as unknown as import("sanity").ArrayOfObjectsInputProps;
  return { props, onChange, renderDefault };
}

function setFormValues({ documentType, visibleLocales }: { documentType?: string; visibleLocales?: unknown }) {
  mockUseFormValue.mockImplementation((path: string[]) => {
    if (path[0] === "_type") return documentType;
    if (path[0] === "visibleLocales") return visibleLocales;
    return undefined;
  });
}

const EN: FakeEntry = { _key: "en", _type: "internationalizedArrayStringValue", language: "en", value: "English value" };
const DA: FakeEntry = { _key: "da", _type: "internationalizedArrayStringValue", language: "da", value: "Danish value" };
const UK: FakeEntry = { _key: "uk", _type: "internationalizedArrayStringValue", language: "uk", value: "Ukrainian value" };

beforeEach(() => {
  mockUseFormValue.mockReset();
});

describe("EventLocaleAwareInput — scoping", () => {
  it("non-event document: passthrough, members/value/onChange are the exact same references (Home/About/etc. unaffected)", () => {
    setFormValues({ documentType: "page", visibleLocales: undefined });
    const { props, onChange, renderDefault } = fakeProps([EN, DA, UK]);
    render(<EventLocaleAwareInput {...props} />);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.members).toBe(props.members);
    expect(passed.value).toBe(props.value);
    expect(passed.onChange).toBe(onChange);
  });

  it("event document with visibleLocales missing entirely: passthrough, nothing filtered", () => {
    setFormValues({ documentType: "event", visibleLocales: undefined });
    const { props, renderDefault } = fakeProps([EN, DA, UK]);
    render(<EventLocaleAwareInput {...props} />);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.members).toBe(props.members);
  });

  it("event document with an empty visibleLocales array: passthrough (min(1) on the field itself is the one place this surfaces)", () => {
    setFormValues({ documentType: "event", visibleLocales: [] });
    const { props, renderDefault } = fakeProps([EN, DA, UK]);
    render(<EventLocaleAwareInput {...props} />);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.members).toBe(props.members);
  });
});

describe("EventLocaleAwareInput — filtering + merge-safety", () => {
  it("inactive entry (da) is excluded from rendered members, but `value`/`onChange` remain the exact untouched references — it is never read, patched, or removed", () => {
    setFormValues({ documentType: "event", visibleLocales: ["en", "uk"] });
    const { props, onChange, renderDefault } = fakeProps([EN, DA, UK]);
    render(<EventLocaleAwareInput {...props} />);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;

    const renderedLanguages = (passed.members as unknown as { item: { value: FakeEntry } }[]).map((m) => m.item.value.language);
    expect(renderedLanguages).toEqual(["en", "uk"]);

    // Merge-safety: value/onChange are the SAME objects passed in — this
    // component performs zero reconstruction of the array.
    expect(passed.value).toBe(props.value);
    expect(passed.onChange).toBe(onChange);
  });

  it("locale deselected then reselected: da disappears, then reappears with its ORIGINAL stored value (same object reference) once selected again", () => {
    const { props, renderDefault } = fakeProps([EN, DA, UK]);

    setFormValues({ documentType: "event", visibleLocales: ["en"] });
    const { unmount } = render(<EventLocaleAwareInput {...props} />);
    let passed = renderDefault.mock.calls[0]![0] as typeof props;
    const langs = (passed.members as unknown as { item: { value: FakeEntry } }[]).map((m) => m.item.value.language);
    expect(langs).toEqual(["en"]);
    unmount();

    renderDefault.mockClear();
    setFormValues({ documentType: "event", visibleLocales: ["en", "da"] });
    render(<EventLocaleAwareInput {...props} />);
    passed = renderDefault.mock.calls[0]![0] as typeof props;
    const daMember = (passed.members as unknown as { item: { value: FakeEntry } }[]).find((m) => m.item.value.language === "da");
    expect(daMember?.item.value.value, "the restored Danish entry must be its original stored value, not blank").toBe("Danish value");
    // Same underlying member object as originally supplied — proves nothing
    // was reconstructed/lost while da was hidden.
    expect(daMember?.item.value).toBe(DA);
  });

  it("a member with no language yet (mid-creation row) stays visible regardless of visibleLocales, rather than risk hiding an active edit", () => {
    setFormValues({ documentType: "event", visibleLocales: ["en"] });
    const pending: FakeEntry = { _key: "new-1", _type: "internationalizedArrayStringValue" };
    const { props, renderDefault } = fakeProps([EN, pending]);
    render(<EventLocaleAwareInput {...props} />);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.members).toHaveLength(2);
  });

  it("all three locales selected: every entry renders, nothing filtered", () => {
    setFormValues({ documentType: "event", visibleLocales: ["en", "da", "uk"] });
    const { props, renderDefault } = fakeProps([EN, DA, UK]);
    render(<EventLocaleAwareInput {...props} />);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.members).toHaveLength(3);
  });

  it("uk-only event: only the uk entry renders, en/da stay stored and untouched", () => {
    setFormValues({ documentType: "event", visibleLocales: ["uk"] });
    const { props, onChange, renderDefault } = fakeProps([EN, DA, UK]);
    render(<EventLocaleAwareInput {...props} />);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    const renderedLanguages = (passed.members as unknown as { item: { value: FakeEntry } }[]).map((m) => m.item.value.language);
    expect(renderedLanguages).toEqual(["uk"]);
    expect(passed.value).toBe(props.value);
    expect(passed.onChange).toBe(onChange);
  });

  it("editing/adding/clearing an active entry is delegated entirely to Sanity's own per-item editing: onChange is always the exact same function this component received, never wrapped", () => {
    setFormValues({ documentType: "event", visibleLocales: ["en", "da"] });
    const { props, onChange, renderDefault } = fakeProps([EN, DA]);
    render(<EventLocaleAwareInput {...props} />);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    // Strict reference equality: proves this component cannot have
    // introduced a wrapper that could drop/alter a patch for update, add,
    // or clear operations on a visible entry — those all flow through
    // exactly this same onChange, untouched.
    expect(passed.onChange).toBe(onChange);
  });
});
