import Link from "next/link";
import { ArrowUpRight, CalendarDays, ConciergeBell, Megaphone, Presentation } from "lucide-react";

const quickPathIcons = {
    "/events": CalendarDays,
    "/host-an-event": Megaphone,
    "/book-the-space": Presentation,
    "/services": ConciergeBell
};

function QuickPathCard({ title, text, href, image }) {
    const Icon = quickPathIcons[href] ?? ConciergeBell;
    return (<Link className="quick-path-card" href={href}>
      <span className="quick-card-media" style={{ backgroundImage: `url(${image})` }} aria-hidden="true"/>
      <span className="quick-card-content">
        <span className="quick-card-heading">
          <span className="quick-card-icon-wrap">
            <Icon className="quick-card-icon" aria-hidden="true" strokeWidth={1.8}/>
          </span>
          <span className="quick-card-title">{title}</span>
        </span>
        <span className="quick-card-text">{text}</span>
      </span>
      <span className="quick-card-arrow" aria-hidden="true">
        <ArrowUpRight strokeWidth={1.8}/>
      </span>
    </Link>);
}

export function QuickPathsGrid({ items }) {
    return (<div className="grid-4 quick-paths-grid">
      {items.map(([title, text, href, image]) => <QuickPathCard key={title} title={title} text={text} href={href} image={image}/>)}
    </div>);
}

export const CardsGrid = QuickPathsGrid;
