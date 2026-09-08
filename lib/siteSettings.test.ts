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
  // getSeoSiteDefaults reads via the build-safe published fetch (it feeds
  // sitemap.ts/robots.ts, which run without a request scope).
  sanityFetchStatic: vi.fn(async () => ({ data: mockSanityFetchResult })),
}));

import { getSeoSiteDefaults } from "./siteSettings";
import { PRODUCTION_ORIGIN } from "@/shared/siteIdentity";

function i18n(en: string) {
  return [{ _key: "en", language: "en", value: en }];
}

beforeEach(() => {
  mockIsSanityConfigured = true;
  mockSanityFetchResult = null;
});

describe("getSeoSiteDefaults — Sanity unavailable / siteSettings missing", () => {
  it("Sanity not configured: falls back to the canonical production origin, no defaults", async () => {
    mockIsSanityConfigured = false;
    const result = await getSeoSiteDefaults();
    expect(result).toEqual({ siteUrl: PRODUCTION_ORIGIN });
  });

  it("Sanity configured but siteSettings doc doesn't exist yet: same canonical fallback", async () => {
    mockSanityFetchResult = null;
    const result = await getSeoSiteDefaults();
    expect(result).toEqual({ siteUrl: PRODUCTION_ORIGIN });
  });
});

describe("getSeoSiteDefaults — siteUrl is infrastructure, not manager-editable content (domain-authority fix)", () => {
  it("a stored siteSettings.siteUrl value is completely ignored — the canonical production origin always wins", async () => {
    mockSanityFetchResult = { siteUrl: "https://example.com" };
    const result = await getSeoSiteDefaults();
    expect(result.siteUrl).toBe(PRODUCTION_ORIGIN);
  });

  it("even a stale/wrong stored siteUrl (e.g. the old no-hyphen domain) can never leak into canonical/hreflang/sitemap URLs", async () => {
    mockSanityFetchResult = { siteUrl: "https://rorum.dk" };
    const result = await getSeoSiteDefaults();
    expect(result.siteUrl).toBe(PRODUCTION_ORIGIN);
  });

  it("a blank/whitespace-only siteUrl also resolves to the canonical origin, same as any other stored value", async () => {
    mockSanityFetchResult = { siteUrl: "   " };
    const result = await getSeoSiteDefaults();
    expect(result.siteUrl).toBe(PRODUCTION_ORIGIN);
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
