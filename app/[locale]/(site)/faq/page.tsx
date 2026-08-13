import type { Metadata } from "next";
import { FAQAccordion, type FaqGroupData } from "@/components/FAQAccordion";
import { Container, Section, SectionLabel } from "@/components/ui";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/sanity-i18n";
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/live";
import { faqGroupsQuery, faqPageQuery } from "@/sanity/queries/faq";

const fallback = {
  heroLabel: "FAQ",
  heroTitle: "Frequently asked questions",
  description: "Answers about RORUM events, hosting, booking, services and volunteering.",
};

async function getData(locale: Locale) {
  if (!isSanityConfigured) return { ...fallback, groups: undefined as FaqGroupData[] | undefined };

  const [{ data: page }, { data: faqGroups }] = await Promise.all([
    sanityFetch({ query: faqPageQuery }),
    sanityFetch({ query: faqGroupsQuery }),
  ]);

  const groups: FaqGroupData[] | undefined = faqGroups?.length
    ? faqGroups.map((group) => ({
        title: pickLocalized(group.title, locale) ?? "",
        items: (group.items ?? []).map((item) => ({
          question: pickLocalized(item?.question, locale) ?? "",
          answer: pickLocalized(item?.answer, locale) ?? "",
        })),
      }))
    : undefined;

  return {
    heroLabel: pickLocalized(page?.heroLabel, locale) ?? fallback.heroLabel,
    heroTitle: pickLocalized(page?.heroTitle, locale) ?? fallback.heroTitle,
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
  const { heroLabel, heroTitle, groups } = await getData(locale);

  return (
    <>
      <section className="bg-cream pt-[clamp(46px,7vw,86px)] pb-[clamp(24px,4vw,42px)]">
        <Container>
          <SectionLabel>{heroLabel}</SectionLabel>
          <h1 className="font-heading font-medium text-text-primary tracking-[-0.03em] text-5xl leading-[1.02] max-w-none mt-4 mb-0">
            {heroTitle}
          </h1>
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
