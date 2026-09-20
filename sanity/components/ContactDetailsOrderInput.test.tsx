// Component-level unit tests for the REAL ContactDetailsOrderInput code —
// mounts it with React Testing Library, mocking only `useFormValue`/
// `useClient` (no live Studio form context here) and `sanity/router`'s
// IntentLink (needs a real Studio router context to render for real).
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { insert, unset, type ArrayOfObjectsInputProps } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { ContactDetailsOrderInput } from "./ContactDetailsOrderInput";

const mockUseFormValue = vi.fn();
let mockSocialLinksDoc: { links?: { icon?: string }[] } | null = null;
vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return {
    ...actual,
    useFormValue: (path: string[]) => mockUseFormValue(path),
    useClient: () => ({
      fetch: (query: string) => Promise.resolve(query.includes("socialLinks") ? mockSocialLinksDoc : null),
    }),
  };
});

vi.mock("sanity/router", () => ({
  IntentLink: ({ intent, params, text, ...rest }: { intent: string; params: Record<string, string>; text?: string }) => (
    <a data-testid={`edit-shared-${params.id}`} data-intent={intent} data-params={JSON.stringify(params)} {...rest}>
      {text}
    </a>
  ),
}));

function renderInput(props: ArrayOfObjectsInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <ContactDetailsOrderInput {...props} />
    </ThemeProvider>,
  );
}

