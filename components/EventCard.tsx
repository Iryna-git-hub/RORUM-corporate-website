import { LocaleLink as Link } from "@/components/LocaleLink";
import { CalendarDays, Clock, TicketCheck, TicketX } from "lucide-react";
import { Card } from "@/components/ui";
import type { RorumEvent } from "@/lib/data";
import { localeTags, type Locale } from "@/lib/i18n";

export interface EventCardMessages {
  soldOutLabel: string;
  spotsLeftOne: string;
  spotsLeftOther: string;
  timeToBeAnnouncedLabel: string;
  viewEventAriaPrefix: string;
}

export const defaultEventCardMessages: EventCardMessages = {
  soldOutLabel: "Sold out",
  spotsLeftOne: "spot left",
  spotsLeftOther: "spots left",
  timeToBeAnnouncedLabel: "Time to be announced",
  viewEventAriaPrefix: "View event:",
};

export function EventList({
  events,
  variant = "grid",
  locale = "en",
  messages = defaultEventCardMessages,
}: {
  events: RorumEvent[];
  variant?: "grid" | "scroll";
  locale?: Locale;
  messages?: EventCardMessages;
}) {
  return (
    <div
      className={variant === "scroll" ? "event-list event-list-scroll" : "event-list"}
    >
      {events.map((event) => (
        <EventCard key={event.title} event={event} variant={variant} locale={locale} messages={messages} />
      ))}
    </div>
  );
}

function formatEventDate(dateValue: string, locale: Locale): string {
  const date = new Date(`${dateValue}T12:00:00`);
  const tag = localeTags[locale];
  const weekday = date.toLocaleDateString(tag, { weekday: "short" });
  const month = date.toLocaleDateString(tag, { month: "short" });
  return `${weekday}, ${month} ${date.getDate()}`;
}

function formatEventBadgeDate(dateValue: string, locale: Locale): { day: string; month: string } {
  const date = new Date(`${dateValue}T12:00:00`);
  const tag = localeTags[locale];
  return {
    day: date.toLocaleDateString(tag, { day: "2-digit" }),
    month: date.toLocaleDateString(tag, { month: "short" }).toUpperCase(),
  };
}

