import { Button, Card } from "@/components/ui";
export function EventCard({ event }) {
    const date = new Date(`${event.date}T12:00:00`);
    return (<Card className="event-card">
      <div className="date-block">
        <span>{date.toLocaleString("en", { month: "short" })}</span>
        <strong>{date.getDate()}</strong>
        <span>{date.getFullYear()}</span>
      </div>
      <div className="event-body">
        <span className="tag">{event.category}</span>
        <h3>{event.title}</h3>
        <div className="event-meta"><span>{event.time}</span><span>{event.language}</span><span>{event.price}</span></div>
        <p className="muted">{event.shortDescription}</p>
        <div className="hero-actions">
          <Button href={event.ticketUrl}>Book Ticket</Button>
          <span className="provider">Tickets via {event.ticketProvider}</span>
        </div>
      </div>
    </Card>);
}
