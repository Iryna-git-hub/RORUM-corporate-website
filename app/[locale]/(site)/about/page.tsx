import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { LocaleLink as Link } from "@/components/LocaleLink";
import {
  CalendarCheck,
  CalendarPlus,
  ChefHat,
  HandHeart,
  Handshake,
  Users,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { Container, CTASection, Section, SectionLabel } from "@/components/ui";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/sanity-i18n";
import { getItem, getSection, resolveAction } from "@/lib/sanity-sections";
import { getIconCardIcon } from "@/lib/iconCardIcons";
import { isSanityConfigured } from "@/sanity/env";
import { sanitySectionMediaAttr } from "@/sanity/lib/dataAttr";
import { urlForImage } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { pageByKeyQuery } from "@/sanity/queries/page";

const fallbackIntroLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/host-at-rorum", label: "Host at RORUM", icon: CalendarPlus },
  { href: "/events", label: "Attend Events", icon: CalendarCheck },
];

const fallbackServiceLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/catering", label: "Catering", icon: ChefHat },
  { href: "/event-decoration", label: "Event Decoration", icon: WandSparkles },
];

const fallbackCommunityQuickLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/community-membership", label: "WECODA membership", icon: Users },
  { href: "/work-with-us", label: "Work with us", icon: Handshake },
  { href: "/volunteer", label: "Volunteer with us", icon: HandHeart },
];

const fallbackAtmosphereImages = [
  { image: "/images/about/about-room-borscht.png", alt: "Ukrainian borscht with pampushky prepared for a RORUM gathering" },
  { image: "/images/space/space-about-room.png", alt: "Warm RORUM room prepared for a meeting" },
  { image: "/images/decoration/decoration-floral-table.png", alt: "Decorated table with flowers and place settings" },
];

const INLINE_LINK_CLASS =
  "inline-flex items-center gap-2 min-h-10 px-4 border border-white rounded-full bg-white text-dark-green text-[13px] font-black tracking-[0.03em] uppercase transition-[color,background-color,border-color,transform] duration-[180ms] ease-[ease] hover:text-red hover:border-[rgba(var(--rgb-red),0.44)] hover:-translate-y-px focus-visible:text-red focus-visible:border-[rgba(var(--rgb-red),0.44)] focus-visible:-translate-y-px";

const VISUAL_IMG_CLASS =
  "w-full h-full object-cover block shadow-[0_16px_34px_rgba(var(--rgb-brown),0.09)] max-lg:min-h-[220px] max-sm:min-h-[210px]";

const fallback = {
  heroLabel: "About",
  heroTitle: "About RORUM",
  heroLead:
    "RORUM is a curated creative and event space in central Copenhagen, designed for small teams, founders, facilitators, hosts and community-minded guests who want gatherings to feel warm, clear and easy to be present in.",
  statementTitle: "Services",
  statementText: "Our catering and decoration services are available off-site and can be brought to your chosen location.",
  communityTitle: "Community",
  communityText: "RORUM is also shaped by members, collaborators and people who want to support thoughtful local gatherings.",
  pillarsLabel: "Experience principles",
  locationTitle: "Thoughtful and practical",
  locationText: "These principles shape the way RORUM approaches meetings, hosted events, catering, decoration and community collaborations.",
  description: "Learn about RORUM, our purpose and our approach to creating thoughtful events, welcoming experiences and meaningful communities.",
  seoTitle: "About RORUM | Our Space, Purpose & Community",
  closingEyebrow: "Not sure where to start?",
  closingTitle: "Let's shape your idea together",
  closingText:
    "Whether you are planning a workshop, private session, community gathering, catering request or event styling idea — tell us what you have in mind, and we'll help you find the right format.",
  closingCta: "Let's talk",
  closingFaqQuestion: "Have questions?",
  closingFaqLabel: "Read our FAQs",
};

const closingLinksFallback = [
  { href: "/events", label: "Attend Events" },
  { href: "/host-at-rorum", label: "Host at RORUM" },
  { href: "/catering", label: "Catering" },
  { href: "/event-decoration", label: "Event decoration" },
];

const fallbackPillars = [
  ["Calm first", "The space should help guests arrive, settle and understand where they are."],
  ["Useful hospitality", "Coffee, water, food, layout and timing are treated as part of the experience."],
  ["Flexible but not blank", "Tables, seating, screen, Wi-Fi and styling options give hosts a clear starting point."],
  ["Personal without noise", "The space has character, but leaves enough space for each format to feel like its own."],
];

