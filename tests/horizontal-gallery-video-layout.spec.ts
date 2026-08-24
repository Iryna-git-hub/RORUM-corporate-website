import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * CSS-contract proof for HorizontalGallery's video rendering, independent of
 * live Sanity content — the 3 scoped galleries (Catering, Event Decoration,
 * Host at RORUM) currently have zero live video items (read-only audit,
 * see MIGRATION_REPORT.md), so a route-level Playwright test can't exercise
 * a real <video> today. This instead loads the project's actual
 * app/globals.css (the real, shipped rules — not a reimplementation) into
 * minimal static fixtures reproducing HorizontalGallery's exact markup
 * (components/HorizontalGallery.tsx) for both the main-track preview card
 * and the Lightbox's active slide, and asserts the real computed styles a
 * browser applies: fixed aspect-ratio (no layout jump before metadata
 * arrives), object-fit: contain in both places (never stretched/cropped,
 * and — for the Lightbox specifically — never the desktop image-only
 * object-fit: cover rule), a neutral background (never an image) behind
 * every state, pointer-events explicitly disabled on non-interactive
 * previews, and no horizontal overflow at mobile/desktop widths.
 *
 * DOM-attribute-level proof (poster attribute absent, controls
 * present/absent per context, loading/error state transitions, opener
 * button semantics, pause-on-navigate) already lives in
 * components/HorizontalGallery.test.tsx (jsdom, event-driven) — this file
 * is deliberately layout-only, the split the project's own testing
 * convention calls for when jsdom can't render real CSS layout.
 */

const globalsCss = readFileSync(path.join(__dirname, "..", "app", "globals.css"), "utf-8");

function withGlobalsCss(bodyHtml: string): string {
  return `<!doctype html>
<html>
<body>
  ${bodyHtml}
</body>
</html>`;
}

// Matches the real main-track card markup: a non-interactive preview
// <video> (no controls, aria-hidden, tabindex=-1) plus a sibling "Open
// video" button overlay — see HorizontalGallery.tsx's VideoWithState
// (interactive=false) and the opener <button>.
function mainTrackCardHtml(innerVideoOrFallback: string): string {
  return withGlobalsCss(`
  <div class="horizontal-gallery">
    <div class="horizontal-gallery-frame">
      <div class="horizontal-gallery-track">
        <div class="horizontal-gallery-item horizontal-gallery-video-item" id="video-card">
          ${innerVideoOrFallback}
          <button type="button" class="horizontal-gallery-video-opener" aria-label="Open video: A short clip">
            <span class="horizontal-gallery-video-opener-icon" aria-hidden="true">▶</span>
          </button>
        </div>
      </div>
    </div>
  </div>`);
}

const MAIN_TRACK_LOADING_HTML = `
  <video src="/clip.mp4" playsinline preload="metadata" tabindex="-1" aria-hidden="true" class="horizontal-gallery-video-preview"></video>
  <div class="horizontal-gallery-video-loading">
    <div class="horizontal-gallery-video-loading-spinner"></div>
  </div>
`;

const MAIN_TRACK_ERROR_HTML = `
  <div class="horizontal-gallery-video-fallback" aria-hidden="true">
    <p class="horizontal-gallery-video-fallback-message">Video unavailable</p>
  </div>
`;

// Matches the real Lightbox active-slide markup: a real, interactive
// <video controls> — see HorizontalGallery.tsx's VideoWithState
// (interactive=true) rendered inside `.gallery-lightbox-slide-active`.
function lightboxActiveSlideHtml(innerVideoOrFallback: string): string {
  return withGlobalsCss(`
  <div class="gallery-lightbox-slider">
    <div class="gallery-lightbox-slide gallery-lightbox-slide-active" id="active-slide">
      ${innerVideoOrFallback}
    </div>
  </div>`);
}

const LIGHTBOX_ACTIVE_VIDEO_HTML = `<video src="/clip.mp4" controls playsinline preload="metadata" aria-label="A short clip"></video>`;

