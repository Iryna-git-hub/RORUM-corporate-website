import type { ReactNode } from "react";
import { FormContentProvider } from "@/components/FormContentProvider";
import { SiteShell } from "@/components/SiteShell";
import { isLocale, type Locale } from "@/lib/i18n";
import { pickLabel, pickLocalized } from "@/lib/sanity-i18n";
import { resolveFooter, resolveNavItems } from "@/lib/sanityNav";
import { defaultFormMessages, resolveFormMessages, resolvePrivacyPolicy } from "@/lib/sanityForms";
import { resolveContactDetails, resolveSocialLinks } from "@/lib/sanityContact";
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/live";
import { contactInfoQuery, footerQuery, formMessagesQuery, navigationQuery, socialLinksQuery } from "@/sanity/queries/globals";
import { legalPageQuery } from "@/sanity/queries/pages";

// Route-group layout: wraps every public marketing/content page (everything
// that used to be directly under app/) in the site's Header/Footer chrome.
// `/studio` deliberately sits outside this group (see app/studio/) so Sanity
// Studio renders full-viewport, without the site's nav/footer around it.
//
// This is where `navigation`/`footer` are fetched and resolved to the
// current locale: Header/Footer are "use client" components that can't call
// sanityFetch themselves, so the resolved, plain-string data is fetched here
// (a Server Component) and passed down as props — see MIGRATION_REPORT.md's
// localization-routing section for why this is the general pattern for
// "client component needs localized Sanity content".
export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";

  if (!isSanityConfigured) {
    return (
      <FormContentProvider
        value={{
          messages: defaultFormMessages,
          privacyPolicy: {
            title: "Privacy Policy",
            subtitle: "How RORUM handles personal information submitted through this website.",
            lastUpdated: null,
            body: null,
          },
        }}
      >
        <SiteShell>{children}</SiteShell>
      </FormContentProvider>
    );
  }

  const [
    { data: navigationDoc },
    { data: footerDoc },
    { data: formMessagesDoc },
    { data: privacyPolicyDoc },
    { data: contactInfoDoc },
    { data: socialLinksDoc },
  ] = await Promise.all([
    sanityFetch({ query: navigationQuery }),
    sanityFetch({ query: footerQuery }),
    sanityFetch({ query: formMessagesQuery }),
    sanityFetch({ query: legalPageQuery, params: { pageKey: "privacy-policy" } }),
    sanityFetch({ query: contactInfoQuery }),
    sanityFetch({ query: socialLinksQuery, stega: false }),
  ]);

  const navItems = resolveNavItems(navigationDoc?.items, locale);
  const footer = resolveFooter(footerDoc, locale);
  const contactCtaLabel = pickLocalized(navigationDoc?.contactCtaLabel, locale);
  const footerContactDetails = resolveContactDetails(contactInfoDoc);
  const footerSocialLinks = resolveSocialLinks(socialLinksDoc, locale);
  const homeLabel = pickLabel(navigationDoc?.labels, "homeLabel", locale, "Home");
  const openMenuLabel = pickLabel(navigationDoc?.labels, "openMenuLabel", locale, "Open menu");
  const closeMenuLabel = pickLabel(navigationDoc?.labels, "closeMenuLabel", locale, "Close menu");
  const languageSwitcherLabel = pickLocalized(navigationDoc?.languageSwitcherLabel, locale);

  return (
    <FormContentProvider
      value={{
        messages: resolveFormMessages(formMessagesDoc, locale),
        privacyPolicy: resolvePrivacyPolicy(privacyPolicyDoc, locale),
      }}
    >
      <SiteShell
        navItems={navItems}
        footerColumns={footer?.columns}
        footerLegalLinks={footer?.legalLinks}
        footerCopyrightText={footer?.copyrightText}
        contactCtaLabel={contactCtaLabel}
        contactDetailsLabel={footer?.contactDetailsLabel}
        footerContactDetails={footerContactDetails}
        footerSocialLinks={footerSocialLinks}
        homeLabel={homeLabel}
        openMenuLabel={openMenuLabel}
        closeMenuLabel={closeMenuLabel}
        languageSwitcherLabel={languageSwitcherLabel}
      >
        {children}
      </SiteShell>
    </FormContentProvider>
  );
}
