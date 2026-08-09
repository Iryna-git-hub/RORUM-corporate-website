"use client";

import type { FocusEvent } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";

export type EventDateFilter = "soonest" | "week" | "month" | "all";
export type EventPriceFilter = "price-asc" | "price-desc" | "all";
export type EventAvailabilityFilter = "available" | "sold-out" | "all";

interface FilterOption {
  value: string;
  label: string;
}

const dateOptions: { value: Exclude<EventDateFilter, "all">; label: string }[] = [
  { value: "soonest", label: "Soonest first" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

const priceOptions: { value: Exclude<EventPriceFilter, "all">; label: string }[] = [
  { value: "price-asc", label: "From low to high" },
  { value: "price-desc", label: "From high to low" },
];

const availabilityOptions: {
  value: Exclude<EventAvailabilityFilter, "all">;
  label: string;
}[] = [
  { value: "available", label: "Available" },
  { value: "sold-out", label: "Sold out" },
];

function EventFilterDropdown({
  name,
  label,
  value,
  options,
  onSelect,
}: {
  name: string;
  label: string;
  value: string;
  options: FilterOption[];
  onSelect: (name: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // A fixed `left`/`right` anchor can't know ahead of time which edge of the
  // viewport a given trigger will end up near on a flex-wrap row - any of
  // the four filters can land next to either edge depending on screen width.
  // This menu is `visibility: hidden` (not `display: none`) while closed, so
  // it still occupies its full layout box even when nobody's opened it -
  // meaning an uncorrected position can push the page wider than the
  // viewport before any dropdown is ever clicked. Measure and correct on
  // mount and on resize (not just on open) so the closed state is safe too,
  // nudging back in bounds via a CSS custom property whenever it overflows
  // either edge. This sets the property directly on the DOM node (an
  // external-system side effect, not React state) rather than routing it
  // through a re-render.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    function reposition() {
      if (!menu) return;
      // `--menu-shift-x` feeds into the `transform` this menu animates on
      // open/close, so simply removing it to re-measure the "natural"
      // position would itself animate - and getBoundingClientRect() would
      // then read a mid-transition value instead of the resting position.
      // Suspend the transition for the instant it takes to remeasure.
      const previousTransition = menu.style.transition;
      menu.style.transition = "none";
      menu.style.removeProperty("--menu-shift-x");
      const margin = 12;
      const rect = menu.getBoundingClientRect();
      const overflowRight = rect.right - (window.innerWidth - margin);
      const overflowLeft = margin - rect.left;
      if (overflowRight > 0) {
        menu.style.setProperty("--menu-shift-x", `${-overflowRight}px`);
      } else if (overflowLeft > 0) {
        menu.style.setProperty("--menu-shift-x", `${overflowLeft}px`);
      }
      // Force the corrected value to take effect instantly, then restore the
      // real transition so the open/close animation still runs normally.
      void menu.offsetHeight;
      menu.style.transition = previousTransition;
    }

    reposition();
    window.addEventListener("resize", reposition);
    return () => window.removeEventListener("resize", reposition);
  }, [open]);

  return (
    <div
      className={`events-filter-dropdown ${open ? "is-open" : ""}`}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <button
        className="events-filter-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{label}</span>
        <ChevronDown aria-hidden="true" strokeWidth={2.2} />
      </button>
      <div className="events-filter-menu" role="menu" ref={menuRef}>
        {options.map((option) => (
          <button
            className={value === option.value ? "is-selected" : ""}
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={value === option.value}
            onClick={() => {
              onSelect(name, option.value);
              setOpen(false);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EventFilters({
  selectedDate,
  selectedLanguage,
  selectedPrice,
  selectedAvailability,
  languageOptions,
  hasActiveFilters,
}: {
  selectedDate: EventDateFilter;
  selectedLanguage: string;
  selectedPrice: EventPriceFilter;
  selectedAvailability: EventAvailabilityFilter;
  languageOptions: string[];
  hasActiveFilters: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectFilter(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    params.delete("page");
    router.push(`/events?${params.toString()}`);
  }

  const languageMenuOptions = languageOptions.map((language) => ({
    value: language,
    label: language,
  }));

  return (
    <div
      className="flex items-center justify-between flex-wrap gap-x-5 gap-y-3 mb-6 p-0 border-0 bg-transparent max-lg:items-stretch"
      aria-label="Filter events"
    >
      <div
        className="flex flex-wrap items-center gap-x-5.5 gap-y-2.5 flex-[1_1_640px] max-lg:basis-full"
        role="group"
        aria-label="Event filters"
      >
        <EventFilterDropdown
          name="date"
          label="Date"
          value={selectedDate}
          options={dateOptions}
          onSelect={selectFilter}
        />
        <EventFilterDropdown
          name="language"
          label="Languages"
          value={selectedLanguage}
          options={languageMenuOptions}
          onSelect={selectFilter}
        />
        <EventFilterDropdown
          name="price"
          label="Price"
          value={selectedPrice}
          options={priceOptions}
          onSelect={selectFilter}
        />
        <EventFilterDropdown
          name="availability"
          label="Availability"
          value={selectedAvailability}
          options={availabilityOptions}
          onSelect={selectFilter}
        />
        {hasActiveFilters ? (
          <Link
            className="min-h-8.5 inline-flex items-center justify-center p-0 border-0 border-b border-b-[rgba(var(--rgb-red),0.32)] rounded-none text-red text-[13px] font-semibold uppercase tracking-[0.02em] transition-colors duration-180 ease-[ease] hover:bg-[rgba(var(--rgb-red),0.08)] hover:text-red focus-visible:bg-[rgba(var(--rgb-red),0.08)] focus-visible:text-red focus-visible:outline-none"
            href="/events"
          >
            Clear filters
          </Link>
        ) : null}
      </div>
    </div>
  );
}
