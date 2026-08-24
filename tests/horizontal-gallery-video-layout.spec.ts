import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * CSS-contract proof for HorizontalGallery's video rendering, independent of
 * live Sanity content — the 3 scoped galleries (Catering, Event Decoration,
 * Host at RORUM) currently have zero live video items (read-only audit,
 * see MIGRATION_REPORT.md), so a route-level Playwright test can't exercise
 * a real <video> today. This instead loads the project's actual
 * app/globals.css (the real, shipped rules — not a reimplementation) into a
 * minimal static fixture reproducing HorizontalGallery's exact video markup
 * (components/HorizontalGallery.tsx), and asserts the real computed styles
 * a browser applies: fixed aspect-ratio (no layout jump before metadata
 * arrives), object-fit: contain (never stretched/cropped), a neutral
 * background (never an image) behind both the loading and error states, and
 * no horizontal overflow at mobile/desktop widths.
 *
 * DOM-attribute-level proof (poster attribute absent, controls present,
 * loading/error state transitions) already lives in
 * components/HorizontalGallery.test.tsx (jsdom, event-driven) — this file
 * is deliberately layout-only, the split the project's own testing
 * convention calls for when jsdom can't render real CSS layout.
 */

const globalsCss = readFileSync(path.join(__dirname, "..", "app", "globals.css"), "utf-8");

function galleryFixtureHtml(videoInnerHtml: string): string {
  return `<!doctype html>
<html>
<body>
  <div class="horizontal-gallery">
    <div class="horizontal-gallery-frame">
      <div class="horizontal-gallery-track">
        <div class="horizontal-gallery-item horizontal-gallery-video-item" id="video-card">
          ${videoInnerHtml}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

const LOADING_STATE_HTML = `
  <video src="/clip.mp4" controls playsinline preload="metadata"></video>
  <div class="horizontal-gallery-video-loading">
    <div class="horizontal-gallery-video-loading-spinner"></div>
  </div>
`;

const ERROR_STATE_HTML = `
  <div class="horizontal-gallery-video-fallback" role="img" aria-label="A short clip">
    <p class="horizontal-gallery-video-fallback-message">Video unavailable</p>
  </div>
`;

for (const width of [375, 1440] as const) {
  test(`@${width}px — video card has a fixed 16:9 aspect ratio, no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.setContent(galleryFixtureHtml(LOADING_STATE_HTML));
    await page.addStyleTag({ content: globalsCss });

    const card = page.locator("#video-card");
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    // 16/9 ≈ 1.778 — allow a small tolerance for sub-pixel rounding.
    expect(box!.width / box!.height).toBeCloseTo(16 / 9, 1);

    const bodyOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(bodyOverflow).toBe(false);
  });
}

test("the <video> fills its card via object-fit: contain, never cover/fill/stretched", async ({ page }) => {
  await page.setContent(galleryFixtureHtml(LOADING_STATE_HTML));
  await page.addStyleTag({ content: globalsCss });

  const objectFit = await page.locator("#video-card video").evaluate((el) => getComputedStyle(el).objectFit);
  expect(objectFit).toBe("contain");
});

test("the video card's background is a plain color, not a background-image — never a poster/thumbnail", async ({ page }) => {
  await page.setContent(galleryFixtureHtml(LOADING_STATE_HTML));
  await page.addStyleTag({ content: globalsCss });

  const backgroundImage = await page.locator("#video-card").evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(backgroundImage).toBe("none");
});

test("the loading overlay has a neutral background and contains no <img>", async ({ page }) => {
  await page.setContent(galleryFixtureHtml(LOADING_STATE_HTML));
  await page.addStyleTag({ content: globalsCss });

  const overlay = page.locator("#video-card .horizontal-gallery-video-loading");
  await expect(overlay).toBeVisible();
  expect(await overlay.locator("img").count()).toBe(0);
  const backgroundImage = await overlay.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(backgroundImage).toBe("none");
});

test("the runtime-error fallback has no <img> and its card keeps the same neutral background, no distinct image surface", async ({ page }) => {
  await page.setContent(galleryFixtureHtml(ERROR_STATE_HTML));
  await page.addStyleTag({ content: globalsCss });

  const fallback = page.locator("#video-card .horizontal-gallery-video-fallback");
  await expect(fallback).toBeVisible();
  expect(await fallback.locator("img").count()).toBe(0);
  await expect(page.getByText("Video unavailable")).toBeVisible();

  const cardBackgroundImage = await page.locator("#video-card").evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(cardBackgroundImage).toBe("none");
});

test("the loading spinner respects prefers-reduced-motion (animation disabled)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setContent(galleryFixtureHtml(LOADING_STATE_HTML));
  await page.addStyleTag({ content: globalsCss });

  const animationName = await page
    .locator("#video-card .horizontal-gallery-video-loading-spinner")
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animationName).toBe("none");
});
