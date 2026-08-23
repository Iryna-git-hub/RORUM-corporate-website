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
    include: ["sanity/components/**/*.test.tsx", "sanity/**/*.unit.test.ts", "lib/**/*.test.ts", "components/**/*.test.tsx"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
