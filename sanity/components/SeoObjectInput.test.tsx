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
import { plainTextToPortableText } from "@/lib/portableText";

const mockUseFormValue = vi.fn();
let mockSiteSettingsDoc: { defaultSeo?: { title?: unknown; description?: unknown; ogImage?: unknown } } | null = null;

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

// Deterministic stand-in for the real `@sanity/image-url`-backed builder
// (sanity/lib/image.ts) — real env vars (NEXT_PUBLIC_SANITY_PROJECT_ID/
// DATASET) aren't loaded under Vitest, so the real `urlForImage` would
// always return `undefined` regardless of input, making the image-priority
// chain untestable. This mock instead derives a predictable URL from the
// asset ref so each tier can be told apart in assertions.
vi.mock("@/sanity/lib/image", () => ({
  urlForImage: (source: { asset?: { _ref?: string } } | undefined | null) => {
    const ref = source?.asset?._ref;
    if (!ref) return undefined;
    return { width: (w: number) => ({ url: () => `https://cdn.test/${ref}-w${w}.jpg` }) };
  },
}));

function sanityImage(ref: string) {
  return { asset: { _ref: ref } };
}

function i18n(en?: string, da?: string, uk?: string) {
  const entries: { language: string; value: string }[] = [];
  if (en) entries.push({ language: "en", value: en });
  if (da) entries.push({ language: "da", value: da });
  if (uk) entries.push({ language: "uk", value: uk });
  return entries;
}

function bodyI18n(en?: string, da?: string, uk?: string) {
  return i18n(en, da, uk).map((entry) => ({ ...entry, value: plainTextToPortableText(entry.value) }));
}

function renderInput(props: ObjectInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <SeoObjectInput {...props} />
    </ThemeProvider>,
  );
}

function fakeProps(value: { title?: unknown; description?: unknown; ogImage?: unknown } | undefined) {
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
  eventFormattedDescription?: unknown;
  eventImage?: unknown;
}) {
  mockUseFormValue.mockImplementation((path: unknown[]) => {
    if (path.length === 1 && path[0] === "_type") return fields.documentType;
    if (path.length === 1 && path[0] === "pageKey") return fields.pageKey;
    if (path.length === 2 && path[0] === "slug" && path[1] === "current") return fields.slug;
    if (path.length === 1 && path[0] === "visibleLocales") return fields.visibleLocales;
    if (path.length === 1 && path[0] === "title") return fields.eventTitle;
    if (path.length === 1 && path[0] === "formattedDescription") return fields.eventFormattedDescription;
    if (path.length === 1 && path[0] === "image") return fields.eventImage;
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
  it("empty event.seo: title becomes '<event title> | RORUM', description derives from formattedDescription", () => {
    mockFormValue({
      documentType: "event",
      slug: "makers-dinner",
      visibleLocales: ["en", "da", "uk"],
      eventTitle: i18n("Makers Dinner", "Håndværkermiddag", "Вечеря майстрів"),
      eventFormattedDescription: bodyI18n("A cozy dinner for makers.", "En hyggelig middag.", "Затишна вечеря."),
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
      eventFormattedDescription: bodyI18n("A cozy dinner for makers."),
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

// Regression coverage for the fixed defect: this preview used to show only
// title/description/canonical, never the resolved social IMAGE — so a
// manager had no way to see, from Studio, which picture a shared link would
// actually carry (the real bug behind the reported broken Facebook preview:
// a leftover QA image would only surface once already published/shared).
// Mirrors the exact same documentOverride -> documentContent (events only)
// -> siteDefault -> emergencyDefault chain as title/description, run
// through the identical shared `resolveSeoField` (shared/seoResolution.ts).
describe("SeoObjectInput — resolved social image preview (documentOverride -> documentContent -> siteDefault -> emergencyDefault)", () => {
  it("shows this document's own seo.ogImage when set, labeled page-specific", () => {
    mockFormValue({ documentType: "page", pageKey: "about" });
    const { props } = fakeProps({ title: i18n("About"), ogImage: sanityImage("image-about-own") });
    renderInput(props);

    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain("image-about-own");
    expect(screen.getByText(/Page-specific social image/)).toBeInTheDocument();
  });

  it("an Event with no seo.ogImage falls back to the event's own photo, labeled generated from the event", () => {
    mockFormValue({
      documentType: "event",
      slug: "makers-dinner",
      visibleLocales: ["en"],
      eventTitle: i18n("Makers Dinner"),
      eventImage: sanityImage("image-event-photo"),
    });
    const { props } = fakeProps({ title: undefined, description: undefined, ogImage: undefined });
    renderInput(props);

    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain("image-event-photo");
    expect(screen.getByText(/Generated from the event's own photo/)).toBeInTheDocument();
  });

  it("falls back to the sitewide default image when neither the document nor (for events) its own photo has one", async () => {
    mockFormValue({ documentType: "page", pageKey: "about" });
    mockSiteSettingsDoc = { defaultSeo: { ogImage: sanityImage("image-site-default") } };
    const { props } = fakeProps({ title: i18n("About"), ogImage: undefined });
    renderInput(props);

    // The sitewide `siteSettings.defaultSeo` fetch (this component's own
    // `useEffect` + `useClient().fetch`) resolves asynchronously — before it
    // does, this tier is simply absent and the image already shows the
    // emergency placeholder on the very first render. `findByText` retries
    // until the fetched siteDefault lands and the preview re-renders.
    await screen.findByText(/Site default image/);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain("image-site-default");
  });

  it("falls back to the same emergency placeholder lib/seo.ts uses when absolutely nothing else is set", () => {
    mockFormValue({ documentType: "page", pageKey: "about" });
    mockSiteSettingsDoc = { defaultSeo: {} };
    const { props } = fakeProps({ title: i18n("About"), ogImage: undefined });
    renderInput(props);

    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toBe("https://ro-rum.dk/images/hero.jpg");
    expect(screen.getByText(/Emergency fallback image/)).toBeInTheDocument();
  });

  it("editing siteSettings itself never shows a circular 'site default' image tier", () => {
    mockFormValue({ documentType: "siteSettings" });
    const { props } = fakeProps({ title: i18n("Site"), ogImage: sanityImage("image-site-own") });
    renderInput(props);

    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain("image-site-own");
    expect(screen.getByText(/Site default social image/)).toBeInTheDocument();
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
