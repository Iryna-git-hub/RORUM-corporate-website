import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

// FAQAccordion's internal links render via LocaleLink, which uses
// lib/useLocale.ts -> next/navigation's usePathname() — unavailable outside
// a real Next App Router tree. Mocked to a fixed English path, matching
// CateringMenuOverlay.test.tsx's own precedent for the same constraint.
vi.mock("next/navigation", () => ({ usePathname: () => "/faq" }));

import { FAQAccordion, type FaqGroupData } from "./FAQAccordion";

afterEach(() => cleanup());

describe("FAQAccordion — optional per-question link (Task 7)", () => {
  it("renders a link under the answer when the question has one, using its localized label as the link text (never a raw URL)", () => {
    const groups: FaqGroupData[] = [
      { title: "Events", items: [{ question: "How do I book?", answer: "Open the event.", link: { href: "/events", label: "See events" } }] },
    ];
    render(<FAQAccordion groups={groups} />);
    const link = screen.getByRole("link", { name: "See events" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/events");
    expect(screen.queryByText("/events")).not.toBeInTheDocument();
  });

  it("renders no link element when the question has none", () => {
    const groups: FaqGroupData[] = [{ title: "Events", items: [{ question: "Q", answer: "A" }] }];
    render(<FAQAccordion groups={groups} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("one question's missing link never affects a sibling question's own link or the accordion layout", () => {
    const groups: FaqGroupData[] = [
      {
        title: "Events",
        items: [
          { question: "Q1", answer: "A1", link: { href: "/events", label: "See events" } },
          { question: "Q2", answer: "A2" },
        ],
      },
    ];
    render(<FAQAccordion groups={groups} />);
    expect(screen.getByText("Q1")).toBeInTheDocument();
    expect(screen.getByText("Q2")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("an external link (http...) opens in a new tab with rel=noreferrer, the established safe-external-link pattern", () => {
    const groups: FaqGroupData[] = [{ title: "Events", items: [{ question: "Q", answer: "A", link: { href: "https://example.com/tickets", label: "Buy tickets" } }] }];
    render(<FAQAccordion groups={groups} />);
    const link = screen.getByRole("link", { name: "Buy tickets" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("an internal link (/path) does not open in a new tab", () => {
    const groups: FaqGroupData[] = [{ title: "Events", items: [{ question: "Q", answer: "A", link: { href: "/faq", label: "More FAQ" } }] }];
    render(<FAQAccordion groups={groups} />);
    const link = screen.getByRole("link", { name: "More FAQ" });
    expect(link).not.toHaveAttribute("target");
  });
});

describe("FAQAccordion — accordion layout is unaffected by the link addition", () => {
  it("clicking a question still toggles its own aria-expanded state, independent of any link", async () => {
    const groups: FaqGroupData[] = [{ title: "Events", items: [{ question: "Q", answer: "A", link: { href: "/faq", label: "More" } }] }];
    render(<FAQAccordion groups={groups} />);
    const button = screen.getByRole("button", { name: /Q/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });
});
