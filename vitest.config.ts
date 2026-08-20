import { defineConfig } from "vitest/config";
import path from "node:path";

// Component-level unit tests only (sanity/components/**/*.test.tsx) — the
// project's E2E/visual/CMS-contract coverage stays on Playwright
// (playwright.config.ts); this is a separate, narrow addition specifically
// for rendering real React component code (e.g. EventLocaleAwareInput) with
// mocked Sanity form hooks, which Playwright's browser-driven model can't
// reach without a live, authenticated Studio session.
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["sanity/components/**/*.test.tsx", "sanity/**/*.unit.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
