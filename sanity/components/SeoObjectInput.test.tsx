// Component-level unit tests for the REAL SeoObjectInput code — mounts it
// with React Testing Library, mocking only `useFormValue`/`useClient` (same
// pattern as ContactDetailsOrderInput.test.tsx). Proves the Studio SEO
// preview shows the exact effective title/description/canonical URL (not an
// approximate placeholder), with manager-friendly source labels, and that an
// Event's locale selector respects `visibleLocales`.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ObjectInputProps } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { SeoObjectInput } from "./SeoObjectInput";

const mockUseFormValue = vi.fn();
let mockSiteSettingsDoc: { defaultSeo?: { title?: unknown; description?: unknown } } | null = null;

vi.mock("sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sanity")>();
  return {
    ...actual,
    useFormValue: (path: string[]) => mockUseFormValue(path),
    useClient: () => ({
      fetch: () => Promise.resolve(mockSiteSettingsDoc),
    }),
  };
});

function i18n(en?: string, da?: string, uk?: string) {
  const entries: { language: string; value: string }[] = [];
  if (en) entries.push({ language: "en", value: en });
  if (da) entries.push({ language: "da", value: da });
  if (uk) entries.push({ language: "uk", value: uk });
  return entries;
}

function renderInput(props: ObjectInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <SeoObjectInput {...props} />
    </ThemeProvider>,
  );
}

function fakeProps(value: { title?: unknown; description?: unknown } | undefined) {
  const renderDefault = vi.fn(() => <div data-testid="rendered-default" />);
  const props = {
    value,
    renderDefault,
    path: ["seo"],
    schemaType: { name: "seo", jsonType: "object" },
  } as unknown as ObjectInputProps;
  return { props, renderDefault };
}

function mockFormValue(fields: {
  documentType?: string;
  pageKey?: string;
  slug?: string;
  visibleLocales?: string[];
  eventTitle?: unknown;
  eventLongDescription?: unknown;
}) {
  mockUseFormValue.mockImplementation((path: unknown[]) => {
    if (path.length === 1 && path[0] === "_type") return fields.documentType;
    if (path.length === 1 && path[0] === "pageKey") return fields.pageKey;
    if (path.length === 2 && path[0] === "slug" && path[1] === "current") return fields.slug;
    if (path.length === 1 && path[0] === "visibleLocales") return fields.visibleLocales;
    if (path.length === 1 && path[0] === "title") return fields.eventTitle;
    if (path.length === 1 && path[0] === "longDescription") return fields.eventLongDescription;
    return undefined;
  });
}

beforeEach(() => {
  mockUseFormValue.mockReset();
  mockSiteSettingsDoc = null;
});
afterEach(() => {
  cleanup();
});

describe("SeoObjectInput — Home shows its actual populated page-specific values (not an approximate placeholder)", () => {
  it("EN: shows the real stored title/description and a manager-friendly 'page-specific' label, never 'your override'", () => {
    mockFormValue({ documentType: "page", pageKey: "home" });
    const { props } = fakeProps({
      title: i18n("RORUM | Real Home Title", "RORUM | Rigtig titel", "RORUM | Реальний заголовок"),
      description: i18n("Real home description.", "Rigtig beskrivelse.", "Реальний опис."),
    });
    renderInput(props);

    expect(screen.getByText("RORUM | Real Home Title")).toBeInTheDocument();
    expect(screen.getByText("Real home description.")).toBeInTheDocument();
    expect(screen.getAllByText(/Page-specific SEO value/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/your override/i)).not.toBeInTheDocument();
  });

  it("canonical preview uses https://ro-rum.dk, never the wrong no-hyphen domain", () => {
    mockFormValue({ documentType: "page", pageKey: "home" });
    const { props } = fakeProps({ title: i18n("Home"), description: i18n("Desc") });
    renderInput(props);

    expect(screen.getByText("https://ro-rum.dk/")).toBeInTheDocument();
    expect(screen.queryByText(/https:\/\/rorum\.dk/)).not.toBeInTheDocument();
  });
});

