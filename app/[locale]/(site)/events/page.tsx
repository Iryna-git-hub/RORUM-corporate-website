import type { Metadata } from "next";
import { Suspense } from "react";
import { EventsClientPage } from "@/components/EventsClientPage";
import { defaultEventCardMessages, type EventCardMessages } from "@/components/EventCard";
import { defaultEventsEmptyStateText, type EventsEmptyStateText } from "@/components/EventsPaginatedList";
import { Container, CTASection, SectionHeader } from "@/components/ui";
import { events as staticEvents } from "@/lib/data";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { pickLabel, pickLocalized } from "@/lib/sanity-i18n";
import { getAction, getItem, getSection } from "@/lib/sanity-sections";
import { defaultFormMessages, resolveFormMessages } from "@/lib/sanityForms";
import { sanityEventToRorumEvent, type SanityEventLike } from "@/lib/sanityEvents";
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/live";
import { allEventsQuery, eventsPageQuery } from "@/sanity/queries/events";
import { eventMessagesQuery, formMessagesQuery } from "@/sanity/queries/globals";
import { pageByKeyQuery } from "@/sanity/queries/page";

// NOTE: this page IS an async Server Component that fetches from Sanity —
// that's fine for static generation (data isn't request-dependent, just
// locale-dependent via generateStaticParams). The one constraint that still
// holds is not reading `searchParams`/`useSearchParams` HERE: all URL-driven
// filtering/pagination stays inside EventsClientPage, which receives the
// full (already-localized) events array as a prop.
//
// `revalidate`: this page's prerendered HTML is otherwise cached until the
// next build — the Live Content API's client-side patching (`<SanityLive
// />`) only updates fields on documents a page has already fetched, it
// doesn't re-run `allEventsQuery` to discover a BRAND NEW event (confirmed
// empirically: a freshly published event did not appear here even after
// several seconds in an open browser tab). No revalidation webhook is
// configured for this project, so a short time-based ISR window is the
// project-supported way for a new event to appear without a manual rebuild.
export const revalidate = 60;

const fallback = {
  title: "Upcoming events at RORUM",
  closingEyebrow: "Host at RORUM",
  closingTitle: "Would you like to host at RORUM?",
  closingText: "Explore our space for workshops, meetings, and community gatherings of up to 12 guests.",
  closingLabel: "Host at RORUM",
  description: "Discover upcoming RORUM events, workshops and intimate community gatherings.",
};

const fallbackFilters = {
  dateLabel: "Date",
  languageLabel: "Languages",
  priceLabel: "Price",
  availabilityLabel: "Availability",
  soonestLabel: "Soonest first",
  weekLabel: "This week",
  monthLabel: "This month",
  priceAscLabel: "From low to high",
  priceDescLabel: "From high to low",
  availableLabel: "Available",
  soldOutLabel: "Sold out",
  clearFiltersLabel: "Clear filters",
};