function fakeProps(overrides: Partial<ArrayOfObjectsInputProps> = {}) {
  const onChange = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the param type drives `.mock.calls[n][0]`'s inferred type, not its usage in the body.
  const renderDefault = vi.fn((_props: ArrayOfObjectsInputProps) => <div data-testid="rendered-default" />);
  const props = {
    path: ["sections", { _key: "hero" }, "items"],
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

function member(itemKey: string, key = itemKey) {
  return { kind: "item", key, item: { value: { _key: key, itemKey } } } as unknown as ArrayOfObjectsInputProps["members"][number];
}

beforeEach(() => {
  mockUseFormValue.mockReset();
  mockSocialLinksDoc = null;
});
afterEach(() => {
  cleanup();
});

describe("ContactDetailsOrderInput — scoping", () => {
  it("non-page-contact document: passthrough to the default array input, unmodified", () => {
    mockFormValue("page-home", "hero");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
  });

  it("page-contact but a different section (e.g. form): passthrough, unmodified — hero is the only scoped section", () => {
    mockFormValue("page-contact", "form");
    const { props, renderDefault } = fakeProps();
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
  });
});

describe("ContactDetailsOrderInput — reorder is key-addressed, never a full-array set() (Task 5)", () => {
  it("moving a detail down emits ONE onChange call whose patches are unset(sourceKey) + insert(after neighborKey) — not a bulk set() of the whole array", async () => {
    mockFormValue("page-contact", "hero");
    const value = [
      { _key: "address", itemKey: "contactDetail-address" },
      { _key: "phone", itemKey: "contactDetail-phone" },
    ];
    const { props, onChange } = fakeProps({
      value: value as never,
      members: [member("contactDetail-address", "address"), member("contactDetail-phone", "phone")],
    });
    renderInput(props);

    await userEvent.click(screen.getByRole("button", { name: /move address down/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const patchEvent = onChange.mock.calls[0]![0] as { patches: unknown[] };
    expect(patchEvent.patches).toHaveLength(2);
    // Neither patch is a whole-array `set` — both are key-scoped.
    for (const patch of patchEvent.patches as { path: unknown[] }[]) {
      expect(patch.path.length).toBeGreaterThan(0);
    }
  });

  it("moving the only detail up/down (nothing to swap with) does nothing", async () => {
    mockFormValue("page-contact", "hero");
    const value = [{ _key: "address", itemKey: "contactDetail-address" }];
    const { props, onChange } = fakeProps({
      value: value as never,
      members: [member("contactDetail-address", "address")],
    });
    renderInput(props);

    expect(screen.getByRole("button", { name: /move address up/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /move address down/i })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reordering a detail never touches an unrelated item (followUsTitle) — it stays out of every patch (Task 5)", async () => {
    mockFormValue("page-contact", "hero");
    const value = [
      { _key: "follow", itemKey: "followUsTitle" },
      { _key: "address", itemKey: "contactDetail-address" },
      { _key: "phone", itemKey: "contactDetail-phone" },
    ];
    const { props, onChange } = fakeProps({
      value: value as never,
      members: [member("followUsTitle", "follow"), member("contactDetail-address", "address"), member("contactDetail-phone", "phone")],
    });
    renderInput(props);

    await userEvent.click(screen.getByRole("button", { name: /move phone up/i }));

    const patchEvent = onChange.mock.calls[0]![0] as { patches: { path: unknown[] }[] };
    const touchedKeys = patchEvent.patches.map((p) => JSON.stringify(p.path));
    expect(touchedKeys.some((p) => p.includes("follow"))).toBe(false);
  });
});

describe("ContactDetailsOrderInput — unknown contactDetail-* markers are rejected, not treated as a known card (Task 5)", () => {
  it("a stray 'contactDetail-fax' marker doesn't appear among the 3 known cards and doesn't block them", () => {
    mockFormValue("page-contact", "hero");
    const value = [{ _key: "address", itemKey: "contactDetail-address" }, { _key: "fax", itemKey: "contactDetail-fax" }];
    const { props } = fakeProps({
      value: value as never,
      members: [member("contactDetail-address", "address"), member("contactDetail-fax", "fax")],
    });
    renderInput(props);
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.queryByText("Fax")).not.toBeInTheDocument();
  });
});

describe("ContactDetailsOrderInput — empty state stays empty, never a hardcoded fallback (Task 5)", () => {
  it("zero contactDetail-* rows shows the explicit empty message, not the default 3", () => {
    mockFormValue("page-contact", "hero");
    const { props } = fakeProps({ value: [] as never, members: [] });
    renderInput(props);
    expect(screen.getByText(/No contact details are shown on the page right now/)).toBeInTheDocument();
  });
});

describe("ContactDetailsOrderInput — add/remove", () => {
  it("+ Add Email inserts a minimal contactDetail-email row", async () => {
    mockFormValue("page-contact", "hero");
    const { props, onChange } = fakeProps({ value: [] as never, members: [] });
    renderInput(props);

    await userEvent.click(screen.getByRole("button", { name: "+ Add Email" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof insert>;
    expect(patch.type).toBe("insert");
    const item = patch.items[0] as { itemKey: string };
    expect(item.itemKey).toBe("contactDetail-email");
  });

  it("Remove emits an unset() addressed by that row's own _key", async () => {
    mockFormValue("page-contact", "hero");
    const value = [{ _key: "address", itemKey: "contactDetail-address" }];
    const { props, onChange } = fakeProps({
      value: value as never,
      members: [member("contactDetail-address", "address")],
    });
    renderInput(props);

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof unset>;
    expect(patch.type).toBe("unset");
  });
});

describe("ContactDetailsOrderInput — shared-document navigation (Task 5)", () => {
  it("shows an 'Edit shared contact information' link pointing at the contactInfo singleton, not a local patch", () => {
    mockFormValue("page-contact", "hero");
    const { props } = fakeProps({ value: [] as never, members: [] });
    renderInput(props);

    const link = screen.getByTestId("edit-shared-contactInfo");
    expect(link).toHaveAttribute("data-intent", "edit");
    expect(JSON.parse(link.getAttribute("data-params")!)).toEqual({ id: "contactInfo", type: "contactInfo" });
  });
});

describe("ContactDetailsOrderInput — Follow us / shared social links summary (Task 6)", () => {
  it("shows a summary of the currently-enabled Instagram/Facebook links, read-only", async () => {
    mockFormValue("page-contact", "hero");
    mockSocialLinksDoc = { links: [{ icon: "instagram" }, { icon: "facebook" }] };
    const { props } = fakeProps({ value: [] as never, members: [] });
    renderInput(props);

    expect(await screen.findByText(/Currently shown: Instagram, Facebook/)).toBeInTheDocument();
  });

  it("an intentionally-empty links array shows the explicit empty message, never a fallback list", async () => {
    mockFormValue("page-contact", "hero");
    mockSocialLinksDoc = { links: [] };
    const { props } = fakeProps({ value: [] as never, members: [] });
    renderInput(props);

    expect(await screen.findByText(/No social links are currently shown/)).toBeInTheDocument();
  });

  it("provides a working 'Edit shared social links' IntentLink to the socialLinks singleton — never patches it directly", () => {
    mockFormValue("page-contact", "hero");
    mockSocialLinksDoc = { links: [] };
    const { props, onChange } = fakeProps({ value: [] as never, members: [] });
    renderInput(props);

    const link = screen.getByTestId("edit-shared-socialLinks");
    expect(link).toHaveAttribute("data-intent", "edit");
    expect(JSON.parse(link.getAttribute("data-params")!)).toEqual({ id: "socialLinks", type: "socialLinks" });
    expect(onChange).not.toHaveBeenCalled();
  });
});
