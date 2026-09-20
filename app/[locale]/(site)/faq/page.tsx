import type { Metadata } from "next";
import { FAQAccordion, type FaqGroupData } from "@/components/FAQAccordion";
import { Container, Section, SectionLabel } from "@/components/ui";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/sanity-i18n";
import { getSection } from "@/lib/sanity-sections";
import { resolveCanonicalFaqGroups } from "@/lib/sanityFaq";
import { isSanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { pageByKeyQuery } from "@/sanity/queries/page";

const fallback = {
  heroLabel: "FAQ",
  heroTitle: "Frequently asked questions",
  heroText: "",
  seoTitle: "Frequently Asked Questions | RORUM",
  description: "Find answers to common questions about RORUM events, hosted programmes, volunteering, services and practical information.",
};

async function getData(locale: Locale) {
  if (!isSanityConfigured) return { ...fallback, groups: undefined as FaqGroupData[] | undefined };

  const { data: newPage } = await sanityFetch({ query: pageByKeyQuery, params: { pageKey: "faq" } });

  const heroSection = getSection(newPage?.sections, "hero");
  // Canonical-vs-legacy authority (see lib/sanityFaq.ts): page-faq missing
  // entirely -> empty; page-faq exists but has zero "group-" sections ->
  // intentionally empty. The legacy `faqPage.groups` source no longer exists.
  const groups = resolveCanonicalFaqGroups(newPage?.sections, undefined, locale);

  return {
    heroLabel: pickLocalized(heroSection?.label, locale) ?? fallback.heroLabel,
    heroTitle: pickLocalized(heroSection?.title, locale) ?? fallback.heroTitle,
    heroText: pickLocalized(heroSection?.text, locale) ?? fallback.heroText,
    seoTitle: pickLocalized(newPage?.seo?.title, locale) ?? fallback.seoTitle,
    description: pickLocalized(newPage?.seo?.description, locale) ?? fallback.description,
    ogImageUrl: urlForImage(newPage?.seo?.ogImage as unknown as Parameters<typeof urlForImage>[0])
      ?.width(1200)
      .url(),
    ogImageAlt: pickLocalized(newPage?.seo?.ogImage?.alt, locale),
    groups,
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
    path: "/faq",
    locale,
    title: seoTitle,
    description,
    ...(ogImageUrl ? { image: ogImageUrl } : {}),
    ...(ogImageAlt ? { imageAlt: ogImageAlt } : {}),
  });
}

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const { heroLabel, heroTitle, heroText, groups } = await getData(locale);

  return (
    <>
      <section className="bg-cream pt-[clamp(46px,7vw,86px)] pb-[clamp(24px,4vw,42px)]">
        <Container>
          <SectionLabel>{heroLabel}</SectionLabel>
          <h1 className="font-heading font-medium text-text-primary tracking-[-0.03em] text-5xl leading-[1.02] max-w-none mt-4 mb-0">
            {heroTitle}
          </h1>
          {heroText ? (
            <p className="m-0 mt-4 max-w-[68ch] text-text-primary text-base leading-[1.7]">{heroText}</p>
          ) : null}
        </Container>
      </section>
      <Section>
        <Container>
          <FAQAccordion groups={groups} />
        </Container>
      </Section>
    </>
  );
}
