import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight, Balloon, CalendarDays, ConciergeBell, Presentation } from "lucide-react";

export type QuickPathHref = "/events" | "/host-at-rorum" | "/catering" | "/event-decoration";

interface QuickPathMeta {
  icon: LucideIcon;
  cta: string;
  tone: "red" | "green";
}

const quickPathMeta: Record<QuickPathHref, QuickPathMeta> = {
  "/events": {
    icon: CalendarDays,
    cta: "Explore events",
    tone: "red",
  },
  "/host-at-rorum": {
    icon: Presentation,
    cta: "Host with us",
    tone: "red",
  },
  "/catering": {
    icon: ConciergeBell,
    tone: "green",
    cta: "Explore catering",
  },
  "/event-decoration": {
    icon: Balloon,
    tone: "green",
    cta: "Explore decoration",
  },
};

function QuickPathCard({
  title,
  text,
  href,
  image,
}: {
  title: string;
  text: string;
  href: QuickPathHref;
  image: string;
}) {
  const meta = quickPathMeta[href];
  const Icon = meta.icon;
  const cardClassName = `quick-path-card quick-path-card-${meta.tone} quick-path-card-${href.replace(/^\/+/, "").replaceAll("/", "-")}`;
  const inner = (
    <>
      <span className="quick-card-media" style={{ backgroundImage: `url(${image})` }} aria-hidden="true" />
      <span className="quick-card-content">
        <span className="quick-card-heading">
          <span className="quick-card-icon-wrap">
            <Icon className="quick-card-icon" aria-hidden="true" strokeWidth={1.8} />
          </span>
          <span className="quick-card-title">{title}</span>
        </span>
        <span className="quick-card-text">{text}</span>
      </span>
      <span className="absolute left-[clamp(18px,2.4vw,26px)] right-[clamp(18px,2.4vw,26px)] bottom-5.5 z-2 grid justify-items-center gap-3">
        <span className="quick-card-cta">
          <span>{meta.cta}</span>
          <ArrowRight aria-hidden="true" strokeWidth={1.9} />
        </span>
      </span>
    </>
  );

  return (
    <Link className={cardClassName} href={href}>
      {inner}
    </Link>
  );
}

export function QuickPathsGrid({
  items,
}: {
  items: [title: string, text: string, href: QuickPathHref, image: string][];
}) {
  return (
    <div className="grid grid-cols-4 gap-[18px] items-stretch max-sm:grid-cols-1 sm:max-xl:grid-cols-2">
      {items.map(([title, text, href, image]) => (
        <QuickPathCard key={title} title={title} text={text} href={href} image={image} />
      ))}
    </div>
  );
}
