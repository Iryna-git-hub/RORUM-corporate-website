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
import { defaultFormMessages, resolveFormMessages } from "@/lib/sanityForms";
import { sanityEventToRorumEvent, type SanityEventLike } from "@/lib/sanityEvents";
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/live";
import { allEventsQuery, eventsPageQuery } from "@/sanity/queries/events";
import { eventMessagesQuery, formMessagesQuery } from "@/sanity/queries/globals";

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

  const [{ data: page }, { data: eventDocs }, { data: formMessagesDoc }, { data: eventMessagesDoc }] = await Promise.all([
    sanityFetch({ query: eventsPageQuery }),
    sanityFetch({ query: allEventsQuery }),
    sanityFetch({ query: formMessagesQuery }),
    sanityFetch({ query: eventMessagesQuery }),
  ]);

  const events = eventDocs?.length
    ? eventDocs.map((doc) => sanityEventToRorumEvent(doc as SanityEventLike, locale))
    : staticEvents;

  const messages = resolveFormMessages(formMessagesDoc, locale);

  const filters = {
    dateLabel: pickLocalized(page?.filters?.dateLabel, locale) ?? fallbackFilters.dateLabel,
    languageLabel: pickLocalized(page?.filters?.languageLabel, locale) ?? fallbackFilters.languageLabel,
    priceLabel: pickLocalized(page?.filters?.priceLabel, locale) ?? fallbackFilters.priceLabel,
    availabilityLabel: pickLocalized(page?.filters?.availabilityLabel, locale) ?? fallbackFilters.availabilityLabel,
    soonestLabel: pickLocalized(page?.filters?.soonestLabel, locale) ?? fallbackFilters.soonestLabel,
    weekLabel: pickLocalized(page?.filters?.weekLabel, locale) ?? fallbackFilters.weekLabel,
    monthLabel: pickLocalized(page?.filters?.monthLabel, locale) ?? fallbackFilters.monthLabel,
    priceAscLabel: pickLocalized(page?.filters?.priceAscLabel, locale) ?? fallbackFilters.priceAscLabel,
    priceDescLabel: pickLocalized(page?.filters?.priceDescLabel, locale) ?? fallbackFilters.priceDescLabel,
    availableLabel: pickLocalized(page?.filters?.availableLabel, locale) ?? fallbackFilters.availableLabel,
    soldOutLabel: pickLocalized(page?.filters?.soldOutLabel, locale) ?? fallbackFilters.soldOutLabel,
    clearFiltersLabel: pickLocalized(page?.filters?.clearFiltersLabel, locale) ?? fallbackFilters.clearFiltersLabel,
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
    title: pickLabel(page?.labels, "emptyStateTitle", locale, defaultEventsEmptyStateText.title),
    text: pickLabel(page?.labels, "emptyStateText", locale, defaultEventsEmptyStateText.text),
  };

  return {
    title: pickLocalized(page?.title, locale) ?? fallback.title,
    closingEyebrow: pickLocalized(page?.closingSection?.eyebrow, locale) ?? fallback.closingEyebrow,
    closingTitle: pickLocalized(page?.closingSection?.title, locale) ?? fallback.closingTitle,
    closingText: pickLocalized(page?.closingSection?.text, locale) ?? fallback.closingText,
    closingLabel: pickLocalized(page?.closingSection?.cta?.label, locale) ?? fallback.closingLabel,
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
