import type { Image } from "sanity";
import { events as staticEvents, type PracticalDetail, type RorumEvent } from "@/lib/data";
import { pickLocalized, type I18nEntry } from "@/lib/sanity-i18n";
import type { Locale } from "@/lib/i18n";
import { urlForImage } from "@/sanity/lib/image";

// Used only when a Sanity event has no uploaded image asset of its own —
// looked up by slug so an editor who hasn't uploaded a banner yet still
// sees *a* picture rather than a broken one. Once an image is uploaded in
// Studio, `urlForImage(doc.image)` below takes priority over this.
const staticBySlug = new Map(staticEvents.map((e) => [e.slug, e]));
const DEFAULT_EVENT_IMAGE = "/images/hero.jpg";

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
  language?: string | null;
  shortDescription?: Localized;
  longDescription?: Localized;
  included?: { text?: Localized }[] | null;
  whatToExpect?: { text?: Localized }[] | null;
  practicalDetails?: { label?: Localized; value?: Localized }[] | null;
  ticketProvider?: string | null;
  ticketUrl?: string | null;
  ticketButtonLabel?: Localized;
  calendarUrl?: string | null;
  waitlistUrl?: string | null;
  isSoldOut?: boolean | null;
  ticketsLeft?: number | null;
}

export function sanityEventToRorumEvent(doc: SanityEventLike, locale: Locale): RorumEvent {
  const slug = doc.slug?.current ?? "";
  const fallback = staticBySlug.get(slug);

  const practicalDetails: PracticalDetail[] =
    doc.practicalDetails
      ?.map((d) => ({
        label: pickLocalized(d.label, locale) ?? "",
        value: pickLocalized(d.value, locale) ?? "",
      }))
      .filter((d) => d.label) ?? fallback?.practicalDetails ?? [];

  // The uploaded Sanity image always wins when present; only an event with
  // no image asset of its own falls back to a matching static event's
  // `/public` path, and only then to the generic placeholder.
  const sanityImageUrl = urlForImage(doc.image)?.width(1200).url();
  const image = sanityImageUrl ?? fallback?.image ?? DEFAULT_EVENT_IMAGE;
  const imageAlt =
    pickLocalized(doc.image?.alt, locale) ?? fallback?.imageAlt ?? undefined;

  return {
    slug,
    title: pickLocalized(doc.title, locale) ?? fallback?.title ?? "",
    date: doc.date ?? fallback?.date ?? "",
    time: doc.time ?? fallback?.time ?? "",
    price: doc.price ?? fallback?.price ?? "",
    language: doc.language ?? fallback?.language ?? "English",
    shortDescription: pickLocalized(doc.shortDescription, locale) ?? fallback?.shortDescription ?? "",
    longDescription: pickLocalized(doc.longDescription, locale) ?? fallback?.longDescription ?? "",
    included:
      doc.included?.map((b) => pickLocalized(b.text, locale) ?? "").filter(Boolean) ??
      fallback?.included ??
      [],
    whatToExpect:
      doc.whatToExpect?.map((b) => pickLocalized(b.text, locale) ?? "").filter(Boolean) ??
      fallback?.whatToExpect ??
      [],
    practicalDetails,
    ticketProvider: doc.ticketProvider ?? fallback?.ticketProvider ?? "Billetto",
    ticketUrl: doc.ticketUrl ?? fallback?.ticketUrl ?? "",
    ticketButtonLabel: pickLocalized(doc.ticketButtonLabel, locale) ?? fallback?.ticketButtonLabel,
    calendarUrl: doc.calendarUrl ?? fallback?.calendarUrl ?? "",
    waitlistUrl: doc.waitlistUrl ?? fallback?.waitlistUrl ?? "",
    isSoldOut: doc.isSoldOut ?? fallback?.isSoldOut ?? false,
    image,
    imageAlt,
    ticketsLeft: doc.ticketsLeft ?? fallback?.ticketsLeft,
  };
}
