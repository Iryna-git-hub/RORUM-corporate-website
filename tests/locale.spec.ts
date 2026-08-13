import { expect, test } from "@playwright/test";

test.describe("Locale routing", () => {
  test("English stays unprefixed, Danish and Ukrainian load at their own prefix", async ({ page }) => {
    for (const [path, htmlLang] of [
      ["/", "en"],
      ["/da", "da"],
      ["/uk", "uk"],
      ["/events", "en"],
      ["/da/events", "da"],
      ["/uk/events", "uk"],
    ] as const) {
      const response = await page.goto(path);
      expect(response?.status(), `GET ${path}`).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", htmlLang);
    }
  });

  test("an explicit /en/* prefix redirects to the unprefixed URL", async ({ page }) => {
    const response = await page.goto("/en/about");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/about$/);
  });

  test("a legacy redirect resolves correctly under a locale prefix", async ({ page }) => {
    const response = await page.goto("/da/private-meetings");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/da\/host-at-rorum$/);
  });

  test("nav active-state highlighting works on a locale-prefixed route", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/da/events");
    const eventsLink = page.getByRole("link", { name: /Deltag i events|Attend Events/i }).first();
    await expect(eventsLink).toHaveAttribute("aria-current", "page");
  });

  test("mobile language switcher navigates to the same page in another language, not the homepage", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/about");
    await page.getByTestId("mobile-menu-toggle").click();

    const mobileSwitcher = page.getByTestId("mobile-language-switcher");
    await mobileSwitcher.getByText("DA", { exact: true }).click();

    await expect(page).toHaveURL(/\/da\/about$/);
  });

  test("language switcher preserves query strings", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/events?date=week");
    await page.getByTestId("mobile-menu-toggle").click();

    const mobileSwitcher = page.getByTestId("mobile-language-switcher");
    await mobileSwitcher.getByText("UA", { exact: true }).click();

    await expect(page).toHaveURL(/\/uk\/events\?date=week$/);
  });

  test("desktop language switcher (the pill row shown at normal window widths) is actually clickable", async ({
    page,
  }) => {
    // Regression test: at typical desktop widths (~1100px+), the visible
    // switcher used to be a plain <span> row with no click handler at all —
    // only the LanguageDropdown, shown in a narrow 1024-1100px gap, was ever
    // interactive. Fixed by making the pill row real buttons too.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/about");

    const desktopSwitcher = page.getByTestId("desktop-language-switcher");
    await expect(desktopSwitcher).toBeVisible();
    await desktopSwitcher.getByRole("button", { name: "DA" }).click();

    await expect(page).toHaveURL(/\/da\/about$/);
  });

  test("the home/event-detail scroll-reset special case still resolves the correct path on a prefixed URL", async ({
    page,
  }) => {
    // Regression check for the splitLocaleFromPath fix in SiteShell: on a
    // /da/events/<slug> URL, `path` (locale-neutral) must still match the
    // event-detail pattern so the scroll-to-top-on-navigate behavior fires,
    // and `isHome` must be false (not the raw, locale-prefixed pathname).
    const response = await page.goto("/da/events/mindful-morning-yoga");
    expect(response?.status()).toBe(200);
    await expect(page.locator(".site-shell-inner")).toHaveCount(1);
    await expect(page.locator(".site-shell-home")).toHaveCount(0);
  });
});
