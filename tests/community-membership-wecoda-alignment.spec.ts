import { expect, test, type BrowserContext } from "@playwright/test";
import { localizedHref, type Locale } from "@/lib/i18n";
import { gotoAndStabilize } from "./support";

/**
 * Regression test for the WECODA membership block's (community-membership
 * page, `.wecoda-membership-content`: heading / statement / external link /
 * FAQ row) left-edge alignment bug.
 *
 * Root cause (see app/globals.css): `.wecoda-membership-content` used
 * `justify-items: center` at every width, with an incomplete, mis-scoped
 * `@media (min-width: 640px)` override that only re-anchored 2 of the 4
 * children (`.wecoda-hero-external-link` and `.faq-inline-prompt`) to the
 * left via `justify-self: start`, and did so at the wrong breakpoint (the
 * section's real desktop/stacked-tablet switch is 1024px, matching the
 * sibling `.wecoda-membership-panel-main`'s own `max-width: 1023px` collapse).
 * Fix: the container itself switches ALL children to `justify-items: start`
 * together at `min-width: 1024px`.
 *
 * Same bandwidth-safe media-blocking convention as tests/interactions.spec.ts
 * / tests/catering-responsive.spec.ts: heavy Sanity CDN image/video requests
 * are intercepted, not downloaded — this test is about box geometry, not
 * image rendering.
 */
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

const LOCALES: Locale[] = ["en", "da", "uk"];
const DESKTOP_WIDTHS = [1024, 1280, 1440] as const;
const MOBILE_WIDTHS = [375, 390] as const;
const VIEWPORT_HEIGHT = 1000;
const TOLERANCE_PX = 3;

async function rowLocators(page: import("@playwright/test").Page) {
  const content = page.locator(".wecoda-membership-content");
  return {
    content,
    heading: content.locator("h3").first(),
    statement: content.locator(".wecoda-membership-statement").first(),
    link: content.locator(".wecoda-hero-external-link").first(),
    faq: content.locator(".faq-inline-prompt").first(),
  };
}

test.describe("Community Membership — WECODA block alignment", () => {
  for (const locale of LOCALES) {
    for (const width of DESKTOP_WIDTHS) {
      test(`locale: ${locale} @ ${width}px — heading/statement/link/FAQ share the same left edge`, async ({
        page,
        context,
      }) => {
        await blockHeavySanityMedia(context);
        await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
        await gotoAndStabilize(page, localizedHref("/community-membership", locale));

        const { heading, statement, link, faq } = await rowLocators(page);
        await expect(heading).toBeVisible();
        await expect(statement).toBeVisible();
        await expect(faq).toBeVisible();

        const headingBox = await heading.boundingBox();
        const statementBox = await statement.boundingBox();
        const faqBox = await faq.boundingBox();
        expect(headingBox, "heading must have a measurable bounding box").toBeTruthy();
        expect(statementBox, "statement must have a measurable bounding box").toBeTruthy();
        expect(faqBox, "FAQ row must have a measurable bounding box").toBeTruthy();

        const linkVisible = await link.isVisible();
        const linkBox = linkVisible ? await link.boundingBox() : null;

        const leftEdges = [headingBox!.x, statementBox!.x, faqBox!.x];
        if (linkBox) leftEdges.push(linkBox.x);

        const minX = Math.min(...leftEdges);
        const maxX = Math.max(...leftEdges);
        expect(
          maxX - minX,
          `left edges must align within ${TOLERANCE_PX}px at ${width}px (got: ${leftEdges.join(", ")})`,
        ).toBeLessThanOrEqual(TOLERANCE_PX);

        // Text itself (not just the box) starts at the left at desktop
        // widths: no ancestor sets text-align: center at >= 1024px.
        const headingTextAlign = await heading.evaluate((el) => getComputedStyle(el).textAlign);
        expect(headingTextAlign, "heading text-align must be left (or default/start) at desktop widths").toMatch(
          /^(left|start)$/,
        );
      });
    }
  }

  for (const locale of LOCALES) {
    for (const width of MOBILE_WIDTHS) {
      test(`locale: ${locale} @ ${width}px — block stays centered (stacked/tablet layout)`, async ({
        page,
        context,
      }) => {
        await blockHeavySanityMedia(context);
        await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
        await gotoAndStabilize(page, localizedHref("/community-membership", locale));

        const { content, heading, statement, faq } = await rowLocators(page);
        await expect(heading).toBeVisible();
        await expect(statement).toBeVisible();
        await expect(faq).toBeVisible();

        const contentBox = await content.boundingBox();
        const headingBox = await heading.boundingBox();
        const statementBox = await statement.boundingBox();
        const faqBox = await faq.boundingBox();
        expect(contentBox).toBeTruthy();
        expect(headingBox).toBeTruthy();
        expect(statementBox).toBeTruthy();
        expect(faqBox).toBeTruthy();

        const contentCenter = contentBox!.x + contentBox!.width / 2;
        for (const [name, box] of [
          ["heading", headingBox],
          ["statement", statementBox],
          ["FAQ row", faqBox],
        ] as const) {
          const center = box!.x + box!.width / 2;
          expect(
            Math.abs(center - contentCenter),
            `${name} must be horizontally centered within the content column at ${width}px`,
          ).toBeLessThanOrEqual(TOLERANCE_PX);
        }

        const headingTextAlign = await heading.evaluate((el) => getComputedStyle(el).textAlign);
        expect(headingTextAlign, "heading text-align must be center below 1024px").toBe("center");
      });
    }
  }
});
