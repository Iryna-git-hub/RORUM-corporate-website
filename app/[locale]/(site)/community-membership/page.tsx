import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { ArrowRight, BadgeCheck, ExternalLink } from "lucide-react";
import {
  Button,
  Container,
  FAQInlinePrompt,
  SectionHeader,
  SectionLabel,
  type ButtonVariant,
} from "@/components/ui";
import { MembershipBenefitsGrid } from "@/components/MembershipBenefitsGrid";
import { WecodaDonationSection, defaultBankFields, type BankField } from "@/components/WecodaDonationSection";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { compact, pickLocalized, type I18nEntry } from "@/lib/sanity-i18n";
import { getAction, getItem, getSection } from "@/lib/sanity-sections";
import { isSanityConfigured } from "@/sanity/env";
import { urlForFile, urlForImage } from "@/sanity/lib/image";
import { isDirectVideoFileUrl } from "@/sanity/lib/videoUrl";
import { sanityFetch } from "@/sanity/lib/live";
import { pageByKeyQuery } from "@/sanity/queries/page";
import { communityMembershipPageQuery } from "@/sanity/queries/pages";

const fallbackWecodaFormUrl = "https://forms.gle/MpadaPTyL8YCHtAa9";
const fallbackWecodaExternalUrl = "https://wecoda.org";
const fallbackWecodaDonationQrSrc = "/images/membership-week/wecoda-donation-qr.jpg";

interface MembershipWeekMediaItem {
  type: "image" | "video";
  src: string;
  alt?: string;
  label?: string;
  featured?: boolean;
}

const membershipWeekMedia: MembershipWeekMediaItem[] = [
  { type: "image", src: "/images/membership-week/members-balloon-arch.png", alt: "WECODA members celebrating in the garden by a green and white balloon arch", featured: true },
  { type: "video", src: "/videos/membership-week/members-week-01.mp4", label: "Muted video from the WECODA membership gathering" },
  { type: "image", src: "/images/membership-week/members-table-laughing.jpg", alt: "WECODA members smiling around a garden table" },
  { type: "image", src: "/images/membership-week/garden-table-catering.png", alt: "Catering table prepared for a WECODA member gathering" },
  { type: "video", src: "/videos/membership-week/members-week-02.mp4", label: "Muted video of members gathering outdoors" },
  { type: "image", src: "/images/membership-week/members-long-table.jpg", alt: "WECODA members seated at a long outdoor table" },
  { type: "image", src: "/images/membership-week/members-group-garden.jpg", alt: "Group portrait of WECODA members in the garden" },
  { type: "image", src: "/images/membership-week/members-portrait.png", alt: "Two WECODA members smiling at the gathering" },
];

const benefitIcons = [
  "/images/membership-benefits/event-access.png",
  "/images/membership-benefits/training-learning.png",
  "/images/membership-benefits/international-networking.png",
  "/images/membership-benefits/international-opportunities.png",
  "/images/membership-benefits/funding-information.png",
  "/images/membership-benefits/mentoring-advice.png",
  "/images/membership-benefits/visibility-work.png",
  "/images/membership-benefits/diplomatic-cultural-events.png",
  "/images/membership-benefits/supportive-community.png",
];

const fallbackBenefits = [
  ["Event Access", "Free or discounted participation in WECODA events."],
  ["Training and Learning", "Access to training sessions, educational programmes, and masterclasses."],
  ["International Networking", "International business networking and new partnerships."],
  ["International Opportunities", "Participation in international projects, forums, and business missions."],
  ["Funding Information", "Information about grants, accelerator programmes, and funding opportunities."],
  ["Mentoring and Expert Advice", "Mentoring support and consultations with experts."],
  ["Visibility for Your Work", "Opportunities to present your business, projects, and professional experience."],
  ["Diplomatic and Cultural Events", "Participation in unique WECODA events focused on diplomatic gastronomy and cultural diplomacy."],
  ["A Supportive Community", "A community of active women who support one another, exchange experience, and create new opportunities."],
];

