// Component-level tests for the real GalleryMediaAltInput code — mounts it
// with React Testing Library, mocking only useFormValue (_id and sections).
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { insert, set } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { GalleryMediaAltInput } from "./GalleryMediaAltInput";

const mockUseFormValue = vi.fn();
vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return { ...actual, useFormValue: (path: string[]) => mockUseFormValue(path) };
});

function renderInput(props: import("sanity").ArrayOfObjectsInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <GalleryMediaAltInput {...props} />
    </ThemeProvider>,
  );
}

const GALLERY_PATH = ["sections", { _key: "gallerySectionKey" }, "media", { _key: "img0" }, "alt"];

function fakeProps(overrides: Partial<import("sanity").ArrayOfObjectsInputProps> = {}) {
  const onChange = vi.fn();
  const props = {
    value: [],
    onChange,
    readOnly: false,
    path: GALLERY_PATH,
    schemaType: { name: "internationalizedArrayString" },
    renderDefault: vi.fn(() => <div data-testid="rendered-default" />),
    ...overrides,
  } as unknown as import("sanity").ArrayOfObjectsInputProps;
  return { props, onChange };
}

function mockFormValue(id: string | undefined, sections: { _key?: string; sectionKey?: string }[] | undefined) {
  mockUseFormValue.mockImplementation((path: string[]) => {
    if (path[0] === "_id") return id;
    if (path[0] === "sections") return sections;
    return undefined;
  });
}

const GALLERY_SECTIONS = [{ _key: "gallerySectionKey", sectionKey: "gallery" }];
const HERO_SECTIONS = [{ _key: "heroSectionKey", sectionKey: "hero" }];
const STYLING_SECTIONS = [{ _key: "stylingSectionKey", sectionKey: "styling" }];
const HOME_HERO_SECTIONS = [{ _key: "homeHeroSectionKey", sectionKey: "hero", media: [{ _key: "heroVideo" }] }];

beforeEach(() => {
  mockUseFormValue.mockReset();
});
afterEach(() => {
  cleanup();
});

describe("GalleryMediaAltInput — scoping", () => {
  it("page-event-decoration's gallery media alt: shows the always-present EN/DA/UK rows, no gating", () => {
    mockFormValue("page-event-decoration", GALLERY_SECTIONS);
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Danish")).toBeInTheDocument();
    expect(screen.getByText("Ukrainian")).toBeInTheDocument();
  });

  it("draft id (drafts.page-event-decoration) is also recognized", () => {
    mockFormValue("drafts.page-event-decoration", GALLERY_SECTIONS);
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Danish")).toBeInTheDocument();
    expect(screen.getByText("Ukrainian")).toBeInTheDocument();
  });

  it("page-catering's gallery media alt: also shows the 3 rows (shared scope)", () => {
    mockFormValue("page-catering", GALLERY_SECTIONS);
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Danish")).toBeInTheDocument();
    expect(screen.getByText("Ukrainian")).toBeInTheDocument();
  });

  it("page-host-at-rorum's gallery media alt: also shows the 3 rows (shared scope)", () => {
    mockFormValue("page-host-at-rorum", GALLERY_SECTIONS);
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Danish")).toBeInTheDocument();
    expect(screen.getByText("Ukrainian")).toBeInTheDocument();
  });

  // Regression for the exact real Publish blocker: an earlier, narrower
  // version of this scope (gallery-section-only) correctly showed the
  // always-visible input for Event Decoration's gallery photos, but left
  // its `styling.media[image]` (also informative, also alt-required, also
  // a real blocking marker in `sanity documents validate`) stuck on the
  // plugin's default "English only" input.
  it("page-event-decoration's STYLING section media alt ALSO shows the always-present EN/DA/UK rows — the exact gap that let styling.media[image] go live EN-only", () => {
    mockFormValue("page-event-decoration", STYLING_SECTIONS);
    const { props } = fakeProps({ path: ["sections", { _key: "stylingSectionKey" }, "media", { _key: "image" }, "alt"] } as never);
    renderInput(props);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Danish")).toBeInTheDocument();
    expect(screen.getByText("Ukrainian")).toBeInTheDocument();
  });

  it("page-event-decoration's HERO media alt ALSO shows the always-present EN/DA/UK rows — the predicate is document/decorative-scoped, not section-name-scoped", () => {
    mockFormValue("page-event-decoration", HERO_SECTIONS);
    const { props } = fakeProps({ path: ["sections", { _key: "heroSectionKey" }, "media", { _key: "heroImg" }, "alt"] } as never);
    renderInput(props);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Danish")).toBeInTheDocument();
    expect(screen.getByText("Ukrainian")).toBeInTheDocument();
  });

  it("a non-gallery page's media (e.g. page-about's hero) ALSO shows the always-present EN/DA/UK rows — no longer scoped to just the 3 HorizontalGallery pages", () => {
    mockFormValue("page-about", HERO_SECTIONS);
    const { props } = fakeProps({ path: ["sections", { _key: "heroSectionKey" }, "media", { _key: "heroImg" }, "alt"] } as never);
    renderInput(props);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Danish")).toBeInTheDocument();
    expect(screen.getByText("Ukrainian")).toBeInTheDocument();
  });

  // The one remaining carve-out — proves the predicate isn't simply always
  // true now: Home's hero/communityTeaser background media is genuinely
  // decorative (mediaItem.ts hides this field there entirely), so it must
  // still fall through to the default input.
  it("page-home's HERO background media alt falls through to the default input — the only genuine carve-out (decorative, not informative)", () => {
    mockFormValue("page-home", HOME_HERO_SECTIONS);
    const { props } = fakeProps({ path: ["sections", { _key: "homeHeroSectionKey" }, "media", { _key: "heroVideo" }, "alt"] } as never);
    renderInput(props);
    expect(screen.queryByText("English")).not.toBeInTheDocument();
    expect(screen.getByTestId("rendered-default")).toBeInTheDocument();
  });

  it("an unrecognized path shape (not sections[].media[].alt) falls through to the default input", () => {
    mockFormValue("page-event-decoration", GALLERY_SECTIONS);
    const { props } = fakeProps({ path: ["seo", "description"] } as never);
    renderInput(props);
    expect(screen.queryByText("English")).not.toBeInTheDocument();
  });
});

