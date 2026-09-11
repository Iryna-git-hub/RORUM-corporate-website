import { describe, expect, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EventCard, type EventCardMessages } from "@/components/EventCard";
import type { RorumEvent } from "@/lib/data";

// Danish + Ukrainian microcopy, exactly as the live `eventMessages`
// singleton stores it (Part 35 verified these values). The NUMBER comes
// from the resolved availability (Billetto or Sanity); the WORDING comes
// from here — the two never mix languages.
const DA: EventCardMessages = {
  soldOutLabel: "Udsolgt",
  spotsLeftOne: "plads tilbage",
  spotsLeftOther: "pladser tilbage",
  timeToBeAnnouncedLabel: "Tidspunkt annonceres",
  viewEventAriaPrefix: "Se arrangement:",
};
const UK: EventCardMessages = {
  soldOutLabel: "Розпродано",
  spotsLeftOne: "місце залишилось",
  spotsLeftOther: "місць залишилось",
  timeToBeAnnouncedLabel: "Час буде оголошено",
  viewEventAriaPrefix: "Переглянути подію:",
};

function ev(overrides: Partial<RorumEvent>): RorumEvent {
  return {
    // slug "" → EventCard renders the bare card (no <Link>/usePathname).
    slug: "", title: "Botanical evening", date: "2026-10-15", time: "18:00-20:00", price: "295 kr.",
    address: "", language: "English", longDescription: "", included: [], whatToExpect: [],
    arrival: "", ticketProviderInfo: { label: "", value: "" }, shareActions: [],
    ticketUrl: "", calendarUrl: "", waitlistUrl: "", isSoldOut: false, image: "/x.jpg",
    ...overrides,
  };
}

describe("EventCard — resolved availability, localized (Phases 4/10/11)", () => {
  for (const variant of ["grid", "scroll"] as const) {
    it(`${variant}: 10 spots → plural DA wording`, () => {
      cleanup();
      render(<EventCard event={ev({ spotsLeft: 10 })} variant={variant} locale="da" messages={DA} />);
      expect(screen.getByText("10 pladser tilbage")).toBeInTheDocument();
    });

    it(`${variant}: 1 spot → singular DA wording`, () => {
      cleanup();
      render(<EventCard event={ev({ spotsLeft: 1 })} variant={variant} locale="da" messages={DA} />);
      expect(screen.getByText("1 plads tilbage")).toBeInTheDocument();
    });

    it(`${variant}: 1 spot → singular UK wording`, () => {
      cleanup();
      render(<EventCard event={ev({ spotsLeft: 1 })} variant={variant} locale="uk" messages={UK} />);
      expect(screen.getByText("1 місце залишилось")).toBeInTheDocument();
    });

    it(`${variant}: sold out → localized Sold out, never a number`, () => {
      cleanup();
      render(<EventCard event={ev({ spotsLeft: 0, isSoldOut: true })} variant={variant} locale="da" messages={DA} />);
      expect(screen.getByText("Udsolgt")).toBeInTheDocument();
      expect(screen.queryByText(/0 /)).not.toBeInTheDocument();
    });

    it(`${variant}: availability unknown (Billetto unreachable) → no availability line, no false "0"/"Sold out"`, () => {
      cleanup();
      render(
        <EventCard
          event={ev({ spotsLeft: undefined, ticketsLeft: undefined, isSoldOut: false })}
          variant={variant}
          locale="da"
          messages={DA}
        />,
      );
      expect(screen.queryByText("Udsolgt")).not.toBeInTheDocument();
      expect(screen.queryByText(/tilbage/)).not.toBeInTheDocument();
    });
  }

  it("resolved Billetto `spotsLeft` takes precedence over a stale Sanity `ticketsLeft`", () => {
    cleanup();
    render(<EventCard event={ev({ spotsLeft: 3, ticketsLeft: 99 })} variant="grid" locale="da" messages={DA} />);
    expect(screen.getByText("3 pladser tilbage")).toBeInTheDocument();
    expect(screen.queryByText(/99/)).not.toBeInTheDocument();
  });
});
