import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { CateringInquiryForm } from "@/components/CateringInquiryForm";
import {
  CateringMenuButton,
  type CateringMenuOverlayText,
} from "@/components/CateringMenuOverlay";
import { HorizontalGallery } from "@/components/HorizontalGallery";
import {
  Button,
  Container,
  FAQInlinePrompt,
  SectionLabel,
} from "@/components/ui";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { compact, pickLocalized } from "@/lib/sanity-i18n";
import { getAction, getItem, getSection, type RawContentItem } from "@/lib/sanity-sections";
import { getIconCardIcon } from "@/lib/iconCardIcons";
import { menuCategories as fallbackMenuCategories } from "@/lib/cateringMenu";
import { cateringGalleryImages } from "@/lib/galleryImages";
import { resolveGalleryItems, resolveCanonicalGalleryItems } from "@/lib/sanityGallery";
import { resolveCateringMenuCategories } from "@/lib/cateringMenuResolve";
import { isSanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { pageByKeyQuery } from "@/sanity/queries/page";
import type { MediaItem } from "@/sanity.types";

const menuFormatImages = [
  {
    image: "/images/catering/european-private-dinner-menu.png",
    alt: "Private dinner table with modern European dishes and wine",
  },
  {
    image: "/images/catering/european-reception-style-menu.png",
    alt: "Reception-style buffet with small bites and shared plates",
  },
  {
    image: "/images/catering/european-business-meeting-menu.png",
    alt: "Business meeting catering buffet with wraps, salad, fruit, water and coffee",
  },
];

const fallbackMenuFormats = [
  {
    title: "Private dinner menu",
    description:
      "A seated dinner with seasonal starters, main courses, sides, and desserts.",
  },
  {
    title: "Reception-style menu",
    description: "Elegant light dishes, small bites, and shareable plates.",
  },
  {
    title: "Business meeting menu",
    description:
      "Balanced, easy-to-serve dishes suitable for workshops, presentations, and longer meetings.",
  },
];

const fallbackFormats: { title: string; text: string; icon: string }[] = [
  {
    title: "Ukrainian cuisine",
    text: "Traditional Ukrainian cuisine in harmony with modern European gastronomy, created with attention to taste, presentation and detail.",
    icon: "ChefHat",
  },
  {
    title: "Finger food & buffet",
    text: "Elegant small bites, light buffet solutions and beautifully served dishes for receptions, celebrations and business events.",
    icon: "HandPlatter",
  },
  {
    title: "Individual menu",
    text: "Each menu is tailored to your event format, number of guests, preferences and desired atmosphere.",
    icon: "ClipboardList",
  },
  {
    title: "On-site cooking",
    text: "If needed, we can organize cooking directly at your location for a fresh, seamless and memorable experience.",
    icon: "CookingPot",
  },
  {
    title: "Full event support",
    text: "Our professional team can support the event with preparation, serving and attentive service throughout the occasion.",
    icon: "ConciergeBell",
  },
  {
    title: "Grill parties",
    text: "Lively grill experiences for warm, informal gatherings where food, conversation and atmosphere come together.",
    icon: "Flame",
  },
];

const fallbackSuitableFor: [label: string, icon: string][] = [
  ["Host at RORUM", "CalendarCheck"],
  ["Workshops", "Presentation"],
  ["Community events", "Handshake"],
  ["Creative sessions", "Lightbulb"],
  ["Founder sessions", "BriefcaseBusiness"],
  ["Birthdays", "Cake"],
  ["Weddings", "Gem"],
  ["Diplomatic meetings", "Landmark"],
  ["Business meetings", "Building2"],
  ["Conferences", "Users"],
  ["External events", "PartyPopper"],
  ["And more", "CircleEllipsis"],
];

const fallbackSteps: [title: string, text: string][] = [
  [
    "Tell us about your event",
    "Share the date, location, guest count and format.",
  ],
  [
    "We suggest the right setup",
    "We help match the catering format to the rhythm and atmosphere of your event.",
  ],
  [
    "We prepare the experience",
    "Food and presentation are arranged with care so your guests feel welcomed.",
  ],
];

const fallback = {
  label: "Catering",
  title: "Catering",
  text: "Traditional Ukrainian cuisine in harmonious combination with modern European gastronomy. We create not just dishes, but an atmosphere where taste, aesthetics, and service work together.",
  requestCta: "Request catering",
  menuExamplesCta: "Menu examples",
  suitableForLabel: "Suitable for:",
  menuFormatsTitle: "Menu Formats",
  philosophyTitle: "What we offer",
  philosophyText:
    "We create catering for different types of events - from elegant finger food and light buffet solutions to full menus for family celebrations, corporate events and official occasions. Each menu is developed individually, combining authentic Ukrainian recipes with a modern European approach, thoughtful presentation and attentive service.",
  philosophyImage: "/images/catering/catering-service-team.png",
  philosophyImageAlt: "RORUM catering team preparing food for an event",
  suitableForAriaLabel: "Suitable catering formats",
  inquiryIntro: "",
  tailoredTitle: "Tailored upon request",
  tailoredText:
    "Every catering concept is created individually based on your event, location, guest count and wishes.",
  stepsTitle: "3-step setup",
  description:
    "Warm Scandinavian catering for workshops, meetings and intimate events.",
  inquiryTitle: "Request catering",
  inquirySubmitLabel: "Request Catering",
  messagePlaceholder: "Describe your event, timing and catering wishes.",
  successMessage:
    "Thank you. We've received your catering request and will contact you soon.",
  footerNote:
    "We'll only use your details to respond to your catering request.",
  seoTitle: "Catering",
};

const fallbackOverlayText: CateringMenuOverlayText = {
  title: "Catering menu",
  intro: [
    "Traditional Ukrainian hospitality, Danish classics, and European-style service for hosted meetings, celebrations, and special gatherings.",
    "Each menu is created individually based on your event format, number of guests, season, and dietary preferences.",
  ],
  requestCta: "Request custom menu",
  featuredDishesLabel: "Featured Dishes",
  disclaimerNote:
    "The dishes shown are examples of what we can offer. We'll be happy to create a menu tailored to your event, preferences, and guests.",
  customMenuTitle: "Create your custom menu",
  customMenuText:
    "Tell us about your event, number of guests, preferred cuisine, and dietary needs. We will help create a menu that fits your occasion and makes your guests feel welcome.",
  backToCateringCta: "Back to Catering",
  emptyStateMessage:
    "No menu examples are available right now — please get in touch and we'll help create a menu for your event.",
};

async function getData(locale: Locale) {
  if (!isSanityConfigured) {
    return {
      ...fallback,
      howItWorksLabel: "How it works",
      menuFormats: fallbackMenuFormats.map((m, i) => ({
        ...m,
        ...menuFormatImages[i],
      })),
      formats: fallbackFormats.map((f) => ({
        title: f.title,
        text: f.text,
        Icon: getIconCardIcon(f.icon),
      })),
      suitableFor: fallbackSuitableFor.map(([label, icon]) => ({
        label,
        Icon: getIconCardIcon(icon),
      })),
      steps: fallbackSteps.map(([title, text], i) => ({
        number: String(i + 1).padStart(2, "0"),
        title,
        text,
      })),
      menuOverlayText: fallbackOverlayText,
      menuCategories: fallbackMenuCategories,
      galleryItems: resolveGalleryItems(undefined, locale, cateringGalleryImages),
    };
  }

  const [{ data: newPage }, { data: newMenuPage }] = await Promise.all([
    sanityFetch({ query: pageByKeyQuery, params: { pageKey: "catering" }, stega: false }),
    sanityFetch({ query: pageByKeyQuery, params: { pageKey: "cateringMenuExamples" }, stega: false }),
  ]);

  // Compact page+sections model (see MIGRATION_REPORT.md) — the sole live
  // Sanity source for Catering; falls through directly to the hardcoded
  // fallback below when a section/field is unset. The legacy `cateringPage`/
  // `cateringMenuExamplesPage` singletons are no longer read here: only a
  // draft of each has ever existed (confirmed via a live, read-only probe),
  // so a published-perspective fetch of either has always returned nothing
  // in production — this removes a dead middle tier, not a behavior change.
  const heroSection = getSection(newPage?.sections, "hero");
  const gallerySection = getSection(newPage?.sections, "gallery");
  const menuFormatsSection = getSection(newPage?.sections, "menuFormats");
  const philosophySection = getSection(newPage?.sections, "philosophy");
  const stepsSection = getSection(newPage?.sections, "steps");
  const formSection = getSection(newPage?.sections, "inquiryForm");
  const bannerSection = getSection(newMenuPage?.sections, "banner");
  const closingSection = getSection(newMenuPage?.sections, "closing");

  // Data-state distinction (applied to every array below, not just menu
  // categories — see the Catering integration report's "stale hardcoded
  // resurrection" fix): a MISSING section (the whole page/section doesn't
  // exist — Sanity unreachable, the document was deleted, or this
  // particular section was never migrated) falls back to hardcoded
  // emergency content, same as every scalar field already does. A section
  // that EXISTS but whose array a manager has intentionally emptied is
  // rendered as genuinely empty — it must never silently resurrect the old
  // hardcoded set. `!isSanityConfigured` is handled entirely by the early
  // return above; everything below only needs to distinguish "section
  // missing" from "section present but empty" — resolveCanonicalGalleryItems
  // (lib/sanityGallery.ts) is the single shared implementation of that
  // policy, also used by Event Decoration and Host at RORUM. Catering has
  // no legacy singleton left to read (confirmed dead in production — see
  // this file's own comment on `newPage`/`newMenuPage` above), so no
  // `legacyMedia` argument is passed.
  const galleryItems = resolveCanonicalGalleryItems(gallerySection as { media?: MediaItem[] } | undefined, locale, cateringGalleryImages);

  // Extracted to lib/cateringMenuResolve.ts so the "document missing (->
  // fallback) vs document exists with zero categories (-> [], never
  // fallback)" distinction is independently unit-tested (all 5 required
  // states: 6/1/0 categories, document missing, Sanity unavailable — the
  // last of which is covered by the earlier `!isSanityConfigured` early
  // return, which never calls this function at all).
  const menuCategories = resolveCateringMenuCategories(newMenuPage, locale, fallbackMenuCategories);

  const menuFormats = !menuFormatsSection
    ? fallbackMenuFormats.map((m, i) => ({ ...m, ...menuFormatImages[i] })) // section missing -> fallback
    : (menuFormatsSection.items ?? []).map((m, i) => ({
        title: pickLocalized(m.title, locale) ?? fallbackMenuFormats[i]?.title ?? "",
        description: pickLocalized(m.text, locale) ?? fallbackMenuFormats[i]?.description ?? "",
        image:
          urlForImage(m.image as unknown as Parameters<typeof urlForImage>[0])
            ?.width(800)
            .url() ?? menuFormatImages[i]?.image ?? menuFormatImages[0]!.image,
        alt: pickLocalized(m.image?.alt, locale) ?? menuFormatImages[i]?.alt ?? menuFormatImages[0]!.alt,
      })); // section present but empty -> [] (respected)

  const formats = !philosophySection
    ? fallbackFormats.map((f) => ({ title: f.title, text: f.text, Icon: getIconCardIcon(f.icon) }))
    : (philosophySection.items ?? [])
        .filter((i) => i.itemKey?.startsWith("format"))
        .map((f) => ({
          title: pickLocalized(f.title, locale) ?? "",
          text: pickLocalized(f.text, locale) ?? "",
          Icon: getIconCardIcon(f.icon ?? undefined),
        }));

  const suitableFor = !gallerySection
    ? fallbackSuitableFor.map(([label, icon]) => ({ label, Icon: getIconCardIcon(icon) }))
    : (gallerySection.items ?? [])
        .filter((i) => i.itemKey?.startsWith("suitableFor"))
        .map((s) => ({
          label: pickLocalized(s.title, locale) ?? "",
          Icon: getIconCardIcon(s.icon ?? undefined),
        }));

  const steps = !stepsSection
    ? fallbackSteps.map(([title, text], i) => ({ number: String(i + 1).padStart(2, "0"), title, text }))
    : (stepsSection.items ?? []).map((s, i) => ({
        number: String(i + 1).padStart(2, "0"),
        title: pickLocalized(s.title, locale) ?? "",
        text: pickLocalized(s.text, locale) ?? "",
      }));

  const philosophyMedia = philosophySection?.media?.[0];
  const tailoredNoteItem = getItem(philosophySection, "tailoredNote");
  const bannerMedia = bannerSection?.media?.[0];
  const introItemsFromSections = (bannerSection?.items ?? []).filter((i): i is RawContentItem => i.itemKey?.startsWith("intro") ?? false);

  return {
    label: pickLocalized(heroSection?.label, locale) ?? fallback.label,
    title: pickLocalized(heroSection?.title, locale) ?? fallback.title,
    text: pickLocalized(heroSection?.text, locale) ?? fallback.text,
    requestCta: pickLocalized(getAction(heroSection, "request")?.label, locale) ?? fallback.requestCta,
    suitableForLabel: pickLocalized(gallerySection?.label, locale) ?? fallback.suitableForLabel,
    menuFormatsTitle: pickLocalized(menuFormatsSection?.title, locale) ?? fallback.menuFormatsTitle,
    philosophyTitle: pickLocalized(philosophySection?.title, locale) ?? fallback.philosophyTitle,
    philosophyText: pickLocalized(philosophySection?.text, locale) ?? fallback.philosophyText,
    tailoredTitle: pickLocalized(tailoredNoteItem?.title, locale) ?? fallback.tailoredTitle,
    tailoredText: pickLocalized(tailoredNoteItem?.text, locale) ?? fallback.tailoredText,
    stepsTitle: pickLocalized(stepsSection?.title, locale) ?? fallback.stepsTitle,
    howItWorksLabel: pickLocalized(stepsSection?.label, locale) ?? "How it works",
    description: pickLocalized(newPage?.seo?.description, locale) ?? fallback.description,
    inquiryTitle: pickLocalized(formSection?.title, locale) ?? fallback.inquiryTitle,
    inquirySubmitLabel: pickLocalized(getItem(formSection, "submitLabel")?.title, locale) ?? fallback.inquirySubmitLabel,
    messagePlaceholder:
      pickLocalized(getItem(formSection, "messagePlaceholder")?.title, locale) ?? fallback.messagePlaceholder,
    successMessage: pickLocalized(getItem(formSection, "successMessage")?.text, locale) ?? fallback.successMessage,
    footerNote: pickLocalized(getItem(formSection, "footerNote")?.title, locale) ?? fallback.footerNote,
    inquiryIntro: pickLocalized(formSection?.text, locale) ?? fallback.inquiryIntro,
    suitableForAriaLabel: pickLocalized(getItem(gallerySection, "ariaLabel")?.title, locale) ?? fallback.suitableForAriaLabel,
    philosophyImage:
      urlForImage(philosophyMedia?.image as unknown as Parameters<typeof urlForImage>[0])
        ?.width(900)
        .url() ?? fallback.philosophyImage,
    philosophyImageAlt: pickLocalized(philosophyMedia?.alt, locale) ?? fallback.philosophyImageAlt,
    menuExamplesCta: pickLocalized(getItem(heroSection, "menuExamplesCta")?.title, locale) ?? fallback.menuExamplesCta,
    menuOverlayText: {
      title: pickLocalized(bannerSection?.title, locale) ?? fallbackOverlayText.title,
      intro: introItemsFromSections.length
        ? compact(introItemsFromSections.map((p) => pickLocalized(p.text, locale)))
        : fallbackOverlayText.intro,
      requestCta: pickLocalized(getItem(bannerSection, "requestCta")?.title, locale) ?? fallbackOverlayText.requestCta,
      featuredDishesLabel:
        pickLocalized(getItem(closingSection, "featuredDishesLabel")?.title, locale) ?? fallbackOverlayText.featuredDishesLabel,
      disclaimerNote:
        pickLocalized(getItem(closingSection, "disclaimerNote")?.text, locale) ?? fallbackOverlayText.disclaimerNote,
      customMenuTitle: pickLocalized(closingSection?.title, locale) ?? fallbackOverlayText.customMenuTitle,
      customMenuText: pickLocalized(closingSection?.text, locale) ?? fallbackOverlayText.customMenuText,
      backToCateringCta:
        pickLocalized(getItem(closingSection, "backToCateringCta")?.title, locale) ?? fallbackOverlayText.backToCateringCta,
      emptyStateMessage:
        pickLocalized(getItem(bannerSection, "emptyStateMessage")?.text, locale) ?? fallbackOverlayText.emptyStateMessage,
    },
    bannerImageUrl: urlForImage(bannerMedia?.image as unknown as Parameters<typeof urlForImage>[0])
      ?.width(1600)
      .url(),
    bannerImageAlt: pickLocalized(bannerMedia?.alt, locale),
    menuCategories,
    menuFormats,
    formats,
    suitableFor,
    steps,
    galleryItems,
    seoTitle: pickLocalized(newPage?.seo?.title, locale) ?? fallback.seoTitle,
    ogImageUrl: urlForImage(newPage?.seo?.ogImage as unknown as Parameters<typeof urlForImage>[0])
      ?.width(1200)
      .url(),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const { seoTitle, description, ogImageUrl } = await getData(locale);
  return localizedPageMetadata({
    path: "/catering",
    locale,
    title: seoTitle,
    description,
    ...(ogImageUrl ? { image: ogImageUrl } : {}),
  });
}

export default async function CateringPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const data = await getData(locale);

  return (
    <>
      <section className="bg-secondary px-0 pt-16.25 pb-0 max-sm:pt-9.5 lg:grid lg:items-center lg:min-h-auto">
        <Container>
          <div className="grid grid-cols-1 gap-[clamp(28px,5vw,72px)] items-end lg:items-center">
            <div className="grid gap-4.5 lg:grid-cols-2 lg:gap-x-[clamp(40px,6vw,80px)] lg:gap-y-[clamp(12px,1.5vw,18px)] lg:items-start">
              <SectionLabel className="lg:col-start-1 lg:row-start-1">
                {data.label}
              </SectionLabel>
              <h1 className="font-heading font-medium text-text-primary m-0 text-[3rem] leading-[1.02] tracking-normal normal-case [@media(min-width:1024px)_and_(max-height:820px)]:text-[clamp(2.55rem,4.2vw,3rem)] lg:col-start-1 lg:row-start-2">
                {data.title}
              </h1>
              <p className="m-0 text-text-primary text-base leading-[1.7] [@media(min-width:1024px)_and_(max-height:820px)]:max-w-[88ch] [@media(min-width:1024px)_and_(max-height:820px)]:leading-[1.55] lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-end">
                {data.text}
              </p>
              <div className="flex flex-wrap items-center gap-3 max-lg:mt-4.5 max-sm:justify-center max-sm:w-full lg:col-start-1 lg:row-start-3 lg:justify-self-start lg:w-fit lg:mt-[clamp(6px,1vw,12px)]">
                <Button
                  href="#catering-inquiry"
                  className="min-h-10! px-6.5! max-sm:flex-auto"
                >
                  {data.requestCta}
                  <ArrowRight
                    className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                </Button>
                <CateringMenuButton
                  requestTargetId="catering-inquiry"
                  variant="secondary"
                  className="min-h-10! px-6.5! max-sm:flex-auto"
                  categories={data.menuCategories}
                  overlayText={data.menuOverlayText}
                  bannerImageUrl={data.bannerImageUrl}
                  bannerImageAlt={data.bannerImageAlt}
                >
                  {data.menuExamplesCta}
                </CateringMenuButton>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="catering-gallery" className="catering-gallery-section">
        <Container>
          <HorizontalGallery items={data.galleryItems} locale={locale} />
          <div className="grid gap-2.5 mt-[clamp(18px,3vw,28px)]">
            <p className="m-0 text-text-primary text-[15px] font-black">
              {data.suitableForLabel}
            </p>
            <div
              className="flex flex-wrap gap-2.5"
              aria-label={data.suitableForAriaLabel}
            >
              {data.suitableFor.map(({ label, Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 min-h-9.5 px-3.25 rounded-none bg-[rgba(var(--rgb-beige),0.5)] border-0 text-red text-[13.5px] font-[800]"
                >
                  <Icon
                    aria-hidden="true"
                    strokeWidth={1.8}
                    className="w-4 h-4 text-red"
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="section bg-white">
        <Container>
          <div className="grid justify-items-center gap-3 mb-[clamp(30px,6vw,54px)] text-center">
            <SectionLabel>{data.label}</SectionLabel>
            <h2 className="font-heading font-medium text-text-primary m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-tight tracking-normal normal-case">
              {data.menuFormatsTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-[clamp(30px,4vw,48px)] gap-x-[clamp(22px,3vw,36px)]">
            {data.menuFormats.map(({ title, description, image, alt }) => (
              <article className="min-w-0" key={title}>
                <img
                  src={image}
                  alt={alt}
                  loading="lazy"
                  className="block w-full aspect-4/3 object-cover"
                />
                <div className="grid gap-2.25 pt-[clamp(16px,2vw,22px)]">
                  <h3 className="m-0 font-heading text-[clamp(20px,1.55vw,24px)] leading-[1.2] lg:whitespace-nowrap">
                    {title}
                  </h3>
                  <p className="m-0 text-[15px] leading-[1.62]">
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section bg-white">
        <Container>
          <div className="grid grid-cols-[minmax(320px,0.8fr)_minmax(0,0.95fr)] gap-[clamp(28px,5vw,72px)] items-start max-lg:grid-cols-1">
            <div className="block w-full h-[min(560px,48vw)] min-h-90 overflow-hidden shadow-[0_18px_40px_rgba(var(--rgb-brown),0.08)] max-lg:-order-1 max-sm:h-auto max-sm:min-h-90 max-sm:aspect-4/3 lg:sticky lg:top-24">
              <img
                className="block w-full h-full min-h-0 object-cover object-center shadow-none"
                src={data.philosophyImage}
                alt={data.philosophyImageAlt}
              />
            </div>
            <div className="grid gap-4 max-w-205">
              <SectionLabel>{data.label}</SectionLabel>
              <h2 className="font-heading font-medium text-text-primary m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-tight tracking-normal normal-case">
                {data.philosophyTitle}
              </h2>
              <p className="m-0 text-text-primary text-[18px] leading-[1.75]">
                {data.philosophyText}
              </p>
              <div className="grid gap-0 mt-2 border-t border-t-[rgba(var(--rgb-beige),0.64)]">
                {data.formats.map(({ title, text, Icon }) => (
                  <div
                    className="grid grid-cols-[54px_minmax(0,1fr)] gap-4.5 items-start py-4.5 border-b border-b-[rgba(var(--rgb-beige),0.64)]"
                    key={title}
                  >
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[rgba(var(--rgb-red),0.1)] text-red">
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.55}
                        className="w-5.5 h-5.5"
                      />
                    </span>
                    <div>
                      <h3 className="mb-1 text-text-primary font-body text-[clamp(16px,1.2vw,18px)] leading-tight font-[800]">
                        {title}
                      </h3>
                      <p className="m-0 text-text-primary text-[15px] leading-[1.55]">
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="decoration-tailored-row">
            <div className="decoration-tailored-note">
              <h3>{data.tailoredTitle}</h3>
              <p>{data.tailoredText}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-3 mt-0 max-sm:justify-center">
              <Button href="#catering-inquiry">{data.requestCta}</Button>
              <CateringMenuButton
                requestTargetId="catering-inquiry"
                variant="secondary"
                categories={data.menuCategories}
                overlayText={data.menuOverlayText}
                bannerImageUrl={data.bannerImageUrl}
                bannerImageAlt={data.bannerImageAlt}
              >
                {data.menuExamplesCta}
              </CateringMenuButton>
            </div>
          </div>
        </Container>
      </section>

      {/* `.catering-inquiry-section`'s bg/label/faq-link-color CSS is kept
          (shared with event-decoration's identical wrapper), but this page
          no longer applies the class itself - equivalent Tailwind/prop
          overrides are used directly below instead. */}
      <section className="section bg-light-green text-cream">
        <Container>
          <div
            id="catering-inquiry"
            className="grid grid-cols-[minmax(260px,0.62fr)_minmax(0,1fr)] gap-24 items-start scroll-mt-24 max-lg:grid-cols-1"
          >
            <div className="grid gap-8 pt-2">
              <SectionLabel className="text-gold! border-b-gold!">
                {data.howItWorksLabel}
              </SectionLabel>
              <h2 className="font-heading font-medium text-white! m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-tight tracking-normal normal-case">
                {data.stepsTitle}
              </h2>
              <div className="grid gap-3">
                {data.steps.map(({ number, title, text }) => (
                  <article
                    className="grid grid-cols-[42px_minmax(0,1fr)] gap-3.5 items-start py-4.5 bg-transparent border-t border-t-[rgba(var(--rgb-cream),0.34)] rounded-none last:border-b last:border-b-[rgba(var(--rgb-cream),0.34)]"
                    key={title}
                  >
                    <span className="inline-block w-auto h-auto rounded-none bg-transparent p-0 text-gold text-[13px] font-black leading-tight tracking-[0.06em]">
                      {number}
                    </span>
                    <div>
                      <h3 className="mb-1 text-white font-body text-[clamp(16px,1.2vw,18px)] leading-tight font-[800]">
                        {title}
                      </h3>
                      <p className="m-0 text-[rgba(var(--rgb-cream),0.88)] text-[15px] leading-[1.55]">
                        {text}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
              <FAQInlinePrompt linkClassName="text-gold!" className="text-[rgba(var(--rgb-cream),0.88)]!" />
            </div>
            <CateringInquiryForm
              title={data.inquiryTitle}
              intro={data.inquiryIntro || undefined}
              successMessage={data.successMessage}
              submitLabel={data.inquirySubmitLabel}
              messagePlaceholder={data.messagePlaceholder}
              footerNote={data.footerNote}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
