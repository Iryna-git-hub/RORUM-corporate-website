import { describe, expect, it } from "vitest";
import { isEventVisibleInLocale, isUpcomingEvent } from "@/lib/eventVisibility";

describe("isUpcomingEvent — the one shared past/upcoming rule (Phase 3)", () => {
  const now = new Date(2026, 8, 9, 14, 30); // 2026-09-09 14:30 local

  it("an event earlier today is still upcoming (visible for the whole of its own day)", () => {
    expect(isUpcomingEvent({ date: "2026-09-09" }, now)).toBe(true);
  });

  it("yesterday's event is NOT upcoming", () => {
    expect(isUpcomingEvent({ date: "2026-09-08" }, now)).toBe(false);
  });

  it("a future event is upcoming", () => {
    expect(isUpcomingEvent({ date: "2026-10-15" }, now)).toBe(true);
  });

  it("the first moment of tomorrow flips an event from upcoming to past", () => {
    expect(isUpcomingEvent({ date: "2026-09-09" }, new Date(2026, 8, 10, 0, 0, 0))).toBe(false);
  });

  it("a missing or unparseable date is treated as NOT upcoming (strict default)", () => {
    expect(isUpcomingEvent({ date: "" }, now)).toBe(false);
    expect(isUpcomingEvent({ date: "not-a-date" }, now)).toBe(false);
    expect(isUpcomingEvent({ date: undefined as unknown as string }, now)).toBe(false);
  });

  it("far-past events (the pre-redistribution May–July 2026 data) are all hidden", () => {
    for (const date of ["2026-05-02", "2026-06-15", "2026-07-18"]) {
      expect(isUpcomingEvent({ date }, now), date).toBe(false);
    }
  });
});

describe("isEventVisibleInLocale — unchanged", () => {
  it("respects visibleLocales", () => {
    expect(isEventVisibleInLocale({ visibleLocales: ["en", "da"] }, "da")).toBe(true);
    expect(isEventVisibleInLocale({ visibleLocales: ["en", "da"] }, "uk")).toBe(false);
    expect(isEventVisibleInLocale({ visibleLocales: undefined }, "en")).toBe(false);
  });
});
