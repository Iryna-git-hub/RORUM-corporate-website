"use client";

import { useSearchParams } from "next/navigation";
import { EventFilters } from "@/components/EventFilters";
import { EventsPaginatedList } from "@/components/EventsPaginatedList";

// ---------------------------------------------------------------------------
// Pure helpers (same logic as before, now runs client-side)
// ---------------------------------------------------------------------------

function normalizeDate(value) {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parsePriceValue(price) {
  if (typeof price !== "string" || !price.trim())
    return Number.POSITIVE_INFINITY;
  const normalized = price.trim().toLowerCase();
  if (normalized.includes("free")) return 0;
  const numeric = Number(normalized.replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
}

function getDateWindow(referenceDate, range) {
  const dayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  if (range === "upcoming") return { start: dayStart, end: null };
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

export function EventsClientPage({ events }) {
  const searchParams = useSearchParams();

  const selectedDate =
    searchParams.get("date") === "soonest" ||
    searchParams.get("date") === "week" ||
    searchParams.get("date") === "month"
      ? searchParams.get("date")
      : "all";

  const selectedPrice =
    searchParams.get("price") === "price-asc" ||
    searchParams.get("price") === "price-desc"
      ? searchParams.get("price")
      : "all";

  const selectedAvailability =
    searchParams.get("availability") === "available" ||
    searchParams.get("availability") === "sold-out"
      ? searchParams.get("availability")
      : "all";

  const languageOptions = Array.from(
    new Set(events.map((event) => event.language).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const rawLanguage = searchParams.get("language");
  const selectedLanguage = languageOptions.includes(rawLanguage)
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
