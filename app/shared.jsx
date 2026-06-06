import Link from "next/link";
import { ArrowRight, CalendarDays, ConciergeBell, Megaphone, Presentation } from "lucide-react";

const quickPathMeta = {
    "/events": {
        icon: CalendarDays,
        cta: "Explore events",
        tone: "red"
    },
    "/host-an-event": {
        icon: Megaphone,
        cta: "Host with us",
        tone: "red"
    },
    "/private-meetings": {
        icon: Presentation,
        cta: "View formats",
        tone: "red"
    },
    "/services": {
        icon: ConciergeBell,
        tone: "green",
        links: [
            { href: "/catering", label: "Catering" },
            { href: "/space-decoration-event-styling", label: "Event decoration" }
        ]
    }
};

function QuickPathCard({ title, text, href, image }) {
    const meta = quickPathMeta[href] ?? quickPathMeta["/services"];
    const Icon = meta.icon;
    const cardClassName = `quick-path-card quick-path-card-${meta.tone} quick-path-card-${href.replace("/", "").replaceAll("/", "-") || "home"}`;
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
        {meta.links ? (<span className="quick-card-links" aria-label="Service links">
            {meta.links.map((link) => <span className="quick-card-link-item" key={link.href}>
              <Link className="quick-card-service-link" href={link.href}>
              <span>{link.label}</span>
              <ArrowRight aria-hidden="true" strokeWidth={1.9}/>
              </Link>
            </span>)}
          </span>) : (<span className="quick-card-cta">
            <span>{meta.cta}</span>
            <ArrowRight aria-hidden="true" strokeWidth={1.9}/>
          </span>)}
      </span>
    </>);

    if (meta.links) {
        return <article className={`${cardClassName} quick-path-card-static`}>{inner}</article>;
    }

    return <Link className={cardClassName} href={href}>{inner}</Link>;
}

export function QuickPathsGrid({ items }) {
    return (<div className="grid-4 quick-paths-grid">
      {items.map(([title, text, href, image]) => <QuickPathCard key={title} title={title} text={text} href={href} image={image}/>)}
    </div>);
}

export const CardsGrid = QuickPathsGrid;
