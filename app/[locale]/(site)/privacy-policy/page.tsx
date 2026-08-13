import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { PrivacyPolicyContent } from "@/components/PrivacyPolicyContent";
import { RichText } from "@/components/RichText";
import { getCompanyContactFacts } from "@/lib/siteContent";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/sanity-i18n";
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/live";
import { legalPageQuery } from "@/sanity/queries/pages";

const fallback = {
  title: "Privacy policy",
  subtitle: "How RORUM handles personal information submitted through this website.",
};

async function getData(locale: Locale) {
  const facts = await getCompanyContactFacts();
  if (!isSanityConfigured) return { ...fallback, body: null, facts };

  const { data: doc } = await sanityFetch({ query: legalPageQuery, params: { pageKey: "privacy-policy" } });
  return {
    title: pickLocalized(doc?.title, locale) ?? fallback.title,
    subtitle: pickLocalized(doc?.subtitle, locale) ?? fallback.subtitle,
    body: pickLocalized(doc?.body, locale) ?? null,
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
  const { title, subtitle } = await getData(locale);
  return localizedPageMetadata({ path: "/privacy-policy", locale, title: `${title} | RORUM`, description: subtitle });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const { title, subtitle, body, facts } = await getData(locale);

  return (
    <LegalPage title={title} subtitle={subtitle}>
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
      {body ? <RichText value={body} /> : <PrivacyPolicyContent />}
    </LegalPage>
  );
}
