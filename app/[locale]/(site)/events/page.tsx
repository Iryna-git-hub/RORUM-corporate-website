import type { Metadata } from "next";
import { Suspense } from "react";
import { EventsClientPage } from "@/components/EventsClientPage";
import { defaultEventFilterLabels } from "@/components/EventFilters";
import { defaultEventCardMessages, type EventCardMessages } from "@/components/EventCard";
import { defaultEventsEmptyStateText, type EventsEmptyStateText } from "@/components/EventsPaginatedList";
import { Container, CTASection, SectionHeader } from "@/components/ui";
import { events as staticEvents } from "@/lib/data";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { pickLabel, pickLocalized } from "@/lib/sanity-i18n";
import { getAction, getSection } from "@/lib/sanity-sections";
import { defaultFormMessages, resolveFormMessages } from "@/lib/sanityForms";
import { sanityEventToRorumEvent, type SanityEventLike } from "@/lib/sanityEvents";
import { resolveEventFilterLabels, resolveEventLanguageLabels, resolveEventsEmptyStateText, resolveOrderedFilterOptions } from "@/lib/eventFilters";
import { getEventLanguageLabel } from "@/lib/eventLanguage";
import { isSanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { allEventsQuery } from "@/sanity/queries/events";
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
  seoTitle: "Upcoming Events at RORUM | Find Your Next Event",
  closingEyebrow: "Host at RORUM",
  closingTitle: "Would you like to host at RORUM?",
  closingText: "Explore our space for workshops, meetings, and community gatherings of up to 12 guests.",
  closingLabel: "Host at RORUM",
  description: "Explore upcoming events at RORUM, find practical information and choose an experience that interests and inspires you.",
};

async function getData(locale: Locale) {
  if (!isSanityConfigured) {
    return {
      ...fallback,
      events: staticEvents,
      filters: defaultEventFilterLabels,
      languageLabels: undefined,
      faqQuestion: defaultFormMessages.faqQuestion,
      faqLabel: defaultFormMessages.faqLabel,
      eventCardMessages: defaultEventCardMessages,
      emptyState: defaultEventsEmptyStateText,
    };
  }

  const [{ data: newPage }, { data: eventDocs }, { data: formMessagesDoc }, { data: eventMessagesDoc }] = await Promise.all([
    sanityFetch({ query: pageByKeyQuery, params: { pageKey: "events" } }),
    sanityFetch({ query: allEventsQuery, params: { locale } }),
    sanityFetch({ query: formMessagesQuery }),
    sanityFetch({ query: eventMessagesQuery }),
  ]);

  const heroSection = getSection(newPage?.sections, "hero");
  const filtersSection = getSection(newPage?.sections, "filters");
  const closingCtaSection = getSection(newPage?.sections, "closingCta");

  // An empty result is a real, legitimate state (no event has this locale in
  // its own `visibleLocales`) and must render as the genuine empty-state UI,
  // never silently fall back to the hardcoded English static events.
  const events = (eventDocs ?? []).map((doc) => sanityEventToRorumEvent(doc as SanityEventLike, locale));

  const messages = resolveFormMessages(formMessagesDoc, locale);

  const filters = resolveEventFilterLabels(filtersSection, locale);
  const languageLabels = resolveEventLanguageLabels(filtersSection, locale, getEventLanguageLabel);
  const dateOptionOrder = resolveOrderedFilterOptions(filtersSection, locale, "date");
  const priceOptionOrder = resolveOrderedFilterOptions(filtersSection, locale, "price");
  const availabilityOptionOrder = resolveOrderedFilterOptions(filtersSection, locale, "availability");

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

  const emptyState: EventsEmptyStateText = resolveEventsEmptyStateText(filtersSection, locale, defaultEventsEmptyStateText);

  return {
    title: pickLocalized(heroSection?.title, locale) ?? fallback.title,
    seoTitle: pickLocalized(newPage?.seo?.title, locale) ?? fallback.seoTitle,
    ogImageUrl: urlForImage(newPage?.seo?.ogImage as unknown as Parameters<typeof urlForImage>[0])
      ?.width(1200)
      .url(),
    ogImageAlt: pickLocalized(newPage?.seo?.ogImage?.alt, locale),
    closingEyebrow: pickLocalized(closingCtaSection?.label, locale) ?? fallback.closingEyebrow,
    closingTitle: pickLocalized(closingCtaSection?.title, locale) ?? fallback.closingTitle,
    closingText: pickLocalized(closingCtaSection?.text, locale) ?? fallback.closingText,
    closingLabel: pickLocalized(getAction(closingCtaSection, "main")?.label, locale) ?? fallback.closingLabel,
    description: pickLocalized(newPage?.seo?.description, locale) ?? fallback.description,
    faqQuestion: messages.faqQuestion,
    faqLabel: messages.faqLabel,
    events,
    filters,
    languageLabels,
    dateOptionOrder,
    priceOptionOrder,
    availabilityOptionOrder,
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
  const { seoTitle, description, ogImageUrl, ogImageAlt } = await getData(locale);
  return localizedPageMetadata({
    path: "/events",
    locale,
    title: seoTitle,
    description,
    ...(ogImageUrl ? { image: ogImageUrl } : {}),
    ...(ogImageAlt ? { imageAlt: ogImageAlt } : {}),
  });
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
              languageLabels={data.languageLabels}
              dateOptionOrder={data.dateOptionOrder}
              priceOptionOrder={data.priceOptionOrder}
              availabilityOptionOrder={data.availabilityOptionOrder}
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
