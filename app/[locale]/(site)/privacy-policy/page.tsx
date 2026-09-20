import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { PrivacyPolicyContent } from "@/components/PrivacyPolicyContent";
import { RichText } from "@/components/RichText";
import { getCompanyContactFacts } from "@/lib/siteContent";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, localeTags, type Locale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/sanity-i18n";
import { getUiText } from "@/lib/uiText";
import { isSanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { legalPageQuery } from "@/sanity/queries/pages";

const fallback = {
  title: "Privacy policy",
  subtitle: "How RORUM handles personal information submitted through this website.",
  seoTitle: "Privacy Policy | RORUM",
  seoDescription: "Learn how RORUM collects, uses, stores and protects personal information when you use the website or contact us.",
};

function formatLastUpdated(dateString: string | null | undefined, locale: Locale): string | undefined {
  if (!dateString) return undefined;
  const formatted = new Intl.DateTimeFormat(localeTags[locale], { year: "numeric", month: "long" }).format(
    new Date(dateString),
  );
  return `${getUiText("lastUpdatedLabel", locale)}: ${formatted}`;
}

async function getData(locale: Locale) {
  const facts = await getCompanyContactFacts();
  if (!isSanityConfigured) return { ...fallback, body: null, lastUpdated: undefined, facts };

  const { data: doc } = await sanityFetch({ query: legalPageQuery, params: { pageKey: "privacy-policy" } });
  return {
    title: pickLocalized(doc?.title, locale) ?? fallback.title,
    subtitle: pickLocalized(doc?.subtitle, locale) ?? fallback.subtitle,
    body: pickLocalized(doc?.body, locale) ?? null,
    lastUpdated: formatLastUpdated(doc?.lastUpdated, locale),
    seoTitle: pickLocalized(doc?.seo?.title, locale) ?? fallback.seoTitle,
    seoDescription: pickLocalized(doc?.seo?.description, locale) ?? fallback.seoDescription,
    ogImageUrl: urlForImage(doc?.seo?.ogImage as unknown as Parameters<typeof urlForImage>[0])
      ?.width(1200)
      .url(),
    ogImageAlt: pickLocalized(doc?.seo?.ogImage?.alt, locale),
    facts,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const { seoTitle, seoDescription, ogImageUrl, ogImageAlt } = await getData(locale);
  return localizedPageMetadata({
    path: "/privacy-policy",
    locale,
    title: seoTitle,
    description: seoDescription,
    ...(ogImageUrl ? { image: ogImageUrl } : {}),
    ...(ogImageAlt ? { imageAlt: ogImageAlt } : {}),
  });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const { title, subtitle, body, lastUpdated, facts } = await getData(locale);

  return (
    <LegalPage title={title} subtitle={subtitle} lastUpdated={lastUpdated}>
      <h2>1. Company details</h2>
      <p>
        <strong>{facts.companyName}</strong>
        <br />
        Address: {facts.shortAddress}
        <br />
        CVR: {facts.cvr}
        <br />
        Contact: <a href={`mailto:${facts.email}`}>{facts.email}</a>
        <br />
        Website: {facts.website}
      </p>
      {body ? <RichText value={body} /> : <PrivacyPolicyContent email={facts.email} />}
    </LegalPage>
  );
}
