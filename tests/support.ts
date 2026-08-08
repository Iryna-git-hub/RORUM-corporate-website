import type { Page } from "@playwright/test";

// Freezes everything that would otherwise make a screenshot non-deterministic:
// CSS/JS animations & transitions, the autoplaying home-hero video, and the
// live Google Maps iframe on /contact. Also waits for web fonts and images so
// the very first screenshot at a given viewport isn't captured mid-layout-shift.
export async function stabilizePage(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-delay: 0ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
        transition-delay: 0ms !important;
        scroll-behavior: auto !important;
      }
      .home-hero-video { visibility: hidden !important; }
      iframe[title="RORUM location on Google Maps"] { visibility: hidden !important; }
    `,
  });

  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });

  await page.evaluate(async () => {
    // `loading="lazy"` images below the fold otherwise never start fetching
    // during a headless run with no real scroll/viewport-intersection
    // activity, so waiting on their `load` event would hang until timeout.
    document.querySelectorAll("img[loading='lazy']").forEach((img) => {
      img.setAttribute("loading", "eager");
    });
    const images = Array.from(document.images).filter((img) => !img.complete);
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );
    // `complete` only means the bytes are fetched, not that the browser has
    // finished (possibly async) decoding - without this, larger images can
    // be captured a frame or two before they're actually painted, producing
    // flaky screenshot diffs on image-heavy sections like Menu Formats.
    await Promise.all(
      Array.from(document.images).map((img) => img.decode().catch(() => {})),
    );
  });
}

export async function gotoAndStabilize(page: Page, route: string): Promise<void> {
  // Both SiteShell's site-wide scroll-reveal and MembershipBenefitsGrid's
  // reveal check `window.matchMedia("(prefers-reduced-motion: reduce)")`
  // synchronously in a `useEffect` that runs on mount - emulating reduced
  // motion has to happen *before* navigation, or that mount-time check
  // observes the real (non-reduced) preference and activates the
  // IntersectionObserver-driven reveal anyway, leaving the page's final
  // state dependent on whether the observer happens to fire before the
  // screenshot is taken.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route, { waitUntil: "networkidle" });
  await stabilizePage(page);
}
