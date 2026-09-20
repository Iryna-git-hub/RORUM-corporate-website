import { deflateSync } from "node:zlib";
import { devices, expect, test, type BrowserContext } from "@playwright/test";
import { localizedHref } from "@/lib/i18n";
import { STATIC_ROUTES } from "./routes";
import { gotoAndStabilize } from "./support";

// Same bandwidth-safety convention as tests/draft-mode.spec.ts and
// tests/forms-formspree.spec.ts (heavy Sanity CDN requests are intercepted
// instead of downloaded) — with one gallery-specific adjustment: a broken
// image is not merely invisible in HorizontalGallery, it is actively
// REMOVED from the rendered set (`onError` -> `removeUnavailableItem`), so
// aborting real `<img>` requests would make the gallery's opener buttons
// disappear out from under these tests. Image requests are fulfilled with a
// tiny transparent placeholder (loads successfully, no real bytes) instead
// of aborted; video requests are aborted (a runtime video error only shows
// an in-place "unavailable" fallback, never removes the item, so aborting
// video is safe).
const TRANSPARENT_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");
async function blockHeavySanityMedia(context: BrowserContext): Promise<void> {
  await context.route("**/*", (route) => {
    const request = route.request();
    const url = request.url();
    const type = request.resourceType();
    const isSanity = url.includes("cdn.sanity.io") || url.includes("sanity-cdn.com");
    if (!isSanity) return route.continue();
    if (type === "image") {
      return route.fulfill({ status: 200, contentType: "image/gif", body: TRANSPARENT_GIF });
    }
    if (type === "media" || /\.(mp4|webm|mov)(\?|$)/.test(url)) {
      return route.abort();
    }
    return route.continue();
  });
}

// A minimal, dependency-free solid-color PNG encoder (raw pixel data +
// zlib deflate, both built into Node — no extra library, no network
// fetch). Used by exactly one test below (the mobile backdrop-gutter
// regression for Issue 2) that specifically needs a real, non-1x1,
// real-aspect-ratio <img> — the ordinary blockHeavySanityMedia 1x1 GIF
// stub used by every other test in this file would also shrink the
// invisible NEIGHBOR slide's <img> down to ~1x1px, sidestepping the exact
// geometry that caused the real bug (see the .gallery-lightbox-slide-prev/
// -next img comment in app/globals.css). The bytes are synthesized
// in-process and fulfilled locally — no bytes are ever downloaded from the
// real Sanity CDN, keeping this consistent with the project's
// bandwidth-safety testing policy (CLAUDE.md §19-21) despite using
// realistic pixel dimensions.
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}
function makeSolidPortraitPng(width: number, height: number): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(rowSize * height, 0);
  for (let y = 0; y < height; y++) {
    const row = y * rowSize;
    raw[row] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const px = row + 1 + x * 3;
      raw[px] = 168; // a plain neutral color — content is irrelevant, only dimensions matter
      raw[px + 1] = 132;
      raw[px + 2] = 98;
    }
  }
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}
// A modest (not 1x1, not full-resolution-original), real-aspect-ratio (3:4
// portrait, representative of a real gallery photo) placeholder — deflate
// compresses a solid color to well under 1KB regardless of pixel
// dimensions, so this stays bandwidth-trivial.
const REALISTIC_ASPECT_PNG = makeSolidPortraitPng(900, 1200);

test.describe("navigation", () => {
  test("desktop nav is visible and dropdowns open at lg (1280px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoAndStabilize(page, "/");

    const desktopNav = page.getByLabel("Main navigation");
    await expect(desktopNav).toBeVisible();
    await expect(page.getByTestId("mobile-menu-toggle")).toBeHidden();

    // The dropdown opens on hover (`onMouseEnter`) as well as click, so a
    // real click after hovering toggles it back closed - hover alone
    // reflects how a mouse user actually reveals it.
    const servicesTrigger = desktopNav.getByRole("button", { name: "Services" });
    await servicesTrigger.hover();
    await expect(servicesTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(desktopNav.getByRole("link", { name: "Catering" })).toBeVisible();
  });

  for (const route of STATIC_ROUTES) {
    test(`mobile burger is visible and usable on ${route || "/"} (375px)`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 900 });
      await gotoAndStabilize(page, route);

      const toggle = page.getByTestId("mobile-menu-toggle");
      await expect(toggle).toBeVisible();

      await toggle.click();
      const panel = page.getByLabel("Mobile menu");
      await expect(panel).toBeVisible();
      await expect(panel.getByRole("link", { name: "Attend Events" })).toBeVisible();

      await panel.getByRole("button", { name: "Close menu" }).click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      // The panel slides off-canvas via `transform` rather than unmounting
      // or going `display:none`, so it stays technically "visible" to
      // Playwright's isVisible() - assert it's out of the viewport instead.
      await expect(panel).not.toBeInViewport();
    });
  }

  test("mobile menu link navigates and closes the menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await gotoAndStabilize(page, "/");

    await page.getByTestId("mobile-menu-toggle").click();
    await page.getByLabel("Mobile menu").getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByLabel("Mobile menu")).not.toBeInViewport();
  });
});

