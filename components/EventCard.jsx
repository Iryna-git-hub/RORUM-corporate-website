import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui";

export function EventList({ events, variant = "grid" }) {
    return (
      <div className={variant === "scroll" ? "event-list event-list-scroll" : "event-list"}>
        {events.map((event) => <EventCard key={event.title} event={event}/>)}
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

export function EventCard({ event }) {
    const badgeDate = formatEventBadgeDate(event.date);
    const card = (
      <Card className="event-card" variant="event">
        <div className="event-media" style={{ backgroundImage: `url(${event.image ?? "/images/hero.jpg"})` }}>
          <time className="event-date-card" dateTime={event.date}>
            <span className="event-date-day">{badgeDate.day}</span>
            <span className="event-date-month">{badgeDate.month}</span>
          </time>
        </div>
        <div className="event-body">
          <h3>{event.title}</h3>
          <div className="event-meta-list">
            <time className="event-date-line" dateTime={`${event.date}T${event.time.split("-")[0]}`}>
              {formatEventDate(event.date)} <span aria-hidden="true">&middot;</span> {event.time}
            </time>
            <span className="event-info-row">
              <span className="event-info-icon"><MapPin aria-hidden="true"/></span>
              <span className="event-info-copy">
                <strong>Buermistersgade 26, 1 th, Copenhagen</strong>
              </span>
            </span>
          </div>
        </div>
      </Card>
    );

    if (event.slug) {
        return <Link className="event-card-link" href={`/events/${event.slug}`}>{card}</Link>;
    }

    return (
      card
    );
}
