// Component-level proof (not a live-data test — no approved production
// content is ever touched to exercise this) that the actual rendered UI
// shows the CMS-controlled empty state, and NEVER the hardcoded
// lib/cateringMenu.ts categories, when `categories={[]}` — i.e. the exact
// prop shape app/[locale]/(site)/catering/page.tsx's getData() now passes
// (via lib/cateringMenuResolve.ts) when a manager has intentionally
// emptied every category on page-catering-menu-examples.
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// CateringMenuOverlay renders <FAQInlinePrompt> in its closing section,
// which uses lib/useLocale.ts -> next/navigation's usePathname() to build a
// locale-aware link — unavailable outside a real Next App Router tree.
// Mocked to a fixed English path, matching this component's own tests'
// scope (proving the empty-state/category rendering logic, not routing).
vi.mock("next/navigation", () => ({ usePathname: () => "/catering" }));

import { FormContentProvider } from "./FormContentProvider";
import { CateringMenuButton } from "./CateringMenuOverlay";
import { defaultFormMessages } from "@/lib/sanityForms";
import { menuCategories as fallbackMenuCategories, type CateringMenuCategory } from "@/lib/cateringMenu";

beforeEach(() => {
  // jsdom has no scroll-container layout, so it doesn't implement
  // Element.scrollTo — CateringMenuOverlay calls it on open (scroll-to-top);
  // a real no-op is fine here since this test suite verifies content/state,
  // not scroll positioning.
  window.HTMLElement.prototype.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
});

function renderButton(categories: CateringMenuCategory[]) {
  return render(
    <FormContentProvider value={{ messages: defaultFormMessages, privacyPolicy: { title: "", subtitle: "", lastUpdated: null, body: null } }}>
      <CateringMenuButton
        categories={categories}
        overlayText={{
          title: "Catering menu",
          intro: ["Intro paragraph."],
          requestCta: "Request custom menu",
          featuredDishesLabel: "Featured Dishes",
          disclaimerNote: "Disclaimer.",
          customMenuTitle: "Create your custom menu",
          customMenuText: "Custom menu text.",
          backToCateringCta: "Back to Catering",
          emptyStateMessage: "No menu examples are available right now.",
        }}
      >
        Menu examples
      </CateringMenuButton>
    </FormContentProvider>,
  );
}

describe("CateringMenuOverlay — empty categories never resurrect the hardcoded menu", () => {
  it("categories=[] shows the CMS empty-state message, not any hardcoded category/dish name", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    renderButton([]);
    await userEvent.click(screen.getByRole("button", { name: "Menu examples" }));

    expect(screen.getByText("No menu examples are available right now.")).toBeInTheDocument();
    // None of the hardcoded fallback category titles/dish names appear anywhere.
    for (const category of fallbackMenuCategories) {
      expect(screen.queryByText(category.title)).not.toBeInTheDocument();
      for (const dish of category.featuredItems) {
        expect(screen.queryByText(dish.name)).not.toBeInTheDocument();
      }
    }
    // No category nav renders at all.
    expect(screen.queryByRole("navigation", { name: "Catering categories" })).not.toBeInTheDocument();
  });

  it("a real (non-empty) category list renders normally — the empty-state branch doesn't leak into the normal case", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const categories: CateringMenuCategory[] = [
      { id: "test-cat", title: "Test Category", navLabel: "Test", description: "desc", featuredItems: [] },
    ];
    renderButton(categories);
    await userEvent.click(screen.getByRole("button", { name: "Menu examples" }));

    expect(screen.getByText("Test Category")).toBeInTheDocument();
    expect(screen.queryByText("No menu examples are available right now.")).not.toBeInTheDocument();
  });
});
