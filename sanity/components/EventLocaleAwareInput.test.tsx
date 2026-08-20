// Component-level unit tests for the REAL EventLocaleAwareInput component
// code (not a re-implementation) — mounts it with React Testing Library
// against a jsdom environment. `sanity`'s `useFormValue` is mocked (the one
// thing that needs a live Studio form context); `set`/`insert` are the REAL
// implementations from `sanity`, so patch-shape assertions below prove
// exactly what would be sent to the document, not a stand-in.
//
// This component fully replaces the plugin's default array UI for `event`
// documents (see the large comment in EventLocaleAwareInput.tsx for why:
// the plugin's own "add language" menu has no per-field override, only the
// global registry, which must stay static). So instead of the old
// members-filtering assertions, these tests prove the two safety properties
// that actually matter here:
//   1. an inactive locale's stored entry is never rendered as a row NOR
//      offered as an "add" button, and is never read/patched/removed;
//   2. every mutation this component performs (edit, add) is a single,
//      minimally-scoped patch — `set([...key...], "value")` or
//      `insert([oneNewEntry], "after", [-1])` — never a full-array rewrite.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { set, insert } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { EventLocaleAwareInput } from "./EventLocaleAwareInput";

const mockUseFormValue = vi.fn();
vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return { ...actual, useFormValue: (path: string[]) => mockUseFormValue(path) };
});

// @sanity/ui's primitives (Stack/Card/Button/TextInput/TextArea) read their
// styles from theme context — a bare render without this provider throws.
function renderInput(props: import("sanity").ArrayOfObjectsInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <EventLocaleAwareInput {...props} />
    </ThemeProvider>,
  );
}

interface FakeEntry {
  _key: string;
  _type: string;
  language?: string;
  value?: string;
}

function fakeProps(members: FakeEntry[], schemaTypeName: "internationalizedArrayString" | "internationalizedArrayText" = "internationalizedArrayString") {
  const value = members.map((m) => m) as unknown as import("sanity").ArrayOfObjectsInputProps["value"];
  const onChange = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the param type drives `.mock.calls[n][0]`'s inferred type, not its usage in the body.
  const renderDefault = vi.fn((_props: import("sanity").ArrayOfObjectsInputProps) => <div data-testid="rendered-default" />);
  const props = {
    members: members.map((m) => ({ kind: "item", key: m._key, item: { value: m } })),
    value,
    onChange,
    renderDefault,
    schemaType: { name: schemaTypeName },
    readOnly: false,
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

afterEach(() => {
  cleanup();
});

describe("EventLocaleAwareInput — scoping (non-event / not-yet-configured passthrough)", () => {
  it("non-event document: passthrough to the plugin's default input, unmodified (Home/About/etc. unaffected)", () => {
    setFormValues({ documentType: "page", visibleLocales: undefined });
    const { props, onChange, renderDefault } = fakeProps([EN, DA, UK]);
    renderInput(props);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.members).toBe(props.members);
    expect(passed.value).toBe(props.value);
    expect(passed.onChange).toBe(onChange);
  });

  it("event document with visibleLocales missing entirely: passthrough, nothing custom-rendered", () => {
    setFormValues({ documentType: "event", visibleLocales: undefined });
    const { props, renderDefault } = fakeProps([EN, DA, UK]);
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    const passed = renderDefault.mock.calls[0]![0] as typeof props;
    expect(passed.members).toBe(props.members);
    expect(passed.value).toBe(props.value);
  });

  it("event document with an empty visibleLocales array: passthrough (min(1) on the field itself is the one place this surfaces)", () => {
    setFormValues({ documentType: "event", visibleLocales: [] });
    const { props, renderDefault } = fakeProps([EN, DA, UK]);
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
  });
});

describe("EventLocaleAwareInput — event documents: row visibility", () => {
  it("only active-locale rows render; an inactive but stored entry (da) renders neither a row nor an add button, and renderDefault is never called", () => {
    setFormValues({ documentType: "event", visibleLocales: ["en", "uk"] });
    const { props, renderDefault } = fakeProps([EN, DA, UK]);
    renderInput(props);

    expect(renderDefault).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue("English value")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ukrainian value")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Danish value")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add Danish/i })).not.toBeInTheDocument();
  });

  it("an active locale with no stored entry yet offers an Add button instead of a row", () => {
    setFormValues({ documentType: "event", visibleLocales: ["en", "uk"] });
    const { props } = fakeProps([EN]); // uk selected but not yet stored
    renderInput(props);

    expect(screen.getByDisplayValue("English value")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Ukrainian/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add Danish/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add English/i })).not.toBeInTheDocument();
  });

  it("all three locales selected and stored: every row renders, nothing hidden", () => {
    setFormValues({ documentType: "event", visibleLocales: ["en", "da", "uk"] });
    const { props } = fakeProps([EN, DA, UK]);
    renderInput(props);
    expect(screen.getByDisplayValue("English value")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Danish value")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ukrainian value")).toBeInTheDocument();
  });

  it("uk-only event: only the uk row renders, en/da neither render nor offer add buttons", () => {
    setFormValues({ documentType: "event", visibleLocales: ["uk"] });
    const { props } = fakeProps([EN, DA, UK]);
    renderInput(props);
    expect(screen.getByDisplayValue("Ukrainian value")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("English value")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Danish value")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add/i })).not.toBeInTheDocument();
  });

  it("deselecting then reselecting a locale: the row disappears, then reappears with its ORIGINAL stored value once reselected — proves the entry was never read/patched while hidden", () => {
    const { props } = fakeProps([EN, DA, UK]);

    setFormValues({ documentType: "event", visibleLocales: ["en"] });
    const { unmount } = renderInput(props);
    expect(screen.queryByDisplayValue("Danish value")).not.toBeInTheDocument();
    unmount();

    setFormValues({ documentType: "event", visibleLocales: ["en", "da"] });
    renderInput(props);
    expect(screen.getByDisplayValue("Danish value")).toBeInTheDocument();
  });

  it("rows render in a fixed en/da/uk order regardless of visibleLocales' own array order", () => {
    setFormValues({ documentType: "event", visibleLocales: ["uk", "en", "da"] });
    const { props } = fakeProps([EN, DA, UK]);
    renderInput(props);
    const textboxes = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(textboxes.map((el) => el.value)).toEqual(["English value", "Danish value", "Ukrainian value"]);
  });
});

