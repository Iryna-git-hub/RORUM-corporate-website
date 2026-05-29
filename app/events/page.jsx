import Link from "next/link";
import { EventList } from "@/components/EventCard";
import { Container, CTASection, SectionHeader } from "@/components/ui";
import { events } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/events");

function normalizeDate(value) {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parsePriceValue(price) {
  if (typeof price !== "string" || !price.trim()) {
    return Number.POSITIVE_INFINITY;
  }
  const normalized = price.trim().toLowerCase();
  if (normalized.includes("free")) {
    return 0;
  }
  const numeric = Number(normalized.replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
}

function getDateWindow(referenceDate, range) {
  const dayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  if (range === "upcoming") {
    return { start: dayStart, end: null };
  }
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

function eventMatchesAvailability(event, selected) {
  if (selected === "all") {
    return true;
  }
  const soldOut = Boolean(event.isSoldOut);
  return selected === "sold-out" ? soldOut : !soldOut;
}

export default function EventsPage({ searchParams }) {
  const query = searchParams ?? {};
  const selectedSort =
    query.sort === "price-asc" || query.sort === "price-desc"
      ? query.sort
      : "soonest";
  const selectedDate =
    query.date === "week" || query.date === "month" || query.date === "upcoming"
      ? query.date
      : "all";
  const selectedPrice =
    query.price === "free" || query.price === "paid" ? query.price : "all";
  const selectedAvailability =
    query.availability === "available" || query.availability === "sold-out"
      ? query.availability
      : "all";
  const languageOptions = Array.from(
    new Set(events.map((event) => event.language).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
  const selectedLanguage = languageOptions.includes(query.language)
    ? query.language
    : "all";

  const now = new Date();
  const { start: dateStart, end: dateEnd } = getDateWindow(now, selectedDate);
  const hasActiveFilters =
    selectedDate !== "all" ||
    selectedLanguage !== "all" ||
    selectedPrice !== "all" ||
    selectedAvailability !== "all";

  const visibleEvents = [...events]
    .filter((event) => {
      const eventDate = normalizeDate(event.date);
      if (!eventDate) {
        return false;
      }
      if (dateStart && eventDate < dateStart) {
        return false;
      }
      if (dateEnd && eventDate > dateEnd) {
        return false;
      }
      if (selectedLanguage !== "all" && event.language !== selectedLanguage) {
        return false;
      }
      const priceValue = parsePriceValue(event.price);
      if (selectedPrice === "free" && priceValue !== 0) {
        return false;
      }
      if (
        selectedPrice === "paid" &&
        (!Number.isFinite(priceValue) || priceValue <= 0)
      ) {
        return false;
      }
      return eventMatchesAvailability(event, selectedAvailability);
    })
    .sort((a, b) => {
      const dateA =
        normalizeDate(a.date)?.getTime() ?? Number.POSITIVE_INFINITY;
      const dateB =
        normalizeDate(b.date)?.getTime() ?? Number.POSITIVE_INFINITY;
      if (selectedSort === "soonest") {
        return dateA - dateB;
      }
      const priceA = parsePriceValue(a.price);
      const priceB = parsePriceValue(b.price);
      if (priceA !== priceB) {
        return selectedSort === "price-asc" ? priceA - priceB : priceB - priceA;
      }
      return dateA - dateB;
    });

  return (
    <>
      <section className="section events-page-section">
        <Container>
          <SectionHeader
            title="Upcoming events at RORUM."
            text="Find community workshops, creative salons and intimate gatherings shaped for the room."
            level={1}
          />
          <form
            className="events-controls"
            method="get"
            action="/events"
            aria-label="Filter and sort events"
          >
            <div
              className="events-filters"
              role="group"
              aria-label="Event filters"
            >
              <label className="events-control-field">
                <span>Date</span>
                <select name="date" defaultValue={selectedDate}>
                  <option value="all">All dates</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
              </label>
              <label className="events-control-field">
                <span>Language</span>
                <select name="language" defaultValue={selectedLanguage}>
                  <option value="all">All languages</option>
                  {languageOptions.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </label>
              <label className="events-control-field">
                <span>Price</span>
                <select name="price" defaultValue={selectedPrice}>
                  <option value="all">All prices</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </label>
              <label className="events-control-field">
                <span>Availability</span>
                <select name="availability" defaultValue={selectedAvailability}>
                  <option value="all">All availability</option>
                  <option value="available">Available</option>
                  <option value="sold-out">Sold out</option>
                </select>
              </label>
            </div>
            <div className="events-controls-actions">
              <label className="events-control-field events-sort-field">
                <span>Sort</span>
                <select name="sort" defaultValue={selectedSort}>
                  <option value="soonest">Soonest first</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
              </label>
              <button className="btn" type="submit">
                Apply
              </button>
              {hasActiveFilters ? (
                <Link className="events-clear-filters" href="/events">
                  Clear filters
                </Link>
              ) : null}
            </div>
          </form>
          {visibleEvents.length > 0 ? (
            <EventList events={visibleEvents} />
          ) : (
            <div
              className="events-empty-state"
              role="status"
              aria-live="polite"
            >
              <p>No events match your filters.</p>
              <p>Try changing the date, language, price or availability.</p>
            </div>
          )}
        </Container>
      </section>
      <CTASection
        variant="host"
        title="Have a format for the room?"
        text="Send a hosting inquiry and we will explore audience, timing and setup together."
        href="/host-an-event"
        label="Host an event"
      />
    </>
  );
}
