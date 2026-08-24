import type { Image } from "sanity";
import {
  events as staticEvents,
  DEFAULT_SHARE_ACTIONS,
  type RorumEvent,
  type ShareAction,
  type ShareActionType,
  type TicketProviderInfo,
} from "@/lib/data";
import { pickExactLocalized, pickLocalized, type I18nEntry } from "@/lib/sanity-i18n";
import type { Locale } from "@/lib/i18n";
import { computeDurationFromTimeRange, parseDurationText, type EventDuration } from "@/lib/eventDuration";
import { urlForImage } from "@/sanity/lib/image";

// Used only when a Sanity event has no uploaded image asset of its own —
// looked up by slug so an editor who hasn't uploaded a banner yet still
// sees *a* picture rather than a broken one. Once an image is uploaded in
// Studio, `urlForImage(doc.image)` below takes priority over this.
const staticBySlug = new Map(staticEvents.map((e) => [e.slug, e]));
const DEFAULT_EVENT_IMAGE = "/images/hero.jpg";
const DEFAULT_ARRIVAL_TEXT = "Please arrive 5-10 minutes before the event begins.";

type Localized = I18nEntry<string>[] | null | undefined;

// Loosely typed to match sanity.types.ts's generated (heavily optional)
// shape rather than fighting it with casts — same reasoning as
// lib/sanity-i18n.ts's I18nEntry.
export interface SanityEventLike {
  slug?: { current?: string | null } | null;
  title?: Localized;
  image?: (Image & { alt?: Localized }) | null;
  date?: string | null;
  time?: string | null;
  price?: string | null;
  address?: string | null;
  language?: string | null;
  longDescription?: Localized;
  whatToExpect?: Localized;
  included?: { text?: Localized }[] | null;
  duration?: { value?: number | null; unit?: "minutes" | "hours" | null } | null;
  arrival?: Localized;
  ticketProviderInfo?: { label?: Localized; value?: Localized } | null;
  shareSettings?: { type?: string | null; label?: Localized; enabled?: boolean | null }[] | null;
  ticketUrl?: string | null;
  ticketButtonLabel?: Localized;
  calendarUrl?: string | null;
  waitlistUrl?: string | null;
  isSoldOut?: boolean | null;
  ticketsLeft?: number | null;
  // Legacy fields — superseded by `address`/`duration`/`arrival`/
  // `ticketProviderInfo` above, but a document that predates this schema
  // change may still only have data here. Read as a fallback only; see
  // sanity/schemaTypes/documents/event.ts's "LEGACY FIELDS" comment.
  practicalDetails?: { label?: Localized; value?: Localized }[] | null;
  ticketProvider?: string | null;
  seo?: { title?: Localized; description?: Localized; ogImage?: (Image & { alt?: Localized }) | null } | null;
  visibleLocales?: string[] | null;
}

/** Finds a legacy `practicalDetails` entry by its (English-only) label — the shape every pre-migration document used. */
function getLegacyDetail(doc: SanityEventLike, label: string): string | undefined {
  const entry = doc.practicalDetails?.find((d) => pickLocalized(d.label, "en") === label);
  return entry ? pickLocalized(entry.value, "en") : undefined;
}

const SHARE_ACTION_TYPES: ShareActionType[] = ["share", "copyLink", "whatsapp", "email", "linkedin", "facebook", "instagram"];

function isShareActionType(value: string | null | undefined): value is ShareActionType {
  return !!value && (SHARE_ACTION_TYPES as string[]).includes(value);
}

