import { describe, expect, it } from "vitest";
import { SITE_ORIGIN, buildUrl, normalizeOrigin, resolveSiteOrigin } from "./siteIdentity";

describe("SITE_ORIGIN — resolved once from NEXT_PUBLIC_SITE_URL (fixed to https://ro-rum.dk for this test run by vitest.setup.ts)", () => {
  it("is a normalized HTTPS origin with no trailing slash", () => {
    expect(SITE_ORIGIN).toBe("https://ro-rum.dk");
    expect(SITE_ORIGIN.endsWith("/")).toBe(false);
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
  it("home path '/' produces exactly the origin plus '/' — no double slash", () => {
    expect(buildUrl(SITE_ORIGIN, "/")).toBe("https://ro-rum.dk/");
  });

  it("a normal path joins cleanly", () => {
    expect(buildUrl(SITE_ORIGIN, "/about")).toBe("https://ro-rum.dk/about");
  });

  it("an origin with a trailing slash still joins without doubling", () => {
    expect(buildUrl("https://ro-rum.dk/", "/about")).toBe("https://ro-rum.dk/about");
  });

  it("a path missing its leading slash is still joined correctly", () => {
    expect(buildUrl(SITE_ORIGIN, "about")).toBe("https://ro-rum.dk/about");
  });
});

describe("resolveSiteOrigin — accepts any public HTTPS origin, purely env-driven (no hardcoded domain anywhere in this function)", () => {
  it("accepts the real ro-rum.dk production origin", () => {
    expect(resolveSiteOrigin("https://ro-rum.dk")).toBe("https://ro-rum.dk");
  });

  it("accepts a Netlify-shaped preview/staging origin — never rejected the way the old resolveProductionOrigin used to", () => {
    expect(resolveSiteOrigin("https://rorum.netlify.app")).toBe("https://rorum.netlify.app");
  });

  it("accepts a *.netlify.live origin", () => {
    expect(resolveSiteOrigin("https://deploy-preview-12--rorum.netlify.live")).toBe(
      "https://deploy-preview-12--rorum.netlify.live",
    );
  });

  it("accepts an arbitrary future custom domain never seen by this codebase before", () => {
    expect(resolveSiteOrigin("https://future-example-domain.com")).toBe("https://future-example-domain.com");
  });

  it("normalizes a trailing slash", () => {
    expect(resolveSiteOrigin("https://ro-rum.dk/")).toBe("https://ro-rum.dk");
  });

  it("trims surrounding whitespace", () => {
    expect(resolveSiteOrigin("  https://ro-rum.dk  ")).toBe("https://ro-rum.dk");
  });

  it("rejects localhost — throws, never silently falls back", () => {
    expect(() => resolveSiteOrigin("http://localhost:3000")).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("rejects 127.0.0.1", () => {
    expect(() => resolveSiteOrigin("https://127.0.0.1")).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("rejects the IPv6 loopback [::1]", () => {
    expect(() => resolveSiteOrigin("https://[::1]:3000")).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("rejects a non-HTTPS (http://) origin", () => {
    expect(() => resolveSiteOrigin("http://ro-rum.dk")).toThrow(/https/i);
  });

  it("rejects a missing/undefined value with a clear error naming the env var", () => {
    expect(() => resolveSiteOrigin(undefined)).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("rejects an empty/whitespace-only value", () => {
    expect(() => resolveSiteOrigin("")).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => resolveSiteOrigin("   ")).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("rejects null the same as missing", () => {
    expect(() => resolveSiteOrigin(null)).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("rejects a malformed URL string with a clear error", () => {
    expect(() => resolveSiteOrigin("not a url")).toThrow(/valid/i);
  });

  it("rejects a value carrying a path — must be a bare origin", () => {
    expect(() => resolveSiteOrigin("https://ro-rum.dk/some/path")).toThrow(/bare origin/i);
  });

  it("rejects a value carrying a query string", () => {
    expect(() => resolveSiteOrigin("https://ro-rum.dk/?x=1")).toThrow(/bare origin/i);
  });

  // The strongest proof this resolver is purely env-driven, not the old
  // hardcoded-with-Netlify-rejected model: every one of these distinct,
  // legitimate public HTTPS origins round-trips through unchanged — nothing
  // here special-cases or rewrites any particular domain (production
  // included) to some other value.
  it("is purely env-driven: distinct valid origins each resolve to themselves, none rewritten to a hardcoded domain", () => {
    const candidates = [
      "https://ro-rum.dk",
      "https://rorum.netlify.app",
      "https://staging.example.com",
      "https://future-example-domain.com",
    ];
    for (const candidate of candidates) {
      expect(resolveSiteOrigin(candidate)).toBe(candidate);
    }
  });
});