function formatListingDate(dateValue: string, locale: Locale): string {
  const date = new Date(`${dateValue}T12:00:00`);
  return date.toLocaleDateString(localeTags[locale], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventTime(time: string, timeToBeAnnouncedLabel: string): string {
  return time?.replace("-", "–") ?? timeToBeAnnouncedLabel;
}

export function EventCard({
  event,
  variant = "grid",
  locale = "en",
  messages = defaultEventCardMessages,
}: {
  event: RorumEvent;
  variant?: "grid" | "scroll";
  locale?: Locale;
  messages?: EventCardMessages;
}) {
  const badgeDate = formatEventBadgeDate(event.date, locale);
  const isListingCard = variant !== "scroll";
  const spotsLeft =
    typeof event.spotsLeft === "number" ? event.spotsLeft : event.ticketsLeft;
  const hasSpotsLeft = typeof spotsLeft === "number";
  const spotsLeftText = hasSpotsLeft
    ? `${spotsLeft} ${spotsLeft === 1 ? messages.spotsLeftOne : messages.spotsLeftOther}`
    : "";
  const ticketStatus = event.isSoldOut ? messages.soldOutLabel : spotsLeftText;
  const homeAvailability = event.isSoldOut ? messages.soldOutLabel : spotsLeftText;
  const ListingAvailabilityIcon = event.isSoldOut ? TicketX : TicketCheck;
  const HomeAvailabilityIcon = event.isSoldOut ? TicketX : TicketCheck;
  const eventStartTime = event.time.split("-")[0] ?? "";
  const card = (
    <Card
      className={`event-card ${isListingCard ? "event-card-listing" : ""} ${event.isSoldOut ? "is-sold-out" : ""}`.trim()}
      variant="event"
    >
      <div className="event-media" data-sanity={event.imageEditAttr}>
        <span
          className={`absolute inset-0 bg-center bg-cover bg-no-repeat scale-100 transition-[transform_0.42s_ease,filter_0.24s_ease] group-hover:scale-[1.07] group-focus-visible:scale-[1.07] ${
            event.isSoldOut
              ? "grayscale-[70%] saturate-[60%] brightness-[0.85]"
              : "group-hover:saturate-[1.08] group-hover:contrast-[1.04] group-focus-visible:saturate-[1.08] group-focus-visible:contrast-[1.04]"
          }`}
          style={{ backgroundImage: `url(${event.image ?? "/images/hero.jpg"})` }}
          aria-hidden="true"
        />
        <time
          className="absolute top-[14px] left-[14px] max-lg:top-[12px] max-lg:left-[12px] z-[1] grid place-items-center content-center gap-px w-[52px] min-h-[52px] px-[7px] py-[6px] bg-light-green text-[var(--color-text-heading)] text-center font-body"
          dateTime={event.date}
        >
          <span className="text-secondary font-body text-[22px] leading-[0.9] font-black">
            {badgeDate.day}
          </span>
          <span className="text-gold font-body text-[11px] leading-[0.95] font-extrabold tracking-[0.04em]">
            {badgeDate.month}
          </span>
        </time>
      </div>
      <div
        className={
          isListingCard
            ? "grid content-start gap-0 px-[clamp(18px,2.3vw,24px)] pt-[clamp(18px,2.3vw,24px)] pb-[clamp(5px,0.8vw,8px)]"
            : "flex flex-col gap-[11px] px-[clamp(14px,2vw,18px)] pt-[clamp(14px,2vw,18px)] pb-[clamp(4px,0.75vw,6px)]"
        }
      >
        <h3
          className={`m-0 font-heading text-[var(--color-text-heading)] font-bold text-[18px] leading-[1.3]${
            isListingCard ? " mb-[14px]" : ""
          }`}
        >
          {event.title}
        </h3>
        {isListingCard ? (
          <>
            <div className="flex items-center gap-[28px] flex-wrap text-text-primary text-[14.5px] leading-[1.35] font-medium">
              <span className="inline-flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center justify-center w-[30px] h-[30px] bg-[rgba(var(--rgb-light-green),0.12)] text-light-green shrink-0">
                  <CalendarDays className="size-4" aria-hidden="true" />
                </span>
                <time dateTime={event.date}>{formatListingDate(event.date, locale)}</time>
              </span>
              <span className="inline-flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center justify-center w-[30px] h-[30px] bg-[rgba(var(--rgb-light-green),0.12)] text-light-green shrink-0">
                  <Clock className="size-4" aria-hidden="true" />
                </span>
                <time dateTime={`${event.date}T${eventStartTime}`}>
                  {formatEventTime(event.time, messages.timeToBeAnnouncedLabel)}
                </time>
              </span>
            </div>
            {ticketStatus ? (
              <p
                className={`inline-flex items-center gap-2 w-fit my-[3px] text-sm leading-[1.35] font-medium ${
                  event.isSoldOut ? "text-accent" : "text-gold"
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-[30px] h-[30px] shrink-0 ${
                    event.isSoldOut
                      ? "bg-[rgba(var(--rgb-red),0.1)] text-accent"
                      : "bg-[rgba(var(--rgb-gold),0.14)] text-gold"
                  }`}
                >
                  <ListingAvailabilityIcon className="size-4" aria-hidden="true" />
                </span>
                <span>{ticketStatus}</span>
              </p>
            ) : null}
          </>
        ) : (
          <>
            <div className="grid gap-[6px] text-sm font-medium mt-auto">
              <span className="grid grid-cols-[30px_minmax(0,1fr)] gap-[10px] items-start min-w-0">
                <span className="inline-flex items-center justify-center w-[30px] h-[30px] -translate-y-1 bg-[rgba(var(--rgb-light-green),0.12)] text-light-green">
                  <CalendarDays className="size-4 stroke-[2.35]" aria-hidden="true" />
                </span>
                <span className="grid gap-[2px] min-w-0">
                  <time
                    className="text-text-primary text-sm leading-[1.25] font-medium"
                    dateTime={event.date}
                  >
                    {formatEventDate(event.date, locale)}
                  </time>
                </span>
              </span>
              <span className="grid grid-cols-[30px_minmax(0,1fr)] gap-[10px] items-start min-w-0">
                <span className="inline-flex items-center justify-center w-[30px] h-[30px] -translate-y-1 bg-[rgba(var(--rgb-light-green),0.12)] text-light-green">
                  <Clock className="size-4 stroke-[2.35]" aria-hidden="true" />
                </span>
                <span className="grid gap-0.5 min-w-0">
                  <time
                    className="text-text-primary text-sm leading-tight font-medium"
                    dateTime={`${event.date}T${eventStartTime}`}
                  >
                    {event.time}
                  </time>
                </span>
              </span>
              {homeAvailability ? (
                <span className="grid grid-cols-[30px_minmax(0,1fr)] gap-[10px] items-start min-w-0">
                  <span
                    className={`inline-flex items-center justify-center w-[30px] h-[30px] -translate-y-1 ${
                      event.isSoldOut
                        ? "bg-[rgba(var(--rgb-red),0.1)] text-accent"
                        : "bg-[rgba(var(--rgb-gold),0.14)] text-gold"
                    }`}
                  >
                    <HomeAvailabilityIcon
                      className="size-4 stroke-[2.35]"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="grid gap-[2px] min-w-0">
                    <span
                      className={`text-sm font-medium leading-[1.25] ${
                        event.isSoldOut ? "text-accent" : "text-gold"
                      }`}
                    >
                      {homeAvailability}
                    </span>
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
    return (
      <Link
        className="event-card-link group"
        href={`/events/${event.slug}`}
        aria-label={`${messages.viewEventAriaPrefix} ${event.title}`}
      >
        {card}
      </Link>
    );
  }

  return card;
}
