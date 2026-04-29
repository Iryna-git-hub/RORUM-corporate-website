import Link from "next/link";
import { ArrowUpRight, CalendarDays, Sparkles, Store, Ticket } from "lucide-react";

const quickPathIcons = {
    "/events": Ticket,
    "/host-an-event": CalendarDays,
    "/book-the-space": Store,
    "/services": Sparkles
};

export function CardsGrid({ items }) {
    return (<div className="grid-4 quick-paths-grid">
      {items.map(([title, text, href, image]) => {
        const Icon = quickPathIcons[href] ?? Sparkles;
        return (<Link key={title} className="quick-path-card" href={href}>
          <span className="quick-card-media" style={{ backgroundImage: `url(${image})` }} aria-hidden="true"/>
          <span className="quick-card-content">
            <span className="quick-card-heading">
              <Icon className="quick-card-icon" aria-hidden="true" strokeWidth={1.8}/>
              <span className="quick-card-title">{title}</span>
            </span>
            <span className="quick-card-text">{text}</span>
          </span>
          <span className="quick-card-arrow" aria-hidden="true">
            <ArrowUpRight strokeWidth={1.8}/>
          </span>
        </Link>);
      })}
    </div>);
}
