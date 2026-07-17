import Link from "next/link";
import { ArrowRight, Balloon, CalendarDays, ConciergeBell, Presentation } from "lucide-react";

const quickPathMeta = {
    "/events": {
        icon: CalendarDays,
        cta: "Explore events",
        tone: "red"
    },
    "/host-at-rorum": {
        icon: Presentation,
        cta: "Host with us",
        tone: "red"
    },
    "/catering": {
        icon: ConciergeBell,
        tone: "green",
        cta: "Explore catering"
    },
    "/event-decoration": {
        icon: Balloon,
        tone: "green",
        cta: "Explore decoration"
    }
};

function QuickPathCard({ title, text, href, image }) {
    const routeKey = href;
    const meta = quickPathMeta[routeKey];
    const Icon = meta.icon;
    const cardClassName = `quick-path-card quick-path-card-${meta.tone} quick-path-card-${routeKey.replace(/^\/+/, "").replaceAll("/", "-")}`;
    const inner = (<>
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
      <span className="quick-card-actions">
        <span className="quick-card-cta">
            <span>{meta.cta}</span>
            <ArrowRight aria-hidden="true" strokeWidth={1.9}/>
        </span>
      </span>
    </>);

    return <Link className={cardClassName} href={href}>{inner}</Link>;
}

export function QuickPathsGrid({ items }) {
    return (<div className="grid-4 quick-paths-grid">
      {items.map(([title, text, href, image]) => <QuickPathCard key={title} title={title} text={text} href={href} image={image}/>)}
    </div>);
}

export const CardsGrid = QuickPathsGrid;