for (const width of [375, 1440] as const) {
  test(`main track @${width}px — video card has a fixed 16:9 aspect ratio, no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.setContent(mainTrackCardHtml(MAIN_TRACK_LOADING_HTML));
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

test("main track — the preview <video> fills its card via object-fit: contain, never cover/fill/stretched", async ({ page }) => {
  await page.setContent(mainTrackCardHtml(MAIN_TRACK_LOADING_HTML));
  await page.addStyleTag({ content: globalsCss });

  const objectFit = await page.locator("#video-card video").evaluate((el) => getComputedStyle(el).objectFit);
  expect(objectFit).toBe("contain");
});

test("main track — the preview <video> has pointer-events disabled, so clicks fall through to the opener button", async ({ page }) => {
  await page.setContent(mainTrackCardHtml(MAIN_TRACK_LOADING_HTML));
  await page.addStyleTag({ content: globalsCss });

  const pointerEvents = await page.locator("#video-card video").evaluate((el) => getComputedStyle(el).pointerEvents);
  expect(pointerEvents).toBe("none");
});

test("main track — the opener button is a real element positioned over the whole card, not decorative", async ({ page }) => {
  await page.setContent(mainTrackCardHtml(MAIN_TRACK_LOADING_HTML));
  await page.addStyleTag({ content: globalsCss });

  const opener = page.getByRole("button", { name: "Open video: A short clip" });
  await expect(opener).toBeVisible();
  const openerBox = await opener.boundingBox();
  const cardBox = await page.locator("#video-card").boundingBox();
  expect(openerBox!.width).toBeCloseTo(cardBox!.width, 0);
  expect(openerBox!.height).toBeCloseTo(cardBox!.height, 0);
});

test("main track — the card's background is a plain color, not a background-image — never a poster/thumbnail", async ({ page }) => {
  await page.setContent(mainTrackCardHtml(MAIN_TRACK_LOADING_HTML));
  await page.addStyleTag({ content: globalsCss });

  const backgroundImage = await page.locator("#video-card").evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(backgroundImage).toBe("none");
});

test("main track — the loading overlay has a neutral background and contains no <img>", async ({ page }) => {
  await page.setContent(mainTrackCardHtml(MAIN_TRACK_LOADING_HTML));
  await page.addStyleTag({ content: globalsCss });

  const overlay = page.locator("#video-card .horizontal-gallery-video-loading");
  await expect(overlay).toBeVisible();
  expect(await overlay.locator("img").count()).toBe(0);
  const backgroundImage = await overlay.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(backgroundImage).toBe("none");
});

test("main track — the runtime-error fallback has no <img> and keeps the same neutral background", async ({ page }) => {
  await page.setContent(mainTrackCardHtml(MAIN_TRACK_ERROR_HTML));
  await page.addStyleTag({ content: globalsCss });

  const fallback = page.locator("#video-card .horizontal-gallery-video-fallback");
  await expect(fallback).toBeVisible();
  expect(await fallback.locator("img").count()).toBe(0);
  await expect(page.getByText("Video unavailable")).toBeVisible();

  const cardBackgroundImage = await page.locator("#video-card").evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(cardBackgroundImage).toBe("none");
});

test("main track — the loading spinner respects prefers-reduced-motion (animation disabled)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setContent(mainTrackCardHtml(MAIN_TRACK_LOADING_HTML));
  await page.addStyleTag({ content: globalsCss });

  const animationName = await page
    .locator("#video-card .horizontal-gallery-video-loading-spinner")
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animationName).toBe("none");
});

test("Lightbox active slide @1440px (desktop) — the video uses object-fit: contain, NOT the desktop image-only cover rule", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.setContent(lightboxActiveSlideHtml(LIGHTBOX_ACTIVE_VIDEO_HTML));
  await page.addStyleTag({ content: globalsCss });

  const objectFit = await page.locator("#active-slide video").evaluate((el) => getComputedStyle(el).objectFit);
  expect(objectFit).toBe("contain");
});

test("Lightbox active slide — the video has a neutral background for letterboxing, not an image", async ({ page }) => {
  await page.setContent(lightboxActiveSlideHtml(LIGHTBOX_ACTIVE_VIDEO_HTML));
  await page.addStyleTag({ content: globalsCss });

  const backgroundImage = await page.locator("#active-slide video").evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(backgroundImage).toBe("none");
  const backgroundColor = await page.locator("#active-slide video").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(backgroundColor).not.toBe("rgba(0, 0, 0, 0)"); // not transparent — a real neutral fill color is set
});

test("Lightbox active slide — the video's pointer-events remain enabled (controls must stay usable)", async ({ page }) => {
  await page.setContent(lightboxActiveSlideHtml(LIGHTBOX_ACTIVE_VIDEO_HTML));
  await page.addStyleTag({ content: globalsCss });

  const pointerEvents = await page.locator("#active-slide video").evaluate((el) => getComputedStyle(el).pointerEvents);
  expect(pointerEvents).not.toBe("none");
});

test("Lightbox neighbor (prev/next) slide — the video's pointer-events are disabled (never interactive, never intercepts a swipe)", async ({ page }) => {
  await page.setContent(
    withGlobalsCss(`
  <div class="gallery-lightbox-slider">
    <div class="gallery-lightbox-slide gallery-lightbox-slide-next" id="next-slide">
      <video src="/clip.mp4" playsinline preload="metadata" tabindex="-1" aria-hidden="true" class="horizontal-gallery-video-preview"></video>
    </div>
  </div>`),
  );
  await page.addStyleTag({ content: globalsCss });

  const pointerEvents = await page.locator("#next-slide video").evaluate((el) => getComputedStyle(el).pointerEvents);
  expect(pointerEvents).toBe("none");
});
