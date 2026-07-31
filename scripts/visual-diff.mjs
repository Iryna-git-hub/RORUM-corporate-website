// Throwaway visual-regression harness for the CSS->Tailwind migration.
// Not part of the permanent toolchain - removed again in Stage 8.
//
// Usage:
//   node scripts/visual-diff.mjs baseline   # capture into .qa/baseline
//   node scripts/visual-diff.mjs current    # capture into .qa/current, diff against baseline
//
// Assumes `next start` (or `next dev`) is already running on PORT below.

import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const PORT = process.env.QA_PORT || "3100";
const BASE_URL = `http://localhost:${PORT}`;
const ROOT = path.resolve(import.meta.dirname, "..");
const QA_DIR = path.join(ROOT, ".qa");

const ROUTES = [
  "/",
  "/about",
  "/catering",
  "/community-membership",
  "/contact",
  "/cookie-policy",
  "/event-decoration",
  "/events",
  "/events/copenhagen-makers-dinner",
  "/faq",
  "/host-at-rorum",
  "/privacy-policy",
  "/terms",
  "/volunteer",
  "/work-with-us",
];

const WIDTHS = [375, 768, 1440];
const HEIGHT = 1200;

function slugFor(route) {
  return route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-");
}

async function capture(dirName) {
  const outDir = path.join(QA_DIR, dirName);
  mkdirSync(outDir, { recursive: true });
  // Restrict to a single route via QA_ROUTE to keep peak memory low on this
  // machine (system was observed with <2.5GB free while a dev server + the
  // user's own browser were also running, which crashed the renderer
  // mid-batch). Caller loops over routes, relaunching the browser each time.
  const routeFilter = process.env.QA_ROUTE;
  const routes = routeFilter ? ROUTES.filter((r) => r === routeFilter) : ROUTES;
  const browser = await chromium.launch({
    args: ["--disable-gpu", "--disable-dev-shm-usage"],
  });

  for (const route of routes) {
    for (const width of WIDTHS) {
      const fileName = `${slugFor(route)}-${width}.png`;
      // Fresh page per screenshot - full-page captures of image-heavy routes
      // were accumulating enough memory in one long-lived page to crash the
      // renderer partway through the run.
      const page = await browser.newPage();
      try {
        await page.setViewportSize({ width, height: HEIGHT });
        try {
          await page.goto(`${BASE_URL}${route}`, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
          await page.waitForLoadState("load", { timeout: 10000 }).catch(() => {});
        } catch {
          // fall through - page may already be usable even if load timed out
        }
        // Hide anything time/animation dependent so repeated captures are deterministic.
        await page.addStyleTag({
          content: `
            *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
            video { visibility: hidden !important; }
            [data-nextjs-dev-tools-button], #__next-build-watcher, nextjs-portal { display: none !important; }
          `,
        });
        // Wait for every <img> (incl. next/image) to finish loading so lazy/fade-in
        // images don't get captured mid-load and produce false-positive diffs.
        await page
          .evaluate(() =>
            Promise.all(
              Array.from(document.images).map((img) =>
                img.complete
                  ? Promise.resolve()
                  : new Promise((resolve) => {
                      img.addEventListener("load", resolve, { once: true });
                      img.addEventListener("error", resolve, { once: true });
                    }),
              ),
            ),
          )
          .catch(() => {});
        await page.waitForTimeout(300);
        await page.screenshot({
          path: path.join(outDir, fileName),
          fullPage: true,
          timeout: 15000,
        });
      } catch (err) {
        console.error(`FAILED capturing ${fileName}: ${err.message.split("\n")[0]}`);
      } finally {
        await page.close().catch(() => {});
      }
    }
  }

  await browser.close();
  console.log(`Captured ${ROUTES.length * WIDTHS.length} screenshots into ${outDir}`);
}

function diff() {
  const baselineDir = path.join(QA_DIR, "baseline");
  const currentDir = path.join(QA_DIR, "current");
  const diffDir = path.join(QA_DIR, "diff");
  mkdirSync(diffDir, { recursive: true });

  const results = [];
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      const fileName = `${slugFor(route)}-${width}.png`;
      const baselinePath = path.join(baselineDir, fileName);
      const currentPath = path.join(currentDir, fileName);
      if (!existsSync(baselinePath) || !existsSync(currentPath)) {
        results.push({ fileName, status: "MISSING", diffPixels: null });
        continue;
      }
      const img1 = PNG.sync.read(readFileSync(baselinePath));
      const img2 = PNG.sync.read(readFileSync(currentPath));
      if (img1.width !== img2.width || img1.height !== img2.height) {
        results.push({
          fileName,
          status: "SIZE_MISMATCH",
          diffPixels: null,
          detail: `${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`,
        });
        continue;
      }
      const { width: w, height: h } = img1;
      const diffImg = new PNG({ width: w, height: h });
      const diffPixels = pixelmatch(img1.data, img2.data, diffImg.data, w, h, {
        threshold: 0.15,
      });
      if (diffPixels > 0) {
        writeFileSync(path.join(diffDir, fileName), PNG.sync.write(diffImg));
      }
      results.push({ fileName, status: diffPixels > 0 ? "DIFF" : "OK", diffPixels });
    }
  }

  results.sort((a, b) => (b.diffPixels ?? 0) - (a.diffPixels ?? 0));
  for (const r of results) {
    console.log(
      `${r.status.padEnd(13)} ${r.fileName.padEnd(40)} ${r.diffPixels ?? r.detail ?? ""}`,
    );
  }
  const missing = results.filter((r) => r.status === "MISSING" || r.status === "SIZE_MISMATCH");
  if (missing.length) {
    console.log(`\n${missing.length} route(s) missing or size-mismatched.`);
  }
}

const mode = process.argv[2];
if (mode === "baseline") {
  await capture("baseline");
} else if (mode === "current") {
  await capture("current");
  if (!process.env.QA_ROUTE) diff();
} else if (mode === "diff") {
  diff();
} else {
  console.error("Usage: node scripts/visual-diff.mjs <baseline|current>");
  process.exit(1);
}
