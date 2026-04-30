import Link from "next/link";
import { Button, Card } from "@/components/ui";

export function EventList({ events }) {
    return <div className="grid-3">{events.map((event) => <EventCard key={event.title} event={event}/>)}</div>;
}

export function EventCard({ event }) {
    const date = new Date(`${event.date}T12:00:00`);
    return (<Card className="event-card" variant="event">
      <div className="date-block">
        <span>{date.toLocaleString("en", { month: "short" })}</span>
        <strong>{date.getDate()}</strong>
        <span>{date.getFullYear()}</span>
      </div>
      <div className="event-body">
        <span className="tag">{event.category}</span>
        <h3>{event.slug ? <Link href={`/events/${event.slug}`}>{event.title}</Link> : event.title}</h3>
        <div className="event-meta"><span>{event.time}</span><span>{event.language}</span><span>{event.price}</span></div>
        <p className="muted">{event.shortDescription}</p>
        <div className="hero-actions">
          <Button href={event.ticketUrl}>Book Ticket</Button>
          <span className="provider">Tickets via {event.ticketProvider}</span>
        </div>
      </div>
    </Card>);
}