async function getData(locale: Locale) {
  if (!isSanityConfigured) {
    return {
      ...fallback,
      events: staticEvents,
      filters: fallbackFilters,
      faqQuestion: defaultFormMessages.faqQuestion,
      faqLabel: defaultFormMessages.faqLabel,
      eventCardMessages: defaultEventCardMessages,
      emptyState: defaultEventsEmptyStateText,
    };
  }

  const [{ data: page }, { data: newPage }, { data: eventDocs }, { data: formMessagesDoc }, { data: eventMessagesDoc }] = await Promise.all([
    sanityFetch({ query: eventsPageQuery }),
    sanityFetch({ query: pageByKeyQuery, params: { pageKey: "events" } }),
    sanityFetch({ query: allEventsQuery }),
    sanityFetch({ query: formMessagesQuery }),
    sanityFetch({ query: eventMessagesQuery }),
  ]);

  const heroSection = getSection(newPage?.sections, "hero");
  const filtersSection = getSection(newPage?.sections, "filters");
  const closingCtaSection = getSection(newPage?.sections, "closingCta");

  const events = eventDocs?.length
    ? eventDocs.map((doc) => sanityEventToRorumEvent(doc as SanityEventLike, locale))
    : staticEvents;

  const messages = resolveFormMessages(formMessagesDoc, locale);

  const filterField = (key: string, fallbackValue: string) =>
    pickLocalized(getItem(filtersSection, key)?.title, locale) ??
    pickLocalized((page?.filters as Record<string, unknown> | undefined)?.[key] as never, locale) ??
    fallbackValue;

  const filters = {
    dateLabel: filterField("dateLabel", fallbackFilters.dateLabel),
    languageLabel: filterField("languageLabel", fallbackFilters.languageLabel),
    priceLabel: filterField("priceLabel", fallbackFilters.priceLabel),
    availabilityLabel: filterField("availabilityLabel", fallbackFilters.availabilityLabel),
    soonestLabel: filterField("soonestLabel", fallbackFilters.soonestLabel),
    weekLabel: filterField("weekLabel", fallbackFilters.weekLabel),
    monthLabel: filterField("monthLabel", fallbackFilters.monthLabel),
    priceAscLabel: filterField("priceAscLabel", fallbackFilters.priceAscLabel),
    priceDescLabel: filterField("priceDescLabel", fallbackFilters.priceDescLabel),
    availableLabel: filterField("availableLabel", fallbackFilters.availableLabel),
    soldOutLabel: filterField("soldOutLabel", fallbackFilters.soldOutLabel),
    clearFiltersLabel: filterField("clearFiltersLabel", fallbackFilters.clearFiltersLabel),
  };

  const eventCardMessages: EventCardMessages = {
    soldOutLabel: pickLabel(eventMessagesDoc?.labels, "soldOutLabel", locale, defaultEventCardMessages.soldOutLabel),
    spotsLeftOne: pickLabel(eventMessagesDoc?.labels, "spotsLeftOne", locale, defaultEventCardMessages.spotsLeftOne),
    spotsLeftOther: pickLabel(eventMessagesDoc?.labels, "spotsLeftOther", locale, defaultEventCardMessages.spotsLeftOther),
    timeToBeAnnouncedLabel: pickLabel(
      eventMessagesDoc?.labels,
      "timeToBeAnnouncedLabel",
      locale,
      defaultEventCardMessages.timeToBeAnnouncedLabel,
    ),
    viewEventAriaPrefix: pickLabel(
      eventMessagesDoc?.labels,
      "viewEventAriaPrefix",
      locale,
      defaultEventCardMessages.viewEventAriaPrefix,
    ),
  };

  const emptyState: EventsEmptyStateText = {
    title:
      pickLocalized(getItem(filtersSection, "emptyStateTitle")?.title, locale) ??
      pickLabel(page?.labels, "emptyStateTitle", locale, defaultEventsEmptyStateText.title),
    text:
      pickLocalized(getItem(filtersSection, "emptyStateText")?.title, locale) ??
      pickLabel(page?.labels, "emptyStateText", locale, defaultEventsEmptyStateText.text),
  };

  return {
    title: pickLocalized(heroSection?.title, locale) ?? pickLocalized(page?.title, locale) ?? fallback.title,
    closingEyebrow:
      pickLocalized(closingCtaSection?.label, locale) ?? pickLocalized(page?.closingSection?.eyebrow, locale) ?? fallback.closingEyebrow,
    closingTitle:
      pickLocalized(closingCtaSection?.title, locale) ?? pickLocalized(page?.closingSection?.title, locale) ?? fallback.closingTitle,
    closingText:
      pickLocalized(closingCtaSection?.text, locale) ?? pickLocalized(page?.closingSection?.text, locale) ?? fallback.closingText,
    closingLabel:
      pickLocalized(getAction(closingCtaSection, "main")?.label, locale) ??
      pickLocalized(page?.closingSection?.cta?.label, locale) ??
      fallback.closingLabel,
    description: pickLocalized(page?.seo?.description, locale) ?? fallback.description,
    faqQuestion: messages.faqQuestion,
    faqLabel: messages.faqLabel,
    events,
    filters,
    eventCardMessages,
    emptyState,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const { description } = await getData(locale);
  return localizedPageMetadata({ path: "/events", locale, title: "Events", description });
}

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const data = await getData(locale);

  return (
    <>
      <section className="pt-[clamp(16px,2vw,28px)] px-0 pb-[clamp(52px,8vw,104px)]">
        <Container>
          <SectionHeader title={data.title} level={1} />
          <Suspense fallback={null}>
            <EventsClientPage
              events={data.events}
              filters={data.filters}
              eventCardMessages={data.eventCardMessages}
              emptyState={data.emptyState}
            />
          </Suspense>
        </Container>
      </section>
      <CTASection
        variant="host"
        className="events-next-step-section"
        eyebrow={data.closingEyebrow}
        title={data.closingTitle}
        text={data.closingText}
        href="/host-at-rorum"
        label={data.closingLabel}
        faqQuestion={data.faqQuestion}
        faqLabel={data.faqLabel}
      />
    </>
  );
}
