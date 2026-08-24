import { describe, expect, it } from "vitest";
import { PRODUCTION_ORIGIN, buildUrl, isProductionOrigin, normalizeOrigin, resolveProductionOrigin } from "./siteIdentity";

describe("PRODUCTION_ORIGIN — the one canonical production origin", () => {
  it("is exactly https://ro-rum.dk, not the wrong no-hyphen domain", () => {
    expect(PRODUCTION_ORIGIN).toBe("https://ro-rum.dk");
  });

  it("has no trailing slash", () => {
    expect(PRODUCTION_ORIGIN.endsWith("/")).toBe(false);
  });
});

describe("normalizeOrigin — trailing-slash normalization can never produce a double slash", () => {
  it("strips a single trailing slash", () => {
    expect(normalizeOrigin("https://ro-rum.dk/")).toBe("https://ro-rum.dk");
  });

  it("strips multiple trailing slashes", () => {
    expect(normalizeOrigin("https://ro-rum.dk///")).toBe("https://ro-rum.dk");
  });

  it("leaves an already-normalized origin untouched", () => {
    expect(normalizeOrigin("https://ro-rum.dk")).toBe("https://ro-rum.dk");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeOrigin("  https://ro-rum.dk  ")).toBe("https://ro-rum.dk");
  });
});

describe("buildUrl — origin + path joins with exactly one slash", () => {
  it("home path '/' produces exactly https://ro-rum.dk/ — no double slash", () => {
    expect(buildUrl(PRODUCTION_ORIGIN, "/")).toBe("https://ro-rum.dk/");
  });

  it("a normal path joins cleanly", () => {
    expect(buildUrl(PRODUCTION_ORIGIN, "/about")).toBe("https://ro-rum.dk/about");
  });

  it("an origin with a trailing slash still joins without doubling", () => {
    expect(buildUrl("https://ro-rum.dk/", "/about")).toBe("https://ro-rum.dk/about");
  });

  it("a path missing its leading slash is still joined correctly", () => {
    expect(buildUrl(PRODUCTION_ORIGIN, "about")).toBe("https://ro-rum.dk/about");
  });
});

describe("isProductionOrigin", () => {
  it("true for the exact canonical origin", () => {
    expect(isProductionOrigin("https://ro-rum.dk")).toBe(true);
  });

  it("true for a trailing-slash variant (normalized before comparing)", () => {
    expect(isProductionOrigin("https://ro-rum.dk/")).toBe(true);
  });

  it("false for the wrong no-hyphen domain", () => {
    expect(isProductionOrigin("https://rorum.dk")).toBe(false);
  });

  it("false for a non-secure origin", () => {
    expect(isProductionOrigin("http://ro-rum.dk")).toBe(false);
  });
});

describe("resolveProductionOrigin — the one resolver, defensive against bad input", () => {
  it("no override at all: falls back to the canonical origin", () => {
    expect(resolveProductionOrigin(undefined)).toBe(PRODUCTION_ORIGIN);
    expect(resolveProductionOrigin(null)).toBe(PRODUCTION_ORIGIN);
    expect(resolveProductionOrigin("")).toBe(PRODUCTION_ORIGIN);
    expect(resolveProductionOrigin("   ")).toBe(PRODUCTION_ORIGIN);
  });

  it("a valid https override is honored and normalized", () => {
    expect(resolveProductionOrigin("https://staging.example.com/")).toBe("https://staging.example.com");
  });

  it("rejects a localhost override — falls back to canonical, never trusts it", () => {
    expect(resolveProductionOrigin("http://localhost:3000")).toBe(PRODUCTION_ORIGIN);
  });

  it("rejects a Netlify preview override — falls back to canonical", () => {
    expect(resolveProductionOrigin("https://deploy-preview-12--rorum.netlify.app")).toBe(PRODUCTION_ORIGIN);
  });

  it("rejects a non-HTTPS override — falls back to canonical", () => {
    expect(resolveProductionOrigin("http://ro-rum.dk")).toBe(PRODUCTION_ORIGIN);
  });

  it("rejects a garbage/malformed override — falls back to canonical rather than emitting broken URLs", () => {
    expect(resolveProductionOrigin("not a url")).toBe(PRODUCTION_ORIGIN);
  });

  it("nothing in this codebase currently passes an override in — every real call site resolves the bare canonical origin", () => {
    expect(resolveProductionOrigin()).toBe(PRODUCTION_ORIGIN);
  });
});
