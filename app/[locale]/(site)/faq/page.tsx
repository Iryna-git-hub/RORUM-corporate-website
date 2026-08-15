import type { Metadata } from "next";
import { FAQAccordion, type FaqGroupData } from "@/components/FAQAccordion";
import { Container, Section, SectionLabel } from "@/components/ui";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/sanity-i18n";
import { getSection } from "@/lib/sanity-sections";
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/live";
import { faqPageQuery } from "@/sanity/queries/faq";
import { pageByKeyQuery } from "@/sanity/queries/page";

const fallback = {
  heroLabel: "FAQ",
  heroTitle: "Frequently asked questions",
  heroText: "",
  description: "Answers about RORUM events, hosting, booking, services and volunteering.",
};

async function getData(locale: Locale) {
  if (!isSanityConfigured) return { ...fallback, groups: undefined as FaqGroupData[] | undefined };

  const [{ data: page }, { data: newPage }] = await Promise.all([
    sanityFetch({ query: faqPageQuery }),
    sanityFetch({ query: pageByKeyQuery, params: { pageKey: "faq" } }),
  ]);

  const heroSection = getSection(newPage?.sections, "hero");
  const groupSections = (newPage?.sections ?? []).filter((s) => s.sectionKey?.startsWith("group-"));

  const groupsFromSections: FaqGroupData[] | undefined = groupSections.length
    ? groupSections.map((group) => ({
        title: pickLocalized(group.title, locale) ?? "",
        items: (group.items ?? []).map((item) => ({
          question: pickLocalized(item.title, locale) ?? "",
          answer: pickLocalized(item.text, locale) ?? "",
        })),
      }))
    : undefined;
  const groups: FaqGroupData[] | undefined =
    groupsFromSections ??
    (page?.groups?.length
      ? page.groups.map((group) => ({
          title: pickLocalized(group.title, locale) ?? "",
          items: (group.items ?? []).map((item) => ({
            question: pickLocalized(item?.question, locale) ?? "",
            answer: pickLocalized(item?.answer, locale) ?? "",
          })),
        }))
      : undefined);

  return {
    heroLabel: pickLocalized(heroSection?.label, locale) ?? pickLocalized(page?.heroLabel, locale) ?? fallback.heroLabel,
    heroTitle: pickLocalized(heroSection?.title, locale) ?? pickLocalized(page?.heroTitle, locale) ?? fallback.heroTitle,
    heroText: pickLocalized(heroSection?.text, locale) ?? pickLocalized(page?.heroText, locale) ?? fallback.heroText,
    description: pickLocalized(page?.seo?.description, locale) ?? fallback.description,
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
  const { heroTitle, description } = await getData(locale);
  return localizedPageMetadata({ path: "/faq", locale, title: `${heroTitle} | RORUM`, description });
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
