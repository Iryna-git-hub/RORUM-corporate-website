import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { DRAFT_MODE_DISABLE_ROUTE, DRAFT_MODE_ENABLE_ROUTE, PREVIEW_ORIGIN } from "@/sanity/lib/presentation";
import { LEGAL_PAGE_KEY_ROUTES, PAGE_KEY_ROUTES, routeForPageKey } from "@/shared/pageRoutes";

// ---------------------------------------------------------------------------
// Security / isolation contract for the Presentation Tool + Draft Mode feature
// (Part 29). These assert against the real source on disk, so a regression that
// re-introduces token exposure fails the normal `npm run test:unit` run.
// ---------------------------------------------------------------------------

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf-8");

/** All first-party .ts/.tsx that ends up in the Next.js runtime (NOT scripts/, NOT tests). */
function runtimeSourceFiles(): string[] {
  const out: string[] = [];
  const skipDir = new Set(["node_modules", ".next", ".next-prodtest", "scripts", "tests"]);
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") && entry.name !== ".") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!skipDir.has(entry.name)) walk(full);
      } else if (/\.(tsx?|jsx?)$/.test(entry.name) && !/\.(test|unit\.test|spec)\.[tj]sx?$/.test(entry.name)) {
        out.push(full);
      }
    }
  };
  for (const d of ["app", "components", "lib", "shared", "sanity"]) walk(path.join(ROOT, d));
  // sanity.config.ts / proxy.ts / next.config.js live at the repo root
  for (const f of ["sanity.config.ts", "sanity.cli.ts", "proxy.ts"]) out.push(path.join(ROOT, f));
  return out;
}

describe("Draft Mode security contract — token exposure", () => {
  it("no NEXT_PUBLIC_* variable is ever used for a Sanity token, anywhere in first-party source", () => {
    const offenders: string[] = [];
    const walkAll = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (["node_modules", ".next", ".next-prodtest", ".git"].includes(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkAll(full);
        else if (/\.(tsx?|jsx?|mjs|md)$/.test(entry.name)) {
          const src = readFileSync(full, "utf-8");
          if (/NEXT_PUBLIC_[A-Z_]*(TOKEN|SECRET|API_READ|API_WRITE)/.test(src)) offenders.push(path.relative(ROOT, full));
        }
      }
    };
    walkAll(ROOT);
    expect(offenders).toEqual([]);
  });

  it("SANITY_API_WRITE_TOKEN is never referenced by Next.js runtime source (only scripts/ + tests/ may touch it)", () => {
    const offenders = runtimeSourceFiles().filter((f) => readFileSync(f, "utf-8").includes("SANITY_API_WRITE_TOKEN"));
    expect(offenders.map((f) => path.relative(ROOT, f))).toEqual([]);
  });

  it("the read token is only referenced where drafts are actually authenticated (live + the enable route)", () => {
    const referencing = runtimeSourceFiles()
      .filter((f) => readFileSync(f, "utf-8").includes("SANITY_API_READ_TOKEN"))
      .map((f) => path.relative(ROOT, f).replace(/\\/g, "/"))
      .sort();
    expect(referencing).toEqual(["app/api/draft-mode/enable/route.ts", "sanity/lib/live.ts"]);
  });

  it("sanity/lib/live.ts uses the SAME read-only Viewer token for serverToken and browserToken, never the write token", () => {
    const src = read("sanity/lib/live.ts");
    // both tokens come from the one `readToken` const, which is SANITY_API_READ_TOKEN
    expect(src).toMatch(/const readToken = process\.env\.SANITY_API_READ_TOKEN/);
    expect(src).toMatch(/serverToken:\s*readToken/);
    expect(src).toMatch(/browserToken:\s*readToken/);
    expect(src).not.toMatch(/WRITE_TOKEN/);
  });

  it("the root layout only ships browserToken to the browser in Draft Mode (SanityLive includeDrafts is gated)", () => {
    const layout = read("app/[locale]/layout.tsx");
    expect(layout).toMatch(/<SanityLive includeDrafts=\{showDraftTools\}/);
    expect(layout).toMatch(/showDraftTools = isSanityConfigured && isDraftMode/);
  });

  it("the shared published client (sanity/lib/client.ts) never attaches a token", () => {
    const src = read("sanity/lib/client.ts");
    expect(src).not.toMatch(/\btoken\s*:/);
    expect(src).not.toMatch(/SANITY_API_(READ|WRITE)_TOKEN/);
  });

  it("the enable route authenticates with the READ token on a short-lived derived client, not the shared one", () => {
    const src = read("app/api/draft-mode/enable/route.ts");
    expect(src).toMatch(/defineEnableDraftMode/);
    expect(src).toMatch(/getClient\(\)\.withConfig\(\{\s*token[^}]*\}\)/s);
    expect(src).toMatch(/process\.env\.SANITY_API_READ_TOKEN/);
    // never reads a write token from the environment
    expect(src).not.toMatch(/process\.env\.\w*WRITE\w*/);
  });
});

describe("Draft Mode security contract — .env.example", () => {
  const env = read(".env.example");

  it("documents SANITY_API_READ_TOKEN as the server-only preview token", () => {
    expect(env).toMatch(/^SANITY_API_READ_TOKEN=/m);
  });

  it("never suggests a NEXT_PUBLIC_ token, and the preview-origin var is explicitly not a secret", () => {
    expect(env).not.toMatch(/NEXT_PUBLIC_SANITY_API_(READ|WRITE)_TOKEN/);
    expect(env).toMatch(/^NEXT_PUBLIC_SANITY_PREVIEW_ORIGIN=/m);
  });
});

