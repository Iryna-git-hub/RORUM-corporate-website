import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, HandHeart, Rocket, Users } from "lucide-react";
import { Container, SectionLabel } from "@/components/ui";
import { VolunteerApplicationButton, type VolunteerFormContent } from "@/components/VolunteerApplicationForm";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { compact, pickLocalized } from "@/lib/sanity-i18n";
import { getAction, getItem, getSection } from "@/lib/sanity-sections";
import { getIconCardIcon } from "@/lib/iconCardIcons";
import { isSanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { pageByKeyQuery } from "@/sanity/queries/page";

const fallbackHeroParagraphs = [
  "It often starts with something simple — a conversation, a shared idea, a moment that brings people together.",
  "At RORUM, these moments turn into experiences. And experiences turn into community.",
  "Volunteering here is more than helping at events. It's becoming part of a space where people create, connect, and grow side by side.",
  "You might be welcoming guests, supporting a workshop, or simply helping shape the atmosphere — but along the way, you become part of something real.",
];
const fallbackClosingParagraphs = [
  "In return, you gain experience, meet inspiring people, and become part of an international creative community in the heart of Copenhagen.",
  "If you feel a spark reading this — it probably means you belong here.",
  "Apply to volunteer and join RORUM.",
];
const fallbackHighlights = [
  { text: "A place where people know each other.", icon: Users },
  { text: "Support each other.", icon: HandHeart },
  { text: "Build something together.", icon: Rocket },
];

const fallbackHeroImage = "/images/events/volunteer-with-us.png";
const fallbackHeroImageAlt = "RORUM volunteers welcoming guests and preparing a gathering";

const fallbackApplicationForm: VolunteerFormContent = {
  modalTitle: "Volunteer With Us",
  messagePlaceholder:
    "Tell us what kinds of activities you would be interested in helping with and how you would like to contribute.",
  successMessage: "Thank you. Your volunteer application has been sent to the RORUM team.",
  errorMessage: "We could not send your application. Please check your connection and try again.",
};

const fallback = {
  heroLabel: "Volunteer with us",
  heroTitle: "Volunteer at RORUM",
  applyCta: "Apply to volunteer",
  seoTitle: "Volunteer at RORUM | Join the Community",
  description: "Discover ways to volunteer at RORUM, contribute your skills and energy, and help create welcoming events and communities.",
};

async function getData(locale: Locale) {
  if (!isSanityConfigured) {
    return {
      ...fallback,
      heroParagraphs: fallbackHeroParagraphs,
      closingParagraphs: fallbackClosingParagraphs,
      highlights: fallbackHighlights.map((h) => ({ text: h.text, Icon: h.icon })),
      heroImage: fallbackHeroImage,
      heroImageAlt: fallbackHeroImageAlt,
      applicationForm: fallbackApplicationForm,
    };
  }

  const { data: newPage } = await sanityFetch({ query: pageByKeyQuery, params: { pageKey: "volunteer" } });

  const heroSection = getSection(newPage?.sections, "hero");
  const formSection = getSection(newPage?.sections, "applicationForm");

  const heroParagraphItems = (heroSection?.items ?? []).filter((i) => i.itemKey?.startsWith("hero"));
  const heroParagraphs = heroParagraphItems.length
    ? compact(heroParagraphItems.map((i) => pickLocalized(i.text, locale)))
    : fallbackHeroParagraphs;

  const closingParagraphItems = (heroSection?.items ?? []).filter((i) => i.itemKey?.startsWith("closing"));
  const closingParagraphs = closingParagraphItems.length
    ? compact(closingParagraphItems.map((i) => pickLocalized(i.text, locale)))
    : fallbackClosingParagraphs;

  const highlightItems = (heroSection?.items ?? []).filter((i) => i.itemKey?.startsWith("highlight"));
  const highlights = highlightItems.length
    ? highlightItems.map((h) => ({ text: pickLocalized(h.title, locale) ?? "", Icon: getIconCardIcon(h.icon ?? undefined) }))
    : fallbackHighlights.map((h) => ({ text: h.text, Icon: h.icon }));

  const applicationForm: VolunteerFormContent = {
    modalTitle:
      pickLocalized(getItem(formSection, "modalTitle")?.title, locale) ?? fallbackApplicationForm.modalTitle,
    messagePlaceholder:
      pickLocalized(getItem(formSection, "messagePlaceholder")?.title, locale) ?? fallbackApplicationForm.messagePlaceholder,
    successMessage:
      pickLocalized(getItem(formSection, "successMessage")?.text, locale) ?? fallbackApplicationForm.successMessage,
    errorMessage:
      pickLocalized(getItem(formSection, "errorMessage")?.text, locale) ?? fallbackApplicationForm.errorMessage,
  };

  return {
    heroLabel: pickLocalized(heroSection?.label, locale) ?? fallback.heroLabel,
    heroTitle: pickLocalized(heroSection?.title, locale) ?? fallback.heroTitle,
    applyCta:
      pickLocalized(getAction(heroSection, "apply")?.label, locale) ?? fallback.applyCta,
    seoTitle: pickLocalized(newPage?.seo?.title, locale) ?? fallback.seoTitle,
    description: pickLocalized(newPage?.seo?.description, locale) ?? fallback.description,
    ogImageUrl: urlForImage(newPage?.seo?.ogImage as unknown as Parameters<typeof urlForImage>[0])
      ?.width(1200)
      .url(),
    ogImageAlt: pickLocalized(newPage?.seo?.ogImage?.alt, locale),
    heroParagraphs,
    closingParagraphs,
    highlights,
    heroImage:
      urlForImage(heroSection?.media?.[0]?.image as unknown as Parameters<typeof urlForImage>[0])
        ?.width(900)
        .url() ?? fallbackHeroImage,
    heroImageAlt:
      pickLocalized(heroSection?.media?.[0]?.alt, locale) ?? fallbackHeroImageAlt,
    applicationForm,
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
    path: "/volunteer",
    locale,
    title: seoTitle,
    description,
    ...(ogImageUrl ? { image: ogImageUrl } : {}),
    ...(ogImageAlt ? { imageAlt: ogImageAlt } : {}),
  });
}

