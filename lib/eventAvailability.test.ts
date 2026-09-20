import { afterEach, describe, expect, it, vi } from "vitest";
import type { RorumEvent } from "@/lib/data";

const getBillettoEventAvailability = vi.fn();
vi.mock("@/lib/billetto", () => ({ getBillettoEventAvailability: (id: string) => getBillettoEventAvailability(id) }));

// imported after the mock is registered
import { applyBillettoAvailability } from "@/lib/eventAvailability";

function ev(overrides: Partial<RorumEvent>): RorumEvent {
  return {
    slug: "e", title: "Event", date: "2026-10-01", time: "18:00-20:00", price: "100 kr.",
    address: "", language: ["English"], formattedDescription: [], included: [], whatToExpect: [],
    arrival: "", ticketProviderInfo: { label: "", value: "" }, shareActions: [],
    ticketUrl: "", calendarUrl: "", waitlistUrl: "", isSoldOut: false, image: "/x.jpg",
    ...overrides,
  };
}

const BILLETTO_URL = "https://billetto.dk/e/rorum-test-billetter-1994849";

afterEach(() => {
  getBillettoEventAvailability.mockReset();
});

describe("applyBillettoAvailability", () => {
  it("a legacy (non-connected) event is returned untouched, no Billetto call", async () => {
    const events = [ev({ slug: "legacy", ticketsLeft: 7, isSoldOut: false, ticketUrl: "https://shop.example/legacy" })];
    const out = (await applyBillettoAvailability(events))[0]!;
    expect(out).toBe(events[0]); // same reference
    expect(getBillettoEventAvailability).not.toHaveBeenCalled();
  });

  it("a connected event with a healthy Billetto response gets the live number + derived sold-out + the Billetto URL as ticketUrl", async () => {
    getBillettoEventAvailability.mockResolvedValue({ ok: true, available: 6, status: "high" });
    const out = (await applyBillettoAvailability([ev({ slug: "connected", billettoEventUrl: BILLETTO_URL, ticketsLeft: 999, isSoldOut: true })]))[0]!;
    expect(out.spotsLeft).toBe(6);
    expect(out.ticketsLeft).toBe(6);
    expect(out.isSoldOut).toBe(false);
    expect(out.ticketUrl).toBe(BILLETTO_URL);
    expect(getBillettoEventAvailability).toHaveBeenCalledWith("1994849");
  });

  it("available === 0 → isSoldOut true, spotsLeft 0", async () => {
    getBillettoEventAvailability.mockResolvedValue({ ok: true, available: 0, status: "sold_out" });
    const out = (await applyBillettoAvailability([ev({ billettoEventUrl: BILLETTO_URL })]))[0]!;
    expect(out.spotsLeft).toBe(0);
    expect(out.isSoldOut).toBe(true);
  });

  it("Billetto FAILURE never produces a false 'Sold out' or '0' — availability is cleared, CTA URL kept", async () => {
    for (const failure of [
      { ok: false, reason: "network" },
      { ok: false, reason: "rate-limited" },
      { ok: false, reason: "not-found" },
      { ok: false, reason: "unauthorized" },
      { ok: false, reason: "server-error" },
      { ok: false, reason: "no-credentials" },
      { ok: false, reason: "malformed" },
      { ok: true, available: null, status: null }, // couldn't read the number
    ] as const) {
      getBillettoEventAvailability.mockResolvedValue(failure);
      const out = (await applyBillettoAvailability([ev({ billettoEventUrl: BILLETTO_URL, ticketsLeft: 5, isSoldOut: true })]))[0]!;
      expect(out.spotsLeft, JSON.stringify(failure)).toBeUndefined();
      expect(out.ticketsLeft, JSON.stringify(failure)).toBeUndefined();
      expect(out.isSoldOut, JSON.stringify(failure)).toBe(false);
      expect(out.ticketUrl, JSON.stringify(failure)).toBe(BILLETTO_URL);
    }
  });

  it("a connected event whose URL has NO parseable id is treated as a failed connection (no false sold-out)", async () => {
    const out = (await applyBillettoAvailability([ev({ billettoEventUrl: "https://billetto.dk/broken", ticketsLeft: 3 })]))[0]!;
    expect(out.spotsLeft).toBeUndefined();
    expect(out.isSoldOut).toBe(false);
    expect(getBillettoEventAvailability).not.toHaveBeenCalled();
  });

  it("keeps a distinct manual ticketUrl as the buy destination when the connected event has one", async () => {
    getBillettoEventAvailability.mockResolvedValue({ ok: true, available: 4, status: "low" });
    const out = (await applyBillettoAvailability([ev({ billettoEventUrl: BILLETTO_URL, ticketUrl: "https://shop.example/vip" })]))[0]!;
    expect(out.ticketUrl).toBe("https://shop.example/vip");
  });

  it("N events resolving to ONE Billetto id → exactly ONE API call (dedup by id, even across different URL strings)", async () => {
    getBillettoEventAvailability.mockResolvedValue({ ok: true, available: 8, status: "high" });
    const events = [
      ev({ slug: "a", billettoEventUrl: BILLETTO_URL }),
      ev({ slug: "b", billettoEventUrl: `${BILLETTO_URL}?utm_source=x` }), // same event, different string
      ev({ slug: "c", billettoEventUrl: BILLETTO_URL }),
      ev({ slug: "legacy", ticketsLeft: 2 }),
    ];
    const out = await applyBillettoAvailability(events);
    expect(getBillettoEventAvailability).toHaveBeenCalledTimes(1);
    expect(getBillettoEventAvailability).toHaveBeenCalledWith("1994849");
    expect(out[0]!.spotsLeft).toBe(8);
    expect(out[1]!.spotsLeft).toBe(8);
    expect(out[3]!.ticketsLeft).toBe(2); // legacy untouched
  });
});
