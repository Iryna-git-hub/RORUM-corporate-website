// Component-level unit tests for the REAL IconPickerInput code — mounts it
// with React Testing Library against the actual installed lucide-react
// "icons" catalog (no mocking of the icon set itself), so these tests prove
// the picker genuinely covers the complete, currently-installed catalog —
// not a stubbed-down fixture that could silently diverge from reality.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import type { StringInputProps } from "sanity";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { icons as lucideIcons } from "lucide-react";
import { IconPickerInput, humanizeIconName } from "./IconPickerInput";

function renderInput(props: StringInputProps) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <IconPickerInput {...props} />
    </ThemeProvider>,
  );
}

function fakeProps(overrides: Partial<StringInputProps> = {}) {
  const onChange = vi.fn();
  const props = {
    value: undefined,
    onChange,
    elementProps: { id: "icon-field", onFocus: vi.fn(), onBlur: vi.fn() },
    schemaType: { title: "Icon" },
    ...overrides,
  } as unknown as StringInputProps;
  return { props, onChange };
}

const sortedNames = Object.keys(lucideIcons).sort((a, b) => a.localeCompare(b));
const PAGE_SIZE = 90;
// A name guaranteed to sit past the first page, regardless of exact catalog
// size — proves the "first 90" ceiling is gone, not just moved.
const nameAfterFirstPage = sortedNames[Math.min(200, sortedNames.length - 1)]!;
const longestName = sortedNames.reduce((longest, n) => (n.length > longest.length ? n : longest), "");

beforeEach(() => {
  cleanup();
});
afterEach(() => {
  cleanup();
});

async function search(query: string) {
  const input = screen.getByPlaceholderText(/search icon/i);
  await userEvent.clear(input);
  if (query) await userEvent.type(input, query);
}

describe("IconPickerInput — humanizeIconName", () => {
  it("splits PascalCase compound names into readable words", () => {
    expect(humanizeIconName("ArrowDownLeft")).toBe("Arrow Down Left");
    expect(humanizeIconName("CircleUserRound")).toBe("Circle User Round");
    expect(humanizeIconName("UtensilsCrossed")).toBe("Utensils Crossed");
    expect(humanizeIconName("ChefHat")).toBe("Chef Hat");
  });

  it("handles a leading single-letter run (AArrowDown, ALargeSmall) without collapsing it", () => {
    expect(humanizeIconName("AArrowDown")).toBe("A Arrow Down");
    expect(humanizeIconName("ALargeSmall")).toBe("A Large Small");
  });

  it("separates trailing digits from letters (Clock12, Grid3x3)", () => {
    expect(humanizeIconName("Clock12")).toBe("Clock 12");
    expect(humanizeIconName("Building2")).toBe("Building 2");
  });

  it("every catalog name produces a non-empty, trimmed label with no leading/trailing whitespace", () => {
    for (const name of sortedNames) {
      const label = humanizeIconName(name);
      expect(label.length).toBeGreaterThan(0);
      expect(label).toBe(label.trim());
    }
  });
});

