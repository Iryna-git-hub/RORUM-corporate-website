import type { Metadata } from "next";
import { InquiryForm } from "@/components/InquiryForm";
import { PackageGrid, type PackageItem } from "@/components/Cards";
import { HorizontalGallery } from "@/components/HorizontalGallery";
import { LocaleLink as Link } from "@/components/LocaleLink";
import {
  Button,
  Container,
  FAQInlinePrompt,
  SectionHeader,
  SectionLabel,
} from "@/components/ui";
import { packages } from "@/lib/data";
import { hostAtRorumGalleryImages } from "@/lib/galleryImages";
import { resolveGalleryImages } from "@/lib/sanityGallery";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { compact, pickLabel, pickLocalized } from "@/lib/sanity-i18n";
import { getAction, getItem, getSection, listItems } from "@/lib/sanity-sections";
import { isSanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { pageByKeyQuery } from "@/sanity/queries/page";
import { hostAtRorumPageQuery } from "@/sanity/queries/pages";
import {
  ArrowRight,
  Armchair,
  ChefHat,
  Coffee,
  DoorOpen,
  HandHeart,
  LampFloor,
  Monitor,
  SlidersHorizontal,
  Wifi,
} from "lucide-react";

const sessionDetailsImage = "/images/private-meetings/private-meeting-room-10.png";

// Sanity's `includedItems` merges what the page renders as two visual
// columns (session basics + setup basics) into one 7-item list — split
// back into the original 4/3 grouping for rendering. Icons have no schema
// field (bulletText only carries text), so they stay a fixed, ordered map.
const includedIcons = [DoorOpen, Coffee, HandHeart, LampFloor];
const basicsIcons = [Monitor, Wifi, Armchair];
const optionalIcons = [ChefHat, SlidersHorizontal];

const fallbackIncluded = ["Use of the space", "Coffee, tea and water", "On-site support", "Simple and thoughtful interior setup"];
const fallbackBasics = ["Screen", "Wi-Fi", "Tables and chairs"];
const fallbackOptional = ["Catering", "Customized food options"];
const fallbackSteps: [title: string, text: string][] = [
  ["Tell us about your gathering", "Tell us the format, guest count, timing and what kind of atmosphere you need."],
  ["We prepare the room", "We align tables, chairs, screen, Wi-Fi and simple hosting details before you arrive."],
  ["Arrive and focus", "The space is ready for your workshop, gathering, or private session, with on-site support."],
];
const fallbackCancellation = [
  "Free cancellation up to 5 working days before",
  "50% charge if cancelled within 24 hours before the event",
  "100% charge if cancelled less than 24 hours before",
];

const fallback = {
  label: "Host at RORUM",
  title: "Host Your Gathering at RORUM",
  intro: [
    "RORUM is a small, curated space in central Copenhagen, designed for meetings, workshops, and private events for up to 12 guests.",
    "Ideal for small teams, founders, and curated gatherings. We offer a calm and well-organized setting, with support before and during your event.",
  ],
  applyCta: "Apply to Host",
  packagesCta: "View Packages & Pricing",
  sessionLabel: "Session details",
  sessionTitle: "Each session includes:",
  optionalLabel: "Optional",
  packagesLabel: "Packages",
  packagesTitle: "Hosting Packages",
  packagesIntro:
    "Every event has its own atmosphere and unique requirements, which is why the packages below are simply examples of our most popular formats. Looking for something different? We would be happy to tailor the space and arrangements to your needs.",
  packagesFooterCtaLabel: "Get in touch",
  packagesFooterText: "with us to discuss your event and receive a personalized proposal.",
  selectPackageCta: "Select Package",
  cancellationTitle: "Cancellation policy:",
  stepsTitle: "3-step setup",
  requestProcessAriaLabel: "Host at RORUM request process",
  sessionImage: sessionDetailsImage,
  sessionImageAlt: "Hosted meeting room setup at RORUM",
  inquiryIntro: "",
  description: "Host workshops, meetings and intimate gatherings at RORUM.",
  inquiryTitle: "Apply to Host at RORUM",
  inquirySubmitLabel: "Submit Hosting Request",
  messagePlaceholder: "Tell us about your meeting format, timing and preferences.",
  successMessage: "Thank you. Your Host at RORUM request is ready for the RORUM team.",
};

async function getData(locale: Locale) {
  if (!isSanityConfigured) {
    return {
      ...fallback,
      howItWorksLabel: "How it works",
      included: fallbackIncluded,
      basics: fallbackBasics,
      optional: fallbackOptional,
      steps: fallbackSteps.map(([title, text], i) => ({ number: String(i + 1).padStart(2, "0"), title, text })),
      cancellation: fallbackCancellation,
      packageItems: packages.booking,
      galleryImages: hostAtRorumGalleryImages,
    };
  }

  const [{ data: page }, { data: newPage }] = await Promise.all([
    sanityFetch({ query: hostAtRorumPageQuery }),
    sanityFetch({ query: pageByKeyQuery, params: { pageKey: "hostAtRorum" } }),
  ]);

  const heroSection = getSection(newPage?.sections, "hero");
  const gallerySection = getSection(newPage?.sections, "gallery");
  const sessionSection = getSection(newPage?.sections, "session");
  const packagesSection = getSection(newPage?.sections, "packages");
  const stepsSection = getSection(newPage?.sections, "steps");
  const formSection = getSection(newPage?.sections, "inquiryForm");

  const galleryImagesFromSections = gallerySection?.media?.length
    ? gallerySection.media
        .filter((m) => m.kind !== "video")
        .map((m) => ({ _type: "image" as const, asset: m.image?.asset, alt: m.alt }) as unknown as Parameters<typeof resolveGalleryImages>[0])
    : undefined;
  const galleryImages = resolveGalleryImages(
    (galleryImagesFromSections as never) ?? page?.gallery,
    locale,
    hostAtRorumGalleryImages,
  );

  const includedAllFromSections = (sessionSection?.items ?? []).filter((i) => i.itemKey?.startsWith("included"));
  const includedAll = includedAllFromSections.length
    ? compact(includedAllFromSections.map((i) => pickLocalized(i.title, locale)))
    : page?.includedItems?.length
      ? compact(page.includedItems.map((b) => pickLocalized(b?.text, locale)))
      : [...fallbackIncluded, ...fallbackBasics];
  const included = includedAll.slice(0, 4).length ? includedAll.slice(0, 4) : fallbackIncluded;
  const basics = includedAll.slice(4, 7).length ? includedAll.slice(4, 7) : fallbackBasics;

  const optionalItemsFromSections = (sessionSection?.items ?? []).filter((i) => i.itemKey?.startsWith("optional") && i.itemKey !== "optionalLabel");
  const optional = optionalItemsFromSections.length
    ? compact(optionalItemsFromSections.map((i) => pickLocalized(i.title, locale)))
    : page?.optionalItems?.length
      ? compact(page.optionalItems.map((b) => pickLocalized(b?.text, locale)))
      : fallbackOptional;

  const steps = stepsSection?.items?.length
    ? listItems(stepsSection, ["requestProcessAriaLabel"]).map((s, i) => ({
        number: String(i + 1).padStart(2, "0"),
        title: pickLocalized(s.title, locale) ?? "",
        text: pickLocalized(s.text, locale) ?? "",
      }))
    : page?.steps?.length
      ? page.steps.map((s, i) => ({
          number: String(i + 1).padStart(2, "0"),
          title: pickLocalized(s?.title, locale) ?? "",
          text: pickLocalized(s?.text, locale) ?? "",
        }))
      : fallbackSteps.map(([title, text], i) => ({ number: String(i + 1).padStart(2, "0"), title, text }));

  const cancellationItemsFromSections = (packagesSection?.items ?? []).filter((i) => i.itemKey?.startsWith("cancellation") && i.itemKey !== "cancellationTitle");
  const cancellation = cancellationItemsFromSections.length
    ? compact(cancellationItemsFromSections.map((i) => pickLocalized(i.title, locale)))
    : page?.cancellationItems?.length
      ? compact(page.cancellationItems.map((b) => pickLocalized(b?.text, locale)))
      : fallbackCancellation;

  const packageItemsFromSections = (packagesSection?.items ?? []).filter((i) => i.itemKey?.startsWith("package"));
  const packageItems: PackageItem[] = packageItemsFromSections.length
    ? packageItemsFromSections.map((p) => ({
        title: pickLocalized(p.title, locale) ?? "",
        price: pickLocalized(p.label, locale) ?? "",
        items: (pickLocalized(p.text, locale) ?? "").split("\n").filter(Boolean),
      }))
    : page?.packages?.length
      ? page.packages.map((p) => ({
          title: pickLocalized(p?.title, locale) ?? "",
          price: pickLocalized(p?.price, locale) ?? "",
          items: p?.items?.length ? compact(p.items.map((i) => pickLocalized(i?.text, locale))) : [],
        }))
      : packages.booking;

  return {
    label: pickLocalized(heroSection?.label, locale) ?? pickLocalized(page?.hero?.label, locale) ?? fallback.label,
    title: pickLocalized(heroSection?.title, locale) ?? pickLocalized(page?.hero?.title, locale) ?? fallback.title,
    intro: (() => {
      const text = pickLocalized(heroSection?.text, locale) ?? pickLocalized(page?.hero?.text, locale);
      return text ? [text] : fallback.intro;
    })(),
    applyCta:
      pickLocalized(getAction(heroSection, "apply")?.label, locale) ??
      pickLocalized(page?.hero?.primaryCta?.label, locale) ??
      fallback.applyCta,
    packagesCta:
      pickLocalized(getAction(heroSection, "packages")?.label, locale) ??
      pickLocalized(page?.hero?.secondaryCta?.label, locale) ??
      fallback.packagesCta,
    sessionLabel:
      pickLocalized(sessionSection?.label, locale) ?? pickLocalized(page?.sessionLabel, locale) ?? fallback.sessionLabel,
    sessionTitle:
      pickLocalized(sessionSection?.title, locale) ?? pickLocalized(page?.sessionTitle, locale) ?? fallback.sessionTitle,
    optionalLabel:
      pickLocalized(getItem(sessionSection, "optionalLabel")?.title, locale) ??
      pickLocalized(page?.optionalLabel, locale) ??
      fallback.optionalLabel,
    packagesLabel:
      pickLocalized(packagesSection?.label, locale) ?? pickLocalized(page?.packagesLabel, locale) ?? fallback.packagesLabel,
    packagesTitle:
      pickLocalized(packagesSection?.title, locale) ?? pickLocalized(page?.packagesTitle, locale) ?? fallback.packagesTitle,
    packagesIntro:
      pickLocalized(packagesSection?.text, locale) ?? pickLocalized(page?.packagesIntro, locale) ?? fallback.packagesIntro,
    packagesFooterCtaLabel:
      pickLocalized(getItem(packagesSection, "footerCtaLabel")?.title, locale) ??
      pickLabel(page?.labels, "packagesFooterCtaLabel", locale, fallback.packagesFooterCtaLabel),
    packagesFooterText:
      pickLocalized(getItem(packagesSection, "footerText")?.title, locale) ??
      pickLabel(page?.labels, "packagesFooterText", locale, fallback.packagesFooterText),
    selectPackageCta:
      pickLocalized(getItem(packagesSection, "selectPackageCta")?.title, locale) ??
      pickLabel(page?.labels, "selectPackageCta", locale, fallback.selectPackageCta),
    cancellationTitle:
      pickLocalized(getItem(packagesSection, "cancellationTitle")?.title, locale) ??
      pickLocalized(page?.cancellationTitle, locale) ??
      fallback.cancellationTitle,
    stepsTitle:
      pickLocalized(stepsSection?.title, locale) ?? pickLocalized(page?.stepsTitle, locale) ?? fallback.stepsTitle,
    howItWorksLabel: pickLocalized(stepsSection?.label, locale) ?? "How it works",
    requestProcessAriaLabel:
      pickLocalized(getItem(stepsSection, "requestProcessAriaLabel")?.title, locale) ??
      pickLabel(page?.labels, "requestProcessAriaLabel", locale, fallback.requestProcessAriaLabel),
    sessionImage:
      urlForImage(sessionSection?.media?.[0]?.image as unknown as Parameters<typeof urlForImage>[0])
        ?.width(1200)
        .url() ??
      urlForImage(page?.sessionImage as unknown as Parameters<typeof urlForImage>[0])
        ?.width(1200)
        .url() ??
      fallback.sessionImage,
    sessionImageAlt:
      pickLocalized(sessionSection?.media?.[0]?.alt, locale) ??
      pickLocalized(page?.sessionImage?.alt, locale) ??
      fallback.sessionImageAlt,
    inquiryIntro:
      pickLocalized(formSection?.text, locale) ?? pickLocalized(page?.inquiryIntro, locale) ?? fallback.inquiryIntro,
    description: pickLocalized(page?.seo?.description, locale) ?? fallback.description,
    inquiryTitle:
      pickLocalized(formSection?.title, locale) ?? pickLocalized(page?.inquiryTitle, locale) ?? fallback.inquiryTitle,
    inquirySubmitLabel:
      pickLocalized(getItem(formSection, "submitLabel")?.title, locale) ??
      pickLocalized(page?.inquirySubmitLabel, locale) ??
      fallback.inquirySubmitLabel,
    messagePlaceholder:
      pickLocalized(getItem(formSection, "messagePlaceholder")?.title, locale) ??
      pickLocalized(page?.messagePlaceholder, locale) ??
      fallback.messagePlaceholder,
    successMessage:
      pickLocalized(getItem(formSection, "successMessage")?.text, locale) ??
      pickLocalized(page?.successMessage, locale) ??
      fallback.successMessage,
    included,
    basics,
    optional,
    steps,
    cancellation,
    packageItems,
    galleryImages,
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
  return localizedPageMetadata({ path: "/host-at-rorum", locale, title: "Host at RORUM", description });
}

export default async function HostAtRorumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const data = await getData(locale);

  return (
    <>
      {/* `book-space-hero`/`private-meetings-hero` are kept: they're the
          ancestors for the deferred `.book-space-hero .horizontal-gallery`
          (≥1280px full-bleed) and `.private-meetings-hero .horizontal-
          gallery-track` (custom scrollbar) rules that reach into the shared
          HorizontalGallery component's internals - out of scope here. */}
      <section className="book-space-hero private-meetings-hero bg-cream text-text-primary pt-16.25 pb-16.25 px-0 max-sm:pt-9.5 max-sm:pb-9.5">
        <Container>
          <div className="grid gap-3.5 w-[min(1120px,100%)] mb-[clamp(28px,4vw,48px)] lg:grid-cols-2 lg:gap-x-[clamp(40px,6vw,80px)] lg:gap-y-[clamp(12px,1.5vw,18px)] lg:items-start lg:mb-[clamp(34px,5vh,58px)] [@media(min-width:1024px)_and_(max-height:820px)]:mb-[clamp(26px,4vh,38px)]">
            <SectionLabel className="lg:col-start-1 lg:row-start-1">
              {data.label}
            </SectionLabel>
            <h1 className="font-heading font-medium text-text-primary m-0 max-w-full text-[3rem] leading-[1.2] tracking-normal normal-case max-sm:text-[clamp(2rem,10vw,2.5rem)] [@media(min-width:1024px)_and_(max-height:820px)]:text-[clamp(2.5rem,4.1vw,3rem)] lg:col-start-1 lg:row-start-2">
              {data.title}
            </h1>
            <div className="grid gap-2 max-w-[880px] [@media(min-width:1024px)_and_(max-height:820px)]:max-w-[96ch] [@media(min-width:1024px)_and_(max-height:820px)]:leading-[1.55] lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-end">
              {data.intro.map((paragraph) => (
                <p key={paragraph} className="m-0 text-[16px]">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 max-sm:justify-center max-sm:w-full lg:col-start-1 lg:row-start-3 lg:justify-self-start lg:w-fit lg:mt-[clamp(6px,1vw,12px)]">
              <Button
                href="#request-private-meeting"
                className="whitespace-nowrap min-h-10! px-6.5! max-sm:flex-auto"
              >
                {data.applyCta}
                <ArrowRight
                  className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </Button>
              <Button
                href="#meeting-packages"
                variant="secondary"
                className="whitespace-nowrap min-h-10! px-6.5! max-sm:flex-auto"
              >
                {data.packagesCta}
                <ArrowRight
                  className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </Button>
            </div>
          </div>
          <HorizontalGallery images={data.galleryImages} />
        </Container>
      </section>
      <section className="section bg-white p-0!">
        <Container className="w-full! max-w-none! mx-0!">
          <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-0 items-stretch min-h-[clamp(560px,50vw,720px)] max-lg:min-h-auto">
            <div
              className="w-full min-w-0 min-h-full bg-beige bg-center bg-cover bg-no-repeat max-lg:min-h-[320px] max-sm:min-h-[clamp(280px,56vw,360px)]"
              role="img"
              aria-label={data.sessionImageAlt}
              style={{ backgroundImage: `url(${data.sessionImage})` }}
            />
            <div className="grid gap-4.5 content-center py-[clamp(56px,8vw,96px)] pr-[max(16px,calc((100vw-1180px)/2))] pl-[clamp(42px,6vw,86px)] min-w-0 *:max-w-140 max-lg:py-11 max-lg:px-[max(16px,calc((100vw-720px)/2))]">
              <SectionHeader
                label={data.sessionLabel}
                title={data.sessionTitle}
                level={3}
                className="gap-3! mb-[clamp(12px,1.5vw,20px)]!"
              />
              <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-y-[clamp(10px,1.5vw,14px)] gap-x-[clamp(16px,2vw,24px)]">
                <div className="grid content-start gap-[clamp(10px,1.5vw,14px)]">
                  {data.included.map((item, i) => {
                    const Icon = includedIcons[i] ?? DoorOpen;
                    return (
                      <div
                        className="grid grid-cols-[38px_minmax(0,1fr)] gap-3 items-start min-w-0"
                        key={item}
                      >
                        <Icon
                          aria-hidden="true"
                          strokeWidth={1.8}
                          className="w-7.5 h-7.5 text-red mt-px"
                        />
                        <p className="m-0 text-text-primary text-base leading-[1.45] font-[620]">
                          {item}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="grid content-start gap-[clamp(10px,1.5vw,14px)]">
                  {data.basics.map((item, i) => {
                    const Icon = basicsIcons[i] ?? Monitor;
                    return (
                      <div
                        className="grid grid-cols-[38px_minmax(0,1fr)] gap-3 items-start min-w-0"
                        key={item}
                      >
                        <Icon
                          aria-hidden="true"
                          strokeWidth={1.8}
                          className="w-7.5 h-7.5 text-red mt-px"
                        />
                        <p className="m-0 text-text-primary text-base leading-[1.45] font-[620]">
                          {item}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-3 mt-[clamp(6px,1.2vw,10px)] pt-[clamp(12px,1.6vw,18px)] border-t border-t-[rgba(var(--rgb-beige),0.68)]">
                <h3 className="m-0 font-body text-light-green text-xs leading-[1.2] font-black tracking-[0.08em] uppercase">
                  {data.optionalLabel}
                </h3>
                <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-y-[clamp(10px,1.5vw,14px)] gap-x-[clamp(16px,2vw,24px)]">
                  {data.optional.map((item, i) => {
                    const Icon = optionalIcons[i] ?? ChefHat;
                    return (
                      <div
                        className="grid grid-cols-[38px_minmax(0,1fr)] gap-3 items-start min-w-0"
                        key={item}
                      >
                        <Icon
                          aria-hidden="true"
                          strokeWidth={1.8}
                          className="w-7.5 h-7.5 text-light-green mt-px"
                        />
                        <p className="m-0 text-text-primary text-base leading-[1.45] font-[620]">
                          {item}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-auto pt-[clamp(6px,1vw,12px)] max-sm:justify-center max-sm:w-full">
                <Button
                  href="#request-private-meeting"
                  className="whitespace-nowrap max-sm:flex-auto"
                >
                  {data.applyCta}
                  <ArrowRight
                    className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                </Button>
                <Button
                  href="#meeting-packages"
                  variant="secondary"
                  className="whitespace-nowrap max-sm:flex-auto"
                >
                  {data.packagesCta}
                  <ArrowRight
                    className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
      <section id="meeting-packages" className="section-tight bg-red text-white">
        <Container>
          <SectionHeader
            label={data.packagesLabel}
            title={data.packagesTitle}
            level={3}
            className="mb-[clamp(22px,3vw,34px)]!"
            labelClassName="text-[rgba(var(--rgb-cream),0.86)]!"
            titleClassName="text-white!"
          />
          <div className="grid gap-3 max-w-230 mb-[clamp(26px,4vw,40px)] text-[rgba(var(--rgb-cream),0.92)] leading-[1.7]">
            <p>
              <i className="text-[15px] italic">{data.packagesIntro}</i>
            </p>
            <p>
              <Link
                href="/contact"
                className="font-extrabold underline underline-offset-[3px] transition-colors duration-180 hover:text-white focus-visible:text-white"
              >
                {data.packagesFooterCtaLabel}
              </Link>{" "}
              {data.packagesFooterText}
            </p>
          </div>
          <PackageGrid
            items={data.packageItems}
            ctaHref="#request-private-meeting"
            ctaLabel={data.selectPackageCta}
          />
          <div className="grid gap-2.5 max-w-230 mt-[clamp(26px,4vw,44px)] pt-0 border-t-0">
            <p className="m-0 text-white text-[15px] leading-[1.7] font-black">
              {data.cancellationTitle}
            </p>
            <ul className="grid gap-1.5 m-0 pl-4.5 list-disc text-white text-[15px] leading-[1.55]">
              {data.cancellation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
      <section className="section bg-light-green text-cream">
        <Container>
          <div
            id="request-private-meeting"
            className="split private-meeting-request"
          >
            <div className="grid gap-8 max-w-[48ch]">
              <SectionLabel className="text-gold! border-b-gold!">{data.howItWorksLabel}</SectionLabel>
              <h2 className="font-heading font-medium text-white m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-tight tracking-normal normal-case">
                {data.stepsTitle}
              </h2>
              <div
                className="grid gap-3"
                aria-label={data.requestProcessAriaLabel}
              >
                {data.steps.map(({ number, title, text }) => (
                  <article
                    className="grid grid-cols-[42px_minmax(0,1fr)] gap-3.5 items-start py-4.5 bg-transparent border-t border-t-[rgba(var(--rgb-cream),0.34)] rounded-none last:border-b last:border-b-[rgba(var(--rgb-cream),0.34)]"
                    key={title}
                  >
                    <span className="inline-block w-auto h-auto rounded-none bg-transparent p-0 text-gold text-[13px] font-black leading-tight tracking-[0.06em]">
                      {number}
                    </span>
                    <div>
                      <h3 className="mb-1 text-white font-body text-[clamp(16px,1.2vw,18px)] leading-tight font-black">
                        {title}
                      </h3>
                      <p className="m-0 text-[rgba(var(--rgb-cream),0.88)] text-[15px] leading-[1.55]">
                        {text}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
              <FAQInlinePrompt
                questionClassName="text-[rgba(var(--rgb-cream),0.88)]!"
                linkClassName="text-gold!"
              />
            </div>
            <InquiryForm
              type="booking"
              title={data.inquiryTitle}
              intro={data.inquiryIntro || undefined}
              submitLabel={data.inquirySubmitLabel}
              successMessage={data.successMessage}
              messagePlaceholder={data.messagePlaceholder}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