async function getData(locale: Locale, editable = false) {
  if (!isSanityConfigured) {
    return {
      ...fallback,
      pillars: fallbackPillars.map(([title, text], i) => ({ number: String(i + 1).padStart(2, "0"), title, text })),
      closingLinks: closingLinksFallback,
      introLinks: fallbackIntroLinks.map(({ href, label, icon }) => ({ href, label, Icon: icon })),
      serviceLinks: fallbackServiceLinks.map(({ href, label, icon }) => ({ href, label, Icon: icon })),
      communityQuickLinks: fallbackCommunityQuickLinks.map(({ href, label, icon }) => ({ href, label, Icon: icon })),
      atmosphereImages: fallbackAtmosphereImages.map((x) => ({ ...x, editAttr: undefined as string | undefined })),
    };
  }

  const { data: newPage } = await sanityFetch({ query: pageByKeyQuery, params: { pageKey: "about" } });

  const heroSection = getSection(newPage?.sections, "hero");
  const statementSection = getSection(newPage?.sections, "statement");
  const communitySection = getSection(newPage?.sections, "community");
  const pillarsSection = getSection(newPage?.sections, "pillars");
  const closingCtaSection = getSection(newPage?.sections, "closingCta");

  const iconLinksFallback = (fb: { href: string; label: string; icon: LucideIcon }[]) =>
    fb.map(({ href, label, icon }) => ({ href, label, Icon: icon }));

  function resolveIconLinksFromSection(section: typeof heroSection, fb: { href: string; label: string; icon: LucideIcon }[]) {
    return section?.items?.length
      ? section.items.map((item, i) => ({
          href: item.href ?? fb[i]?.href ?? "/",
          label: pickLocalized(item.label, locale) ?? fb[i]?.label ?? "",
          Icon: item.icon ? getIconCardIcon(item.icon) : (fb[i]?.icon ?? CalendarPlus),
        }))
      : undefined;
  }

  const atmosphereMedia = heroSection?.media;
  const atmosphereImages = atmosphereMedia?.length
    ? atmosphereMedia.map((m, i) => ({
        image:
          urlForImage(m.image as unknown as Parameters<typeof urlForImage>[0])
            ?.width(700)
            .url() ?? fallbackAtmosphereImages[i]?.image ?? "",
        alt: pickLocalized(m.alt, locale) ?? fallbackAtmosphereImages[i]?.alt ?? "",
        editAttr: sanitySectionMediaAttr(editable, newPage?._id, heroSection?._key, m._key),
      }))
    : fallbackAtmosphereImages.map((x) => ({ ...x, editAttr: undefined as string | undefined }));

  const pillars = pillarsSection?.items?.length
    ? pillarsSection.items.map((p, i) => ({
        number: String(i + 1).padStart(2, "0"),
        title: pickLocalized(p.title, locale) ?? "",
        text: pickLocalized(p.text, locale) ?? "",
      }))
    : fallbackPillars.map(([title, text], i) => ({ number: String(i + 1).padStart(2, "0"), title, text }));

  const closingLinkItems = closingCtaSection?.items?.filter((i) => i.itemKey?.startsWith("link"));
  const closingLinks = closingLinkItems?.length
    ? closingLinkItems.map((l, i) => ({
        href: l.href ?? closingLinksFallback[i]?.href ?? "/",
        label: pickLocalized(l.label, locale) ?? closingLinksFallback[i]?.label ?? "",
      }))
    : closingLinksFallback;

  return {
    heroLabel: pickLocalized(heroSection?.label, locale) ?? fallback.heroLabel,
    heroTitle: pickLocalized(heroSection?.title, locale) ?? fallback.heroTitle,
    heroLead: pickLocalized(heroSection?.text, locale) ?? fallback.heroLead,
    statementTitle: pickLocalized(statementSection?.title, locale) ?? fallback.statementTitle,
    statementText: pickLocalized(statementSection?.text, locale) ?? fallback.statementText,
    communityTitle: pickLocalized(communitySection?.title, locale) ?? fallback.communityTitle,
    communityText: pickLocalized(communitySection?.text, locale) ?? fallback.communityText,
    pillarsLabel: pickLocalized(pillarsSection?.label, locale) ?? fallback.pillarsLabel,
    locationTitle: pickLocalized(pillarsSection?.title, locale) ?? fallback.locationTitle,
    locationText: pickLocalized(pillarsSection?.text, locale) ?? fallback.locationText,
    // `pickLocalized` falls back to English internally when only EN is set,
    // and to `fallback.description` only as the true last resort (no Sanity
    // content at all) — same fallback chain Home uses.
    description: pickLocalized(newPage?.seo?.description, locale) ?? fallback.description,
    // `seo.title` lives on the shared `seo` object type used by every
    // page/event — production content for it may still be empty on About, in
    // which case `<title>` shows the hardcoded fallback until an editor fills it in.
    seoTitle: pickLocalized(newPage?.seo?.title, locale) ?? fallback.seoTitle,
    ogImageUrl: urlForImage(newPage?.seo?.ogImage as unknown as Parameters<typeof urlForImage>[0])
      ?.width(1200)
      .url(),
    ogImageAlt: pickLocalized(newPage?.seo?.ogImage?.alt, locale),
    closingEyebrow: pickLocalized(closingCtaSection?.label, locale) ?? fallback.closingEyebrow,
    closingTitle: pickLocalized(closingCtaSection?.title, locale) ?? fallback.closingTitle,
    closingText: pickLocalized(closingCtaSection?.text, locale) ?? fallback.closingText,
    // Shared resolver Home uses for every CTA — wires href/openInNewTab/enabled
    // together with the label.
    closingMainAction: resolveAction(closingCtaSection, "main", locale, { label: fallback.closingCta, href: "/contact" }),
    closingFaqQuestion:
      pickLocalized(getItem(closingCtaSection, "faqQuestion")?.title, locale) ?? fallback.closingFaqQuestion,
    closingFaqLabel:
      pickLocalized(getItem(closingCtaSection, "faqLabel")?.title, locale) ?? fallback.closingFaqLabel,
    pillars,
    closingLinks,
    introLinks: resolveIconLinksFromSection(heroSection, fallbackIntroLinks) ?? iconLinksFallback(fallbackIntroLinks),
    serviceLinks:
      resolveIconLinksFromSection(statementSection, fallbackServiceLinks) ?? iconLinksFallback(fallbackServiceLinks),
    communityQuickLinks:
      resolveIconLinksFromSection(communitySection, fallbackCommunityQuickLinks) ??
      iconLinksFallback(fallbackCommunityQuickLinks),
    atmosphereImages,
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
    path: "/about",
    locale,
    title: seoTitle,
    description,
    ...(ogImageUrl ? { image: ogImageUrl } : {}),
    ...(ogImageAlt ? { imageAlt: ogImageAlt } : {}),
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const { isEnabled: isDraftMode } = await draftMode();
  const {
    heroLabel,
    heroTitle,
    heroLead,
    statementTitle,
    statementText,
    communityTitle,
    communityText,
    pillarsLabel,
    locationTitle,
    locationText,
    pillars,
    closingEyebrow,
    closingTitle,
    closingText,
    closingMainAction,
    closingFaqQuestion,
    closingFaqLabel,
    closingLinks,
    introLinks,
    serviceLinks,
    communityQuickLinks,
    atmosphereImages,
  } = await getData(locale, isDraftMode);

  return (
    <>
      <section className="pt-[65px] pb-[clamp(34px,5vw,58px)] bg-cream text-text-primary max-sm:pt-[38px]">
        <Container>
          <div className="grid grid-cols-[minmax(0,0.88fr)_minmax(360px,0.86fr)] gap-[clamp(28px,5vw,72px)] items-center max-lg:grid-cols-1">
            <div className="grid gap-[18px]">
              <SectionLabel>{heroLabel}</SectionLabel>
              <h1 className="font-heading font-medium text-text-primary m-0 max-w-[12ch] text-[3rem] leading-[1.02] tracking-[-0.03em] max-lg:max-w-[16ch]">
                {heroTitle}
              </h1>
              <p className="m-0 max-w-[68ch] text-text-primary text-base leading-[1.7] font-medium">
                {heroLead}
              </p>
              <div
                className="flex flex-wrap gap-2.5 mt-1.5"
                aria-label="RORUM event paths"
              >
                {introLinks.map(({ href, label, Icon }) => (
                  <Link className={INLINE_LINK_CLASS} href={href} key={href}>
                    <Icon
                      className="w-4 h-4 text-red"
                      aria-hidden="true"
                      strokeWidth={1.8}
                    />
                    {label}
                  </Link>
                ))}
              </div>
              <div className="grid gap-2.5 mt-2.5 pt-[18px] border-t border-[rgba(var(--rgb-beige),0.72)]">
                <h2 className="m-0 text-text-primary font-body text-[16px] leading-[1.25] font-black uppercase tracking-[0.06em]">
                  {statementTitle}
                </h2>
                <p className="m-0 max-w-[68ch] text-text-primary font-medium text-[15px] leading-[1.65]">
                  {statementText}
                </p>
                <div
                  className="flex flex-wrap gap-2.5 mt-1.5"
                  aria-label="RORUM service paths"
                >
                  {serviceLinks.map(({ href, label, Icon }) => (
                    <Link className={INLINE_LINK_CLASS} href={href} key={href}>
                      <Icon
                        className="w-4 h-4 text-red"
                        aria-hidden="true"
                        strokeWidth={1.8}
                      />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="grid gap-2.5 mt-2.5 pt-[18px] border-t border-[rgba(var(--rgb-beige),0.72)]">
                <h2 className="m-0 text-text-primary font-body text-[16px] leading-[1.25] font-black uppercase tracking-[0.06em]">
                  {communityTitle}
                </h2>
                <p className="m-0 max-w-[68ch] text-text-primary font-medium text-[15px] leading-[1.65]">
                  {communityText}
                </p>
                <div
                  className="flex flex-wrap gap-2.5 mt-0"
                  aria-label="Community paths"
                >
                  {communityQuickLinks.map(({ href, label, Icon }) => (
                    <Link className={INLINE_LINK_CLASS} href={href} key={href}>
                      <Icon
                        className="w-4 h-4 text-red"
                        aria-hidden="true"
                        strokeWidth={1.8}
                      />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] grid-rows-[repeat(2,minmax(170px,1fr))] gap-3 min-h-[clamp(380px,43vw,560px)] max-lg:min-h-auto max-lg:grid-rows-[auto] max-sm:grid-cols-1"
              aria-label="RORUM atmosphere"
            >
              {atmosphereImages.map(({ image, alt, editAttr }, i) => (
                <img
                  className={`${VISUAL_IMG_CLASS} ${i === 0 ? "row-span-2 max-sm:[grid-row:auto]" : ""}`}
                  src={image}
                  alt={alt}
                  data-sanity={editAttr}
                  key={image}
                />
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Section tight>
        <Container>
          <div className="grid grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] gap-[clamp(28px,5vw,72px)] items-start max-lg:grid-cols-1">
            <div className="grid gap-3.5 sticky top-[108px] max-lg:static">
              <SectionLabel>{pillarsLabel}</SectionLabel>
              <h2 className="font-heading font-medium text-text-primary m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-[1.25] tracking-[0] normal-case">
                {locationTitle}
              </h2>
              <p className="m-0 text-text-primary text-[clamp(16px,1.2vw,18px)] leading-[1.75]">
                {locationText}
              </p>
            </div>
            <div className="grid border-t border-[rgba(var(--rgb-beige),0.7)]">
              {pillars.map(({ number, title, text }) => (
                <div
                  className="grid grid-cols-[54px_minmax(0,1fr)] gap-[18px] py-5 border-b border-[rgba(var(--rgb-beige),0.7)]"
                  key={number}
                >
                  <span className="text-gold text-[20px] font-semibold leading-[1.2]">
                    {number}
                  </span>
                  <div>
                    <h3 className="mb-[5px] text-text-primary font-body text-[clamp(16px,1.2vw,18px)] leading-[1.25] font-black">
                      {title}
                    </h3>
                    <p className="text-text-primary text-[15px] leading-[1.55]">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        variant="final"
        className="next-step-section-not-sure"
        eyebrow={closingEyebrow}
        title={closingTitle}
        text={closingText}
        href={closingMainAction?.href}
        label={closingMainAction?.label}
        target={closingMainAction?.target}
        rel={closingMainAction?.rel}
        faqQuestion={closingFaqQuestion}
        faqLabel={closingFaqLabel}
        links={closingLinks}
      />
    </>
  );
}
