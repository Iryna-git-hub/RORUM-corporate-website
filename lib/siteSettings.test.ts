import { describe, expect, it, vi, beforeEach } from "vitest";

let mockIsSanityConfigured = true;
let mockSanityFetchResult: unknown = null;

vi.mock("@/sanity/env", () => ({
  get isSanityConfigured() {
    return mockIsSanityConfigured;
  },
  projectId: undefined,
  dataset: undefined,
}));
vi.mock("@/sanity/lib/live", () => ({
  sanityFetch: vi.fn(async () => ({ data: mockSanityFetchResult })),
}));

import { getSeoSiteDefaults } from "./siteSettings";
import { siteUrl as staticSiteUrl } from "./data";

function i18n(en: string) {
  return [{ _key: "en", language: "en", value: en }];
}

beforeEach(() => {
  mockIsSanityConfigured = true;
  mockSanityFetchResult = null;
});

describe("getSeoSiteDefaults — Sanity unavailable / siteSettings missing", () => {
  it("Sanity not configured: falls back to the static site URL, no defaults", async () => {
    mockIsSanityConfigured = false;
    const result = await getSeoSiteDefaults();
    expect(result).toEqual({ siteUrl: staticSiteUrl });
  });

  it("Sanity configured but siteSettings doc doesn't exist yet: same static fallback", async () => {
    mockSanityFetchResult = null;
    const result = await getSeoSiteDefaults();
    expect(result).toEqual({ siteUrl: staticSiteUrl });
  });
});

describe("getSeoSiteDefaults — manager-editable siteUrl", () => {
  it("a configured siteUrl overrides the static fallback", async () => {
    mockSanityFetchResult = { siteUrl: "https://example.com" };
    const result = await getSeoSiteDefaults();
    expect(result.siteUrl).toBe("https://example.com");
  });

  it("a blank/whitespace-only siteUrl still falls back to the static value (never an empty canonical authority)", async () => {
    mockSanityFetchResult = { siteUrl: "   " };
    const result = await getSeoSiteDefaults();
    expect(result.siteUrl).toBe(staticSiteUrl);
  });
});

describe("getSeoSiteDefaults — Default SEO passthrough", () => {
  it("passes through defaultSeo.title/description/ogImage.alt untouched (locale-picking happens in the caller)", async () => {
    mockSanityFetchResult = {
      siteUrl: "https://example.com",
      defaultSeo: {
        title: i18n("Default Title"),
        description: i18n("Default Description"),
        ogImage: { alt: i18n("Default Alt") },
      },
    };
    const result = await getSeoSiteDefaults();
    expect(result.title).toEqual(i18n("Default Title"));
    expect(result.description).toEqual(i18n("Default Description"));
    expect(result.imageAlt).toEqual(i18n("Default Alt"));
  });

  it("no defaultSeo.ogImage set: image is undefined, not a broken URL", async () => {
    mockSanityFetchResult = { siteUrl: "https://example.com" };
    const result = await getSeoSiteDefaults();
    expect(result.image).toBeUndefined();
  });
});