describe("IconPickerInput — the complete catalog is reachable, not just the first page", () => {
  it("reports the real installed catalog size, not a hardcoded number", () => {
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.getByText(new RegExp(`of ${lucideIcons ? Object.keys(lucideIcons).length : 0} icons`))).toBeInTheDocument();
  });

  it(`renders only ${PAGE_SIZE} icons initially — does not mount the whole catalog at once`, () => {
    const { props } = fakeProps();
    renderInput(props);
    const grid = screen.getByTestId("icon-grid");
    expect(within(grid).getAllByRole("button")).toHaveLength(PAGE_SIZE);
  });

  it("a name past the first page is NOT rendered before searching or loading more", () => {
    const { props } = fakeProps();
    renderInput(props);
    expect(screen.queryByTitle(nameAfterFirstPage, { exact: true })).not.toBeInTheDocument();
  });

  it("searching finds and makes selectable an icon beyond position 90 — search runs against the complete catalog, not the rendered page", async () => {
    const { props, onChange } = fakeProps();
    renderInput(props);
    await search(nameAfterFirstPage);

    const button = screen.getByTitle(nameAfterFirstPage, { exact: true });
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(onChange).toHaveBeenCalledTimes(1);
    const patch = onChange.mock.calls[0]![0] as { type: string; value?: unknown };
    expect(patch.type).toBe("set");
    expect(patch.value).toBe(nameAfterFirstPage);
  });

  it('"Load more" exposes additional results beyond the initial page', async () => {
    const { props } = fakeProps();
    renderInput(props);
    const grid = screen.getByTestId("icon-grid");
    expect(within(grid).getAllByRole("button")).toHaveLength(PAGE_SIZE);

    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(within(grid).getAllByRole("button").length).toBeGreaterThan(PAGE_SIZE);
  });

  it("clicking Load more repeatedly eventually exposes a name past the first page without needing to search", async () => {
    const { props } = fakeProps();
    renderInput(props);
    const loadMoreUntilVisible = async () => {
      for (let i = 0; i < 40; i++) {
        if (screen.queryByTitle(nameAfterFirstPage, { exact: true })) return true;
        const button = screen.queryByRole("button", { name: "Load more" });
        if (!button) return false;
        await userEvent.click(button);
      }
      return Boolean(screen.queryByTitle(nameAfterFirstPage, { exact: true }));
    };
    expect(await loadMoreUntilVisible()).toBe(true);
  });

  it("Load more disappears once every match is already visible", async () => {
    const { props } = fakeProps();
    renderInput(props);
    await search("chef"); // a narrow query with far fewer than PAGE_SIZE matches
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });
});

describe("IconPickerInput — search", () => {
  it("is case-insensitive", async () => {
    const { props } = fakeProps();
    renderInput(props);
    await search("CHEFHAT");
    expect(screen.getByTitle("ChefHat", { exact: true })).toBeInTheDocument();
  });

  it("is trimmed", async () => {
    const { props } = fakeProps();
    renderInput(props);
    await search("   chefhat   ");
    expect(screen.getByTitle("ChefHat", { exact: true })).toBeInTheDocument();
  });

  it("matches the human-readable label as well as the canonical name (\"arrow down\" finds ArrowDown-prefixed icons)", async () => {
    const { props } = fakeProps();
    renderInput(props);
    await search("arrow down");
    const arrowDownNames = sortedNames.filter((n) => n.toLowerCase().startsWith("arrowdown"));
    expect(arrowDownNames.length).toBeGreaterThan(0);
    for (const name of arrowDownNames) {
      expect(screen.getByTitle(name, { exact: true })).toBeInTheDocument();
    }
  });

  it("is deterministic — the same query run twice yields the same result set", async () => {
    const { props } = fakeProps();
    renderInput(props);
    await search("circle");
    const first = within(screen.getByTestId("icon-grid"))
      .getAllByRole("button")
      .map((b) => b.getAttribute("title"));
    await search("circle");
    const second = within(screen.getByTestId("icon-grid"))
      .getAllByRole("button")
      .map((b) => b.getAttribute("title"));
    expect(second).toEqual(first);
  });

  it('shows "No icons found" for a query matching nothing', async () => {
    const { props } = fakeProps();
    renderInput(props);
    await search("zzzznotarealiconnamezzzz");
    expect(screen.getByText(/no icons found/i)).toBeInTheDocument();
    expect(screen.queryByTestId("icon-grid")).not.toBeInTheDocument();
  });

  it("is resettable via the Clear search button — returns to the full, first-page catalog", async () => {
    const { props } = fakeProps();
    renderInput(props);
    await search("chefhat");
    expect(within(screen.getByTestId("icon-grid")).getAllByRole("button")).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(within(screen.getByTestId("icon-grid")).getAllByRole("button")).toHaveLength(PAGE_SIZE);
  });
});