const fallbackApplicationSteps: [title: string, text: string][] = [
  ["Submit your application", "Complete the WECODA membership application form."],
  ["Pay the annual membership fee", "The annual membership fee is 250 DKK."],
  ["Board review", "The WECODA Board reviews your application and payment."],
  ["Membership confirmation", "You will receive confirmation after your membership has been approved."],
];

const fallback = {
  heroLabel: "WECODA Community",
  heroTitle: "Join a Community That Helps Women Move Forward",
  heroIntro: [
    "WECODA: Women Entrepreneurs Commerce & Development Association.",
    "Connect with women entrepreneurs, professionals, and changemakers. Exchange experience, discover new opportunities, and grow with the support of an international community.",
  ],
  supportCta: "Support WECODA",
  externalSiteCta: "WECODA website",
  priceStripText: "Annual membership price: 250 DKK",
  introColumns: [
    "WECODA is an international community where ambitious women entrepreneurs, professionals, and leaders connect to exchange knowledge, build meaningful partnerships, and grow together. What makes WECODA unique is our signature concept of Diplomatic Gastronomy—a distinctive approach that brings together business, culture, and international dialogue. We believe that genuine relationships are built through shared experiences, creating an environment where conversations become collaborations and ideas evolve into lasting partnerships.",
    "Through curated networking events, business breakfasts, international forums, educational programs, and cultural initiatives, we create opportunities that extend far beyond traditional networking. Become part of a community where business meets purpose, relationships inspire growth, and every connection opens the door to new possibilities.",
  ],
  benefitsTitle: "What You Gain as a Member",
  applicationTitle: "Application Process",
  applicationCta: "Become a Member",
  seoTitle: "Community Membership | Join RORUM",
  description: "Become part of the RORUM community, meet people, exchange ideas and take part in activities and shared experiences.",
  introSectionLabel: "WECODA community",
  introSectionTitle: "Connecting Women Who Inspire, Build and Lead.",
  galleryLabel: "Gallery",
  galleryTitle: "WECODA Community Meetings",
  donationLabel: "Donation",
  donationTitle: "Support the WECODA Community",
  donationText:
    "Your support helps WECODA organise educational programmes, community events, international collaborations, and new opportunities for women.",
  donationScanText: "Scan to donate",
  donationScanSubtext: "Fast, secure and easy.",
  donationOrText: "OR",
  donationBankTransferText: "Prefer bank transfer? See our bank details on the right.",
  donationBankDetailsTitle: "Bank Details",
  donationSupportText:
    "RORUM proudly supports WECODA by providing a welcoming space for community events, learning, and collaboration.",
  statementText: "Together, we are building a strong international community.",
};

function MembershipButton({ children, variant = "primary", href = fallbackWecodaFormUrl }: { children: ReactNode; variant?: ButtonVariant; href?: string }) {
  return (
    <Button href={href} variant={variant}>
      {children}
      <ArrowRight
        className="button-arrow w-[15px] h-[15px] shrink-0 transition-transform duration-[180ms] ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
        aria-hidden="true"
        strokeWidth={1.9}
      />
    </Button>
  );
}

type BenefitIndexStyle = CSSProperties & { "--benefit-index": number };

function splitBenefit(combined: string, fallbackTitle: string, fallbackText: string): [string, string] {
  const [title, ...rest] = combined.split(" — ");
  const text = rest.join(" — ");
  return title && text ? [title, text] : [fallbackTitle, fallbackText];
}