export function sanityEventToRorumEvent(doc: SanityEventLike, locale: Locale): RorumEvent {
  const slug = doc.slug?.current ?? "";
  const fallback = staticBySlug.get(slug);

  // The uploaded Sanity image always wins when present; only an event with
  // no image asset of its own falls back to a matching static event's
  // `/public` path, and only then to the generic placeholder.
  const sanityImageUrl = urlForImage(doc.image)?.width(1200).url();
  const image = sanityImageUrl ?? fallback?.image ?? DEFAULT_EVENT_IMAGE;
  const imageAlt = pickLocalized(doc.image?.alt, locale) ?? fallback?.imageAlt ?? undefined;

  const address = doc.address ?? getLegacyDetail(doc, "Address") ?? fallback?.address ?? "";

  const duration: EventDuration | undefined =
    doc.duration?.value && doc.duration.unit
      ? { value: doc.duration.value, unit: doc.duration.unit }
      : parseDurationText(getLegacyDetail(doc, "Duration")) ?? computeDurationFromTimeRange(doc.time) ?? fallback?.duration;

  const arrival = pickLocalized(doc.arrival, locale) ?? getLegacyDetail(doc, "Arrival") ?? fallback?.arrival ?? DEFAULT_ARRIVAL_TEXT;

  // `labelExactLocale`/`labelEnglish`: exact-locale-only (no fallback of any
  // kind), whitespace-only treated as unset — a blank translation shouldn't
  // count as "this event has its own label here" (see the event detail
  // page's priority chain, which needs to know the difference between "not
  // translated" and "translated to an empty string").
  const rawExactLabel = pickExactLocalized(doc.ticketProviderInfo?.label, locale);
  const rawEnglishLabel = pickExactLocalized(doc.ticketProviderInfo?.label, "en");
  const ticketProviderInfo: TicketProviderInfo = {
    label: pickLocalized(doc.ticketProviderInfo?.label, locale) ?? fallback?.ticketProviderInfo?.label ?? "Ticket provider",
    labelExactLocale: rawExactLabel?.trim() ? rawExactLabel : undefined,
    labelEnglish: rawEnglishLabel?.trim() ? rawEnglishLabel : undefined,
    value:
      pickLocalized(doc.ticketProviderInfo?.value, locale) ??
      doc.ticketProvider ??
      fallback?.ticketProviderInfo?.value ??
      "Billetto",
  };

  const shareActions: ShareAction[] = doc.shareSettings?.length
    ? doc.shareSettings
        .filter((a): a is typeof a & { type: string } => isShareActionType(a.type))
        .map((a) => ({
          type: a.type as ShareActionType,
          label: pickLocalized(a.label, locale) ?? a.type,
          enabled: a.enabled ?? true,
        }))
    : (fallback?.shareActions ?? DEFAULT_SHARE_ACTIONS);

  return {
    slug,
    title: pickLocalized(doc.title, locale) ?? fallback?.title ?? "",
    date: doc.date ?? fallback?.date ?? "",
    time: doc.time ?? fallback?.time ?? "",
    price: doc.price ?? fallback?.price ?? "",
    address,
    language: doc.language ?? fallback?.language ?? "English",
    longDescription: pickLocalized(doc.longDescription, locale) ?? fallback?.longDescription ?? "",
    included:
      doc.included?.map((b) => pickLocalized(b.text, locale) ?? "").filter(Boolean) ??
      fallback?.included ??
      [],
    whatToExpect:
      pickLocalized(doc.whatToExpect, locale)
        ?.split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean) ??
      fallback?.whatToExpect ??
      [],
    duration,
    arrival,
    ticketProviderInfo,
    shareActions,
    ticketUrl: doc.ticketUrl ?? fallback?.ticketUrl ?? "",
    ticketButtonLabel: pickLocalized(doc.ticketButtonLabel, locale) ?? fallback?.ticketButtonLabel,
    calendarUrl: doc.calendarUrl ?? fallback?.calendarUrl ?? "",
    waitlistUrl: doc.waitlistUrl ?? fallback?.waitlistUrl ?? "",
    isSoldOut: doc.isSoldOut ?? fallback?.isSoldOut ?? false,
    image,
    imageAlt,
    ticketsLeft: doc.ticketsLeft ?? fallback?.ticketsLeft,
    seo: {
      title: pickLocalized(doc.seo?.title, locale) ?? undefined,
      description: pickLocalized(doc.seo?.description, locale) ?? undefined,
      ogImageUrl: urlForImage(doc.seo?.ogImage)?.width(1200).url() ?? undefined,
      ogImageAlt: pickLocalized(doc.seo?.ogImage?.alt, locale) ?? undefined,
    },
    visibleLocales: doc.visibleLocales ?? undefined,
  };
}