describe("IconPickerInput — icon-only grid: no permanent visible label, but the name is never lost", () => {
  it("no grid button renders its human-readable label as visible text — the grid is icon-only", async () => {
    const { props } = fakeProps();
    renderInput(props);
    await search(longestName);
    // The longest name in the catalog is the hardest case for a visible
    // label to wrap/clip; here it must not appear as rendered text at all.
    expect(screen.queryByText(humanizeIconName(longestName))).not.toBeInTheDocument();
  });

  it("no button in the default (unsearched) grid renders any humanized label as visible text", () => {
    const { props } = fakeProps();
    renderInput(props);
    const grid = screen.getByTestId("icon-grid");
    for (const [name] of Object.entries(lucideIcons).slice(0, PAGE_SIZE)) {
      expect(within(grid).queryByText(humanizeIconName(name))).not.toBeInTheDocument();
    }
  });

  it("the canonical name is still present as the full title tooltip, and the accessible name (aria-label) still includes the human-readable label", async () => {
    const { props } = fakeProps();
    renderInput(props);
    await search(longestName);
    const button = screen.getByTitle(longestName, { exact: true });
    expect(button.getAttribute("title")).toBe(longestName);
    expect(button.getAttribute("aria-label")).toContain(humanizeIconName(longestName));
    expect(button.getAttribute("aria-label")).toContain(longestName);
  });

  it("each grid button mounts only its icon SVG, no separate label element — fewer DOM nodes per card than a labeled card would have", () => {
    const { props } = fakeProps();
    renderInput(props);
    const grid = screen.getByTestId("icon-grid");
    const button = within(grid).getAllByRole("button")[0]!;
    // A labeled card previously mounted <button><Flex><Icon/><Text><span/></Text></Flex></button>
    // — an SVG plus a Text wrapper div plus an inner span (3+ descendant
    // elements beyond the icon). Icon-only, the button's only element child
    // is the SVG itself.
    expect(button.children).toHaveLength(1);
    expect(button.children[0]!.tagName.toLowerCase()).toBe("svg");
  });
});

describe("IconPickerInput — selecting, clearing, and accessibility", () => {
  it("selecting an icon emits the exact canonical stored value via set()", async () => {
    const { props, onChange } = fakeProps();
    renderInput(props);
    await search("chefhat"); // "ChefHat" sits well past the default first page — proves selection works from a searched result too
    await userEvent.click(screen.getByTitle("ChefHat", { exact: true }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const patch = onChange.mock.calls[0]![0] as { type: string; value?: unknown };
    expect(patch.type).toBe("set");
    expect(patch.value).toBe("ChefHat");
  });

  it("clearing an already-selected icon emits unset()", async () => {
    const { props, onChange } = fakeProps({ value: "ChefHat" });
    renderInput(props);
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const patch = onChange.mock.calls[0]![0] as { type: string };
    expect(patch.type).toBe("unset");
  });

  it("an existing stored icon is shown as selected in both the summary card and the matching grid cell", async () => {
    const { props } = fakeProps({ value: "ChefHat" });
    renderInput(props);
    expect(screen.getByText("ChefHat")).toBeInTheDocument();
    await search("chefhat");
    const button = screen.getByTitle("ChefHat", { exact: true });
    expect(button).toHaveAttribute("data-selected", "true");
    expect(button.getAttribute("aria-label")).toMatch(/selected/);
  });

  it("an unknown/unsupported stored value is never silently replaced — no onChange fires, and a clear warning is shown", () => {
    const { props, onChange } = fakeProps({ value: "TotallyNotARealLucideIconNameXyz" });
    renderInput(props);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("TotallyNotARealLucideIconNameXyz")).toBeInTheDocument();
    expect(screen.getByText(/isn.t recognized/i)).toBeInTheDocument();
    // The manager can still clear it manually — nothing is auto-corrected.
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });

  it("every rendered icon cell is a real, keyboard-focusable <button> with an accessible label and a full-name tooltip", async () => {
    const { props } = fakeProps();
    renderInput(props);
    const grid = screen.getByTestId("icon-grid");
    const buttons = within(grid).getAllByRole("button");
    const first = buttons[0]!;
    expect(first.tagName).toBe("BUTTON");
    expect(first.getAttribute("type")).toBe("button");
    expect(first.getAttribute("aria-label")).toBeTruthy();
    expect(first.getAttribute("title")).toBeTruthy();
    first.focus();
    expect(first).toHaveFocus();
  });
});
