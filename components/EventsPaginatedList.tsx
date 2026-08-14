"use client";

import { useEffect, useState } from "react";
import { EventList, defaultEventCardMessages, type EventCardMessages } from "@/components/EventCard";
import type { RorumEvent } from "@/lib/data";
import type { Locale } from "@/lib/i18n";

const ROWS_PER_PAGE = 7;

// Breakpoints match the .event-list CSS grid:
//   >= 1024px  → 3 columns  (repeat(3, 1fr)) - `lg`
//   640-1023px → 2 columns  (repeat(2, 1fr)) - `sm`
//   < 640px    → 1 column   (1fr)
// Default to desktop (3 × 7 = 21) so SSR output matches the most common
// layout and avoids hydration mismatches. useEffect corrects after mount.
function useEventsPerPage(): number {
  const [eventsPerPage, setEventsPerPage] = useState(ROWS_PER_PAGE * 3);

  useEffect(() => {
    function update() {
      const width = window.innerWidth;
      let columns: number;
      if (width >= 1024) {
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

export interface EventsEmptyStateText {
  title: string;
  text: string;
}

export const defaultEventsEmptyStateText: EventsEmptyStateText = {
  title: "No events match your filters.",
  text: "Try changing the date, language, price or availability.",
};

export function EventsPaginatedList({
  events,
  initialPage,
  queryParams,
  locale = "en",
  messages = defaultEventCardMessages,
  emptyState = defaultEventsEmptyStateText,
}: {
  events: RorumEvent[];
  initialPage: number;
  queryParams: Record<string, string>;
  locale?: Locale;
  messages?: EventCardMessages;
  emptyState?: EventsEmptyStateText;
}) {
  const eventsPerPage = useEventsPerPage();
  const totalPages = Math.max(1, Math.ceil(events.length / eventsPerPage));
  const requestedPage =
    Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1;
  const currentPage = Math.min(requestedPage, totalPages);

  const paginatedEvents = events.slice(
    (currentPage - 1) * eventsPerPage,
    currentPage * eventsPerPage,
  );

  function getPageHref(page: number): string {
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
      <div
        className="mt-2 p-[clamp(28px,4vw,44px)] border border-[rgba(var(--rgb-beige),0.9)] rounded-lg bg-[rgba(var(--rgb-cream),0.4)] text-center"
        role="status"
        aria-live="polite"
      >
        <p className="m-0 text-text-primary">{emptyState.title}</p>
        <p className="mt-2 text-[rgba(var(--rgb-brown),0.9)]">{emptyState.text}</p>
      </div>
    );
  }

  const paginationItemBase =
    "min-h-9 inline-flex items-center justify-center border text-[13px] font-bold leading-none uppercase transition-[background,border-color,color,transform] duration-180 ease-[ease]";
  const paginationInteractive =
    "border-[rgba(var(--rgb-light-green),0.24)] bg-transparent text-text-primary hover:border-light-green hover:bg-light-green hover:text-white hover:-translate-y-px focus-visible:border-light-green focus-visible:bg-light-green focus-visible:text-white focus-visible:outline-none focus-visible:-translate-y-px";
  const paginationActive =
    "border-light-green bg-light-green text-white outline-none -translate-y-px";
  const paginationDisabled =
    "pointer-events-none border-[rgba(var(--rgb-light-green),0.16)] text-[rgba(var(--rgb-light-green),0.36)] bg-transparent";

  return (
    <>
      <EventList events={paginatedEvents} locale={locale} messages={messages} />
      {totalPages > 1 ? (
        <nav
          className="flex items-center justify-center flex-wrap gap-2 mt-[clamp(28px,4vw,46px)] w-full"
          aria-label="Events pages"
        >
          <a
            className={
              currentPage === 1
                ? `${paginationItemBase} px-3.5 ${paginationDisabled}`
                : `${paginationItemBase} px-3.5 ${paginationInteractive}`
            }
            href={getPageHref(Math.max(1, currentPage - 1))}
            aria-disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <span aria-hidden="true">←</span>
          </a>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              return (
                <a
                  className={
                    page === currentPage
                      ? `${paginationItemBase} w-9 p-0 ${paginationActive}`
                      : `${paginationItemBase} w-9 p-0 ${paginationInteractive}`
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
                ? `${paginationItemBase} px-3.5 ${paginationDisabled}`
                : `${paginationItemBase} px-3.5 ${paginationInteractive}`
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
