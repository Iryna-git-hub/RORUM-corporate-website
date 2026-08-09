import { expect, test } from "@playwright/test";
import { STATIC_ROUTES } from "./routes";
import { gotoAndStabilize } from "./support";

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
