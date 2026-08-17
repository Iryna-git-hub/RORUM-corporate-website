import type { LucideIcon } from "lucide-react";
import { LocaleLink as Link } from "@/components/LocaleLink";
import { ArrowRight, Balloon, CalendarDays, ConciergeBell, Presentation } from "lucide-react";

export type QuickPathHref = "/events" | "/host-at-rorum" | "/catering" | "/event-decoration";

const QUICK_PATH_HREFS: readonly QuickPathHref[] = ["/events", "/host-at-rorum", "/catering", "/event-decoration"];

/**
 * `QuickPathCard` looks up its icon/tone by using `href` as a key into
 * `quickPathMeta` below, which only has entries for these 4 exact paths —
 * an editor-supplied href that isn't one of them would make that lookup
 * `undefined` and crash on `.icon`. Callers resolving `item.href` from
 * Sanity must check this first and fall back to a known-safe href otherwise.
 */
export function isQuickPathHref(value: string | null | undefined): value is QuickPathHref {
  return !!value && (QUICK_PATH_HREFS as readonly string[]).includes(value);
}

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
  cta,
  icon,
}: {
  title: string;
  text: string;
  href: QuickPathHref;
  image: string;
  cta?: string;
  /** Editor-chosen icon from Sanity, already resolved to a component. Falls back to the fixed per-href icon below when unset (e.g. field empty, or an invalid/unrecognized icon name). */
  icon?: LucideIcon;
}) {
  const meta = quickPathMeta[href];
  const Icon = icon ?? meta.icon;
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
          <span>{cta ?? meta.cta}</span>
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
  items: [title: string, text: string, href: QuickPathHref, image: string, cta?: string, icon?: LucideIcon][];
}) {
  return (
    <div className="grid grid-cols-4 gap-[18px] items-stretch max-sm:grid-cols-1 sm:max-xl:grid-cols-2">
      {items.map(([title, text, href, image, cta, icon]) => (
        <QuickPathCard key={title} title={title} text={text} href={href} image={image} cta={cta} icon={icon} />
      ))}
    </div>
  );
}