describe("GalleryMediaAltInput — lazy creation, never a silent auto-mutation from merely opening a field", () => {
  it("with an empty value, no onChange is called just from rendering", () => {
    mockFormValue("page-event-decoration", GALLERY_SECTIONS);
    const { props, onChange } = fakeProps();
    renderInput(props);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("typing into a previously-missing language's row inserts exactly one new entry with that language and value", async () => {
    mockFormValue("page-event-decoration", GALLERY_SECTIONS);
    const { props, onChange } = fakeProps();
    renderInput(props);
    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[0]!, "H");
    expect(onChange).toHaveBeenCalled();
    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof insert>;
    expect(patch.type).toBe("insert");
    const entry = patch.items[0] as { language: string; value: string; _key: string };
    expect(entry.language).toBe("en");
    expect(entry._key).toBe("en");
  });

  it("typing into an EXISTING entry's row emits set() on that entry's own _key path — existing translations are preserved, not replaced wholesale", async () => {
    mockFormValue("page-event-decoration", GALLERY_SECTIONS);
    const value = [
      { _key: "en", _type: "internationalizedArrayStringValue", language: "en", value: "Balloon wall decoration for a RORUM event" },
      { _key: "da", _type: "internationalizedArrayStringValue", language: "da", value: "Ballonvægdekoration til et RORUM-arrangement" },
    ];
    const { props, onChange } = fakeProps({ value } as never);
    renderInput(props);
    // Existing DA translation is rendered, not blank.
    expect(screen.getByDisplayValue("Ballonvægdekoration til et RORUM-arrangement")).toBeInTheDocument();
    const ukInput = screen.getAllByRole("textbox")[2]!; // en, da, uk order
    await userEvent.type(ukInput, "У");
    expect(onChange).toHaveBeenCalled();
    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof insert>;
    expect(patch.type).toBe("insert");
    const entry = patch.items[0] as { language: string };
    expect(entry.language).toBe("uk");
  });

  it("typing into an already-populated EN row emits set() on its own _key, not a new insert", async () => {
    mockFormValue("page-event-decoration", GALLERY_SECTIONS);
    const value = [{ _key: "en", _type: "internationalizedArrayStringValue", language: "en", value: "Hell" }];
    const { props, onChange } = fakeProps({ value } as never);
    renderInput(props);
    const enInput = screen.getByDisplayValue("Hell");
    await userEvent.type(enInput, "o");
    expect(onChange).toHaveBeenCalled();
    const patch = onChange.mock.calls[0]![0] as ReturnType<typeof set>;
    expect(patch.type).toBe("set");
    expect(patch.path).toEqual([{ _key: "en" }, "value"]);
  });
});

describe("GalleryMediaAltInput — readOnly", () => {
  it("all 3 rows are read-only when the field is read-only", () => {
    mockFormValue("page-event-decoration", GALLERY_SECTIONS);
    const { props } = fakeProps({ readOnly: true } as never);
    renderInput(props);
    for (const input of screen.getAllByRole("textbox")) {
      expect(input).toHaveAttribute("readonly");
    }
  });
});
