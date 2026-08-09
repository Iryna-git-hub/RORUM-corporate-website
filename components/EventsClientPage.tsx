"use client";

import { useSearchParams } from "next/navigation";
import {
  EventFilters,
  type EventAvailabilityFilter,
  type EventDateFilter,
  type EventPriceFilter,
} from "@/components/EventFilters";
import { EventsPaginatedList } from "@/components/EventsPaginatedList";
import type { RorumEvent } from "@/lib/data";

// ---------------------------------------------------------------------------
// Pure helpers (same logic as before, now runs client-side)
// ---------------------------------------------------------------------------

function normalizeDate(value: string): Date | null {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parsePriceValue(price: string): number {
  if (typeof price !== "string" || !price.trim())
    return Number.POSITIVE_INFINITY;
  const normalized = price.trim().toLowerCase();
  if (normalized.includes("free")) return 0;
  const numeric = Number(normalized.replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
}

function getDateWindow(
  referenceDate: Date,
  range: EventDateFilter,
): { start: Date | null; end: Date | null } {
  const dayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  // NOTE (pre-existing, not introduced by this migration): the original code
  // checked `range === "upcoming"` here, but the "Soonest first" filter
  // option's actual value is "soonest" (see EventFilters.tsx's dateOptions)
  // — "upcoming" is never a real value of EventDateFilter, so this branch
  // was already dead code. Concretely: picking "Soonest first" applies no
  // date window at all today (falls through to the `{ start: null, end:
  // null }` below) — it only re-sorts by date, it doesn't hide past events.
  // Preserved as-is rather than silently changed to `range === "soonest"`,
  // which would be a real filtering-behavior change on a live site; flagging
  // for a decision instead.
  if (range === "week") {
    const start = new Date(dayStart);
    const day = start.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + offset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (range === "month") {
    const start = new Date(dayStart.getFullYear(), dayStart.getMonth(), 1);
    const end = new Date(
      dayStart.getFullYear(),
      dayStart.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return { start, end };
  }
  return { start: null, end: null };
}

// ---------------------------------------------------------------------------
// Client component — reads URL params via useSearchParams so the Server
// Component page stays static (no searchParams dependency) and is compatible
// with Next.js output: 'export'.
// ---------------------------------------------------------------------------

export function EventsClientPage({ events }: { events: RorumEvent[] }) {
  const searchParams = useSearchParams();

  const rawDate = searchParams.get("date");
  const selectedDate: EventDateFilter =
    rawDate === "soonest" || rawDate === "week" || rawDate === "month"
      ? rawDate
      : "all";

  const rawPrice = searchParams.get("price");
  const selectedPrice: EventPriceFilter =
    rawPrice === "price-asc" || rawPrice === "price-desc" ? rawPrice : "all";

  const rawAvailability = searchParams.get("availability");
  const selectedAvailability: EventAvailabilityFilter =
    rawAvailability === "available" || rawAvailability === "sold-out"
      ? rawAvailability
      : "all";

  const languageOptions = Array.from(
    new Set(events.map((event) => event.language).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const rawLanguage = searchParams.get("language");
  const selectedLanguage =
    rawLanguage !== null && languageOptions.includes(rawLanguage)
      ? rawLanguage
      : "all";

  const rawPage = Number(searchParams.get("page"));
  const initialPage = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const hasActiveFilters =
    selectedDate !== "all" ||
    selectedLanguage !== "all" ||
    selectedPrice !== "all" ||
    selectedAvailability !== "all";

  const now = new Date();
  const { start: dateStart, end: dateEnd } = getDateWindow(now, selectedDate);

  const visibleEvents = [...events]
    .filter((event) => {
      const eventDate = normalizeDate(event.date);
      if (!eventDate) return false;
      if (dateStart && eventDate < dateStart) return false;
      if (dateEnd && eventDate > dateEnd) return false;
      if (selectedLanguage !== "all" && event.language !== selectedLanguage)
        return false;
      const soldOut = Boolean(event.isSoldOut);
      if (selectedAvailability === "sold-out") return soldOut;
      if (selectedAvailability === "available") return !soldOut;
      return true;
    })
    .sort((a, b) => {
      const dateA =
        normalizeDate(a.date)?.getTime() ?? Number.POSITIVE_INFINITY;
      const dateB =
        normalizeDate(b.date)?.getTime() ?? Number.POSITIVE_INFINITY;
      const priceA = parsePriceValue(a.price);
      const priceB = parsePriceValue(b.price);
      if (selectedPrice === "price-asc" || selectedPrice === "price-desc") {
        if (priceA !== priceB) {
          return selectedPrice === "price-asc"
            ? priceA - priceB
            : priceB - priceA;
        }
      }
      return dateA - dateB;
    });

  // Build a plain object from current search params for pagination link building.
  const queryParams = Object.fromEntries(searchParams.entries());

  return (
    <>
      <EventFilters
        selectedDate={selectedDate}
        selectedLanguage={selectedLanguage}
        selectedPrice={selectedPrice}
        selectedAvailability={selectedAvailability}
        languageOptions={languageOptions}
        hasActiveFilters={hasActiveFilters}
      />
      <EventsPaginatedList
        events={visibleEvents}
        initialPage={initialPage}
        queryParams={queryParams}
      />
    </>
  );
}
