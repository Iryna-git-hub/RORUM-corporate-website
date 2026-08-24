// Component-level unit tests for the REAL EventsFiltersInput code — mounts
// it with React Testing Library, mocking only `useFormValue`.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { PatchEvent, type ArrayOfObjectsInputProps } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { EventsFiltersInput } from "./EventsFiltersInput";

const mockUseFormValue = vi.fn();
vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return { ...actual, useFormValue: (path: string[]) => mockUseFormValue(path) };
});
// Chained onto EventsClosingCtaItemsInput (via this file's own fallback for
// every non-"filters" section) — stubbed since there's no real Studio
// router context in this unit-test environment; that file's own test
// covers its actual IntentLink content.
vi.mock("sanity/router", () => ({
  IntentLink: (props: { text?: string }) => <a data-testid="edit-shared-form-messages">{props.text}</a>,
}));

function renderInput(props: ArrayOfObjectsInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <EventsFiltersInput {...props} />
    </ThemeProvider>,
  );
}

function member(itemKey: string) {
  return { kind: "item", key: itemKey, item: { value: { _key: itemKey, itemKey } } } as unknown as ArrayOfObjectsInputProps["members"][number];
}

const ALL_17_KEYS = [
  "dateLabel", "soonestLabel", "weekLabel", "monthLabel",
  "languageLabel", "languageEnLabel", "languageDaLabel", "languageUkLabel",
  "priceLabel", "priceAscLabel", "priceDescLabel",
  "availabilityLabel", "availableLabel", "soldOutLabel",
  "clearFiltersLabel", "emptyStateTitle", "emptyStateText",
];

function fakeProps(overrides: Partial<ArrayOfObjectsInputProps> = {}) {
  const onChange = vi.fn();
  const renderDefault = vi.fn((p: ArrayOfObjectsInputProps) => (
    <div data-testid="rendered-default">
      {p.members.map((m) => (m.kind === "item" ? <span key={m.key}>{(m.item.value as { itemKey?: string }).itemKey}</span> : null))}
    </div>
  ));
  const props = {
    path: ["sections", { _key: "filters" }, "items"],
    members: ALL_17_KEYS.map(member),
    value: ALL_17_KEYS.map((k) => ({ _key: k, itemKey: k })),
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

describe("EventsFiltersInput — scoping", () => {
  it("non-page-events document: passthrough to the default array input, unmodified", () => {
    mockFormValue("page-catering", "filters");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
  });

  it("page-events but a different section (e.g. hero, which has no items of its own): passthrough — filters is the only section this file itself handles", () => {
    mockFormValue("page-events", "hero");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
  });

  it("page-events' closingCta section is NOT handled by this file — it chains to EventsClosingCtaItemsInput instead (see that file's own tests)", () => {
    mockFormValue("page-events", "closingCta");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).not.toHaveBeenCalled();
    expect(screen.getByTestId("edit-shared-form-messages")).toBeInTheDocument();
  });
});

describe("EventsFiltersInput — 5 semantic groups, never a flat mixed list", () => {
  it("shows Date/Language/Price/Availability group headings and a separate Filter messages group", () => {
    mockFormValue("page-events", "filters");
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("Availability")).toBeInTheDocument();
    expect(screen.getByText("Filter messages")).toBeInTheDocument();
  });

  it("each option row shows its semantic label (e.g. \"Soonest first\"), never a raw itemKey", () => {
    mockFormValue("page-events", "filters");
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByText("Soonest first")).toBeInTheDocument();
    expect(screen.getByText("Price: low to high")).toBeInTheDocument();
  });
});

describe("EventsFiltersInput — no generic Add/duplicate/copy/remove anywhere (Section 10)", () => {
  it("every renderDefault call for a row disables add/addBefore/addAfter/duplicate/copy/remove", () => {
    mockFormValue("page-events", "filters");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalled();
    for (const call of renderDefault.mock.calls) {
      const schemaType = (call[0] as ArrayOfObjectsInputProps).schemaType as { options?: { disableActions?: string[] } };
      expect(schemaType.options?.disableActions).toEqual(expect.arrayContaining(["add", "duplicate", "copy", "remove"]));
    }
  });

  it("no '+ Add' button of any kind is rendered (all 17 rows already exist)", () => {
    mockFormValue("page-events", "filters");
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.queryByRole("button", { name: /\+ Add/i })).not.toBeInTheDocument();
  });
});

describe("EventsFiltersInput — reorder stays inside its own group, key-addressed, never a full-array set() (Section 8/9)", () => {
  it("moving 'This week' up within Date emits unset+insert addressed by _key, never touching Language/Price/Availability rows", async () => {
    mockFormValue("page-events", "filters");
    const { props, onChange } = fakeProps();
    renderInput(props);

    await userEvent.click(screen.getByRole("button", { name: /move this week up/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const patchEvent = onChange.mock.calls[0]![0] as InstanceType<typeof PatchEvent>;
    const patches = (patchEvent as unknown as { patches: { path: unknown[] }[] }).patches;
    expect(patches).toHaveLength(2);
    const touchedKeys = patches.map((p) => JSON.stringify(p.path));
    expect(touchedKeys.some((p) => p.includes("languageLabel") || p.includes("priceLabel") || p.includes("availableLabel"))).toBe(false);
  });

  it("the first option in a group can't move up, the last can't move down", () => {
    mockFormValue("page-events", "filters");
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByRole("button", { name: /move soonest first up/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /move this month down/i })).toBeDisabled();
  });

  it("moving an option never touches its group's own heading row", async () => {
    mockFormValue("page-events", "filters");
    const { props, onChange } = fakeProps();
    renderInput(props);

    await userEvent.click(screen.getByRole("button", { name: /move this month up/i }));

    const patchEvent = onChange.mock.calls[0]![0] as unknown as { patches: { path: unknown[] }[] };
    const touchedKeys = patchEvent.patches.map((p) => JSON.stringify(p.path));
    expect(touchedKeys.some((p) => p.includes("dateLabel"))).toBe(false);
  });
});

describe("EventsFiltersInput — a missing row is shown as missing, never fabricated", () => {
  it("a group missing one of its rows shows an explicit 'Missing' note instead of silently omitting or auto-creating it", () => {
    mockFormValue("page-events", "filters");
    const keysWithoutMonth = ALL_17_KEYS.filter((k) => k !== "monthLabel");
    const { props, onChange } = fakeProps({
      members: keysWithoutMonth.map(member),
      value: keysWithoutMonth.map((k) => ({ _key: k, itemKey: k })),
    });
    renderInput(props);
    expect(screen.getByText((_, element) => element?.children.length === 0 && (element?.textContent?.startsWith("Missing") ?? false))).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("EventsFiltersInput — stray/unrecognized items stay visible, never silently hidden", () => {
  it("an item with an unrecognized itemKey is shown under 'Other items'", () => {
    mockFormValue("page-events", "filters");
    const { props } = fakeProps({
      members: [...ALL_17_KEYS.map(member), member("legacyMysteryRow")],
      value: [...ALL_17_KEYS.map((k) => ({ _key: k, itemKey: k })), { _key: "legacyMysteryRow", itemKey: "legacyMysteryRow" }],
    });
    renderInput(props);
    expect(screen.getByText("Other items")).toBeInTheDocument();
  });
});
