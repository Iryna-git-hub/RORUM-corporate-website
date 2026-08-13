import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { HorizontalGallery } from "@/components/HorizontalGallery";
import { InquiryForm } from "@/components/InquiryForm";
import {
  Button,
  Container,
  FAQInlinePrompt,
  Section,
  SectionLabel,
} from "@/components/ui";
import { localizedPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/sanity-i18n";
import { getIconCardIcon } from "@/lib/iconCardIcons";
import { eventDecorationGalleryImages } from "@/lib/galleryImages";
import { resolveGalleryImages } from "@/lib/sanityGallery";
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/live";
import { eventDecorationPageQuery } from "@/sanity/queries/pages";
import { galleryCollectionQuery } from "@/sanity/queries/gallery";

const fallbackFormats: { title: string; text: string; icon: string }[] = [
  { title: "Table styling", text: "Elegant table setups with flowers, candles, place details and carefully selected visual accents.", icon: "UtensilsCrossed" },
  { title: "Florals", text: "Seasonal floral arrangements designed around your event mood, space and color palette.", icon: "Flower" },
  { title: "Balloon accents", text: "Soft and elegant balloon decor for entrances, celebration corners, photo zones and backdrops.", icon: "Balloon" },
  { title: "Atmosphere details", text: "Candles, textures, fabrics, signs and decorative objects that make the space feel warm and complete.", icon: "Flame" },
  { title: "Personal touches", text: "Custom details for birthdays, weddings, dinners, workshops, private celebrations and meaningful moments.", icon: "BadgeCheck" },
];

const fallbackSuitableFor: [label: string, icon: string][] = [
  ["Private events", "CalendarCheck"],
  ["Weddings", "Gem"],
  ["Birthdays", "PartyPopper"],
  ["Workshops", "Lightbulb"],
  ["Dinner tables", "UtensilsCrossed"],
  ["Photo corners", "Sparkles"],
  ["Seasonal moments", "Flower2"],
  ["And more", "CircleEllipsis"],
];

const fallbackSteps: [title: string, text: string][] = [
  ["Share the occasion", "Tell us about the event format, date, guests and atmosphere you want."],
  ["We suggest the visual direction", "We match decoration details to the room, table and rhythm of the event."],
  ["We prepare the setup", "The decorative layer is arranged with care before guests arrive."],
];

const fallback = {
  label: "Event decoration",
  title: "Event decoration",
  text: "Flowers, table styling, candles, balloon decor and visual details for warm, memorable events at RORUM or selected external locations.",
  requestCta: "Request decoration",
  stylingTitle: "What we style",
  stylingIntro: [
    "We create decoration concepts that bring warmth, beauty and personality to your event.",
    "Our styling can include table settings, seasonal flowers, candles, balloon accents, textiles, decorative objects, photo moments and personal details. Each element is selected to work together as one cohesive atmosphere.",
  ],
  suitableForLabel: "Suitable for:",
  tailoredTitle: "Tailored upon request",
  tailoredText: "We create each setup individually according to your event format, location and wishes.",
  stepsTitle: "3-step setup",
  inquiryIntro: "Tell us what you are planning and we will suggest the right visual setup for your event.",
  description: "Thoughtful table settings, florals and atmosphere styling for RORUM events.",
  inquiryTitle: "Decoration request",
  inquirySubmitLabel: "Send request",
  messagePlaceholder: "Describe your event, location and desired visual setup.",
  successMessage: "Thank you. Your request is ready for the RORUM team.",
};

async function getData(locale: Locale) {
  if (!isSanityConfigured) {
    return {
      ...fallback,
      formats: fallbackFormats.map((f) => ({ title: f.title, text: f.text, Icon: getIconCardIcon(f.icon) })),
      suitableFor: fallbackSuitableFor.map(([label, icon]) => ({ label, Icon: getIconCardIcon(icon) })),
      steps: fallbackSteps.map(([title, text], i) => ({ number: String(i + 1).padStart(2, "0"), title, text })),
      galleryImages: eventDecorationGalleryImages,
    };
  }

  const [{ data: page }, { data: galleryDoc }] = await Promise.all([
    sanityFetch({ query: eventDecorationPageQuery }),
    sanityFetch({ query: galleryCollectionQuery, params: { key: "event-decoration" } }),
  ]);

  const galleryImages = resolveGalleryImages(galleryDoc, locale, eventDecorationGalleryImages);

  const stylingIntro = page?.stylingIntro?.length
    ? page.stylingIntro.map((p) => pickLocalized(p?.text, locale)).filter((v): v is NonNullable<typeof v> => v != null)
    : fallback.stylingIntro;

  const formats = page?.formats?.length
    ? page.formats.map((f) => ({
        title: pickLocalized(f?.title, locale) ?? "",
        text: pickLocalized(f?.text, locale) ?? "",
        Icon: getIconCardIcon(f?.icon),
      }))
    : fallbackFormats.map((f) => ({ title: f.title, text: f.text, Icon: getIconCardIcon(f.icon) }));

  const suitableFor = page?.suitableFor?.length
    ? page.suitableFor.map((s) => ({ label: pickLocalized(s?.title, locale) ?? "", Icon: getIconCardIcon(s?.icon) }))
    : fallbackSuitableFor.map(([label, icon]) => ({ label, Icon: getIconCardIcon(icon) }));

  const steps = page?.steps?.length
    ? page.steps.map((s, i) => ({
        number: String(i + 1).padStart(2, "0"),
        title: pickLocalized(s?.title, locale) ?? "",
        text: pickLocalized(s?.text, locale) ?? "",
      }))
    : fallbackSteps.map(([title, text], i) => ({ number: String(i + 1).padStart(2, "0"), title, text }));

  return {
    label: pickLocalized(page?.hero?.label, locale) ?? fallback.label,
    title: pickLocalized(page?.hero?.title, locale) ?? fallback.title,
    text: pickLocalized(page?.hero?.text, locale) ?? fallback.text,
    requestCta: pickLocalized(page?.hero?.primaryCta?.label, locale) ?? fallback.requestCta,
    stylingTitle: pickLocalized(page?.stylingTitle, locale) ?? fallback.stylingTitle,
    stylingIntro,
    suitableForLabel: pickLocalized(page?.suitableForLabel, locale) ?? fallback.suitableForLabel,
    tailoredTitle: pickLocalized(page?.tailoredNote?.title, locale) ?? fallback.tailoredTitle,
    tailoredText: pickLocalized(page?.tailoredNote?.text, locale) ?? fallback.tailoredText,
    stepsTitle: pickLocalized(page?.stepsTitle, locale) ?? fallback.stepsTitle,
    inquiryIntro: pickLocalized(page?.inquiryIntro, locale) ?? fallback.inquiryIntro,
    description: pickLocalized(page?.seo?.description, locale) ?? fallback.description,
    inquiryTitle: pickLocalized(page?.inquiryTitle, locale) ?? fallback.inquiryTitle,
    inquirySubmitLabel: pickLocalized(page?.inquirySubmitLabel, locale) ?? fallback.inquirySubmitLabel,
    messagePlaceholder: pickLocalized(page?.messagePlaceholder, locale) ?? fallback.messagePlaceholder,
    successMessage: pickLocalized(page?.successMessage, locale) ?? fallback.successMessage,
    formats,
    suitableFor,
    steps,
    galleryImages,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const { description } = await getData(locale);
  return localizedPageMetadata({ path: "/event-decoration", locale, title: "Space Decoration", description });
}

export default async function DecorationPage({ params }: { params: Promise<{ locale: string }> }) {
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
                  href="#decoration-inquiry"
                  className="min-h-10! px-6.5! max-sm:flex-auto"
                >
                  {data.requestCta}
                  <ArrowRight
                    className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="decoration-gallery" className="catering-gallery-section">
        <Container>
          <HorizontalGallery images={data.galleryImages} />
          <div className="grid gap-2.5 mt-[clamp(18px,3vw,28px)]">
            <p className="m-0 text-text-primary text-[15px] font-black">
              {data.suitableForLabel}
            </p>
            <div
              className="flex flex-wrap gap-2.5"
              aria-label="Suitable decoration formats"
            >
              {data.suitableFor.map(({ label, Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 min-h-[38px] px-[13px] bg-[rgba(var(--rgb-beige),0.5)] text-red text-[13.5px] font-[850]"
                >
                  <Icon
                    className="w-4 h-4 text-red"
                    aria-hidden="true"
                    strokeWidth={1.8}
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Section tight>
        <Container>
          <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(320px,0.8fr)] gap-[clamp(28px,5vw,68px)] items-start max-lg:grid-cols-1">
            <div className="grid gap-4 max-w-[820px]">
              <SectionLabel>Decoration</SectionLabel>
              <h2 className="font-heading font-medium text-text-primary m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-[1.25] tracking-[0] normal-case">
                {data.stylingTitle}
              </h2>
              {data.stylingIntro.map((paragraph) => (
                <p key={paragraph} className="max-w-[48ch] m-0 text-text-primary text-[18px] leading-[1.75]">
                  {paragraph}
                </p>
              ))}
              <div className="grid gap-0 mt-2 border-t border-[rgba(var(--rgb-beige),0.64)]">
                {data.formats.map(({ title, text, Icon }) => (
                  <div
                    className="grid grid-cols-[54px_minmax(0,1fr)] gap-[18px] items-start py-[18px] border-b border-[rgba(var(--rgb-beige),0.64)]"
                    key={title}
                  >
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[rgba(var(--rgb-red),0.1)] text-red">
                      <Icon
                        className="w-[22px] h-[22px]"
                        aria-hidden="true"
                        strokeWidth={1.75}
                      />
                    </span>
                    <div>
                      <h3 className="mb-1 text-text-primary font-body text-[clamp(16px,1.2vw,18px)] leading-[1.25] font-black">
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
            <img
              className="block w-full h-[min(560px,48vw)] min-h-[360px] object-cover object-center shadow-[0_18px_40px_rgba(var(--rgb-brown),0.08)] self-start lg:sticky lg:top-24 max-sm:h-[280px] max-sm:min-h-[280px]"
              src="/images/decoration/decoration-entrance-arch.png"
              alt=""
            />
          </div>
          <div className="decoration-tailored-row">
            <div className="grid gap-[6px]">
              <h3 className="m-0 text-red font-body text-[13px] font-black tracking-[0.06em] uppercase">
                {data.tailoredTitle}
              </h3>
              <p className="m-0 text-text-primary text-[15px] leading-[1.6]">
                {data.tailoredText}
              </p>
            </div>
            <Button href="#decoration-inquiry">
              {data.requestCta}
              <ArrowRight
                className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                aria-hidden="true"
                strokeWidth={1.9}
              />
            </Button>
          </div>
        </Container>
      </Section>

      <section className="py-[clamp(52px,8vw,104px)] bg-light-green text-cream">
        <Container>
          <div
            id="decoration-inquiry"
            className="grid grid-cols-[minmax(260px,0.62fr)_minmax(0,1fr)] gap-24 items-start scroll-mt-24 max-lg:grid-cols-1"
          >
            <div className="grid gap-8 pt-2">
              <SectionLabel className="text-gold! border-b-gold!">How it works</SectionLabel>
              <h2 className="font-heading font-medium text-white m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-[1.25] tracking-[0] normal-case">
                {data.stepsTitle}
              </h2>
              <div className="grid gap-3">
                {data.steps.map(({ number, title, text }) => (
                  <article
                    className="grid grid-cols-[42px_minmax(0,1fr)] gap-3.5 items-start py-[18px] border-t border-[rgba(var(--rgb-cream),0.34)] last:border-b last:border-[rgba(var(--rgb-cream),0.34)]"
                    key={title}
                  >
                    <span className="inline-block text-gold text-[13px] font-black leading-[1.2] tracking-[0.06em]">
                      {number}
                    </span>
                    <div>
                      <h3 className="mb-1 text-white font-body text-[clamp(16px,1.2vw,18px)] leading-[1.25] font-black">
                        {title}
                      </h3>
                      <p className="text-[rgba(var(--rgb-cream),0.88)] text-[15px] leading-[1.55]">
                        {text}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
              <FAQInlinePrompt
                questionClassName="text-[rgba(var(--rgb-cream),0.88)]!"
                linkClassName="text-gold!"
              />
            </div>
            <InquiryForm
              type="decoration"
              title={data.inquiryTitle}
              intro={data.inquiryIntro}
              submitLabel={data.inquirySubmitLabel}
              successMessage={data.successMessage}
              messagePlaceholder={data.messagePlaceholder}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
