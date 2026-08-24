import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { isQuickPathHref, QuickPathsGrid, type QuickPathHref } from "@/app/shared";
import { EventList } from "@/components/EventCard";
import {
  CommunityTeaserSection,
  EditorialFeatureSection,
  ServicesTeaserSection,
  type CommunityLink,
  type FeatureBullet,
  type ServiceTeaser,
} from "@/components/HomeEditorialSections";
import {
  Button,
  Container,
  CTASection,
  HomeHero,
  Section,
  SectionHeader,
  type TrustItem,
} from "@/components/ui";
import { events as staticEvents } from "@/lib/data";
import { getIconCardIcon } from "@/lib/iconCardIcons";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { compact, pickLocalized } from "@/lib/sanity-i18n";
import { getItem, getSection, resolveAction, type RawPageSection, type ResolvedAction } from "@/lib/sanity-sections";
import { sanityEventToRorumEvent, type SanityEventLike } from "@/lib/sanityEvents";
import { isSanityConfigured } from "@/sanity/env";
import { urlForFile, urlForImage } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { allEventsQuery } from "@/sanity/queries/events";
import { pageByKeyQuery } from "@/sanity/queries/page";
import {
  ArrowRight,
  CircleEllipsis,
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

// Fallback metadata only — no longer the primary href source (Quick Path
// cards now use each item's own Sanity `href` first, see
// `isQuickPathHref`/`quickPathsFromSections` below). Still genuinely needed
// for: (1) `image`, the per-card fallback photo when an editor hasn't
// uploaded one yet, and (2) `href` itself, as the last-resort value when a
// Sanity item's href is missing or isn't one of the 4 known quick-path
// destinations (see `isQuickPathHref` — `QuickPathCard` looks up icon/tone
// by href, so an arbitrary editor-typed string can't safely reach it).
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

// Paired with a name (the exact lucide-react export) so a resolved icon can
// always be stamped as `data-icon`, whether it came from Sanity or from
// here — see resolveFeature() below and the icon-backfill migration
// (scripts/backfill-home-feature-icons.ts), which writes these same names.
const ATTEND_FEATURE_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: "MessagesSquare", icon: MessagesSquare },
  { name: "Users", icon: Users },
  { name: "MapPin", icon: MapPin },
  { name: "HeartHandshake", icon: HeartHandshake },
];
const HOST_FEATURE_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: "Users", icon: Users },
  { name: "SlidersHorizontal", icon: SlidersHorizontal },
  { name: "MapPin", icon: MapPin },
  { name: "HandHeart", icon: HandHeart },
];

const fallback = {
  heroImageUrl: "/images/hero.jpg",
  heroVideoUrl: "/videos/home-hero.mp4",
  heroLabel: "Copenhagen event space",
  heroTitle: "A Copenhagen space for meaningful gatherings",
  heroText: "Attend events or host your own gathering in a calm, thoughtfully prepared space with support from the RORUM team.",
  heroTrustItems: [
    { title: "Up to 12 guests", icon: "Users" },
    { title: "Central Copenhagen", icon: "MapPin" },
    { title: "On-site support", icon: "Smile" },
    { title: "Catering & decoration available", icon: "Wine" },
  ],
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
    featureIcons: ATTEND_FEATURE_ICONS,
    cta: "Attend Events",
    ctaHref: "/events",
    image: "/images/events/host-event-workshop-quickpath.png",
    imageAlt: "Workshop gathering around a table at RORUM",
  },
  hostFeature: {
    eyebrow: "Your Gathering",
    title: "Host at RORUM",
    intro: "Host your gathering at RORUM.",
    description: "A warm and flexible Copenhagen venue for workshops, meetings, and community gatherings of up to 12 guests.",
    features: ["Up to 12 guests", "Flexible room setup", "Central Copenhagen", "On-site support"],
    featureIcons: HOST_FEATURE_ICONS,
    cta: "Host at RORUM",
    ctaHref: "/host-at-rorum",
    image: "/images/events/private-meetings.png",
    imageAlt: "Small hosted meeting in the RORUM room",
  },
  closingEyebrow: "Not sure where to start?",
  closingTitle: "Let's shape your idea together",
  closingText:
    "Whether you are planning a workshop, private session, community gathering, catering request or event styling idea — tell us what you have in mind, and we'll help you find the right format.",
  closingCta: "Let's talk",
  seoTitle: "RORUM | Events, Community & Creative Space",
  description: "Discover RORUM — a place for events, community, hosting, catering and creative collaboration where people and ideas come together.",
  servicesLabel: "Services",
  servicesTitle: "Services for thoughtful gatherings",
  communityLabel: "Community",
  communityTitle: "More than a space",
  communityText:
    "RORUM is a place for events, ideas and meaningful connections. Join our community, collaborate with us or become part of the team behind the experiences.",
};