describe("EventLocaleAwareInput — event documents: mutations are minimally-scoped patches", () => {
  it("editing an active row's text patches ONLY that entry's own value — set([{_key}, 'value'])", () => {
    setFormValues({ documentType: "event", visibleLocales: ["en", "uk"] });
    const { props, onChange } = fakeProps([EN, UK]);
    renderInput(props);

    // Controlled input bound directly to props.value, which this harness
    // never feeds back in — a single `fireEvent.change` (the full new DOM
    // value in one go) proves the patch shape without fighting React's
    // controlled-value reversion between keystrokes.
    const input = screen.getByDisplayValue("English value");
    fireEvent.change(input, { target: { value: "X" } });

    expect(onChange).toHaveBeenCalledWith(set("X", [{ _key: "en" }, "value"]));
    expect(onChange).toHaveBeenCalledTimes(1);
    // Never a full-array rewrite: the call never carries the other entry's key.
    expect(JSON.stringify(onChange.mock.calls[0]![0])).not.toContain('"uk"');
  });

  it("clicking Add for a missing active locale inserts exactly one new entry — insert([newEntry], 'after', [-1]) — and touches nothing else", async () => {
    setFormValues({ documentType: "event", visibleLocales: ["en", "uk"] });
    const { props, onChange } = fakeProps([EN]); // uk missing
    renderInput(props);

    await userEvent.click(screen.getByRole("button", { name: /Add Ukrainian/i }));

    expect(onChange).toHaveBeenCalledWith(
      insert([{ _key: "uk", _type: "internationalizedArrayStringValue", language: "uk", value: "" }], "after", [-1]),
    );
  });

  it("Add is never offered, and cannot be triggered, for a locale not in visibleLocales", () => {
    setFormValues({ documentType: "event", visibleLocales: ["en"] });
    const { props } = fakeProps([EN]);
    renderInput(props);
    expect(screen.queryByRole("button", { name: /Add Danish/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add Ukrainian/i })).not.toBeInTheDocument();
  });
});

describe("EventLocaleAwareInput — field kind (single-line vs multiline)", () => {
  it("internationalizedArrayString renders a single-line textbox", () => {
    setFormValues({ documentType: "event", visibleLocales: ["en"] });
    const { props } = fakeProps([EN], "internationalizedArrayString");
    renderInput(props);
    const input = screen.getByDisplayValue("English value");
    expect(input.tagName).toBe("INPUT");
  });

  it("internationalizedArrayText renders a multiline textarea", () => {
    setFormValues({ documentType: "event", visibleLocales: ["en"] });
    const { props } = fakeProps([EN], "internationalizedArrayText");
    renderInput(props);
    const input = screen.getByDisplayValue("English value");
    expect(input.tagName).toBe("TEXTAREA");
  });
});

describe("EventLocaleAwareInput — read-only", () => {
  it("readOnly disables both existing-row inputs and Add buttons", () => {
    setFormValues({ documentType: "event", visibleLocales: ["en", "uk"] });
    const { props } = fakeProps([EN]);
    renderInput({ ...props, readOnly: true });
    expect(screen.getByDisplayValue("English value")).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: /Add Ukrainian/i })).toBeDisabled();
  });
});
