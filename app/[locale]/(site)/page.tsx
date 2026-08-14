import type { Metadata } from "next";
import { QuickPathsGrid, type QuickPathHref } from "@/app/shared";
import { EventList } from "@/components/EventCard";
import {
  CommunityTeaserSection,
  EditorialFeatureSection,
  ServicesTeaserSection,
  type CommunityLink,
  type ServiceTeaser,
} from "@/components/HomeEditorialSections";
import {
  Button,
  Container,
  CTASection,
  HomeHero,
  Section,
  SectionHeader,
} from "@/components/ui";
import { events as staticEvents } from "@/lib/data";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { compact, pickLocalized } from "@/lib/sanity-i18n";
import { sanityEventToRorumEvent, type SanityEventLike } from "@/lib/sanityEvents";
import { isSanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { allEventsQuery } from "@/sanity/queries/events";
import { homePageQuery } from "@/sanity/queries/pages";
import {
  ArrowRight,
  HandHeart,
  HeartHandshake,
  MapPin,
  MessagesSquare,
  SlidersHorizontal,
  Users,
} from "lucide-react";

// Fallback only, used when Sanity has no `services[i].image` set yet.
const serviceImages = ["/images/catering/catering-1.png", "/images/decoration/decoration-1.png"];

const fallbackServices: ServiceTeaser[] = [
  {
    title: "Catering",
    text: "Fresh, simple and elegant catering for meetings, private gatherings, workshops and special moments.",
    cta: "Explore catering",
    href: "/catering",
    image: "/images/catering/catering-1.png",
  },
  {
    title: "Event decoration",
    text: "Flowers, table styling, candles and visual details designed to create a warm and memorable atmosphere.",
    cta: "Explore decoration",
    href: "/event-decoration",
    image: "/images/decoration/decoration-1.png",
  },
];

const fallbackCommunityLinks: CommunityLink[] = [
  { href: "/community-membership", label: "WECODA membership" },
  { href: "/work-with-us", label: "Work with us" },
  { href: "/volunteer", label: "Volunteer with us" },
];

const quickPathMeta: { href: QuickPathHref; image: string }[] = [
  { href: "/events", image: "/images/events/attend-events-quickpath.png" },
  { href: "/host-at-rorum", image: "/images/private-meetings/private-meeting-room-9.png" },
  { href: "/catering", image: "/images/catering/catering-1.png" },
  { href: "/event-decoration", image: "/images/decoration/decoration-1.png" },
];

const fallbackQuickPaths: [title: string, text: string][] = [
  ["Attend Events", "Discover workshops, conversations, and community experiences in the heart of Copenhagen."],
  ["Host at RORUM", "A warm and flexible Copenhagen venue for workshops, meetings, and community gatherings of up to 12 guests."],
  ["Catering", "Fresh, simple and elegant catering for meetings, private gatherings, workshops and special moments."],
  ["Event Decoration", "Flowers, table styling, candles and visual details designed to create a warm and memorable atmosphere."],
];

const fallback = {
  heroImageUrl: "/images/hero.jpg",
  heroVideoUrl: "/videos/home-hero.mp4",
  heroLabel: "Copenhagen event space",
  heroTitle: "A Copenhagen space for meaningful gatherings",
  heroText: "Attend events or host your own gathering in a calm, thoughtfully prepared space with support from the RORUM team.",
  heroTrustItems: ["Up to 12 guests", "Central Copenhagen", "On-site support", "Catering & decoration available"],
  hostAtRorumCta: "Host at RORUM",
  attendEventsCta: "Attend Events",
  quickPathsLabel: "Quick paths",
  quickPathsTitle: "Start with what you need.",
  eventsLabel: "What's on",
  eventsTitle: "Upcoming events at RORUM",
  eventsViewAllLabel: "View all events",
  attendFeature: {
    eyebrow: "Meaningful Gatherings",
    title: "Attend Events",
    intro: "Join meaningful gatherings at RORUM.",
    description: "Discover workshops, conversations, and community experiences in the heart of Copenhagen.",
    features: ["Small-group experiences", "Up to 12 participants", "Central Copenhagen", "Community-focused"],
    cta: "Attend Events",
    image: "/images/events/host-event-workshop-quickpath.png",
    imageAlt: "Workshop gathering around a table at RORUM",
  },
  hostFeature: {
    eyebrow: "Your Gathering",
    title: "Host at RORUM",
    intro: "Host your gathering at RORUM.",
    description: "A warm and flexible Copenhagen venue for workshops, meetings, and community gatherings of up to 12 guests.",
    features: ["Up to 12 guests", "Flexible room setup", "Central Copenhagen", "On-site support"],
    cta: "Host at RORUM",
    image: "/images/events/private-meetings.png",
    imageAlt: "Small hosted meeting in the RORUM room",
  },
  closingEyebrow: "Not sure where to start?",
  closingTitle: "Let's shape your idea together",
  closingText:
    "Whether you are planning a workshop, private session, community gathering, catering request or event styling idea — tell us what you have in mind, and we'll help you find the right format.",
  closingCta: "Let's talk",
  description: "RORUM is a warm Copenhagen space for meaningful events, hosted gatherings and community experiences.",
  servicesLabel: "Services",
  servicesTitle: "Services for thoughtful gatherings",
  communityLabel: "Community",
  communityTitle: "More than a space",
  communityText:
    "RORUM is a place for events, ideas and meaningful connections. Join our community, collaborate with us or become part of the team behind the experiences.",
};

async function getData(locale: Locale) {
  const eventsPromise = isSanityConfigured
    ? sanityFetch({ query: allEventsQuery }).then(({ data }) =>
        data?.length ? data.map((doc) => sanityEventToRorumEvent(doc as SanityEventLike, locale)) : staticEvents,
      )
    : Promise.resolve(staticEvents);

  if (!isSanityConfigured) {
    return {
      ...fallback,
      quickPaths: fallbackQuickPaths.map(([title, text], i) => ({ title, text, ...quickPathMeta[i]!, cta: undefined as string | undefined })),
      services: fallbackServices,
      communityLinks: fallbackCommunityLinks,
      events: await eventsPromise,
    };
  }

  const [{ data: page }, events] = await Promise.all([sanityFetch({ query: homePageQuery }), eventsPromise]);

  const quickPaths = page?.quickPaths?.length
    ? page.quickPaths.map((p, i) => ({
        title: pickLocalized(p?.title, locale) ?? fallbackQuickPaths[i]?.[0] ?? "",
        text: pickLocalized(p?.text, locale) ?? fallbackQuickPaths[i]?.[1] ?? "",
        href: (quickPathMeta[i] ?? quickPathMeta[0]!).href,
        image:
          urlForImage(p?.image as unknown as Parameters<typeof urlForImage>[0])
            ?.width(700)
            .url() ?? (quickPathMeta[i] ?? quickPathMeta[0]!).image,
        cta: pickLocalized(p?.cta, locale),
      }))
    : fallbackQuickPaths.map(([title, text], i) => ({ title, text, ...quickPathMeta[i]!, cta: undefined }));

  const heroTrustItems = page?.heroTrustItems?.length
    ? compact(page.heroTrustItems.map((b) => pickLocalized(b?.text, locale)))
    : fallback.heroTrustItems;

  function resolveFeature(
    feature: typeof page extends null | undefined ? never : NonNullable<typeof page>["attendEventsFeature"],
    fb: typeof fallback.attendFeature,
  ) {
    return {
      eyebrow: pickLocalized(feature?.eyebrow, locale) ?? fb.eyebrow,
      title: pickLocalized(feature?.title, locale) ?? fb.title,
      intro: pickLocalized(feature?.intro, locale) ?? fb.intro,
      description: pickLocalized(feature?.description, locale) ?? fb.description,
      features: feature?.features?.length
        ? compact(feature.features.map((b) => pickLocalized(b?.text, locale)))
        : fb.features,
      cta: pickLocalized(feature?.cta?.label, locale) ?? fb.cta,
      image:
        urlForImage(feature?.image as unknown as Parameters<typeof urlForImage>[0])
          ?.width(900)
          .url() ?? fb.image,
      imageAlt: pickLocalized(feature?.image?.alt, locale) ?? fb.imageAlt,
    };
  }

  const services: ServiceTeaser[] = page?.services?.length
    ? page.services.map((s, i) => ({
        title: pickLocalized(s?.title, locale) ?? fallbackServices[i]?.title ?? "",
        text: pickLocalized(s?.text, locale) ?? fallbackServices[i]?.text ?? "",
        cta: pickLocalized(s?.cta, locale) ?? fallbackServices[i]?.cta,
        href: s?.href ?? fallbackServices[i]?.href ?? "/",
        image:
          urlForImage(s?.image as unknown as Parameters<typeof urlForImage>[0])
            ?.width(700)
            .url() ?? serviceImages[i] ?? serviceImages[0]!,
      }))
    : fallbackServices;

  const communityLinks: CommunityLink[] = page?.communityLinks?.length
    ? page.communityLinks.map((l, i) => ({
        href: l?.href ?? fallbackCommunityLinks[i]?.href ?? "/",
        label: pickLocalized(l?.label, locale) ?? fallbackCommunityLinks[i]?.label ?? "",
      }))
    : fallbackCommunityLinks;

  const closingLinksFallback = [
    { href: "/events", label: "Attend Events" },
    { href: "/host-at-rorum", label: "Host at RORUM" },
    { href: "/catering", label: "Catering" },
    { href: "/event-decoration", label: "Event decoration" },
  ];
  const closingLinks = page?.closingSection?.links?.length
    ? page.closingSection.links.map((l, i) => ({
        href: l?.href ?? closingLinksFallback[i]?.href ?? "/",
        label: pickLocalized(l?.label, locale) ?? closingLinksFallback[i]?.label ?? "",
      }))
    : closingLinksFallback;

  return {
    heroLabel: pickLocalized(page?.heroLabel, locale) ?? fallback.heroLabel,
    heroTitle: pickLocalized(page?.heroTitle, locale) ?? fallback.heroTitle,
    heroText: pickLocalized(page?.heroText, locale) ?? fallback.heroText,
    heroTrustItems,
    hostAtRorumCta: pickLocalized(page?.heroPrimaryCta?.label, locale) ?? fallback.hostAtRorumCta,
    attendEventsCta: pickLocalized(page?.heroSecondaryCta?.label, locale) ?? fallback.attendEventsCta,
    quickPathsLabel: pickLocalized(page?.quickPathsLabel, locale) ?? fallback.quickPathsLabel,
    quickPathsTitle: pickLocalized(page?.quickPathsTitle, locale) ?? fallback.quickPathsTitle,
    quickPaths,
    eventsLabel: pickLocalized(page?.eventsLabel, locale) ?? fallback.eventsLabel,
    eventsTitle: pickLocalized(page?.eventsTitle, locale) ?? fallback.eventsTitle,
    eventsViewAllLabel: pickLocalized(page?.eventsViewAllLabel, locale) ?? fallback.eventsViewAllLabel,
    attendFeature: resolveFeature(page?.attendEventsFeature, fallback.attendFeature),
    hostFeature: resolveFeature(page?.hostAtRorumFeature, fallback.hostFeature),
    closingEyebrow: pickLocalized(page?.closingSection?.eyebrow, locale) ?? fallback.closingEyebrow,
    closingTitle: pickLocalized(page?.closingSection?.title, locale) ?? fallback.closingTitle,
    closingText: pickLocalized(page?.closingSection?.text, locale) ?? fallback.closingText,
    closingCta: pickLocalized(page?.closingSection?.cta?.label, locale) ?? fallback.closingCta,
    closingFaqQuestion: pickLocalized(page?.closingSection?.faqQuestion, locale) ?? "Have questions?",
    closingFaqLabel: pickLocalized(page?.closingSection?.faqLabel, locale) ?? "Read our FAQs",
    closingLinks,
    description: pickLocalized(page?.seo?.description, locale) ?? fallback.description,
    servicesLabel: pickLocalized(page?.servicesLabel, locale) ?? fallback.servicesLabel,
    servicesTitle: pickLocalized(page?.servicesTitle, locale) ?? fallback.servicesTitle,
    communityLabel: pickLocalized(page?.communityLabel, locale) ?? fallback.communityLabel,
    communityTitle: pickLocalized(page?.communityTitle, locale) ?? fallback.communityTitle,
    communityText: pickLocalized(page?.communityText, locale) ?? fallback.communityText,
    communityImageUrl: urlForImage(page?.communityImage as unknown as Parameters<typeof urlForImage>[0])
      ?.width(1600)
      .url(),
    heroImageUrl:
      urlForImage(page?.heroImage as unknown as Parameters<typeof urlForImage>[0])
        ?.width(1600)
        .url() ?? fallback.heroImageUrl,
    heroVideoUrl: page?.heroVideoUrl || fallback.heroVideoUrl,
    services,
    communityLinks,
    events,
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
  return localizedPageMetadata({
    path: "/",
    locale,
    title: "RORUM | Creative Event Space in Copenhagen",
    description,
  });
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const data = await getData(locale);

  return (
    <>
      <HomeHero
        label={data.heroLabel}
        title={data.heroTitle}
        text={data.heroText}
        trustItems={data.heroTrustItems}
        image={data.heroImageUrl}
        video={data.heroVideoUrl}
        actions={
          <>
            {/* `!important`: Button's own `.btn` base (deferred, still-
                unlayered CSS) sets background/border/padding/min-height/
                font-size too, and unlayered CSS isn't reliably beaten by a
                plain layered Tailwind utility regardless of specificity or
                className order. */}
            <Button
              href="/host-at-rorum"
              className="min-h-11.5! px-5! text-[12.5px]! max-sm:min-h-10! max-sm:px-3.5! max-sm:text-[11px]! bg-[#ae5745]! border-[#ae5745]! text-white! hover:bg-cta-red-hover! hover:border-cta-red-hover! hover:text-white!"
            >
              {data.hostAtRorumCta}
              <ArrowRight
                className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                aria-hidden="true"
                strokeWidth={1.9}
              />
            </Button>
            <Button
              href="/events"
              variant="secondary"
              className="backdrop-blur-md min-h-11.5! px-5! text-[12.5px]! max-sm:min-h-10! max-sm:px-3.5! max-sm:text-[11px]! bg-[rgb(255_250_242/28%)]! border-transparent! text-white! hover:bg-[rgba(var(--rgb-beige),0.2)]! hover:border-primary-light! hover:text-white!"
            >
              {data.attendEventsCta}
              <ArrowRight
                className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                aria-hidden="true"
                strokeWidth={1.9}
              />
            </Button>
          </>
        }
      />
      <section className="py-[clamp(52px,8vw,104px)] bg-white">
        <Container>
          <SectionHeader
            label={data.quickPathsLabel}
            title={data.quickPathsTitle}
          />
          <QuickPathsGrid
            items={data.quickPaths.map(({ title, text, href, image, cta }) => [title, text, href, image, cta])}
          />
        </Container>
      </section>
      <Section tight>
        <Container>
          <div className="event-section-head">
            <SectionHeader
              label={data.eventsLabel}
              title={data.eventsTitle}
            />
            <Button href="/events" variant="event-all">
              <span>{data.eventsViewAllLabel}</span>
              <ArrowRight
                className="event-all-icon w-4.5 h-4.5 bg-transparent text-current transition-transform duration-200 ease-[ease] flex-none group-hover:translate-x-1"
                aria-hidden="true"
                strokeWidth={1.9}
              />
            </Button>
          </div>
          <EventList events={data.events} variant="scroll" locale={locale} />
        </Container>
      </Section>
      <EditorialFeatureSection
        eyebrow={data.attendFeature.eyebrow}
        title={data.attendFeature.title}
        intro={data.attendFeature.intro}
        description={data.attendFeature.description}
        features={data.attendFeature.features}
        featureIcons={[MessagesSquare, Users, MapPin, HeartHandshake]}
        ctaLabel={data.attendFeature.cta}
        ctaHref="/events"
        image={data.attendFeature.image}
        imageAlt={data.attendFeature.imageAlt}
      />
      <EditorialFeatureSection
        eyebrow={data.hostFeature.eyebrow}
        title={data.hostFeature.title}
        intro={data.hostFeature.intro}
        description={data.hostFeature.description}
        features={data.hostFeature.features}
        featureIcons={[Users, SlidersHorizontal, MapPin, HandHeart]}
        ctaLabel={data.hostFeature.cta}
        ctaHref="/host-at-rorum"
        image={data.hostFeature.image}
        imageAlt={data.hostFeature.imageAlt}
        reversed
      />
      <ServicesTeaserSection
        services={data.services}
        label={data.servicesLabel}
        title={data.servicesTitle}
      />
      <CommunityTeaserSection
        label={data.communityLabel}
        title={data.communityTitle}
        text={data.communityText}
        links={data.communityLinks}
        backgroundImage={data.communityImageUrl}
      />
      <CTASection
        variant="final"
        className="next-step-section-not-sure"
        eyebrow={data.closingEyebrow}
        title={data.closingTitle}
        text={data.closingText}
        href="/contact"
        label={data.closingCta}
        faqQuestion={data.closingFaqQuestion}
        faqLabel={data.closingFaqLabel}
        links={data.closingLinks}
      />
    </>
  );
}
