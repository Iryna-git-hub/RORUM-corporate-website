"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const dateOptions = [
  { value: "soonest", label: "Soonest first" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

const priceOptions = [
  { value: "price-asc", label: "From low to high" },
  { value: "price-desc", label: "From high to low" },
];

const availabilityOptions = [
  { value: "available", label: "Available" },
  { value: "sold-out", label: "Sold out" },
];

function EventFilterDropdown({ name, label, value, options, onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`events-filter-dropdown ${open ? "is-open" : ""}`}
      onBlur={(event) => {
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
      <div className="events-filter-menu" role="menu">
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
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectFilter(name, value) {
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
    <div className="events-controls" aria-label="Filter events">
      <div className="events-filters" role="group" aria-label="Event filters">
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
          <Link className="events-clear-filters" href="/events">
            Clear filters
          </Link>
        ) : null}
      </div>
    </div>
  );
}