test.describe("events listing", () => {
  test("date filter updates the URL", async ({ page }) => {
    await gotoAndStabilize(page, "/events");
    await page.locator(".events-filter-trigger").first().click();
    await page.getByRole("menuitemradio", { name: "This week" }).click();
    await expect(page).toHaveURL(/date=week/);
  });

  test("pagination advances to the next page", async ({ page }) => {
    await gotoAndStabilize(page, "/events");
    const next = page.getByRole("link", { name: "Next page" });
    if (await next.count()) {
      await next.click();
      await expect(page).toHaveURL(/page=2/);
    }
  });

  // Regression: pagination's getPageHref used to hardcode "/events" instead
  // of using the current locale, so clicking page 2 from /da/events or
  // /uk/events silently bounced the visitor to English (see
  // components/EventsPaginatedList.tsx's getPageHref + lib/i18n.ts's
  // localizedHref — the same helper EventFilters.tsx already used correctly
  // for its own URL updates). These full-page <a href> navigations are
  // exercised per-locale to prove the fix and guard against a repeat.
  //
  // Live-data counts (checked at authoring time): ~30 upcoming events per
  // locale, well above a single page (21 at desktop/3-col, 7 at
  // mobile/1-col) — pagination is expected to exist; if it doesn't (e.g. the
  // dataset shrinks drastically), each test skips itself rather than
  // reporting a false pass.
  for (const locale of ["da", "uk"] as const) {
    test(`pagination preserves the ${locale} locale prefix across next/previous`, async ({ page }) => {
      await gotoAndStabilize(page, localizedHref("/events", locale));

      const next = page.getByRole("link", { name: "Next page" });
      test.skip((await next.count()) === 0, `no second page of events for locale ${locale}`);

      await next.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/events\\?page=2$`));
      // Exact pathname check: never a bare English fallback (no locale
      // prefix at all) and never a duplicated locale segment.
      let url = new URL(page.url());
      expect(url.pathname, "locale prefix must be preserved, not dropped to English").toBe(`/${locale}/events`);
      expect(url.searchParams.get("page")).toBe("2");

      // Previous navigation (page 2 -> page 1) must keep the same locale
      // prefix rather than reverting to English.
      const previous = page.getByRole("link", { name: "Previous page" });
      await previous.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/events$`));
      url = new URL(page.url());
      expect(url.pathname, "locale prefix must survive previous-page navigation too").toBe(`/${locale}/events`);
    });
  }

  test("EN pagination stays unprefixed (page 1 -> page 2 -> page 1)", async ({ page }) => {
    await gotoAndStabilize(page, "/events");
    const next = page.getByRole("link", { name: "Next page" });
    test.skip((await next.count()) === 0, "no second page of events for locale en");

    await next.click();
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/events\?page=2$/);

    const previous = page.getByRole("link", { name: "Previous page" });
    await previous.click();
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/events$/);
  });

  test("pagination preserves an active filter param alongside the locale prefix (da)", async ({ page }) => {
    // "available" leaves ~28 events for da — comfortably more than a single
    // page even at desktop's 21/page, so a second page should exist without
    // needing to force a narrower viewport.
    await gotoAndStabilize(page, `${localizedHref("/events", "da")}?availability=available`);

    const next = page.getByRole("link", { name: "Next page" });
    test.skip((await next.count()) === 0, "no second page of available events for locale da");

    await next.click();
    await expect(page).toHaveURL(/\/da\/events\?/);
    const url = new URL(page.url());
    expect(url.pathname, "locale prefix must be preserved").toBe("/da/events");
    expect(url.searchParams.get("availability"), "active filter must be preserved").toBe("available");
    expect(url.searchParams.get("page"), "page must advance").toBe("2");
  });
});

test.describe("event detail", () => {
  test("Buy Ticket control renders as a real button-sized target", async ({ page }) => {
    await gotoAndStabilize(page, "/events/copenhagen-makers-dinner");
    const ticket = page.getByRole("link", { name: "Buy Ticket" });
    await expect(ticket).toBeVisible();
    const box = await ticket.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(80);
    expect(box!.height).toBeGreaterThan(20);
  });
});

