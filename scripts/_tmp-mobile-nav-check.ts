import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const WIDTHS = [320, 360, 375, 390, 430];
const LOCALES: { path: string; label: string }[] = [
  { path: "", label: "en" },
  { path: "/da", label: "da" },
  { path: "/uk", label: "uk" },
];

async function main() {
  const browser = await chromium.launch();
  let anyFail = false;

  for (const { path, label } of LOCALES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      await page.goto(`${BASE}${path}/`, { waitUntil: "networkidle" });
      await page.click('[data-testid="mobile-menu-toggle"]');
      await page.waitForTimeout(350); // menu slide-in transition

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const innerWidth = await page.evaluate(() => window.innerWidth);
      const overflow = scrollWidth > innerWidth;

      const ctaBox = await page.locator('aside[aria-label="Mobile menu"] a.btn').boundingBox();
      const switcherBox = await page.locator('[data-testid="mobile-language-switcher"]').boundingBox();
      const closeBox = await page.locator('aside[aria-label="Mobile menu"] button[aria-label="Close menu"]').boundingBox();

      // A pre-existing ~8px baseline vertical-alignment offset between the
      // CTA/close (y=12.5) and the switcher (y=20.3) exists even before this
      // fix (confirmed against the original, unmodified layout) — well
      // under the ~40-50px a genuine row-wrap would produce. 20px threshold
      // distinguishes "still one row" from "wrapped to a second row".
      const sameRow =
        ctaBox && switcherBox && closeBox &&
        Math.abs(ctaBox.y - switcherBox.y) < 20 &&
        Math.abs(ctaBox.y - closeBox.y) < 20;

      const closeVisible = closeBox && closeBox.x + closeBox.width <= width + 1 && closeBox.x >= 0;
      const switcherVisible = switcherBox && switcherBox.x + switcherBox.width <= width + 1;

      const ok = !overflow && sameRow && closeVisible && switcherVisible;
      if (!ok) anyFail = true;
      console.log(
        `${label.padEnd(3)} ${width}px: overflow=${overflow} (scrollW=${scrollWidth},innerW=${innerWidth}) sameRow=${!!sameRow} closeVisible=${!!closeVisible} switcherVisible=${!!switcherVisible} ${ok ? "OK" : "FAIL"}`,
      );
      if (!ok) {
        console.log(
          `    cta: x=${ctaBox?.x.toFixed(1)} w=${ctaBox?.width.toFixed(1)} y=${ctaBox?.y.toFixed(1)} | switcher: x=${switcherBox?.x.toFixed(1)} w=${switcherBox?.width.toFixed(1)} y=${switcherBox?.y.toFixed(1)} | close: x=${closeBox?.x.toFixed(1)} w=${closeBox?.width.toFixed(1)} y=${closeBox?.y.toFixed(1)}`,
        );
      }
      await page.close();
    }
  }

  await browser.close();
  console.log(anyFail ? "\nSOME CHECKS FAILED" : "\nALL CHECKS PASSED");
  process.exit(anyFail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
