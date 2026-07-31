// Throwaway visual-regression helper for the TS/Tailwind migration.
// Not imported by the app. Safe to delete once the migration is done.
//
// Usage:
//   node scripts/visual-qa.mjs --baseline   (capture screenshots into .qa/baseline)
//   node scripts/visual-qa.mjs --diff       (capture into .qa/current, diff vs .qa/baseline)
//
// Assumes a dev server is already running on http://localhost:3000.

import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { PNG } from "pngjs" ;

const BASE_URL = "http://localhost:3000";
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

const mode = process.argv.includes("--diff") ? "diff" : "baseline";
const outDir = path.resolve(
  process.cwd(),
  ".qa",
  mode === "diff" ? "current" : "baseline",
);

function routeToFilename(route, width) {
  const slug = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "_");
  return `${slug}--${width}.png`;
}

async function capture() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const failures = [];

  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        // Disable CSS transitions/animations wherever the site's own CSS
        // respects prefers-reduced-motion (it does, for .site-reveal), and
        // signal reduced motion to Playwright itself.
        reducedMotion: "reduce",
      });
      try {
        const res = await page.goto(`${BASE_URL}${route}`, {
          waitUntil: "networkidle",
          timeout: 30000,
        });
        if (!res || res.status() >= 400) {
          failures.push(`${route} @ ${width}px -> HTTP ${res?.status()}`);
        }

        // Neutralize the two known sources of run-to-run screenshot noise:
        // 1) next/font "swap" can paint a fallback font briefly before the
        //    real font is ready, shifting text metrics between runs.
        // 2) the home hero's autoplay/loop <video> is at a different frame
        //    every capture. Pause + rewind every <video> and force any
        //    scroll-reveal elements to their finished state so screenshots
        //    are deterministic regardless of animation/playback timing.
        await page.evaluate(async () => {
          await document.fonts.ready;
          document.querySelectorAll("video").forEach((video) => {
            video.pause();
            video.currentTime = 0;
          });
          document.querySelectorAll(".site-reveal").forEach((el) => {
            el.classList.add("is-site-reveal-visible");
          });
        });
        await page.waitForTimeout(150);

        const file = path.join(outDir, routeToFilename(route, width));
        await page.screenshot({ path: file, fullPage: true });
      } catch (err) {
        failures.push(`${route} @ ${width}px -> ${err.message}`);
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();

  if (failures.length) {
    console.error("Failures while capturing:\n" + failures.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(
      `Captured ${ROUTES.length * WIDTHS.length} screenshots into ${outDir}`,
    );
  }
}

async function diff() {
  const baselineDir = path.resolve(process.cwd(), ".qa", "baseline");
  if (!existsSync(baselineDir)) {
    console.error("No baseline found. Run with --baseline first.");
    process.exit(1);
  }
  await capture();

  let pixelmatch;
  try {
    ({ default: pixelmatch } = await import("pixelmatch"));
  } catch {
    console.log(
      "\npixelmatch not installed — skipping pixel diff, screenshots captured for manual comparison in .qa/current vs .qa/baseline.",
    );
    return;
  }

  const diffDir = path.resolve(process.cwd(), ".qa", "diff");
  await mkdir(diffDir, { recursive: true });
  let totalDiffPixels = 0;

  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      const name = routeToFilename(route, width);
      const beforePath = path.join(baselineDir, name);
      const afterPath = path.join(outDir, name);
      if (!existsSync(beforePath) || !existsSync(afterPath)) continue;

      const before = PNG.sync.read(await readFile(beforePath));
      const after = PNG.sync.read(await readFile(afterPath));
      const { width: w, height: h } = before;
      if (after.width !== w || after.height !== h) {
        console.log(`${name}: size changed (${w}x${h} -> ${after.width}x${after.height})`);
        continue;
      }
      const diffImg = new PNG({ width: w, height: h });
      const diffPixels = pixelmatch(before.data, after.data, diffImg.data, w, h, {
        threshold: 0.1,
      });
      if (diffPixels > 0) {
        totalDiffPixels += diffPixels;
        await writeFile(path.join(diffDir, name), PNG.sync.write(diffImg));
        console.log(`${name}: ${diffPixels} px diff`);
      }
    }
  }

  console.log(`\nTotal diff pixels across all screenshots: ${totalDiffPixels}`);
}

if (mode === "diff") {
  await diff();
} else {
  await capture();
}
