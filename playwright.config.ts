import { defineConfig, devices } from "@playwright/test";

// The test-runner Node process (unlike the `webServer` child process, which
// is `next start` and loads .env.local itself) doesn't get .env.local for
// free — needed once a spec talks to Sanity directly (see
// tests/cms-home-contract.spec.ts). Guarded: CI environments that already
// export real env vars have no .env.local file at all.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (e.g. CI with env vars already set) — nothing to load.
}

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Full default parallelism (~cpuCount/2) was enough to make the heaviest
  // page (home, with its hero video/images) occasionally miss the 30s
  // per-test timeout under contention; capping workers keeps runs
  // reliable without a meaningful time cost.
  workers: process.env.CI ? 2 : 4,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      // Fonts/subpixel antialiasing differ slightly run to run; this keeps
      // the check meaningful without flaking on noise below the visible
      // threshold established during the original migration (~100-270px
      // diffs were real regressions, this stays far below that).
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    },
  },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