async function getData(locale: Locale) {
  if (!isSanityConfigured) {
    return {
      ...fallback,
      benefits: fallbackBenefits.map(([title, text], i) => ({ title, text, icon: benefitIcons[i]! })),
      applicationSteps: fallbackApplicationSteps.map(([title, text], i) => ({
        number: String(i + 1).padStart(2, "0"),
        title,
        text,
      })),
      membershipFormHref: fallbackWecodaFormUrl,
      externalSiteHref: fallbackWecodaExternalUrl,
      donationQrSrc: fallbackWecodaDonationQrSrc,
      bankFields: defaultBankFields,
      gallery: membershipWeekMedia,
    };
  }

  const [{ data: page }, { data: newPage }] = await Promise.all([
    sanityFetch({ query: communityMembershipPageQuery }),
    sanityFetch({ query: pageByKeyQuery, params: { pageKey: "communityMembership" } }),
  ]);

  const heroSection = getSection(newPage?.sections, "hero");
  const donationSection = getSection(newPage?.sections, "donation");
  const introSection = getSection(newPage?.sections, "intro");
  const benefitsSection = getSection(newPage?.sections, "benefits");
  const applicationSection = getSection(newPage?.sections, "application");
  const gallerySection = getSection(newPage?.sections, "gallery");

  const heroTextValue = pickLocalized(heroSection?.text, locale);
  const heroIntroItemsFromSections = (heroSection?.items ?? []).filter((i) => i.itemKey?.startsWith("intro"));
  const heroIntro = heroTextValue
    ? heroTextValue.split("\n\n").filter(Boolean)
    : heroIntroItemsFromSections.length
      ? compact(heroIntroItemsFromSections.map((i) => pickLocalized(i.text, locale)))
      : page?.heroIntro?.length
        ? compact(page.heroIntro.map((p) => pickLocalized(p?.text, locale)))
        : fallback.heroIntro;

  const introColumns = introSection?.items?.length
    ? compact(introSection.items.map((c) => pickLocalized(c.text, locale)))
    : page?.introColumns?.length
      ? compact(page.introColumns.map((c) => pickLocalized(c?.text, locale)))
      : fallback.introColumns;

  const benefits = benefitsSection?.items?.length
    ? benefitsSection.items.map((b, i) => ({
        title: pickLocalized(b.title, locale) ?? fallbackBenefits[i]?.[0] ?? "",
        text: pickLocalized(b.text, locale) ?? fallbackBenefits[i]?.[1] ?? "",
        icon:
          urlForImage(b.image as unknown as Parameters<typeof urlForImage>[0])
            ?.width(96)
            .url() ?? benefitIcons[i] ?? benefitIcons[0]!,
      }))
    : page?.benefits?.length
      ? page.benefits.map((b, i) => {
          const combined = pickLocalized(b?.text, locale) ?? "";
          const [title, text] = splitBenefit(combined, fallbackBenefits[i]?.[0] ?? "", fallbackBenefits[i]?.[1] ?? "");
          const icon =
            urlForImage(b?.icon as unknown as Parameters<typeof urlForImage>[0])
              ?.width(96)
              .url() ?? benefitIcons[i] ?? benefitIcons[0]!;
          return { title, text, icon };
        })
      : fallbackBenefits.map(([title, text], i) => ({ title, text, icon: benefitIcons[i]! }));

  const applyAction = getAction(heroSection, "apply");
  const membershipFormHref = applyAction?.href || page?.membershipFormCta?.href || fallbackWecodaFormUrl;
  const externalSiteHref = getAction(heroSection, "external")?.href || fallbackWecodaExternalUrl;

  const donationQrSrc =
    urlForImage(donationSection?.media?.[0]?.image as unknown as Parameters<typeof urlForImage>[0])?.width(800).url() ??
    urlForImage(page?.donation?.qrImage as unknown as Parameters<typeof urlForImage>[0])?.width(800).url() ??
    fallbackWecodaDonationQrSrc;

  const bankItemsFromSections = (donationSection?.items ?? []).filter((i) => i.itemKey?.startsWith("bank"));
  const bankFields: BankField[] = bankItemsFromSections.length
    ? bankItemsFromSections
        .filter((f) => (f.value ?? "").trim().length > 0)
        .map((f, i) => ({
          label: pickLocalized(f.title, locale) ?? defaultBankFields[i]?.label ?? "",
          value: f.value ?? "",
          copyable: f.copyEnabled ?? false,
        }))
    : page?.donation?.bankFields?.length
      ? page.donation.bankFields.map((f, i) => ({
          label: pickLocalized(f?.label, locale) ?? defaultBankFields[i]?.label ?? "",
          value: f?.value ?? defaultBankFields[i]?.value ?? "",
          copyable: f?.copyable ?? defaultBankFields[i]?.copyable,
        }))
      : defaultBankFields;

  // Mirrors resolveCanonicalGalleryItems's "missing vs. intentionally empty"
  // policy (lib/sanityGallery.ts) by hand rather than calling it directly:
  // this page's mosaic layout needs a `featured` (2x2 tile) flag that's
  // meaningless to every other gallery consumer, and its static emergency
  // fallback mixes photos and videos, while the shared resolver's own
  // fallback tier is images-only — reusing it here would either leak a
  // page-only concern into the shared type or silently drop the video
  // fallback items. The per-item photo/video resolution below still
  // mirrors resolveOne's precedence (uploaded file before external URL,
  // rejecting a non-direct-file URL) to avoid re-introducing the bug that
  // helper exists to prevent.
  function resolveMembershipMedia(
    item: { image?: unknown; videoFile?: unknown; videoUrl?: string | null; alt?: I18nEntry<string>[] | null },
    fb: MembershipWeekMediaItem | undefined,
  ): MembershipWeekMediaItem | undefined {
    const imageUrl = urlForImage(item.image as unknown as Parameters<typeof urlForImage>[0])
      ?.width(700)
      .url();
    if (imageUrl) {
      return { type: "image", src: imageUrl, alt: pickLocalized(item.alt, locale) ?? fb?.alt, featured: fb?.featured };
    }
    const uploadedSrc = urlForFile(item.videoFile as Parameters<typeof urlForFile>[0]);
    let videoSrc = uploadedSrc;
    if (!videoSrc && item.videoUrl?.trim()) {
      if (isDirectVideoFileUrl(item.videoUrl)) {
        videoSrc = item.videoUrl.trim();
      }
    }
    if (!videoSrc) return undefined;
    return { type: "video", src: videoSrc, label: pickLocalized(item.alt, locale) ?? fb?.label, featured: fb?.featured };
  }

  const galleryFromSections = gallerySection?.media?.length
    ? gallerySection.media.map((item, i) => resolveMembershipMedia(item, membershipWeekMedia[i])).filter((m): m is MembershipWeekMediaItem => m !== undefined)
    : gallerySection
      ? []
      : undefined;
  const gallery: MembershipWeekMediaItem[] =
    galleryFromSections ??
    (page?.gallery?.length
      ? page.gallery.map((item, i) => {
          const fb = membershipWeekMedia[i];
          const imageUrl = urlForImage(item?.image as unknown as Parameters<typeof urlForImage>[0])
            ?.width(700)
            .url();
          return imageUrl
            ? { type: "image" as const, src: imageUrl, alt: pickLocalized(item?.alt, locale) ?? fb?.alt, featured: fb?.featured }
            : {
                type: "video" as const,
                src: item?.videoUrl || fb?.src || "",
                label: pickLocalized(item?.alt, locale) ?? fb?.label,
                featured: fb?.featured,
              };
        })
      : membershipWeekMedia);

  const applicationSteps = applicationSection?.items?.length
    ? applicationSection.items.map((s, i) => ({
        number: String(i + 1).padStart(2, "0"),
        title: pickLocalized(s.title, locale) ?? "",
        text: pickLocalized(s.text, locale) ?? "",
      }))
    : page?.applicationSteps?.length
      ? page.applicationSteps.map((s, i) => ({
          number: String(i + 1).padStart(2, "0"),
          title: pickLocalized(s?.title, locale) ?? "",
          text: pickLocalized(s?.text, locale) ?? "",
        }))
      : fallbackApplicationSteps.map(([title, text], i) => ({ number: String(i + 1).padStart(2, "0"), title, text }));

  return {
    heroLabel: pickLocalized(heroSection?.label, locale) ?? pickLocalized(page?.heroLabel, locale) ?? fallback.heroLabel,
    heroTitle: pickLocalized(heroSection?.title, locale) ?? pickLocalized(page?.heroTitle, locale) ?? fallback.heroTitle,
    supportCta:
      pickLocalized(getAction(heroSection, "support")?.label, locale) ??
      pickLocalized(page?.supportCta?.label, locale) ??
      fallback.supportCta,
    externalSiteCta:
      pickLocalized(getAction(heroSection, "external")?.label, locale) ??
      pickLocalized(page?.externalSiteCta?.label, locale) ??
      fallback.externalSiteCta,
    priceStripText:
      pickLocalized(getItem(heroSection, "priceStripText")?.title, locale) ??
      pickLocalized(page?.priceStripText, locale) ??
      fallback.priceStripText,
    benefitsTitle:
      pickLocalized(benefitsSection?.title, locale) ?? pickLocalized(page?.benefitsTitle, locale) ?? fallback.benefitsTitle,
    applicationTitle:
      pickLocalized(applicationSection?.title, locale) ?? pickLocalized(page?.applicationTitle, locale) ?? fallback.applicationTitle,
    applicationCta:
      pickLocalized(getAction(applicationSection, "apply")?.label, locale) ??
      pickLocalized(page?.applicationCta?.label, locale) ??
      fallback.applicationCta,
    seoTitle: pickLocalized(newPage?.seo?.title, locale) ?? pickLocalized(page?.seo?.title, locale) ?? fallback.seoTitle,
    description:
      pickLocalized(newPage?.seo?.description, locale) ?? pickLocalized(page?.seo?.description, locale) ?? fallback.description,
    ogImageUrl: urlForImage(newPage?.seo?.ogImage as unknown as Parameters<typeof urlForImage>[0])
      ?.width(1200)
      .url(),
    ogImageAlt: pickLocalized(newPage?.seo?.ogImage?.alt, locale),
    introSectionLabel:
      pickLocalized(introSection?.label, locale) ?? pickLocalized(page?.introSectionLabel, locale) ?? fallback.introSectionLabel,
    introSectionTitle:
      pickLocalized(introSection?.title, locale) ?? pickLocalized(page?.introSectionTitle, locale) ?? fallback.introSectionTitle,
    galleryLabel:
      pickLocalized(gallerySection?.label, locale) ?? pickLocalized(page?.galleryLabel, locale) ?? fallback.galleryLabel,
    galleryTitle:
      pickLocalized(gallerySection?.title, locale) ?? pickLocalized(page?.galleryTitle, locale) ?? fallback.galleryTitle,
    donationLabel:
      pickLocalized(donationSection?.label, locale) ?? pickLocalized(page?.donation?.label, locale) ?? fallback.donationLabel,
    donationTitle:
      pickLocalized(donationSection?.title, locale) ?? pickLocalized(page?.donation?.title, locale) ?? fallback.donationTitle,
    donationText:
      pickLocalized(donationSection?.text, locale) ?? pickLocalized(page?.donation?.text, locale) ?? fallback.donationText,
    donationScanText:
      pickLocalized(getItem(donationSection, "scanText")?.title, locale) ??
      pickLocalized(page?.donation?.scanText, locale) ??
      fallback.donationScanText,
    donationScanSubtext:
      pickLocalized(getItem(donationSection, "scanSubtext")?.title, locale) ??
      pickLocalized(page?.donation?.scanSubtext, locale) ??
      fallback.donationScanSubtext,
    donationOrText:
      pickLocalized(getItem(donationSection, "orText")?.title, locale) ??
      pickLocalized(page?.donation?.orText, locale) ??
      fallback.donationOrText,
    donationBankTransferText:
      pickLocalized(getItem(donationSection, "bankTransferText")?.title, locale) ??
      pickLocalized(page?.donation?.bankTransferText, locale) ??
      fallback.donationBankTransferText,
    donationBankDetailsTitle:
      pickLocalized(getItem(donationSection, "bankDetailsTitle")?.title, locale) ??
      pickLocalized(page?.donation?.bankDetailsTitle, locale) ??
      fallback.donationBankDetailsTitle,
    donationSupportText:
      pickLocalized(getItem(donationSection, "supportText")?.text, locale) ??
      pickLocalized(page?.donation?.supportText, locale) ??
      fallback.donationSupportText,
    statementText:
      pickLocalized(applicationSection?.text, locale) ?? pickLocalized(page?.statementText, locale) ?? fallback.statementText,
    heroIntro,
    introColumns,
    benefits,
    applicationSteps,
    membershipFormHref,
    externalSiteHref,
    donationQrSrc,
    bankFields,
    gallery,
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
    path: "/community-membership",
    locale,
    title: seoTitle,
    description,
    ...(ogImageUrl ? { image: ogImageUrl } : {}),
    ...(ogImageAlt ? { imageAlt: ogImageAlt } : {}),
  });
}