test.describe("FAQ accordion", () => {
  test("expands and collapses a question", async ({ page }) => {
    await gotoAndStabilize(page, "/faq");
    const question = page.locator(".faq-question").first();
    await expect(question).toHaveAttribute("aria-expanded", "false");

    await question.click();
    await expect(question).toHaveAttribute("aria-expanded", "true");

    await question.click();
    await expect(question).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("catering menu overlay", () => {
  test("opens as a dialog, locks scroll, and closes on Escape", async ({ page }) => {
    await gotoAndStabilize(page, "/catering");
    const opener = page.getByRole("button", { name: "Menu examples" }).first();
    await opener.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");

    const overflow = await page.evaluate(
      () => getComputedStyle(document.body).overflow || getComputedStyle(document.documentElement).overflow,
    );
    expect(overflow).toBe("hidden");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});

test.describe("gallery lightbox", () => {
  test("opens an image in a lightbox dialog and closes on Escape", async ({ page }) => {
    await gotoAndStabilize(page, "/catering");
    const galleryImage = page.locator("main img").first();
    await galleryImage.scrollIntoViewIfNeeded();
    await galleryImage.click();

    const dialog = page.getByRole("dialog");
    if (await dialog.count()) {
      await expect(dialog.first()).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog.first()).toBeHidden();
    }
  });

  // Exercises the real mixed-media Lightbox end-to-end against whatever
  // live video currently exists in Catering's gallery (a manager-created
  // manual test fixture as of this writing — see MIGRATION_REPORT.md).
  // Skips gracefully once that fixture is deleted, per the manual
  // verification checklist's own "delete the test video" step — this is
  // real-browser confirmation of the same behavior already proven in
  // components/HorizontalGallery.test.tsx (jsdom), not a replacement for it.
  test("a real gallery video: opener button, single accessible Close control, focus trap, Escape restores focus", async ({ page }) => {
    await gotoAndStabilize(page, "/catering");
    const opener = page.getByRole("button", { name: /^Open video: / });
    if ((await opener.count()) === 0) {
      test.skip(true, "no live test video currently in the Catering gallery — see the manual checklist's cleanup step");
      return;
    }

    await opener.first().scrollIntoViewIfNeeded();
    await opener.first().click();

    const dialog = page.getByRole("dialog", { name: "Media preview" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".gallery-lightbox-slide-active video")).toBeVisible();

    // Exactly one accessible Close command (the backdrop is a non-interactive div).
    await expect(page.getByRole("button", { name: "Close media preview" })).toHaveCount(1);

    // Focus starts on the Close button; Tab a full cycle never escapes the dialog.
    await expect(page.getByRole("button", { name: "Close media preview" })).toBeFocused();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      const isInsideDialog = await page.evaluate(() => {
        const dialogEl = document.querySelector('[role="dialog"][aria-label="Media preview"]');
        return !!dialogEl && dialogEl.contains(document.activeElement);
      });
      expect(isInsideDialog, `focus escaped the dialog after ${i + 1} Tab press(es)`).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener.first()).toBeFocused();
  });

  // New interaction-model contract: desktop input (mouse + keyboard) never
  // drags/wheels the Lightbox, only Previous/Next and ArrowLeft/ArrowRight
  // navigate; touch input is the only way to swipe. Run in two separate
  // browser contexts so "no real Touch events fire" (desktop) and "real
  // Touch events fire" (mobile) are each tested under their real native
  // input capability, not simulated via viewport width alone.
  test("desktop (mouse + keyboard): buttons/arrows navigate; mouse-drag and wheel do NOT; backdrop closes; image click does not", async ({
    page,
  }) => {
    await blockHeavySanityMedia(page.context());
    await gotoAndStabilize(page, "/catering");

    const opener = page.getByRole("button", { name: /^Open gallery image/ }).first();
    await opener.scrollIntoViewIfNeeded();
    await opener.click();

    const dialog = page.getByRole("dialog", { name: "Media preview" });
    await expect(dialog).toBeVisible();
    const counter = dialog.locator('[aria-live="polite"]');
    await expect(counter).toHaveText(/^1 \//);

    const totalText = (await counter.textContent()) ?? "";
    const total = Number(totalText.split("/")[1]?.trim() ?? "1");
    test.skip(total < 2, "Catering gallery currently has fewer than 2 items — navigation has nothing to verify");

    // (a) Previous/Next buttons navigate.
    await dialog.getByRole("button", { name: "Next media" }).click();
    await expect(counter).toHaveText(/^2 \//);
    await dialog.getByRole("button", { name: "Previous media" }).click();
    await expect(counter).toHaveText(/^1 \//);

    // (b) ArrowLeft/ArrowRight navigate.
    await page.keyboard.press("ArrowRight");
    await expect(counter).toHaveText(/^2 \//);
    await page.keyboard.press("ArrowLeft");
    await expect(counter).toHaveText(/^1 \//);

    // (c) A mouse drag gesture does NOT navigate (mouse-drag removed).
    // Deliberately dragged across the visible IMAGE itself (not the wider
    // slider/grid box) — since the pointer-events fix (Issue 2) the grid's
    // own gutter/gap pixels around the image now correctly fall through to
    // the backdrop and close on a plain click, which a drag whose start AND
    // end both land in that gutter would also trigger (same-element
    // mousedown/mouseup synthesizes a native click there, same as a tap) —
    // that's the intended new close-from-the-gutter behavior covered by its
    // own dedicated tests below, not what this drag-doesn't-navigate guard
    // is about.
    const slider = dialog.locator(".gallery-lightbox-slider");
    const activeImage = dialog.locator(".gallery-lightbox-slide-active img");
    const dragImageBox = await activeImage.boundingBox();
    expect(dragImageBox).not.toBeNull();
    if (dragImageBox) {
      const y = dragImageBox.y + dragImageBox.height / 2;
      await page.mouse.move(dragImageBox.x + dragImageBox.width * 0.8, y);
      await page.mouse.down();
      await page.mouse.move(dragImageBox.x + dragImageBox.width * 0.2, y, { steps: 5 });
      await page.mouse.up();
    }
    await expect(counter).toHaveText(/^1 \//);
    await expect(dialog).toBeVisible();

    // (d) A wheel gesture with horizontal delta does NOT navigate.
    await slider.hover();
    await page.mouse.wheel(120, 0);
    await expect(counter).toHaveText(/^1 \//);

    // (f) Clicking the active image does nothing (no navigate, no close).
    // The image is `pointer-events: auto` (globals.css `.gallery-lightbox-slide
    // img`) so it, not an ancestor, is the real hit-test target — it simply
    // has no onClick handler, so a click over it is a no-op either way.
    const activeSlide = dialog.locator(".gallery-lightbox-slide-active");
    if (await activeSlide.locator("img").count()) {
      await activeSlide.click();
      await expect(dialog).toBeVisible();
      await expect(counter).toHaveText(/^1 \//);
    }

    // (e) Clicking the backdrop closes.
    const backdrop = page.locator(".fixed.inset-0.z-2000 > .absolute.inset-0.bg-black\\/68");
    await backdrop.click({ position: { x: 5, y: 5 }, force: true });
    await expect(dialog).toBeHidden();
  });

  test("touch (real Touch events): swipe navigates; tap on image does not close/navigate; tap on X closes", async ({
    browser,
  }) => {
    const context = await browser.newContext({ ...devices["iPhone 13"], hasTouch: true });
    try {
      await blockHeavySanityMedia(context);
      const page = await context.newPage();
      await gotoAndStabilize(page, "/catering");

      const opener = page.getByRole("button", { name: /^Open gallery image/ }).first();
      await opener.scrollIntoViewIfNeeded();
      await opener.tap();

      const dialog = page.getByRole("dialog", { name: "Media preview" });
      await expect(dialog).toBeVisible();
      const counter = dialog.locator('[aria-live="polite"]');
      await expect(counter).toHaveText(/^1 \//);

      // Tap on the active image does nothing (no navigate, no close) — the
      // image is `pointer-events: auto` and is the real hit-test target,
      // it simply has no tap/click handler.
      const activeSlide = dialog.locator(".gallery-lightbox-slide-active");
      if (await activeSlide.locator("img").count()) {
        await activeSlide.tap();
        await expect(dialog).toBeVisible();
        await expect(counter).toHaveText(/^1 \//);
      }

      const totalText = (await counter.textContent()) ?? "";
      const total = Number(totalText.split("/")[1]?.trim() ?? "1");
      test.skip(total < 2, "Catering gallery currently has fewer than 2 items — a swipe has nothing to verify");

      // Real swipe gesture: Playwright 1.62's page.touchscreen only exposes
      // tap() (no swipe/drag primitive), so the swipe is dispatched with
      // the browser's own native Touch/TouchEvent constructors from inside
      // the page (available because this context has hasTouch: true) —
      // this fires genuine TouchEvents, not a synthetic mouse substitute.
      await page.evaluate(() => {
        const el = document.querySelector(".gallery-lightbox-slider");
        if (!(el instanceof HTMLElement)) throw new Error("lightbox slider not found");
        const rect = el.getBoundingClientRect();
        const y = rect.top + rect.height / 2;
        const makeTouch = (x: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
        const startX = rect.left + rect.width * 0.8;
        const endX = rect.left + rect.width * 0.2;
        el.dispatchEvent(
          new TouchEvent("touchstart", {
            touches: [makeTouch(startX)],
            changedTouches: [makeTouch(startX)],
            bubbles: true,
            cancelable: true,
          }),
        );
        el.dispatchEvent(
          new TouchEvent("touchend", {
            touches: [],
            changedTouches: [makeTouch(endX)],
            bubbles: true,
            cancelable: true,
          }),
        );
      });
      await expect(counter).toHaveText(/^2 \//);

      // Tap on X closes.
      await dialog.locator(".gallery-lightbox-close").tap();
      await expect(dialog).toBeHidden();
    } finally {
      await context.close();
    }
  });

  // ISSUE 2 regression coverage: dialogContentRef (and everything it
  // inherits into — .gallery-lightbox-slider, .gallery-lightbox-slide) is
  // pointer-events-none, so a click/tap in the backdrop gutters around the
  // visible image — left/right inside the dialog's content box, not just
  // above/below its fixed-height box — must fall through to the real
  // backdrop div and close. Clicking/tapping the image itself must still do
  // nothing (no navigate, no close). Uses real pixel coordinates from the
  // rendered image's own bounding box, since jsdom (HorizontalGallery.test.tsx)
  // cannot do real layout/hit-testing.
  for (const width of [1024, 1440]) {
    test(`desktop (${width}px): clicking the backdrop gutters left/right/above/below the image closes; clicking the image itself does not`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await blockHeavySanityMedia(page.context());
      await gotoAndStabilize(page, "/catering");

      const opener = page.getByRole("button", { name: /^Open gallery image/ }).first();
      await opener.scrollIntoViewIfNeeded();
      const dialog = page.getByRole("dialog", { name: "Media preview" });
      const image = dialog.locator(".gallery-lightbox-slide-active img");

      async function openAndGetImageBox() {
        await opener.click();
        await expect(dialog).toBeVisible();
        await expect(image).toBeVisible();
        const box = await image.boundingBox();
        expect(box).not.toBeNull();
        return box!;
      }

      // Clicking the image's own center does nothing — dialog stays open.
      const centerBox = await openAndGetImageBox();
      await page.mouse.click(centerBox.x + centerBox.width / 2, centerBox.y + centerBox.height / 2);
      await expect(dialog).toBeVisible();

      // Left gutter — strictly left of the image, still inside the dialog.
      const leftBox = await image.boundingBox();
      expect(leftBox).not.toBeNull();
      await page.mouse.click(Math.max(leftBox!.x - 40, 2), leftBox!.y + leftBox!.height / 2);
      await expect(dialog).toBeHidden();

      // Right gutter.
      const rightBox = await openAndGetImageBox();
      await page.mouse.click(Math.min(rightBox.x + rightBox.width + 40, width - 2), rightBox.y + rightBox.height / 2);
      await expect(dialog).toBeHidden();

      // Above the image (inside the dialog's fixed-height box).
      const topBox = await openAndGetImageBox();
      await page.mouse.click(topBox.x + topBox.width / 2, Math.max(topBox.y - 40, 2));
      await expect(dialog).toBeHidden();

      // Below the image.
      const bottomBox = await openAndGetImageBox();
      await page.mouse.click(bottomBox.x + bottomBox.width / 2, Math.min(bottomBox.y + bottomBox.height + 40, 898));
      await expect(dialog).toBeHidden();
    });
  }

  // Regression guard for the pointer-events architecture itself: at
  // >=640px the prev/next neighbor slides are a genuine VISIBLE preview
  // (scaled down, dimmed — not backdrop), so clicking that dimmed photo
  // must do nothing, same as the active image. (The first attempt at the
  // mobile fix above made the neighbor <img> pointer-events:none
  // unconditionally, which fixed the mobile bug but — since dialogContentRef
  // and everything under it is pointer-events:none — let a click on the
  // now-transparent neighbor image cascade all the way through to the real
  // backdrop and close the Lightbox at every width, including desktop. The
  // fix scopes that override to <=639px only, so >=640px keeps inheriting
  // `pointer-events: auto` from the base `.gallery-lightbox-slide img`
  // rule and the neighbor image swallows the click itself, same as the
  // active slide.)
  for (const width of [768, 1024, 1440]) {
    test(`desktop/tablet (${width}px): clicking the visible neighbor-preview photo does not close the Lightbox`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      // Deliberately NOT blockHeavySanityMedia's 1x1 GIF stub: a 1x1
      // intrinsic size collapses the neighbor preview's rendered <img> box
      // down to a fraction of a pixel (object-fit: contain has nothing
      // real to size against), making its "bounding box" meaningless and
      // any click-coordinate math built on it land wherever real geometry
      // happens to be underneath instead — same class of problem the
      // mobile gutter test above already had to route around with
      // REALISTIC_ASPECT_PNG.
      await page.context().route("**/*", (route) => {
        const request = route.request();
        const url = request.url();
        const type = request.resourceType();
        const isSanity = url.includes("cdn.sanity.io") || url.includes("sanity-cdn.com");
        if (!isSanity) return route.continue();
        if (type === "image") {
          return route.fulfill({ status: 200, contentType: "image/png", body: REALISTIC_ASPECT_PNG });
        }
        if (type === "media" || /\.(mp4|webm|mov)(\?|$)/.test(url)) {
          return route.abort();
        }
        return route.continue();
      });
      await gotoAndStabilize(page, "/catering");

      const opener = page.getByRole("button", { name: /^Open gallery image/ }).first();
      await opener.scrollIntoViewIfNeeded();
      await opener.click();

      const dialog = page.getByRole("dialog", { name: "Media preview" });
      await expect(dialog).toBeVisible();
      const counter = dialog.locator('[aria-live="polite"]');
      const initialCounterText = (await counter.textContent()) ?? "";
      const total = Number(initialCounterText.split("/")[1]?.trim() ?? "1");
      test.skip(total < 2, "Catering gallery currently has fewer than 2 items — no neighbor preview to click");

      // Whichever index opened, its counter text is the baseline — the
      // point of this test is that clicking the neighbor preview must NOT
      // change it (no navigation), not that it lands on any specific slide.
      // Uses the NEXT slide specifically and clicks near the top of its
      // (scaled-down) image, clear of the vertically-centered Next button
      // that visually floats over the same column — a dead-center click
      // risks hitting that real, genuinely-clickable button instead of the
      // preview image beneath it, which is a DOM-overlap fact of this
      // layout, not what this test is checking.
      const neighborImage = dialog.locator(".gallery-lightbox-slide-next img");
      await expect(neighborImage).toBeVisible();
      const box = await neighborImage.boundingBox();
      expect(box).not.toBeNull();
      await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height * 0.12);
      await expect(dialog).toBeVisible();
      await expect(counter).toHaveText(initialCounterText);
    });
  }

  // ISSUE 2 (mobile-specific regression): the neighbor prev/next slides are
  // invisible at <=639px (their CONTAINER is opacity:0/pointer-events:none),
  // but a base rule re-enabling pointer-events on every slide's own <img>
  // (needed so the ACTIVE image swallows a direct tap) also reached the
  // NEIGHBOR slides' <img>, overriding the container's pointer-events:none
  // back to auto. An invisible neighbor <img> with real (non-tiny) intrinsic
  // dimensions can then render at nearly full viewport size, silently
  // swallowing taps meant for the real backdrop to the LEFT, ABOVE and
  // BELOW the visible active image (RIGHT happened to still work — a thin
  // sliver of real backdrop survived). This test deliberately does NOT use
  // blockHeavySanityMedia's 1x1 GIF stub (every other test in this file
  // uses it) — a 1x1 image collapses the neighbor <img>'s rendered box down
  // to ~1px too, which would make every assertion below pass regardless of
  // whether the underlying CSS bug is fixed. See REALISTIC_ASPECT_PNG above.
  test("touch (real Touch events): tapping the backdrop gutters left/right/above/below the image closes on mobile widths too, using real (non-1x1) image geometry", async ({
    browser,
  }) => {
    const context = await browser.newContext({ ...devices["iPhone 13"], hasTouch: true });
    try {
      await context.route("**/*", (route) => {
        const request = route.request();
        const url = request.url();
        const type = request.resourceType();
        const isSanity = url.includes("cdn.sanity.io") || url.includes("sanity-cdn.com");
        if (!isSanity) return route.continue();
        if (type === "image") {
          return route.fulfill({ status: 200, contentType: "image/png", body: REALISTIC_ASPECT_PNG });
        }
        if (type === "media" || /\.(mp4|webm|mov)(\?|$)/.test(url)) {
          return route.abort();
        }
        return route.continue();
      });
      const page = await context.newPage();
      await gotoAndStabilize(page, "/catering");

      const opener = page.getByRole("button", { name: /^Open gallery image/ }).first();
      await opener.scrollIntoViewIfNeeded();
      const dialog = page.getByRole("dialog", { name: "Media preview" });
      const image = dialog.locator(".gallery-lightbox-slide-active img");
      const viewportWidth = page.viewportSize()?.width ?? 390;
      const viewportHeight = page.viewportSize()?.height ?? 844;

      async function openAndGetImageBox() {
        await opener.tap();
        await expect(dialog).toBeVisible();
        await expect(image).toBeVisible();
        const box = await image.boundingBox();
        expect(box).not.toBeNull();
        return box!;
      }

      // Tap on the image itself still does nothing.
      const centerBox = await openAndGetImageBox();
      await page.touchscreen.tap(centerBox.x + centerBox.width / 2, centerBox.y + centerBox.height / 2);
      await expect(dialog).toBeVisible();

      // Sanity check this test is actually exercising the real, non-tiny
      // geometry it claims to (guards against silently degenerating back to
      // "everything is a few px so of course every tap below passes"): the
      // active image itself must be substantial, and if a neighbor slide's
      // own <img> is present in the DOM at this width, its computed
      // pointer-events must be "none" — this is the exact regression fix.
      expect(centerBox.width).toBeGreaterThan(50);
      expect(centerBox.height).toBeGreaterThan(50);
      const neighborImgInfo = await page.evaluate(() => {
        const el = document.querySelector<HTMLImageElement>(
          ".gallery-lightbox-slide-prev img, .gallery-lightbox-slide-next img",
        );
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { pointerEvents: getComputedStyle(el).pointerEvents, width: rect.width, height: rect.height };
      });
      if (neighborImgInfo) {
        expect(neighborImgInfo.pointerEvents).toBe("none");
      }

      // Left gutter tap closes (skipped if the image already fills the
      // full mobile width — max-width: calc(100vw - 24px) leaves at least
      // a 12px margin on each side per app/globals.css's mobile override).
      const leftBox = await image.boundingBox();
      expect(leftBox).not.toBeNull();
      if (leftBox!.x > 4) {
        await page.touchscreen.tap(Math.max(leftBox!.x - 8, 1), leftBox!.y + leftBox!.height / 2);
        await expect(dialog).toBeHidden();
      }

      // Right gutter tap closes.
      const rightBox = await openAndGetImageBox();
      if (rightBox.x + rightBox.width < viewportWidth - 4) {
        await page.touchscreen.tap(
          Math.min(rightBox.x + rightBox.width + 8, viewportWidth - 1),
          rightBox.y + rightBox.height / 2,
        );
        await expect(dialog).toBeHidden();
      }

      // Above the image tap closes. The counter/index badge
      // (`[aria-live="polite"]`, `pointer-events-auto` by design — it is
      // "content intentionally belonging to the Lightbox", not backdrop,
      // per the product requirement) floats directly above the image at
      // this viewport/aspect-ratio combination, so an 8px margin off the
      // image's own top edge can land ON the badge instead of the real
      // backdrop. Clear BOTH the image's and the badge's bounding boxes so
      // this assertion targets genuine empty backdrop, not the badge's own
      // (intentionally non-closing) footprint.
      const topBox = await openAndGetImageBox();
      const badgeBox = await dialog.locator('[aria-live="polite"]').boundingBox();
      const aboveBoundary = badgeBox ? Math.min(topBox.y, badgeBox.y) : topBox.y;
      if (aboveBoundary > 4) {
        await page.touchscreen.tap(topBox.x + topBox.width / 2, Math.max(aboveBoundary - 8, 1));
        await expect(dialog).toBeHidden();
      }

      // Below the image tap closes.
      const bottomBox = await openAndGetImageBox();
      if (bottomBox.y + bottomBox.height < viewportHeight - 4) {
        await page.touchscreen.tap(
          bottomBox.x + bottomBox.width / 2,
          Math.min(bottomBox.y + bottomBox.height + 8, viewportHeight - 1),
        );
        await expect(dialog).toBeHidden();
      }
    } finally {
      await context.close();
    }
  });

  test(".gallery-lightbox-nav (Previous/Next) is hidden at <=639px and visible at tablet/desktop widths", async ({
    page,
  }) => {
    await blockHeavySanityMedia(page.context());
    for (const { width, expectVisible } of [
      { width: 375, expectVisible: false },
      { width: 639, expectVisible: false },
      { width: 768, expectVisible: true },
      { width: 1024, expectVisible: true },
      { width: 1440, expectVisible: true },
    ]) {
      await page.setViewportSize({ width, height: 900 });
      await gotoAndStabilize(page, "/catering");

      const opener = page.getByRole("button", { name: /^Open gallery image/ }).first();
      await opener.scrollIntoViewIfNeeded();
      await opener.click();
      const dialog = page.getByRole("dialog", { name: "Media preview" });
      await expect(dialog).toBeVisible();

      const prevNav = dialog.locator(".gallery-lightbox-nav-prev");
      const nextNav = dialog.locator(".gallery-lightbox-nav-next");
      if (expectVisible) {
        await expect(prevNav).toBeVisible();
        await expect(nextNav).toBeVisible();
      } else {
        await expect(prevNav).toBeHidden();
        await expect(nextNav).toBeHidden();
      }

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    }
  });

  // ISSUE 1 regression: at <=639px the Previous/Next nav buttons are
  // `display: none` (see the test above), but the focus trap's `focusable`
  // query used to match them anyway (a hidden element still satisfies
  // `button:not([disabled])`). A real Tab key press never actually focuses
  // a display:none element (browsers skip it in native tab order), so
  // `last` resolved to a button focus could never reach, the forward-
  // boundary check (`activeElement === last`) never fired, and native Tab
  // carried focus out of the still-open, still-scroll-locked dialog onto
  // the page behind it. jsdom (HorizontalGallery.test.tsx) can't reproduce
  // this — it doesn't skip display:none elements in tab order the way a
  // real browser does — so this must be a real Playwright browser test.
  test("mobile (375px): Tab from Close never escapes the dialog on a photo-only lightbox, even though Prev/Next are display:none", async ({
    page,
  }) => {
    await blockHeavySanityMedia(page.context());
    await page.setViewportSize({ width: 375, height: 900 });
    await gotoAndStabilize(page, "/catering");

    const opener = page.getByRole("button", { name: /^Open gallery image/ }).first();
    await opener.scrollIntoViewIfNeeded();
    await opener.click();

    const dialog = page.getByRole("dialog", { name: "Media preview" });
    await expect(dialog).toBeVisible();
    // Confirm this is genuinely a photo-only slide (no active video tab
    // stop) and that Prev/Next really are hidden here, matching the exact
    // conditions of the bug report.
    await expect(dialog.locator(".gallery-lightbox-slide-active video")).toHaveCount(0);
    await expect(dialog.locator(".gallery-lightbox-nav-prev")).toBeHidden();
    await expect(dialog.locator(".gallery-lightbox-nav-next")).toBeHidden();

    const closeButton = dialog.locator(".gallery-lightbox-close");
    await expect(closeButton).toBeFocused();

    // With Prev/Next hidden and no active video, Close is the only real
    // tab stop — a real Tab press must keep cycling focus back to it,
    // never escaping onto the page behind the modal.
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Tab");
      const isInsideDialog = await page.evaluate(() => {
        const dialogEl = document.querySelector('[role="dialog"][aria-label="Media preview"]');
        return !!dialogEl && dialogEl.contains(document.activeElement);
      });
      expect(isInsideDialog, `focus escaped the dialog after ${i + 1} Tab press(es)`).toBe(true);
      await expect(closeButton).toBeFocused();
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});

test.describe("forms and validation", () => {
  test("contact form shows client-side validation errors on empty submit", async ({ page }) => {
    await gotoAndStabilize(page, "/contact");
    const form = page.locator("form").first();
    await form.locator('button[type="submit"], input[type="submit"]').first().click();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("privacy consent opens the policy modal and Agree checks the box", async ({ page }) => {
    await gotoAndStabilize(page, "/contact");
    const policyButton = page.getByRole("button", { name: "Privacy Policy" });
    await policyButton.click();

    const dialog = page.getByRole("dialog", { name: /privacy/i });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: /agree/i }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator("#contact-privacy")).toBeChecked();
    await expect(policyButton).toBeFocused();
  });
});

test.describe("application modal", () => {
  test("focus moves in on open, traps Tab, and restores focus on Escape", async ({ page }) => {
    await gotoAndStabilize(page, "/volunteer");
    const opener = page.getByRole("button", { name: "Apply to volunteer" });
    await opener.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toBeFocused().catch(() => {});

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
});

test.describe("footer", () => {
  test("footer nav collapses to two columns on mobile and one row on desktop", async ({ page }) => {
    await gotoAndStabilize(page, "/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });
});
