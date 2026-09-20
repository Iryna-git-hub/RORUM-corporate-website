import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
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
  title: "Terms and conditions",
  subtitle: "Terms for using the RORUM website, submitting inquiries and following external ticket links.",
  seoTitle: "Terms and Conditions | RORUM",
  seoDescription: "Read the terms and conditions that apply when using the RORUM website, services and related features.",
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

  const { data: doc } = await sanityFetch({ query: legalPageQuery, params: { pageKey: "terms" } });
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
    path: "/terms",
    locale,
    title: seoTitle,
    description: seoDescription,
    ...(ogImageUrl ? { image: ogImageUrl } : {}),
    ...(ogImageAlt ? { imageAlt: ogImageAlt } : {}),
  });
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const { title, subtitle, body, lastUpdated, facts } = await getData(locale);

  return (
    <LegalPage title={title} subtitle={subtitle} lastUpdated={lastUpdated}>
      <h2>1. Company details</h2>
      <p>
        RORUM is a Copenhagen-based business connected to events, private
        meetings, catering, event decoration and community experiences.
      </p>
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

      {body ? (
        <RichText value={body} />
      ) : (
        <>
          <h2>2. Use of this website</h2>
          <p>
            This website provides information about RORUM, events, hosted gatherings,
            catering, event decoration and related community experiences. The
            website is intended for general information and inquiries.
          </p>

          <h2>3. Inquiries and forms</h2>
          <p>
            Forms on this website are email-only. Submitting a form sends your
            inquiry to RORUM by email. Form submissions are not stored in Sanity,
            and no inquiry database is used in this simplified setup.
          </p>

          <h2>4. Bookings and tickets</h2>
          <p>
            Submitting an inquiry does not create a confirmed booking. Details such
            as availability, pricing and final arrangements are confirmed
            separately. Event ticket purchases may be handled through Billetto,
            which is an external ticket provider.
          </p>

          <h2>5. External links and services</h2>
          <p>
            This website may link to external services, including Billetto, Google
            Maps and social media platforms. RORUM is not responsible for the
            content, policies or technical behavior of external websites.
          </p>

          <h2>6. Website content</h2>
          <p>
            All text, images, design elements and website content belong to RORUM or
            are used with permission. You may not copy, reuse or distribute website
            content without permission from RORUM.
          </p>

          <h2>7. Website availability</h2>
          <p>
            RORUM aims to keep the website available and accurate, but the website
            may change, be unavailable or contain errors from time to time.
          </p>

          <h2>8. Contact</h2>
          <p>
            For questions about these terms, contact{" "}
            <a href={`mailto:${facts.email}`}>{facts.email}</a>.
          </p>
        </>
      )}
    </LegalPage>
  );
}