export default async function VolunteerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const { heroLabel, heroTitle, applyCta, heroParagraphs, closingParagraphs, highlights, heroImage, heroImageAlt, applicationForm } =
    await getData(locale);

  return (
    <div>
      <section className="bg-cream px-0 pt-16.25 pb-[clamp(46px,7vw,92px)] max-sm:pt-9.5 max-sm:pb-12">
        <Container>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(320px,0.86fr)] gap-[clamp(34px,5vw,74px)] items-center max-lg:grid-cols-1">
            <div className="grid gap-[clamp(14px,2vw,22px)] max-w-[720px] max-lg:max-w-[760px]">
              <SectionLabel>{heroLabel}</SectionLabel>
              <h1 className="font-heading font-medium text-text-primary m-0 max-w-none text-[3rem] leading-[1.2] tracking-normal max-sm:text-[clamp(2rem,10vw,3rem)]">
                {heroTitle}
              </h1>
              <div className="grid gap-3.5">
                {heroParagraphs.map((paragraph) => (
                  <p key={paragraph} className="m-0 max-w-[66ch] text-text-primary text-base leading-[1.7]">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-[clamp(16px,2.4vw,38px)] mt-[clamp(4px,1vw,10px)] p-[clamp(16px,2.4vw,24px)] border border-red max-sm:grid-cols-1">
                {highlights.map(({ text, Icon }) => (
                  <div
                    className="grid justify-items-center content-start gap-3.5 py-3 text-center"
                    key={text}
                  >
                    <Icon
                      className="w-9 h-9 text-red"
                      aria-hidden="true"
                      strokeWidth={1.7}
                    />
                    <p className="m-0 text-text-primary text-[14px] leading-[1.4] font-bold">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid gap-3.5 pt-[clamp(8px,1.5vw,16px)]">
                {closingParagraphs.map((paragraph) => (
                  <p key={paragraph} className="m-0 max-w-[66ch] text-text-primary text-base leading-[1.7]">
                    {paragraph}
                  </p>
                ))}
              </div>
              <VolunteerApplicationButton
                className="btn group min-h-[46px]! px-[clamp(20px,3vw,30px)]! max-sm:w-full!"
                content={applicationForm}
              >
                <span>{applyCta}</span>
                <ArrowRight
                  className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </VolunteerApplicationButton>
            </div>
            <div className="relative min-h-[clamp(520px,56vw,720px)] overflow-hidden bg-beige lg:sticky lg:top-24 lg:self-start max-lg:min-h-[clamp(300px,48vw,440px)] max-sm:min-h-[280px]">
              <Image
                src={heroImage}
                alt={heroImageAlt}
                fill
                priority
                sizes="(max-width: 980px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
