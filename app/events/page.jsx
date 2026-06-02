import { EventList } from "@/components/EventCard";
import { EventFilters } from "@/components/EventFilters";
import { Container, CTASection, SectionHeader } from "@/components/ui";
import { events } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/events");
const EVENTS_PER_PAGE = 20;

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
  const selectedDate =
    query.date === "soonest" || query.date === "week" || query.date === "month"
      ? query.date
      : "all";
  const selectedPrice =
    query.price === "price-asc" || query.price === "price-desc"
      ? query.price
      : "all";
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
  const requestedPage = Number(query.page);

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
      return eventMatchesAvailability(event, selectedAvailability);
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
  const totalPages = Math.max(
    1,
    Math.ceil(visibleEvents.length / EVENTS_PER_PAGE),
  );
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, totalPages)
      : 1;
  const paginatedEvents = visibleEvents.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE,
  );

  function getPageHref(page) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (key === "page" || value === undefined || value === null) {
        continue;
      }
      params.set(key, String(value));
    }
    if (page > 1) {
      params.set("page", String(page));
    }
    const queryString = params.toString();
    return queryString ? `/events?${queryString}` : "/events";
  }

  return (
    <>
      <section className="section events-page-section">
        <Container>
          <SectionHeader
            title="Upcoming events at RORUM."
            level={1}
          />
          <EventFilters
            selectedDate={selectedDate}
            selectedLanguage={selectedLanguage}
            selectedPrice={selectedPrice}
            selectedAvailability={selectedAvailability}
            languageOptions={languageOptions}
            hasActiveFilters={hasActiveFilters}
          />
          {visibleEvents.length > 0 ? (
            <>
              <EventList events={paginatedEvents} />
              {totalPages > 1 ? (
                <nav className="events-pagination" aria-label="Events pages">
                  <a
                    className={
                      currentPage === 1
                        ? "events-pagination-link is-disabled"
                        : "events-pagination-link"
                    }
                    href={getPageHref(Math.max(1, currentPage - 1))}
                    aria-disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <span aria-hidden="true">←</span>
                  </a>
                  <div className="events-pagination-pages">
                    {Array.from({ length: totalPages }, (_, index) => {
                      const page = index + 1;
                      return (
                        <a
                          className={
                            page === currentPage
                              ? "events-pagination-page is-active"
                              : "events-pagination-page"
                          }
                          href={getPageHref(page)}
                          key={page}
                          aria-current={page === currentPage ? "page" : undefined}
                        >
                          {page}
                        </a>
                      );
                    })}
                  </div>
                  <a
                    className={
                      currentPage === totalPages
                        ? "events-pagination-link is-disabled"
                        : "events-pagination-link"
                    }
                    href={getPageHref(Math.min(totalPages, currentPage + 1))}
                    aria-disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <span aria-hidden="true">→</span>
                  </a>
                </nav>
              ) : null}
            </>
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
        className="events-next-step-section"
        title="Have a format for the room?"
        text="Send a hosting inquiry and we will explore audience, timing and setup together."
        href="/host-an-event"
        label="Host an event"
      />
    </>
  );
}