describe("Build-time queries never call draftMode() (generateStaticParams / sitemap / robots)", () => {
  it("sanity/lib/live.ts exports sanityFetchStatic pinned to published + stega:false", () => {
    const src = read("sanity/lib/live.ts");
    expect(src).toMatch(/export function sanityFetchStatic/);
    expect(src).toMatch(/perspective:\s*"published"/);
    expect(src).toMatch(/stega:\s*false/);
  });

  it("generateStaticParams / sitemap / SEO-site-defaults use sanityFetchStatic, not the request-aware sanityFetch", () => {
    const slug = read("app/[locale]/(site)/events/[slug]/page.tsx");
    // the generateStaticParams body must not call the bare sanityFetch
    const gsp = slug.slice(slug.indexOf("export async function generateStaticParams"));
    expect(gsp).toMatch(/sanityFetchStatic\(\{\s*query:\s*allEventSlugsQuery/);
    expect(gsp.slice(0, gsp.indexOf("}")).match(/\bsanityFetch\(/)).toBeNull();

    expect(read("app/sitemap.ts")).not.toMatch(/[^a-zA-Z]sanityFetch\(/);
    expect(read("app/sitemap.ts")).toMatch(/sanityFetchStatic\(/);
    expect(read("lib/siteSettings.ts")).toMatch(/sanityFetchStatic\(/);
    expect(read("lib/siteSettings.ts")).not.toMatch(/[^a-zA-Z]sanityFetch\(/);
  });
});

describe("Stega does not break the resolver layer (Visual Editing overlays + Draft Mode localization)", () => {
  it("stegaFilter excludes every structural discriminator the resolvers match with ===", () => {
    const src = read("sanity/lib/stegaFilter.ts");
    for (const field of ["sectionKey", "sectionKind", "itemKey", "actionKey", "kind"]) {
      expect(src, `stegaFilter must list ${field}`).toContain(`"${field}"`);
    }
  });

  it("the Live client wires stegaFilter into stega config", () => {
    expect(read("sanity/lib/live.ts")).toMatch(/stega:\s*\{\s*studioUrl:\s*"\/studio",\s*filter:\s*stegaFilter\s*\}/);
  });

  it("no page body fetch opts out of stega with stega:false (only metadata/JSON-LD/social may)", () => {
    // catering was the one page-body fetch that passed stega:false as a
    // workaround for the discriminator bug — now fixed by stegaFilter.
    const catering = read("app/[locale]/(site)/catering/page.tsx");
    expect(catering).not.toMatch(/pageByKeyQuery[^)]*stega:\s*false/s);
  });
});

describe("Draft Mode wiring — Presentation points at the secure enable route", () => {
  it("sanity.config.ts enables preview mode via the shared DRAFT_MODE_ENABLE_ROUTE constant", () => {
    const cfg = read("sanity.config.ts");
    expect(cfg).toMatch(/presentationTool\(/);
    expect(cfg).toMatch(/previewMode:\s*\{\s*enable:\s*DRAFT_MODE_ENABLE_ROUTE\s*\}/);
  });

  it("the enable/disable routes exist at the paths the constants name", () => {
    expect(DRAFT_MODE_ENABLE_ROUTE).toBe("/api/draft-mode/enable");
    expect(DRAFT_MODE_DISABLE_ROUTE).toBe("/api/draft-mode/disable");
    expect(() => read("app/api/draft-mode/enable/route.ts")).not.toThrow();
    expect(() => read("app/api/draft-mode/disable/route.ts")).not.toThrow();
  });

  it("PREVIEW_ORIGIN is undefined unless NEXT_PUBLIC_SANITY_PREVIEW_ORIGIN is set (relative '/' default)", () => {
    // Nothing sets it in the unit-test env, so it must be undefined here.
    expect(PREVIEW_ORIGIN).toBeUndefined();
  });
});

describe("shared/pageRoutes — Presentation location map", () => {
  it("maps the pages the Presentation preview needs, and omits routeless cateringMenuExamples", () => {
    expect(PAGE_KEY_ROUTES.home).toBe("/");
    expect(PAGE_KEY_ROUTES.about).toBe("/about");
    expect(PAGE_KEY_ROUTES.events).toBe("/events");
    expect(PAGE_KEY_ROUTES).not.toHaveProperty("cateringMenuExamples");
  });

  it("routeForPageKey resolves page vs legalPage and rejects unknown types/keys", () => {
    expect(routeForPageKey("page", "about")).toBe("/about");
    expect(routeForPageKey("legalPage", "privacy-policy")).toBe("/privacy-policy");
    expect(routeForPageKey("page", "nope")).toBeUndefined();
    expect(routeForPageKey("event", "whatever")).toBeUndefined();
    expect(routeForPageKey("page", undefined)).toBeUndefined();
  });

  it("stays consistent with the legacy route copies (sitemap.ts / SeoObjectInput.tsx)", () => {
    // These two files keep private copies of the same route map by earlier
    // design — assert every route in the shared map is still present in both
    // so the duplication can't silently drift.
    const sitemap = read("app/sitemap.ts");
    const seoInput = read("sanity/components/SeoObjectInput.tsx");
    const routes = [...Object.values(PAGE_KEY_ROUTES), ...Object.values(LEGAL_PAGE_KEY_ROUTES)].filter((r) => r !== "/");
    for (const route of routes) {
      expect(sitemap, `sitemap.ts missing ${route}`).toContain(`"${route}"`);
      expect(seoInput, `SeoObjectInput.tsx missing ${route}`).toContain(`"${route}"`);
    }
  });
});
