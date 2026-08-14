import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, DoorOpen, HeartHandshake, Sprout, type LucideIcon } from "lucide-react";
import { CvUploadButton, type CvUploadFormContent } from "@/components/CvUploadModal";
import { Container, SectionLabel } from "@/components/ui";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { compact, pickLocalized } from "@/lib/sanity-i18n";
import { getIconCardIcon } from "@/lib/iconCardIcons";
import { isSanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { workWithUsPageQuery } from "@/sanity/queries/pages";

const fallbackFeatureItems: { text: string; icon: LucideIcon }[] = [
  { text: "Opportunities grow through people", icon: Sprout },
  { text: "The right environment opens new doors", icon: DoorOpen },
  { text: "Let's create something meaningful together", icon: HeartHandshake },
];

const HERO_TEXT_P_CLASS = "m-0 max-w-[66ch] text-text-primary text-base leading-[1.7]";

const fallbackHeroParagraphs = [
  "If our work resonates with you, we would be happy to get to know you.",
  "Please feel free to send us your CV, and if any opportunities arise within our projects or activities that match your experience and interests, we will be sure to get in touch.",
  "We believe that opportunities grow through people — and sometimes the right environment can open doors you didn't even know existed.",
  "Maybe it leads to a collaboration. Maybe to a role. Or maybe to a connection that brings something unexpected.",
  "Either way — it starts here.",
];

const fallbackCollaborationImages = [
  { image: "/images/work-with-us/kitchen-collaboration.png", alt: "RORUM collaborators cooking together in the kitchen" },
  { image: "/images/work-with-us/light-collaboration.png", alt: "Light RORUM collaboration scene with planning materials" },
];

const fallbackCvUploadForm: CvUploadFormContent = {
  modalTitle: "Send your CV",
  modalTitleSent: "Thank you — we received your CV",
  description:
    "We'd love to hear from you. Upload your CV and tell us a little about yourself — we'll keep your details in mind for future collaborations, roles, or opportunities at RORUM.",
  descriptionSent:
    "Thank you for reaching out and sharing your story with RORUM. We'll keep your details in mind for future collaborations, roles, or opportunities.",
  messagePlaceholder: "Tell us briefly what kind of collaboration you are interested in.",
  dropzoneText: "Choose a PDF, DOC, or DOCX file",
  errorMessage: "Something went wrong while sending your CV. Please try again.",
};

const fallback = {
  heroLabel: "Work with us",
  heroTitle: "Work with us",
  cvUploadCta: "Send your CV",
  description: "Collaborate with RORUM as a facilitator, chef, creative partner or event professional.",
};

async function getData(locale: Locale) {
  if (!isSanityConfigured) {
    return {
      ...fallback,
      heroParagraphs: fallbackHeroParagraphs,
      featureItems: fallbackFeatureItems,
      collaborationImages: fallbackCollaborationImages,
      cvUploadForm: fallbackCvUploadForm,
    };
  }

  const { data: page } = await sanityFetch({ query: workWithUsPageQuery });
  const heroParagraphs = page?.heroParagraphs
    ? compact(page.heroParagraphs.map((p) => pickLocalized(p?.text, locale)))
    : fallbackHeroParagraphs;

  const featureItems = page?.featureItems?.length
    ? page.featureItems.map((f, i) => ({
        text: pickLocalized(f?.title, locale) ?? fallbackFeatureItems[i]?.text ?? "",
        icon: getIconCardIcon(f?.icon),
      }))
    : fallbackFeatureItems;

  const collaborationImages = page?.collaborationImages?.length
    ? page.collaborationImages.map((img, i) => ({
        image:
          urlForImage(img as unknown as Parameters<typeof urlForImage>[0])
            ?.width(900)
            .url() ?? fallbackCollaborationImages[i]?.image ?? "",
        alt: pickLocalized(img?.alt, locale) ?? fallbackCollaborationImages[i]?.alt ?? "",
      }))
    : fallbackCollaborationImages;

  const cvUploadForm: CvUploadFormContent = {
    modalTitle: pickLocalized(page?.cvUploadForm?.modalTitle, locale) ?? fallbackCvUploadForm.modalTitle,
    modalTitleSent: pickLocalized(page?.cvUploadForm?.modalTitleSent, locale) ?? fallbackCvUploadForm.modalTitleSent,
    description: pickLocalized(page?.cvUploadForm?.description, locale) ?? fallbackCvUploadForm.description,
    descriptionSent:
      pickLocalized(page?.cvUploadForm?.descriptionSent, locale) ?? fallbackCvUploadForm.descriptionSent,
    messagePlaceholder:
      pickLocalized(page?.cvUploadForm?.messagePlaceholder, locale) ?? fallbackCvUploadForm.messagePlaceholder,
    dropzoneText: pickLocalized(page?.cvUploadForm?.dropzoneText, locale) ?? fallbackCvUploadForm.dropzoneText,
    errorMessage: pickLocalized(page?.cvUploadForm?.errorMessage, locale) ?? fallbackCvUploadForm.errorMessage,
  };

  return {
    heroLabel: pickLocalized(page?.heroLabel, locale) ?? fallback.heroLabel,
    heroTitle: pickLocalized(page?.heroTitle, locale) ?? fallback.heroTitle,
    cvUploadCta: pickLocalized(page?.cvUploadCta, locale) ?? fallback.cvUploadCta,
    description: pickLocalized(page?.seo?.description, locale) ?? fallback.description,
    heroParagraphs,
    featureItems,
    collaborationImages,
    cvUploadForm,
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
  return localizedPageMetadata({ path: "/work-with-us", locale, title: `${heroTitle} | RORUM`, description });
}

export default async function WorkWithUsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const { heroLabel, heroTitle, cvUploadCta, heroParagraphs, featureItems, collaborationImages, cvUploadForm } =
    await getData(locale);

  return (
    <>
      <section className="bg-white pt-[65px] pb-[clamp(38px,6vw,78px)] max-sm:pt-[38px] max-sm:pb-12">
        <Container>
          <div className="grid grid-cols-[minmax(0,1.02fr)_minmax(320px,0.88fr)] gap-[clamp(32px,5vw,72px)] items-center max-lg:grid-cols-1">
            <div className="grid gap-[clamp(14px,2vw,22px)] max-w-[720px] max-lg:max-w-[760px]">
              <SectionLabel>{heroLabel}</SectionLabel>
              <h1 className="font-heading font-medium text-text-primary m-0 max-w-[11ch] text-[3rem] leading-[1.2] tracking-[0] max-sm:text-[clamp(2rem,10vw,3rem)]">
                {heroTitle}
              </h1>
              <div className="grid gap-3.5">
                {heroParagraphs.map((paragraph) => (
                  <p key={paragraph} className={HERO_TEXT_P_CLASS}>
                    {paragraph}
                  </p>
                ))}
              </div>
              <CvUploadButton
                className="group inline-flex items-center justify-center gap-2 min-h-[46px] w-fit px-[clamp(20px,3vw,30px)] border border-primary rounded-pill bg-primary text-white text-[12.5px] font-bold tracking-[0.02em] uppercase cursor-pointer transition-[transform,background-color,border-color,color] duration-[180ms] ease-[ease] hover:-translate-y-px hover:bg-primary-dark hover:border-primary-dark hover:text-white active:bg-primary-darker active:border-primary-darker max-sm:w-full"
                content={cvUploadForm}
              >
                <span>{cvUploadCta}</span>
                <ArrowRight
                  className="w-[15px] h-[15px] shrink-0 transition-transform duration-[180ms] ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </CvUploadButton>
            </div>
            <div className="relative w-full aspect-square min-h-0 overflow-visible isolate max-sm:max-w-full">
              <div className="absolute overflow-hidden bg-beige shadow-[0_18px_42px_rgba(var(--rgb-brown),0.1)] top-0 right-0 w-[66.666%] aspect-square">
                <Image
                  className="object-cover object-center"
                  src={collaborationImages[0]?.image ?? fallbackCollaborationImages[0]!.image}
                  alt={collaborationImages[0]?.alt ?? fallbackCollaborationImages[0]!.alt}
                  fill
                  priority
                  sizes="(max-width: 980px) 100vw, 50vw"
                />
              </div>
              <div className="absolute overflow-hidden bg-beige shadow-[0_18px_42px_rgba(var(--rgb-brown),0.1)] left-0 bottom-0 z-2 w-1/2 aspect-square max-sm:w-[55%]">
                <Image
                  className="object-cover object-[center_56%]"
                  src={collaborationImages[1]?.image ?? fallbackCollaborationImages[1]!.image}
                  alt={collaborationImages[1]?.alt ?? fallbackCollaborationImages[1]!.alt}
                  fill
                  sizes="(max-width: 640px) 34vw, 14vw"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-[clamp(40px,6vw,76px)] bg-cream">
        <Container>
          <div className="grid grid-cols-3 gap-[clamp(14px,2vw,22px)] max-lg:grid-cols-2 max-sm:grid-cols-1">
            {featureItems.map(({ text, icon: Icon }) => (
              <article
                className="flex items-start gap-5 min-h-0 py-[clamp(16px,2.4vw,24px)]"
                key={text}
              >
                <Icon
                  className="w-9 h-9 flex-none text-red"
                  aria-hidden="true"
                  strokeWidth={1.7}
                />
                <p className="m-0 text-text-primary text-[clamp(15px,1.1vw,17px)] leading-[1.35] font-extrabold max-w-[18ch]">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
