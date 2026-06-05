"use client";

import { useEffect, useState } from "react";
import { EventList } from "@/components/EventCard";

const ROWS_PER_PAGE = 7;

// Breakpoints match the .event-list CSS grid:
//   >= 981px  → 3 columns  (repeat(3, 1fr))
//   640-980px → 2 columns  (repeat(2, 1fr))
//   < 640px   → 1 column   (1fr)
// Default to desktop (3 × 7 = 21) so SSR output matches the most common
// layout and avoids hydration mismatches. useEffect corrects after mount.
function useEventsPerPage() {
  const [eventsPerPage, setEventsPerPage] = useState(ROWS_PER_PAGE * 3);

  useEffect(() => {
    function update() {
      const width = window.innerWidth;
      let columns;
      if (width >= 981) {
        columns = 3;
      } else if (width >= 640) {
        columns = 2;
      } else {
        columns = 1;
      }
      setEventsPerPage(columns * ROWS_PER_PAGE);
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return eventsPerPage;
}

export function EventsPaginatedList({ events, initialPage, queryParams }) {
  const eventsPerPage = useEventsPerPage();
  const totalPages = Math.max(1, Math.ceil(events.length / eventsPerPage));
  const requestedPage =
    Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1;
  const currentPage = Math.min(requestedPage, totalPages);

  const paginatedEvents = events.slice(
    (currentPage - 1) * eventsPerPage,
    currentPage * eventsPerPage,
  );

  function getPageHref(page) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (key === "page" || value === undefined || value === null) continue;
      params.set(key, String(value));
    }
    if (page > 1) {
      params.set("page", String(page));
    }
    const qs = params.toString();
    return qs ? `/events?${qs}` : "/events";
  }

  if (events.length === 0) {
    return (
      <div className="events-empty-state" role="status" aria-live="polite">
        <p>No events match your filters.</p>
        <p>Try changing the date, language, price or availability.</p>
      </div>
    );
  }

  return (
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
  );
}