export default async function CommunityMembershipPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const data = await getData(locale);

  return (
    <>
      <section className="wecoda-hero bg-cream py-[clamp(44px,5vw,6rem)] max-sm:p-[24px_0_28px]">
        <Container>
          <div className="wecoda-hero-grid">
            <div className="wecoda-hero-copy grid gap-[clamp(10px,1.3vw,15px)] min-w-0">
              <SectionLabel>{data.heroLabel}</SectionLabel>
              <h1 className="heading wecoda-hero-title font-heading text-text-primary font-medium normal-case tracking-[0] leading-[1.2] m-0 max-w-full text-[3rem] max-sm:text-[clamp(2rem,10vw,2.5rem)]">
                {data.heroTitle}
              </h1>
              {data.heroIntro.map((paragraph) => (
                <p key={paragraph} className="wecoda-hero-intro text-text-primary text-[1rem] leading-[1.58] max-sm:m-[2px_0_4px]">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="wecoda-hero-logo-panel grid place-items-center w-[clamp(240px,24vw,300px)] aspect-square justify-self-start bg-white rounded-full border border-[rgba(var(--rgb-brown),0.1)] shadow-[0_18px_40px_rgba(var(--rgb-brown),0.12)] max-lg:w-[clamp(200px,30vw,260px)] max-lg:justify-self-center max-sm:w-[min(220px,60vw)]">
              <Image
                className="wecoda-hero-logo w-[75%] h-[75%] object-contain"
                src="/images/membership-week/wecoda-logo.jpg"
                alt="WECODA Women Entrepreneurs Commerce and Development Association logo"
                width={440}
                height={382}
                priority
              />
            </div>
            <div className="wecoda-hero-actions flex flex-wrap gap-5 items-center max-sm:w-full max-sm:mt-1">
              <MembershipButton href={data.membershipFormHref}>{data.applicationCta}</MembershipButton>
              <Button href="#support-wecoda" variant="secondary">
                {data.supportCta}
                <ArrowRight
                  className="button-arrow w-[15px] h-[15px] shrink-0 transition-transform duration-[180ms] ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </Button>
              <a
                className="wecoda-hero-external-link inline-flex items-center gap-1.5 w-fit text-[16px] font-bold leading-[1.45] no-underline transition-[color,transform] duration-[0.18s] max-sm:w-full max-sm:justify-center"
                href={data.externalSiteHref}
                target="_blank"
                rel="noreferrer"
              >
                {data.externalSiteCta}
                <ExternalLink
                  className="wecoda-hero-external-link-icon w-[15px] h-[15px] shrink-0"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </a>
            </div>
          </div>
        </Container>
      </section>

      <section className="wecoda-membership-price-strip w-full py-[clamp(12px,1.5vw,16px)] bg-light-green text-white">
        <Container>
          <div className="membership-price__content flex items-center gap-3">
            <span className="membership-price__icon inline-flex items-center justify-center w-11 h-11 rounded-full bg-[color-mix(in_srgb,var(--color-light-green)_62%,var(--color-white))] text-white shrink-0" aria-hidden="true">
              <BadgeCheck size={23} strokeWidth={2} />
            </span>
            <p className="membership-price__text min-w-0 m-0 text-inherit text-[clamp(1.05rem,1.4vw,1.18rem)] leading-[1.4] font-normal">
              {data.priceStripText}
            </p>
          </div>
        </Container>
      </section>

      <WecodaDonationSection
        qrSrc={data.donationQrSrc}
        label={data.donationLabel}
        title={data.donationTitle}
        text={data.donationText}
        scanText={data.donationScanText}
        scanSubtext={data.donationScanSubtext}
        orText={data.donationOrText}
        bankTransferText={data.donationBankTransferText}
        bankDetailsTitle={data.donationBankDetailsTitle}
        bankFields={data.bankFields}
        supportText={data.donationSupportText}
      />
      <section className="section wecoda-intro-section bg-cream text-text-primary">
        <Container>
          <SectionHeader
            label={data.introSectionLabel}
            title={data.introSectionTitle}
          />
          <div className="wecoda-intro-columns grid grid-cols-2 gap-[clamp(24px,3vw,56px)] max-lg:grid-cols-1 max-lg:gap-5">
            {data.introColumns.map((paragraph) => (
              <div key={paragraph} className="wecoda-intro-column grid gap-4 content-start">
                <p>{paragraph}</p>
              </div>
            ))}
          </div>
          <div className="wecoda-hero-actions flex flex-wrap gap-5 items-center max-sm:w-full max-sm:mt-1">
            <MembershipButton href={data.membershipFormHref}>{data.applicationCta}</MembershipButton>
            <a
              className="wecoda-hero-external-link inline-flex items-center gap-1.5 w-fit text-[16px] font-bold leading-[1.45] no-underline transition-[color,transform] duration-[0.18s] max-sm:w-full max-sm:justify-center"
              href={data.externalSiteHref}
              target="_blank"
              rel="noreferrer"
            >
              {data.externalSiteCta}
              <ExternalLink
                className="wecoda-hero-external-link-icon w-[15px] h-[15px] shrink-0"
                aria-hidden="true"
                strokeWidth={1.9}
              />
            </a>
          </div>
        </Container>
      </section>

      <section className="section wecoda-benefits-section bg-cream text-text-primary">
        <Container>
          <SectionHeader
            label="Membership Benefits"
            title={data.benefitsTitle}
            className="mb-[clamp(28px,4vw,42px)]!"
          />
          <MembershipBenefitsGrid>
            {data.benefits.map(({ title, text, icon }, index) => (
              <article
                className="wecoda-benefit-item grid grid-cols-1 content-start gap-4 p-[clamp(20px,2.6vw,28px)] border-0 rounded-none bg-white text-text-primary shadow-[0_12px_30px_rgba(var(--rgb-brown),0.06)]"
                key={title}
                style={{ "--benefit-index": index } as BenefitIndexStyle}
              >
                <span className="flex items-center justify-start w-12 h-12 shrink-0">
                  <Image
                    src={icon}
                    alt=""
                    aria-hidden="true"
                    width={48}
                    height={48}
                    className="block w-full h-full object-contain"
                  />
                </span>
                <div className="grid">
                  <h3 className="m-0 mb-4 text-text-primary font-heading text-[1.2rem] leading-[1.2] font-semibold">
                    {title}
                  </h3>
                  <p className="m-0 max-w-[54ch] text-[rgba(var(--rgb-dark-brown),0.76)] text-[0.96rem] leading-[1.62]">
                    {text}
                  </p>
                </div>
              </article>
            ))}
          </MembershipBenefitsGrid>
          <p className="text-[0.8rem] pt-8">
            Membership icons designed by{" "}
            <a
              href="https://www.flaticon.com/authors/freepik"
              target="_blank"
              rel="noreferrer"
              className="hover:text-red"
            >
              Freepik
            </a>{" "}
            from{" "}
            <a
              href="https://www.flaticon.com/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-red"
            >
              Flaticon
            </a>
            .
          </p>
        </Container>
      </section>

      <section className="section wecoda-membership-section bg-light-green text-text-on-dark pb-24 max-sm:pb-11">
        <Container>
          <div className="wecoda-membership-panel grid gap-24 w-full text-text-on-dark max-sm:w-full max-sm:gap-6">
            <div className="wecoda-membership-panel-main grid grid-cols-[minmax(180px,220px)_minmax(0,max-content)_auto] justify-start items-center gap-[75px] max-lg:grid-cols-1 max-lg:justify-items-center max-lg:text-center max-sm:grid-cols-1 max-sm:gap-11">
              <div className="wecoda-membership-illustration grid place-items-center min-w-0">
                <div className="wecoda-membership-logo-badge grid place-items-center w-[min(100%,200px)] aspect-square rounded-full bg-white p-[clamp(20px,2.2vw,28px)] shadow-[0_18px_40px_rgba(var(--rgb-brown),0.16)] max-lg:w-[min(40vw,185px)] max-sm:w-[min(60vw,170px)]">
                  <Image
                    className="wecoda-membership-logo block w-full h-auto object-contain"
                    src="/images/membership-week/wecoda-logo.jpg"
                    alt="WECODA Women Entrepreneurs Commerce and Development Association logo"
                    width={300}
                    height={260}
                  />
                </div>
              </div>
              <div className="wecoda-membership-content grid justify-items-center gap-5 min-w-0">
                <h3>{data.priceStripText.replace("Annual membership price:", "Annual Membership:")}</h3>
                <p className="wecoda-membership-statement max-w-[42ch] text-[rgba(var(--rgb-cream),0.9)] text-[clamp(1rem,1.3vw,1.12rem)] leading-[1.5]">
                  {data.statementText}
                </p>
                <a
                  className="wecoda-hero-external-link inline-flex items-center gap-1.5 w-fit text-[16px] font-bold leading-[1.45] no-underline transition-[color,transform] duration-[0.18s] max-sm:w-full max-sm:justify-center"
                  href={data.externalSiteHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  {data.externalSiteCta}
                  <ExternalLink
                    className="wecoda-hero-external-link-icon w-[15px] h-[15px] shrink-0"
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                </a>
                <FAQInlinePrompt
                  className="text-[rgba(var(--rgb-cream),0.72)]!"
                  linkClassName="text-gold!"
                />
              </div>
              <div className="wecoda-membership-cta flex justify-center min-w-max max-lg:justify-center max-lg:min-w-0">
                <MembershipButton variant="red" href={data.membershipFormHref}>{data.applicationCta}</MembershipButton>
              </div>
            </div>
            <div className="wecoda-application-process grid gap-[18px] pt-[clamp(24px,3vw,34px)]">
              <h4>{data.applicationTitle}</h4>
              <ol className="wecoda-application-steps grid grid-cols-2 gap-x-[clamp(32px,5vw,64px)] gap-y-0 p-0 list-none max-lg:grid-cols-1">
                {data.applicationSteps.map(({ number, title, text }) => (
                  <li key={title}>
                    <span
                      className="wecoda-application-step-number inline-block text-gold text-[13px] font-black leading-[1.2] tracking-[0.06em]"
                      aria-hidden="true"
                    >
                      {number}
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <p>{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </section>

      <section className="section wecoda-membership-week-section">
        <Container>
          <SectionHeader label={data.galleryLabel} title={data.galleryTitle} />
          <div className="wecoda-membership-week-grid grid grid-cols-4 auto-rows-[clamp(230px,21vw,340px)] gap-[clamp(12px,1.6vw,18px)] max-lg:grid-cols-2 max-lg:auto-rows-[clamp(190px,38vw,320px)] max-[560px]:grid-cols-1 max-[560px]:auto-rows-[clamp(230px,72vw,380px)]">
            {data.gallery.map((item) => (
              <figure
                className={`wecoda-membership-week-item relative min-w-0 min-h-0 m-0 overflow-hidden bg-beige ${
                  item.featured
                    ? "wecoda-membership-week-item-featured col-span-2 row-span-2 max-[560px]:col-auto max-[560px]:row-span-1"
                    : ""
                }`}
                key={item.src}
              >
                {item.type === "video" ? (
                  <video
                    src={item.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    aria-label={item.label}
                  />
                ) : (
                  <img src={item.src} alt={item.alt} loading="lazy" />
                )}
              </figure>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
