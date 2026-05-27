import Link from "next/link";
import { CalendarDays, Clock, TicketCheck, TicketX } from "lucide-react";
import { Card } from "@/components/ui";

export function EventList({ events, variant = "grid" }) {
    return (
      <div className={variant === "scroll" ? "event-list event-list-scroll" : "event-list"}>
        {events.map((event) => <EventCard key={event.title} event={event} variant={variant}/>)}
      </div>
    );
}

function formatEventDate(dateValue) {
    const date = new Date(`${dateValue}T12:00:00`);
    const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
    const month = date.toLocaleDateString("en-GB", { month: "short" });
    return `${weekday}, ${month} ${date.getDate()}`;
}

function formatEventBadgeDate(dateValue) {
    const date = new Date(`${dateValue}T12:00:00`);
    return {
        day: date.toLocaleDateString("en-GB", { day: "2-digit" }),
        month: date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()
    };
}

function formatListingDate(dateValue) {
    const date = new Date(`${dateValue}T12:00:00`);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatEventTime(time) {
    return time?.replace("-", "\u2013") ?? "Time to be announced";
}

export function EventCard({ event, variant = "grid" }) {
    const badgeDate = formatEventBadgeDate(event.date);
    const isListingCard = variant !== "scroll";
    const spotsLeft = typeof event.spotsLeft === "number" ? event.spotsLeft : event.ticketsLeft;
    const hasSpotsLeft = typeof spotsLeft === "number";
    const ticketStatus = event.isSoldOut ? "Sold out" : hasSpotsLeft ? `${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left` : "";
    const homeAvailability = event.isSoldOut
        ? "Sold out"
        : hasSpotsLeft
          ? `${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left`
          : "";
    const ListingAvailabilityIcon = event.isSoldOut ? TicketX : TicketCheck;
    const HomeAvailabilityIcon = event.isSoldOut ? TicketX : TicketCheck;
    const card = (
      <Card className={`event-card ${isListingCard ? "event-card-listing" : ""} ${event.isSoldOut ? "is-sold-out" : ""}`.trim()} variant="event">
        <div className="event-media">
          <span className="event-media-image" style={{ backgroundImage: `url(${event.image ?? "/images/hero.jpg"})` }} aria-hidden="true"/>
          <time className="event-date-card" dateTime={event.date}>
            <span className="event-date-day">{badgeDate.day}</span>
            <span className="event-date-month">{badgeDate.month}</span>
          </time>
        </div>
        <div className="event-body">
          <h3 className={isListingCard ? "event-card-title" : ""}>{event.title}</h3>
          {isListingCard ? (
            <>
              <div className="event-card-meta">
                <span className="event-card-meta-item">
                  <span className="event-card-meta-icon">
                    <CalendarDays aria-hidden="true"/>
                  </span>
                  <time dateTime={event.date}>{formatListingDate(event.date)}</time>
                </span>
                <span className="event-card-meta-item">
                  <span className="event-card-meta-icon">
                    <Clock aria-hidden="true"/>
                  </span>
                  <time dateTime={`${event.date}T${event.time.split("-")[0]}`}>{formatEventTime(event.time)}</time>
                </span>
              </div>
              {ticketStatus ? (
                <p className={event.isSoldOut ? "event-card-availability is-sold-out" : "event-card-availability"}>
                  <span className="event-card-availability-icon">
                    <ListingAvailabilityIcon aria-hidden="true"/>
                  </span>
                  <span>{ticketStatus}</span>
                </p>
              ) : null}
            </>
          ) : (
            <>
              <div className="event-meta-list">
                <span className="event-info-row">
                  <span className="event-info-icon"><CalendarDays aria-hidden="true"/></span>
                  <span className="event-info-copy">
                    <time dateTime={event.date}>{formatEventDate(event.date)}</time>
                  </span>
                </span>
                <span className="event-info-row">
                  <span className="event-info-icon"><Clock aria-hidden="true"/></span>
                  <span className="event-info-copy">
                    <time dateTime={`${event.date}T${event.time.split("-")[0]}`}>{event.time}</time>
                  </span>
                </span>
                {homeAvailability ? (
                  <span className={event.isSoldOut ? "event-info-row event-home-availability is-sold-out" : "event-info-row event-home-availability"}>
                    <span className="event-info-icon event-home-availability-icon"><HomeAvailabilityIcon aria-hidden="true"/></span>
                    <span className="event-info-copy">
                      <span className="event-home-availability-text">{homeAvailability}</span>
                    </span>
                  </span>
                ) : null}
              </div>
            </>
          )}
        </div>
      </Card>
    );

    if (event.slug) {
        return <Link className="event-card-link" href={`/events/${event.slug}`} aria-label={`View event: ${event.title}`}>{card}</Link>;
    }

    return (
      card
    );
}
