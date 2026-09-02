import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { SocialIcon } from "@/components/SocialIcon";
import { Container, FAQInlinePrompt, SectionLabel } from "@/components/ui";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/sanity-i18n";
import { getItem, getSection } from "@/lib/sanity-sections";
import { isSanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { pageByKeyQuery } from "@/sanity/queries/page";
import { contactInfoQuery, socialLinksQuery } from "@/sanity/queries/globals";
import {
  resolveContactDetailOrder,
  resolveContactDetails,
  resolveFaqPrompt,
  resolvePrivacyConsentSettings,
  resolveSocialLinks,
} from "@/lib/sanityContact";
import { Mail, MapPin, Phone } from "lucide-react";

type BrandColorStyle = CSSProperties & { "--social-brand-color": string };

const fallback = {
  heroLabel: "Contact",
  introTitle: "We are here for you",
  introText:
    "For more information about events, hosting a gathering at RORUM, collaborations, catering, event decoration, or practical details, please feel free to get in touch with us.",
  followUsTitle: "Follow us",
  formTitle: "We want to hear from you",
  successMessage: "Thank you. Your message is ready for the RORUM team.",
  submitLabel: "Send message",
  seoTitle: "Contact RORUM | Get in Touch",
  description: "Contact RORUM with questions about events, hosting, catering, membership, collaboration or visiting the space.",
};

async function getData(locale: Locale) {
  if (!isSanityConfigured) {
    return {
      ...fallback,
      contactDetails: resolveContactDetails(null),
      contactDetailOrder: resolveContactDetailOrder(undefined),
      socialLinks: resolveSocialLinks(null, locale),
      privacyConsent: resolvePrivacyConsentSettings(undefined),
      faqPrompt: resolveFaqPrompt(undefined, locale),
      formSection: undefined,
    };
  }

  const [{ data: newPage }, { data: contactInfoDoc }, { data: socialLinksDoc }] = await Promise.all([
    sanityFetch({ query: pageByKeyQuery, params: { pageKey: "contact" } }),
    sanityFetch({ query: contactInfoQuery }),
    sanityFetch({ query: socialLinksQuery, stega: false }),
  ]);

  const heroSection = getSection(newPage?.sections, "hero");
  const formSection = getSection(newPage?.sections, "form");

  return {
    heroLabel: pickLocalized(heroSection?.label, locale) ?? fallback.heroLabel,
    introTitle: pickLocalized(heroSection?.title, locale) ?? fallback.introTitle,
    introText: pickLocalized(heroSection?.text, locale) ?? fallback.introText,
    followUsTitle:
      pickLocalized(getItem(heroSection, "followUsTitle")?.title, locale) ?? fallback.followUsTitle,
    formTitle: pickLocalized(formSection?.title, locale) ?? fallback.formTitle,
    successMessage:
      pickLocalized(getItem(formSection, "successMessage")?.text, locale) ?? fallback.successMessage,
    submitLabel:
      pickLocalized(getItem(formSection, "submitLabel")?.title, locale) ?? fallback.submitLabel,
    seoTitle: pickLocalized(newPage?.seo?.title, locale) ?? fallback.seoTitle,
    description: pickLocalized(newPage?.seo?.description, locale) ?? fallback.description,
    ogImageUrl: urlForImage(newPage?.seo?.ogImage as unknown as Parameters<typeof urlForImage>[0])
      ?.width(1200)
      .url(),
    ogImageAlt: pickLocalized(newPage?.seo?.ogImage?.alt, locale),
    contactDetails: resolveContactDetails(contactInfoDoc),
    contactDetailOrder: resolveContactDetailOrder(heroSection),
    socialLinks: resolveSocialLinks(socialLinksDoc, locale),
    privacyConsent: resolvePrivacyConsentSettings(formSection),
    faqPrompt: resolveFaqPrompt(formSection, locale),
    formSection,
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
    path: "/contact",
    locale,
    title: seoTitle,
    description,
    ...(ogImageUrl ? { image: ogImageUrl } : {}),
    ...(ogImageAlt ? { imageAlt: ogImageAlt } : {}),
  });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const data = await getData(locale);

  return (
    <>
      <section className="bg-cream p-[65px_0_clamp(42px,7vw,88px)] max-sm:p-[38px_0_42px]">
        <Container>
          <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)] gap-[clamp(26px,5vw,64px)] items-start max-lg:grid-cols-1">
            <div className="grid items-start min-h-full">
              <div className="grid gap-5 content-start max-w-[650px] max-lg:max-w-[760px]">
                <SectionLabel>{data.heroLabel}</SectionLabel>
                <h1 className="heading sr-only m-0 max-w-[12ch] text-[3rem] leading-[0.98] font-medium max-sm:text-[clamp(2rem,10vw,3.2rem)] max-lg:max-w-[14ch]">
                  Contact us
                </h1>
                <div className="grid gap-2">
                  <h2 className="m-0 text-text-primary font-body text-[clamp(17px,1.35vw,20px)] leading-[1.25] font-black">
                    {data.introTitle}
                  </h2>
                  <p className="m-0 max-w-[56ch] text-text-primary text-[1rem] leading-[1.65]">
                    {data.introText}
                  </p>
                </div>
                <div className="grid gap-3">
                  {data.contactDetailOrder.map((detail) => {
                    if (detail === "address") {
                      return (
                        <p key="address" className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 items-center m-0 text-text-primary leading-[1.55] font-[650]">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(var(--rgb-red),0.1)] text-red leading-[1]" aria-hidden="true">
                            <MapPin
                              className="block w-4.5 h-4.5 shrink-0"
                              aria-hidden="true"
                              strokeWidth={1.8}
                            />
                          </span>
                          <span>{data.contactDetails.address}</span>
                        </p>
                      );
                    }
                    if (detail === "phone") {
                      return (
                        <p key="phone" className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 items-center m-0 text-text-primary leading-[1.55] font-[650]">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(var(--rgb-red),0.1)] text-red leading-[1]" aria-hidden="true">
                            <Phone
                              className="block w-4.5 h-4.5 shrink-0"
                              aria-hidden="true"
                              strokeWidth={1.8}
                            />
                          </span>
                          <a
                            className="text-text-primary hover:text-red focus-visible:text-red"
                            href={data.contactDetails.phoneHref}
                          >
                            {data.contactDetails.phone}
                          </a>
                        </p>
                      );
                    }
                    if (detail === "email") {
                      return (
                        <p key="email" className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 items-center m-0 text-text-primary leading-[1.55] font-[650]">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(var(--rgb-red),0.1)] text-red leading-[1]" aria-hidden="true">
                            <Mail
                              className="block w-4.5 h-4.5 shrink-0"
                              aria-hidden="true"
                              strokeWidth={1.8}
                            />
                          </span>
                          <a
                            className="text-text-primary hover:text-red focus-visible:text-red"
                            href={`mailto:${data.contactDetails.email}`}
                          >
                            {data.contactDetails.email}
                          </a>
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
                <div className="grid gap-2">
                  <h2 className="m-0 text-text-primary font-body text-[clamp(17px,1.35vw,20px)] leading-[1.25] font-black">
                    {data.followUsTitle}
                  </h2>
                </div>
                <div
                  className="flex flex-wrap gap-[10px] mt-1"
                  aria-label="Social links"
                >
                  {data.socialLinks.map(({ id, href, label, icon, brandColor }) => (
                    <a
                      key={id}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="inline-flex items-center justify-center w-10.5 h-10.5 rounded-full border-0 bg-[var(--social-brand-color,var(--color-red))] text-white transition-[color,transform,filter] duration-180 ease-[ease] hover:text-white hover:-translate-y-px hover:brightness-[1.08] hover:saturate-[1.04] focus-visible:text-white focus-visible:-translate-y-px focus-visible:brightness-[1.08] focus-visible:saturate-[1.04]"
                      style={{ "--social-brand-color": brandColor } as BrandColorStyle}
                    >
                      <SocialIcon icon={icon} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div
              className="grid items-start min-h-full"
              aria-label="RORUM location map"
            >
              <div className="w-full mb-4">
                <ContactForm
                  formTitle={data.formTitle}
                  successMessage={data.successMessage}
                  submitLabel={data.submitLabel}
                  formSection={data.formSection}
                  privacyConsent={data.privacyConsent}
                />
              </div>
              {data.faqPrompt.shown ? (
                <FAQInlinePrompt question={data.faqPrompt.question} label={data.faqPrompt.label} href={data.faqPrompt.href} />
              ) : null}
            </div>
          </div>
        </Container>
      </section>
      <section
        className="bg-white"
        aria-label="RORUM location map"
      >
        <div
          className="w-full min-h-[clamp(360px,34vw,520px)] scroll-mt-[78px] bg-white overflow-hidden max-lg:min-h-[clamp(320px,54vw,430px)] max-lg:scroll-mt-[68px]"
          id="contact-map"
        >
          <iframe
            className="block w-full h-full min-h-[clamp(360px,34vw,520px)] border-0 max-lg:min-h-[clamp(320px,54vw,430px)]"
            title="RORUM location on Google Maps"
            src={`https://www.google.com/maps?q=${encodeURIComponent(data.contactDetails.mapQueryAddress)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  );
}
