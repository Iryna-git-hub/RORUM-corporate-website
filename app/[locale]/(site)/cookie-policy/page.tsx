import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { RichText } from "@/components/RichText";
import { getCompanyContactFacts } from "@/lib/siteContent";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, localeTags, type Locale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/sanity-i18n";
import { getUiText } from "@/lib/uiText";
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/live";
import { legalPageQuery } from "@/sanity/queries/pages";

const fallback = {
  title: "Cookie policy",
  subtitle: "How RORUM may use cookies and similar technologies.",
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

  const { data: doc } = await sanityFetch({ query: legalPageQuery, params: { pageKey: "cookie-policy" } });
  return {
    title: pickLocalized(doc?.title, locale) ?? fallback.title,
    subtitle: pickLocalized(doc?.subtitle, locale) ?? fallback.subtitle,
    body: pickLocalized(doc?.body, locale) ?? null,
    lastUpdated: formatLastUpdated(doc?.lastUpdated, locale),
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
  return localizedPageMetadata({ path: "/cookie-policy", locale, title: `${title} | RORUM`, description: subtitle });
}

export default async function CookiePolicyPage({ params }: { params: Promise<{ locale: string }> }) {
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

      {body ? (
        <RichText value={body} />
      ) : (
        <>
          <h2>2. What cookies are</h2>
          <p>
            Cookies are small files stored by your browser. Similar technologies may
            also be used to load website features or external services.
          </p>

          <h2>3. Necessary website cookies</h2>
          <p>
            The RORUM website may use necessary cookies or similar technologies
            required for basic website functionality, security or page behavior.
          </p>

          <h2>4. Forms</h2>
          <p>
            Forms on this website are email-only. Form submissions are not stored in
            Sanity, and no inquiry database is used in this simplified setup.
          </p>

          <h2>5. Analytics and marketing tracking</h2>
          <p>
            Google Analytics, Meta Pixel and marketing tracking cookies are not
            intentionally used by default on this simplified website.
          </p>

          <h2>6. Google Maps</h2>
          <p>
            The Contact page may include a Google Maps iframe. Google Maps may set
            cookies or process data when the map is loaded.
          </p>

          <h2>7. Billetto</h2>
          <p>
            Event ticket links may lead to Billetto, which is an external ticket
            provider. Billetto may use its own cookies or similar technologies.
          </p>

          <h2>8. Social media links</h2>
          <p>
            Social media links on this website are external links only. Social
            platforms may use their own cookies or tracking when you visit them.
          </p>

          <h2>9. Contact</h2>
          <p>
            For cookie questions, contact{" "}
            <a href={`mailto:${facts.email}`}>{facts.email}</a>.
          </p>
        </>
      )}
    </LegalPage>
  );
}
