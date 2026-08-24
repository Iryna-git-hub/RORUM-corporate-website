import { describe, expect, it } from "vitest";
import { EMERGENCY_SEO_DESCRIPTION, EMERGENCY_SEO_TITLE, resolveSeo, resolveSeoField, type SeoFieldTier } from "./seoResolution";
import { PRODUCTION_ORIGIN } from "./siteIdentity";

describe("resolveSeoField — first non-empty tier wins, in the order given", () => {
  it("documentOverride wins when present, even with lower tiers also populated", () => {
    const tiers: SeoFieldTier[] = [
      { source: "documentOverride", value: "Manager's own title" },
      { source: "siteDefault", value: "Sitewide default title" },
      { source: "emergencyDefault", value: EMERGENCY_SEO_TITLE },
    ];
    expect(resolveSeoField(tiers)).toEqual({ value: "Manager's own title", source: "documentOverride" });
  });

  it("an empty documentOverride is skipped in favor of the next tier", () => {
    const tiers: SeoFieldTier[] = [
      { source: "documentOverride", value: "" },
      { source: "documentContent", value: "Generated from event title" },
      { source: "emergencyDefault", value: EMERGENCY_SEO_TITLE },
    ];
    expect(resolveSeoField(tiers)).toEqual({ value: "Generated from event title", source: "documentContent" });
  });

  it("a whitespace-only value counts as empty, same as a genuinely missing one", () => {
    const tiers: SeoFieldTier[] = [
      { source: "documentOverride", value: "   " },
      { source: "siteDefault", value: "Sitewide default" },
    ];
    expect(resolveSeoField(tiers)).toEqual({ value: "Sitewide default", source: "siteDefault" });
  });

  it("undefined/null tier values are treated the same as empty", () => {
    const tiers: SeoFieldTier[] = [
      { source: "documentOverride", value: undefined },
      { source: "pageDefault", value: null },
      { source: "siteDefault", value: "Sitewide default" },
    ];
    expect(resolveSeoField(tiers)).toEqual({ value: "Sitewide default", source: "siteDefault" });
  });

  it("emergency fallback is used only when every other tier is empty", () => {
    const tiers: SeoFieldTier[] = [
      { source: "documentOverride", value: "" },
      { source: "documentContent", value: "" },
      { source: "siteDefault", value: "" },
      { source: "emergencyDefault", value: EMERGENCY_SEO_TITLE },
    ];
    expect(resolveSeoField(tiers)).toEqual({ value: EMERGENCY_SEO_TITLE, source: "emergencyDefault" });
  });

  it("the resolved value is trimmed", () => {
    const tiers: SeoFieldTier[] = [{ source: "documentOverride", value: "  Padded title  " }];
    expect(resolveSeoField(tiers)).toEqual({ value: "Padded title", source: "documentOverride" });
  });

  it("site default is used only after document/page tiers, never before", () => {
    const tiers: SeoFieldTier[] = [
      { source: "documentOverride", value: "" },
      { source: "pageDefault", value: "The page's own approved default" },
      { source: "siteDefault", value: "Sitewide default" },
    ];
    expect(resolveSeoField(tiers)).toEqual({ value: "The page's own approved default", source: "pageDefault" });
  });
});

describe("resolveSeo — full {title, description, canonicalUrl} contract", () => {
  it("resolves title/description independently and builds the canonical URL from origin+path", () => {
    const result = resolveSeo({
      origin: PRODUCTION_ORIGIN,
      path: "/about",
      titleTiers: [{ source: "documentOverride", value: "About RORUM" }],
      descriptionTiers: [{ source: "siteDefault", value: "Sitewide description" }],
    });
    expect(result).toEqual({
      title: { value: "About RORUM", source: "documentOverride" },
      description: { value: "Sitewide description", source: "siteDefault" },
      canonicalUrl: "https://ro-rum.dk/about",
    });
  });

  it("home path '/' produces a canonical URL with no double slash", () => {
    const result = resolveSeo({
      origin: PRODUCTION_ORIGIN,
      path: "/",
      titleTiers: [{ source: "emergencyDefault", value: EMERGENCY_SEO_TITLE }],
      descriptionTiers: [{ source: "emergencyDefault", value: EMERGENCY_SEO_DESCRIPTION }],
    });
    expect(result.canonicalUrl).toBe("https://ro-rum.dk/");
  });
});

describe("EMERGENCY_SEO_TITLE / EMERGENCY_SEO_DESCRIPTION — the shared floor text", () => {
  it("both are non-empty — the true last resort must never itself be blank", () => {
    expect(EMERGENCY_SEO_TITLE.trim().length).toBeGreaterThan(0);
    expect(EMERGENCY_SEO_DESCRIPTION.trim().length).toBeGreaterThan(0);
  });
});