async function getData(locale: Locale) {
  // `data` is a real (possibly empty) array whenever Sanity is configured —
  // an empty result means "no event is visible on this locale's website"
  // (per that event's own `visibleLocales`), which must render as a
  // genuinely empty strip, not silently fall back to the hardcoded English
  // static events. The static fallback is only for the case Sanity itself
  // isn't configured at all (see the other branch below).
  const eventsPromise = isSanityConfigured
    ? sanityFetch({ query: allEventsQuery, params: { locale } }).then(({ data }) =>
        (data ?? []).map((doc) => sanityEventToRorumEvent(doc as SanityEventLike, locale)),
      )
    : Promise.resolve(staticEvents);

  const noAction = (label: string, href: string): ResolvedAction => ({ label, href, target: undefined, rel: undefined });
  const noActionFeature = (fb: typeof fallback.attendFeature | typeof fallback.hostFeature) => ({
    eyebrow: fb.eyebrow,
    title: fb.title,
    intro: fb.intro,
    description: fb.description,
    features: fb.features.map((label, i) => {
      const fbIcon = fb.featureIcons[i] ?? fb.featureIcons[0]!;
      return { label, icon: fbIcon.icon, iconName: fbIcon.name } satisfies FeatureBullet;
    }),
    cta: fb.cta as string | undefined,
    ctaHref: fb.ctaHref as string | undefined,
    ctaTarget: undefined as ResolvedAction["target"],
    ctaRel: undefined as string | undefined,
    image: fb.image,
    imageAlt: fb.imageAlt,
  });

  if (!isSanityConfigured) {
    return {
      ...fallback,
      heroPrimaryAction: noAction(fallback.hostAtRorumCta, "/host-at-rorum"),
      heroSecondaryAction: noAction(fallback.attendEventsCta, "/events"),
      eventsViewAllAction: noAction(fallback.eventsViewAllLabel, "/events"),
      closingMainAction: noAction(fallback.closingCta, "/contact"),
      attendFeature: noActionFeature(fallback.attendFeature),
      hostFeature: noActionFeature(fallback.hostFeature),
      quickPaths: fallbackQuickPaths.map(([title, text], i) => ({
        title,
        text,
        ...quickPathMeta[i]!,
        cta: undefined as string | undefined,
        icon: undefined as LucideIcon | undefined,
        iconName: undefined as string | undefined,
      })),
      services: fallbackServices,
      communityLinks: fallbackCommunityLinks,
      events: await eventsPromise,
    };
  }

  // `page-home` (pageKey "home") is the only CMS source for Home — the
  // legacy `homePage` singleton (0 documents in production, confirmed via a
  // read-only count query) has been removed from this data path entirely.
  // The `homePage` schema type itself is intentionally still registered
  // (see sanity/schemaTypes/index.ts) and already hidden from Studio's
  // create menu via `sanity.config.ts`'s `newDocumentOptions` — unregistering
  // it globally is a later, cross-page schema-cleanup decision, not part of
  // this Home-only fix.
  const [{ data: newPage }, events] = await Promise.all([
    sanityFetch({ query: pageByKeyQuery, params: { pageKey: "home" } }),
    eventsPromise,
  ]);

  const heroSection = getSection(newPage?.sections, "hero");
  const quickPathsSection = getSection(newPage?.sections, "quickPaths");
  const eventsStripSection = getSection(newPage?.sections, "eventsStrip");
  const attendFeatureSection = getSection(newPage?.sections, "editorialAttendEvents");
  const hostFeatureSection = getSection(newPage?.sections, "editorialHostAtRorum");
  const servicesTeaserSection = getSection(newPage?.sections, "servicesTeaser");
  const communityTeaserSection = getSection(newPage?.sections, "communityTeaser");
  const closingCtaSection = getSection(newPage?.sections, "closingCta");

  const quickPathsFromSections = quickPathsSection?.items?.length
    ? quickPathsSection.items.map((item, i) => {
        const fallbackMeta = quickPathMeta[i] ?? quickPathMeta[0]!;
        return {
          title: pickLocalized(item.title, locale) ?? fallbackQuickPaths[i]?.[0] ?? "",
          text: pickLocalized(item.text, locale) ?? fallbackQuickPaths[i]?.[1] ?? "",
          // `item.href` only wins when it's one of the 4 known quick-path
          // destinations (QuickPathCard looks up icon/tone by href — see
          // isQuickPathHref) — an unrecognized or missing value fails safely
          // to the same positional fallback used before this field was wired.
          href: isQuickPathHref(item.href) ? item.href : fallbackMeta.href,
          image:
            urlForImage(item.image as unknown as Parameters<typeof urlForImage>[0])
              ?.width(700)
              .url() ?? fallbackMeta.image,
          cta: pickLocalized(item.label, locale),
          // Editor-chosen icon, wired via the same validated resolver every
          // other icon picker on the site uses. Empty AND invalid values
          // (an icon name that isn't a real current lucide-react export)
          // both resolve to `undefined` here rather than getIconCardIcon's
          // own CircleEllipsis placeholder, so QuickPathCard's per-href
          // fallback icon applies instead of a generic dot in either case.
          // `iconName` is the validated raw string, paired 1:1 with `icon`,
          // used only to stamp `data-icon` for tests.
          ...(() => {
            const trimmed = item.icon?.trim();
            const resolved = trimmed ? getIconCardIcon(trimmed) : undefined;
            const valid = resolved && resolved !== CircleEllipsis;
            return { icon: valid ? resolved : undefined, iconName: valid ? trimmed : undefined };
          })(),
        };
      })
    : undefined;
  const quickPaths =
    quickPathsFromSections ??
    fallbackQuickPaths.map(([title, text], i) => ({
      title,
      text,
      ...quickPathMeta[i]!,
      cta: undefined as string | undefined,
      icon: undefined as LucideIcon | undefined,
      iconName: undefined as string | undefined,
    }));

  const heroTrustSectionItems = heroSection?.items?.filter((i) => i.itemKey?.startsWith("trust"));
  const heroTrustItems: TrustItem[] = heroTrustSectionItems?.length
    ? compact(
        heroTrustSectionItems.map((item, i) => {
          const title = pickLocalized(item.title, locale) ?? fallback.heroTrustItems[i]?.title;
          return title ? { title, icon: item.icon ?? fallback.heroTrustItems[i]?.icon, key: item.itemKey ?? undefined } : undefined;
        }),
      )
    : fallback.heroTrustItems;

  function resolveFeature(
    section: RawPageSection | undefined,
    fb: {
      eyebrow: string;
      title: string;
      intro: string;
      description: string;
      features: string[];
      featureIcons: { name: string; icon: LucideIcon }[];
      cta: string;
      ctaHref: string;
      image: string;
      imageAlt: string;
    },
  ) {
    const media = section?.media?.[0];
    const descriptionItem = getItem(section, "description");
    const featureItems = (section?.items ?? []).filter((i) => i.itemKey?.startsWith("feature"));
    const features: FeatureBullet[] = featureItems.length
      ? featureItems.map((item, i) => {
          const fbIcon = fb.featureIcons[i] ?? fb.featureIcons[0]!;
          const iconName = item.icon?.trim();
          return {
            label: pickLocalized(item.title, locale) ?? fb.features[i] ?? "",
            icon: iconName ? getIconCardIcon(iconName) : fbIcon.icon,
            iconName: iconName || fbIcon.name,
            key: item.itemKey ?? undefined,
          };
        })
      : fb.features.map((label, i) => {
          const fbIcon = fb.featureIcons[i] ?? fb.featureIcons[0]!;
          return { label, icon: fbIcon.icon, iconName: fbIcon.name };
        });

    const ctaAction = resolveAction(section, "cta", locale, { label: fb.cta, href: fb.ctaHref });

    return {
      eyebrow: pickLocalized(section?.label, locale) ?? fb.eyebrow,
      title: pickLocalized(section?.title, locale) ?? fb.title,
      intro: pickLocalized(section?.text, locale) ?? fb.intro,
      description: pickLocalized(descriptionItem?.text, locale) ?? fb.description,
      features,
      cta: ctaAction?.label,
      ctaHref: ctaAction?.href,
      ctaTarget: ctaAction?.target,
      ctaRel: ctaAction?.rel,
      image:
        urlForImage(media?.image as unknown as Parameters<typeof urlForImage>[0])
          ?.width(900)
          .url() ?? fb.image,
      imageAlt: pickLocalized(media?.alt, locale) ?? fb.imageAlt,
    };
  }

  const servicesFromSections = servicesTeaserSection?.items?.length
    ? servicesTeaserSection.items.map((s, i) => ({
        title: pickLocalized(s.title, locale) ?? fallbackServices[i]?.title ?? "",
        text: pickLocalized(s.text, locale) ?? fallbackServices[i]?.text ?? "",
        cta: pickLocalized(s.label, locale) ?? fallbackServices[i]?.cta,
        href: s.href ?? fallbackServices[i]?.href ?? "/",
        image:
          urlForImage(s.image as unknown as Parameters<typeof urlForImage>[0])
            ?.width(700)
            .url() ?? serviceImages[i] ?? serviceImages[0]!,
      }))
    : undefined;
  const services: ServiceTeaser[] = servicesFromSections ?? fallbackServices;

  const communityLinksFromSections = communityTeaserSection?.items?.length
    ? communityTeaserSection.items.map((l, i) => ({
        href: l.href ?? fallbackCommunityLinks[i]?.href ?? "/",
        label: pickLocalized(l.label, locale) ?? fallbackCommunityLinks[i]?.label ?? "",
      }))
    : undefined;
  const communityLinks: CommunityLink[] = communityLinksFromSections ?? fallbackCommunityLinks;

  const closingLinksFallback = [
    { href: "/events", label: "Attend Events" },
    { href: "/host-at-rorum", label: "Host at RORUM" },
    { href: "/catering", label: "Catering" },
    { href: "/event-decoration", label: "Event decoration" },
  ];
  const closingLinkItems = closingCtaSection?.items?.filter((i) => i.itemKey?.startsWith("link"));
  const closingLinksFromSections = closingLinkItems?.length
    ? closingLinkItems.map((l, i) => ({
        href: l.href ?? closingLinksFallback[i]?.href ?? "/",
        label: pickLocalized(l.label, locale) ?? closingLinksFallback[i]?.label ?? "",
      }))
    : undefined;
  const closingLinks = closingLinksFromSections ?? closingLinksFallback;

  const heroVideoMedia = heroSection?.media?.find((m) => m.kind === "video");
  const heroImageMedia = heroSection?.media?.find((m) => m.kind !== "video") ?? heroVideoMedia;

  return {
    heroLabel: pickLocalized(heroSection?.label, locale) ?? fallback.heroLabel,
    heroTitle: pickLocalized(heroSection?.title, locale) ?? fallback.heroTitle,
    heroText: pickLocalized(heroSection?.text, locale) ?? fallback.heroText,
    heroTrustItems,
    heroPrimaryAction: resolveAction(heroSection, "primary", locale, { label: fallback.hostAtRorumCta, href: "/host-at-rorum" }),
    heroSecondaryAction: resolveAction(heroSection, "secondary", locale, { label: fallback.attendEventsCta, href: "/events" }),
    quickPathsLabel: pickLocalized(quickPathsSection?.label, locale) ?? fallback.quickPathsLabel,
    quickPathsTitle: pickLocalized(quickPathsSection?.title, locale) ?? fallback.quickPathsTitle,
    quickPaths,
    eventsLabel: pickLocalized(eventsStripSection?.label, locale) ?? fallback.eventsLabel,
    eventsTitle: pickLocalized(eventsStripSection?.title, locale) ?? fallback.eventsTitle,
    eventsViewAllAction: resolveAction(eventsStripSection, "viewAll", locale, { label: fallback.eventsViewAllLabel, href: "/events" }),
    attendFeature: resolveFeature(attendFeatureSection, fallback.attendFeature),
    hostFeature: resolveFeature(hostFeatureSection, fallback.hostFeature),
    closingEyebrow: pickLocalized(closingCtaSection?.label, locale) ?? fallback.closingEyebrow,
    closingTitle: pickLocalized(closingCtaSection?.title, locale) ?? fallback.closingTitle,
    closingText: pickLocalized(closingCtaSection?.text, locale) ?? fallback.closingText,
    closingMainAction: resolveAction(closingCtaSection, "main", locale, { label: fallback.closingCta, href: "/contact" }),
    closingFaqQuestion: pickLocalized(getItem(closingCtaSection, "faqQuestion")?.title, locale) ?? "Have questions?",
    closingFaqLabel: pickLocalized(getItem(closingCtaSection, "faqLabel")?.title, locale) ?? "Read our FAQs",
    closingLinks,
    // Reads the current page-sections document's own SEO field — previously
    // read `page?.seo?.description` from the obsolete `homePageQuery` result,
    // which always returned null (0 `homePage` documents in production), so
    // this silently ignored every editor's SEO description. `pickLocalized`
    // still falls back to English internally when only EN is set, and to
    // `fallback.description` only as the true last resort (no Sanity content
    // at all) — never as the normal result when real content exists.
    description: pickLocalized(newPage?.seo?.description, locale) ?? fallback.description,
    // Same fallback shape as description above. `seo.title` is not a new
    // field — it already exists on the shared `seo` object type used by
    // every page/event/singleton (0 new Content Lake attributes) — this is
    // wiring only; production content for it is still empty on Home as of
    // this change, so `<title>` keeps showing the hardcoded fallback until
    // an editor fills it in.
    seoTitle: pickLocalized(newPage?.seo?.title, locale) ?? fallback.seoTitle,
    ogImageUrl: urlForImage(newPage?.seo?.ogImage as unknown as Parameters<typeof urlForImage>[0])
      ?.width(1200)
      .url(),
    ogImageAlt: pickLocalized(newPage?.seo?.ogImage?.alt, locale),
    servicesLabel: pickLocalized(servicesTeaserSection?.label, locale) ?? fallback.servicesLabel,
    servicesTitle: pickLocalized(servicesTeaserSection?.title, locale) ?? fallback.servicesTitle,
    communityLabel: pickLocalized(communityTeaserSection?.label, locale) ?? fallback.communityLabel,
    communityTitle: pickLocalized(communityTeaserSection?.title, locale) ?? fallback.communityTitle,
    communityText: pickLocalized(communityTeaserSection?.text, locale) ?? fallback.communityText,
    communityImageUrl: urlForImage(communityTeaserSection?.media?.[0]?.image as unknown as Parameters<typeof urlForImage>[0])
      ?.width(1600)
      .url(),
    heroImageUrl:
      urlForImage(heroImageMedia?.image as unknown as Parameters<typeof urlForImage>[0])
        ?.width(1600)
        .url() ?? fallback.heroImageUrl,
    heroVideoUrl: urlForFile(heroVideoMedia?.videoFile) ?? fallback.heroVideoUrl,
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
  const { seoTitle, description, ogImageUrl, ogImageAlt } = await getData(locale);
  return localizedPageMetadata({
    path: "/",
    locale,
    title: seoTitle,
    description,
    ...(ogImageUrl ? { image: ogImageUrl } : {}),
    ...(ogImageAlt ? { imageAlt: ogImageAlt } : {}),
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
            {data.heroPrimaryAction ? (
              <Button
                href={data.heroPrimaryAction.href}
                target={data.heroPrimaryAction.target}
                rel={data.heroPrimaryAction.rel}
                data-testid="home-hero-primary-cta"
                className="min-h-11.5! px-5! text-[12.5px]! max-sm:min-h-10! max-sm:px-3.5! max-sm:text-[11px]! bg-[#ae5745]! border-[#ae5745]! text-white! hover:bg-cta-red-hover! hover:border-cta-red-hover! hover:text-white!"
              >
                {data.heroPrimaryAction.label}
                <ArrowRight
                  className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </Button>
            ) : null}
            {data.heroSecondaryAction ? (
              <Button
                href={data.heroSecondaryAction.href}
                target={data.heroSecondaryAction.target}
                rel={data.heroSecondaryAction.rel}
                data-testid="home-hero-secondary-cta"
                variant="secondary"
                className="backdrop-blur-md min-h-11.5! px-5! text-[12.5px]! max-sm:min-h-10! max-sm:px-3.5! max-sm:text-[11px]! bg-[rgb(255_250_242/28%)]! border-transparent! text-white! hover:bg-[rgba(var(--rgb-beige),0.2)]! hover:border-primary-light! hover:text-white!"
              >
                {data.heroSecondaryAction.label}
                <ArrowRight
                  className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </Button>
            ) : null}
          </>
        }
      />
      <section className="py-[clamp(52px,8vw,104px)] bg-white">
        <Container>
          <SectionHeader
            label={data.quickPathsLabel}
            title={data.quickPathsTitle}
            data-testid="home-quickpaths-label"
          />
          <QuickPathsGrid
            items={data.quickPaths.map(({ title, text, href, image, cta, icon, iconName }) => [title, text, href, image, cta, icon, iconName])}
          />
        </Container>
      </section>
      <Section tight>
        <Container>
          <div className="event-section-head">
            <SectionHeader
              label={data.eventsLabel}
              title={data.eventsTitle}
              data-testid="home-events-label"
            />
            {data.eventsViewAllAction ? (
              <Button
                href={data.eventsViewAllAction.href}
                target={data.eventsViewAllAction.target}
                rel={data.eventsViewAllAction.rel}
                variant="event-all"
                data-testid="home-events-view-all"
              >
                <span>{data.eventsViewAllAction.label}</span>
                <ArrowRight
                  className="event-all-icon w-4.5 h-4.5 bg-transparent text-current transition-transform duration-200 ease-[ease] flex-none group-hover:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </Button>
            ) : null}
          </div>
          <EventList events={data.events} variant="scroll" locale={locale} />
        </Container>
      </Section>
      <EditorialFeatureSection
        data-testid="home-feature-attend"
        eyebrow={data.attendFeature.eyebrow}
        title={data.attendFeature.title}
        intro={data.attendFeature.intro}
        description={data.attendFeature.description}
        features={data.attendFeature.features}
        ctaLabel={data.attendFeature.cta}
        ctaHref={data.attendFeature.ctaHref}
        ctaTarget={data.attendFeature.ctaTarget}
        ctaRel={data.attendFeature.ctaRel}
        image={data.attendFeature.image}
        imageAlt={data.attendFeature.imageAlt}
      />
      <EditorialFeatureSection
        data-testid="home-feature-host"
        eyebrow={data.hostFeature.eyebrow}
        title={data.hostFeature.title}
        intro={data.hostFeature.intro}
        description={data.hostFeature.description}
        features={data.hostFeature.features}
        ctaLabel={data.hostFeature.cta}
        ctaHref={data.hostFeature.ctaHref}
        ctaTarget={data.hostFeature.ctaTarget}
        ctaRel={data.hostFeature.ctaRel}
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
        data-testid="home-closing-cta"
        eyebrow={data.closingEyebrow}
        title={data.closingTitle}
        text={data.closingText}
        href={data.closingMainAction?.href}
        label={data.closingMainAction?.label}
        target={data.closingMainAction?.target}
        rel={data.closingMainAction?.rel}
        faqQuestion={data.closingFaqQuestion}
        faqLabel={data.closingFaqLabel}
        links={data.closingLinks}
      />
    </>
  );
}
