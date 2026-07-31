import {
  ArrowRight,
  Balloon,
  BadgeCheck,
  CircleEllipsis,
  Flame,
  Flower,
  Flower2,
  Gem,
  CalendarCheck,
  Lightbulb,
  PartyPopper,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { HorizontalGallery } from "@/components/HorizontalGallery";
import { InquiryForm } from "@/components/InquiryForm";
import {
  Button,
  Container,
  FAQInlinePrompt,
  Section,
  SectionLabel,
} from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/event-decoration");

const galleryImages = [
  "/images/decoration/decoration-balloon-wall.png",
  "/images/decoration/decoration-garden-pergola-dinner.png",
  "/images/decoration/decoration-long-table.png",
  "/images/decoration/decoration-modern-dining-natural-light.png",
  "/images/decoration/decoration-balloon-closeup.png",
  "/images/decoration/decoration-candlelight-dinner-table.png",
  "/images/decoration/decoration-cake-table.png",
  "/images/decoration/decoration-garden-reception-dusk.png",
  "/images/decoration/decoration-floral-table.png",
  "/images/decoration/decoration-elegant-banquet-daylight.png",
  "/images/decoration/decoration-place-setting.png",
  "/images/decoration/decoration-modern-lounge-floral-accents.png",
  "/images/decoration/decoration-contrast-floral-table.png",
  "/images/decoration/decoration-entrance-arch.png",
];

const decorationFormats = [
  {
    title: "Table styling",
    text: "Elegant table setups with flowers, candles, place details and carefully selected visual accents.",
    icon: UtensilsCrossed,
  },
  {
    title: "Florals",
    text: "Seasonal floral arrangements designed around your event mood, space and color palette.",
    icon: Flower,
  },
  {
    title: "Balloon accents",
    text: "Soft and elegant balloon decor for entrances, celebration corners, photo zones and backdrops.",
    icon: Balloon,
  },
  {
    title: "Atmosphere details",
    text: "Candles, textures, fabrics, signs and decorative objects that make the space feel warm and complete.",
    icon: Flame,
  },
  {
    title: "Personal touches",
    text: "Custom details for birthdays, weddings, dinners, workshops, private celebrations and meaningful moments.",
    icon: BadgeCheck,
  },
];

const suitableFor: [label: string, icon: LucideIcon][] = [
  ["Private events", CalendarCheck],
  ["Weddings", Gem],
  ["Birthdays", PartyPopper],
  ["Workshops", Lightbulb],
  ["Dinner tables", UtensilsCrossed],
  ["Photo corners", Sparkles],
  ["Seasonal moments", Flower2],
  ["And more", CircleEllipsis],
];

const steps: [title: string, text: string][] = [
  [
    "Share the occasion",
    "Tell us about the event format, date, guests and atmosphere you want.",
  ],
  [
    "We suggest the visual direction",
    "We match decoration details to the room, table and rhythm of the event.",
  ],
  [
    "We prepare the setup",
    "The decorative layer is arranged with care before guests arrive.",
  ],
];

export default function DecorationPage() {
  return (
    <>
      {/*
        Hero section: `service-hero`, `decoration-hero`, `catering-hero-layout`,
        `service-hero-copy` and `hero-actions catering-hero-actions` are kept as
        retained (unconverted) classes. They participate in a shared
        `:is(.catering-hero .service-hero-copy, .decoration-hero .service-hero-copy, ...)`
        explicit grid-column/grid-row placement rule (app/globals.css ~3805-3885)
        that also governs private-meetings-hero and the catering menu overlay —
        functionally equivalent to grid-template-areas and not safely
        reproducible from this file alone without touching those other pages.
      */}
      <section className="service-hero decoration-hero">
        <Container>
          <div className="catering-hero-layout">
            <div className="service-hero-copy">
              <SectionLabel>Event decoration</SectionLabel>
              <h1 className="heading">Event decoration</h1>
              <p>
                Flowers, table styling, candles, balloon decor and visual
                details for warm, memorable events at RORUM or selected external
                locations.
              </p>
              <div className="hero-actions catering-hero-actions">
                <Button href="#decoration-inquiry">
                  Request decoration
                  <ArrowRight
                    className="button-arrow"
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/*
        `catering-gallery-section` is retained: it is the ancestor for
        `.catering-gallery-section .horizontal-gallery`,
        `.horizontal-gallery-item` and `.horizontal-gallery-track` overrides
        that reach into the shared HorizontalGallery component's internal
        markup (not in scope here). `decoration-gallery-section` had zero
        matching CSS rules (confirmed via grep) and was dropped as dead CSS.
      */}
      <section id="decoration-gallery" className="catering-gallery-section">
        <Container>
          <HorizontalGallery images={galleryImages} />
          <div className="grid gap-2.5 mt-[clamp(18px,3vw,28px)]">
            <p className="m-0 text-text-primary text-[15px] font-black">
              Suitable for:
            </p>
            <div
              className="flex flex-wrap gap-2.5"
              aria-label="Suitable decoration formats"
            >
              {suitableFor.map(([item, Icon]) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 min-h-[38px] px-[13px] bg-[rgba(var(--rgb-beige),0.5)] text-red text-[13.5px] font-[850]"
                >
                  <Icon
                    className="w-4 h-4 text-red"
                    aria-hidden="true"
                    strokeWidth={1.8}
                  />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Section tight>
        <Container>
          <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(320px,0.8fr)] gap-[clamp(28px,5vw,68px)] items-start max-desktop:grid-cols-1">
            <div className="grid gap-4 max-w-[820px]">
              <SectionLabel>Decoration</SectionLabel>
              <h2 className="font-heading font-medium text-text-primary m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-[1.25] tracking-[0] normal-case">
                What we style
              </h2>
              <p className="max-w-[48ch] m-0 text-text-primary text-[18px] leading-[1.75]">
                We create decoration concepts that bring warmth, beauty and
                personality to your event.
              </p>
              <p className="m-0 text-text-primary text-[18px] leading-[1.75]">
                Our styling can include table settings, seasonal flowers,
                candles, balloon accents, textiles, decorative objects, photo
                moments and personal details. Each element is selected to work
                together as one cohesive atmosphere.
              </p>
              <div className="grid gap-0 mt-2 border-t border-[rgba(var(--rgb-beige),0.64)]">
                {decorationFormats.map(({ title, text, icon: Icon }) => (
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
              className="block w-full h-[min(560px,48vw)] min-h-[360px] object-cover object-center shadow-[0_18px_40px_rgba(var(--rgb-brown),0.08)] self-start desktop:sticky desktop:top-24 max-tablet:h-[280px] max-tablet:min-h-[280px]"
              src="/images/decoration/decoration-entrance-arch.png"
              alt=""
            />
          </div>
          {/*
            `decoration-tailored-row` is retained: it is the ancestor for
            `.decoration-tailored-row .btn` / `.decoration-tailored-row .btn
            .button-arrow` rules that size/position the Button rendered below
            (a shared ui.tsx component whose "btn"/"button-arrow" classes are
            themselves retained there) — not safely reproducible without an
            ancestor class.
          */}
          <div className="decoration-tailored-row">
            <div className="grid gap-[6px]">
              <h3 className="m-0 text-red font-body text-[13px] font-black tracking-[0.06em] uppercase">
                Tailored upon request
              </h3>
              <p className="m-0 text-text-primary text-[15px] leading-[1.6]">
                We create each setup individually according to your event
                format, location and wishes.
              </p>
            </div>
            <Button href="#decoration-inquiry">
              Request decoration
              <ArrowRight
                className="button-arrow"
                aria-hidden="true"
                strokeWidth={1.9}
              />
            </Button>
          </div>
        </Container>
      </Section>

      {/*
        `catering-inquiry-section` is retained: it is the ancestor for
        `.catering-inquiry-section .label` and `.catering-inquiry-section
        .faq-inline-prompt-link` color overrides on the SectionLabel and
        FAQInlinePrompt shared components below, neither of which accepts a
        className/color override prop.
      */}
      <section className="py-[clamp(52px,8vw,104px)] catering-inquiry-section">
        <Container>
          <div
            id="decoration-inquiry"
            className="grid grid-cols-[minmax(260px,0.62fr)_minmax(0,1fr)] gap-24 items-start scroll-mt-24 max-desktop:grid-cols-1"
          >
            <div className="grid gap-8 pt-2">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="font-heading font-medium text-white m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-[1.25] tracking-[0] normal-case">
                3-step setup
              </h2>
              <div className="grid gap-3">
                {steps.map(([title, text], index) => (
                  <article
                    className="grid grid-cols-[42px_minmax(0,1fr)] gap-3.5 items-start py-[18px] border-t border-[rgba(var(--rgb-cream),0.34)] last:border-b last:border-[rgba(var(--rgb-cream),0.34)]"
                    key={title}
                  >
                    <span className="inline-block text-gold text-[13px] font-black leading-[1.2] tracking-[0.06em]">
                      {String(index + 1).padStart(2, "0")}
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
              <FAQInlinePrompt />
            </div>
            <InquiryForm
              type="decoration"
              title="Decoration request"
              intro="Tell us what you are planning and we will suggest the right visual setup for your event."
              submitLabel="Send request"
            />
          </div>
        </Container>
      </section>
    </>
  );
}