describe("SeoObjectInput — an Event with empty SEO fields shows the ACTUAL generated Event title/description, not a vague fallback notice", () => {
  it("empty event.seo: title becomes '<event title> | RORUM', description becomes the event's own longDescription", () => {
    mockFormValue({
      documentType: "event",
      slug: "makers-dinner",
      visibleLocales: ["en", "da", "uk"],
      eventTitle: i18n("Makers Dinner", "Håndværkermiddag", "Вечеря майстрів"),
      eventLongDescription: i18n("A cozy dinner for makers.", "En hyggelig middag.", "Затишна вечеря."),
    });
    const { props } = fakeProps({ title: undefined, description: undefined });
    renderInput(props);

    expect(screen.getByText("Makers Dinner | RORUM")).toBeInTheDocument();
    expect(screen.getByText("A cozy dinner for makers.")).toBeInTheDocument();
    expect(screen.getByText(/Generated from event title/)).toBeInTheDocument();
    expect(screen.getByText(/Generated from event description/)).toBeInTheDocument();
  });

  it("an Event WITH its own seo.title/description override shows that instead, labeled page-specific", () => {
    mockFormValue({
      documentType: "event",
      slug: "makers-dinner",
      visibleLocales: ["en"],
      eventTitle: i18n("Makers Dinner"),
      eventLongDescription: i18n("A cozy dinner for makers."),
    });
    const { props } = fakeProps({
      title: i18n("Custom Event SEO Title"),
      description: i18n("Custom event SEO description."),
    });
    renderInput(props);

    expect(screen.getByText("Custom Event SEO Title")).toBeInTheDocument();
    expect(screen.getByText("Custom event SEO description.")).toBeInTheDocument();
    expect(screen.getAllByText(/Page-specific SEO value/).length).toBeGreaterThan(0);
  });
});

describe("SeoObjectInput — no leftover technical placeholder text anywhere", () => {
  it("never renders '(not set for this language...)' regardless of document type", () => {
    mockFormValue({ documentType: "page", pageKey: "about" });
    const { props } = fakeProps({ title: undefined, description: undefined });
    renderInput(props);
    expect(screen.queryByText(/not set for this language/i)).not.toBeInTheDocument();
  });

  it("never renders the bare 'using fallback' wording without showing the actual fallback text", () => {
    mockFormValue({ documentType: "page", pageKey: "about" });
    const { props } = fakeProps({ title: undefined, description: undefined });
    renderInput(props);
    expect(screen.queryByText(/using fallback/i)).not.toBeInTheDocument();
    // The real fallback text (this page's approved default) is shown instead.
    expect(screen.getByText("About RORUM | Our Space, Purpose & Community")).toBeInTheDocument();
  });
});

describe("SeoObjectInput — Event locale selector respects visibleLocales", () => {
  it("an Event visible only in English/Ukrainian never offers Danish as a preview language", () => {
    mockFormValue({
      documentType: "event",
      slug: "uk-only-event",
      visibleLocales: ["en", "uk"],
      eventTitle: i18n("Only EN/UK", undefined, "Тільки EN/UK"),
    });
    const { props } = fakeProps({ title: undefined, description: undefined });
    renderInput(props);

    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ukrainian" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Danish" })).not.toBeInTheDocument();
  });

  it("a static page (page/legalPage) always offers all 3 locales, unaffected by visibleLocales", () => {
    mockFormValue({ documentType: "page", pageKey: "about" });
    const { props } = fakeProps({ title: i18n("About") });
    renderInput(props);

    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Danish" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ukrainian" })).toBeInTheDocument();
  });
});

describe("SeoObjectInput — empty-field honesty: distinguishes 'this field is empty' from 'the metadata is still valid'", () => {
  it("shows the explanatory note only when a tier below documentOverride actually supplied the value", () => {
    mockFormValue({ documentType: "page", pageKey: "faq" });
    const { props } = fakeProps({ title: undefined, description: undefined });
    renderInput(props);
    expect(screen.getByText(/still valid and is exactly what will be emitted/i)).toBeInTheDocument();
  });

  it("does not show the empty-field note when both title and description are genuine document overrides", () => {
    mockFormValue({ documentType: "page", pageKey: "faq" });
    const { props } = fakeProps({ title: i18n("Real title"), description: i18n("Real description") });
    renderInput(props);
    expect(screen.queryByText(/still valid and is exactly what will be emitted/i)).not.toBeInTheDocument();
  });
});

describe("SeoObjectInput — the default seo field editor is still rendered underneath the preview", () => {
  it("calls renderDefault so every schema-defined field still renders normally", () => {
    mockFormValue({ documentType: "page", pageKey: "home" });
    const { props, renderDefault } = fakeProps({ title: i18n("Home") });
    renderInput(props);
    expect(renderDefault).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("rendered-default")).toBeInTheDocument();
  });
});
