import { defineConfig } from "vitest/config";
import path from "node:path";

// Component-level unit tests (sanity/components/**/*.test.tsx) — the
// project's E2E/visual/CMS-contract coverage stays on Playwright
// (playwright.config.ts); this is a separate, narrow addition specifically
// for rendering real React component code (e.g. EventLocaleAwareInput) with
// mocked Sanity form hooks, which Playwright's browser-driven model can't
// reach without a live, authenticated Studio session. `lib/**/*.test.ts`
// covers plain-function unit tests (e.g. resolveCateringMenuCategories)
// that need no DOM/component rendering at all — same runner, no live
// Sanity fetch, so the "document missing" vs "document present but empty"
// data-state distinction is testable without mutating or reading live data.
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["sanity/components/**/*.test.tsx", "sanity/**/*.unit.test.ts", "lib/**/*.test.ts", "components/**/*.test.tsx", "shared/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // `server-only` is a build-time marker Next.js aliases to a no-op for
      // Server Components (and a throwing stub for Client Components). Next
      // handles it during `next build`; Vitest just needs it to resolve, so
      // point it at the same no-op Next uses server-side. The real
      // server/client boundary is still enforced by `next build`.
      "server-only": path.resolve(__dirname, "node_modules/next/dist/compiled/server-only/empty.js"),
    },
  },
});
