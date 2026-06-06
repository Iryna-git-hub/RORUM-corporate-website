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

export const metadata = pageMetadata("/space-decoration-event-styling");

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

const suitableFor = [
  ["Private events", CalendarCheck],
  ["Weddings", Gem],
  ["Birthdays", PartyPopper],
  ["Workshops", Lightbulb],
  ["Dinner tables", UtensilsCrossed],
  ["Photo corners", Sparkles],
  ["Seasonal moments", Flower2],
  ["And more", CircleEllipsis],
];

const steps = [
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

      <section
        id="decoration-gallery"
        className="catering-gallery-section decoration-gallery-section"
      >
        <Container>
          <HorizontalGallery images={galleryImages} />
          <div className="catering-suitable-tags">
            <p>Suitable for:</p>
            <div
              className="catering-chip-grid"
              aria-label="Suitable decoration formats"
            >
              {suitableFor.map(([item, Icon]) => (
                <span key={item}>
                  <Icon aria-hidden="true" strokeWidth={1.8} />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Section tight>
        <Container>
          <div className="catering-philosophy-grid decoration-philosophy-grid">
            <div className="catering-intro">
              <SectionLabel>Decoration</SectionLabel>
              <h2 className="heading section-title">What we style</h2>
              <p className="catering-philosophy-lead">
                We create decoration concepts that bring warmth, beauty and
                personality to your event.
              </p>
              <p>
                Our styling can include table settings, seasonal flowers,
                candles, balloon accents, textiles, decorative objects, photo
                moments and personal details. Each element is selected to work
                together as one cohesive atmosphere.
              </p>
              <div className="catering-philosophy-list decoration-philosophy-list">
                {decorationFormats.map(({ title, text, icon: Icon }) => (
                  <div className="catering-philosophy-item" key={title}>
                    <span className="decoration-philosophy-icon">
                      <Icon aria-hidden="true" strokeWidth={1.75} />
                    </span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <img
              className="catering-philosophy-image decoration-philosophy-image"
              src="/images/decoration/decoration-entrance-arch.png"
              alt=""
            />
          </div>
          <div className="decoration-tailored-row">
            <div className="decoration-tailored-note">
              <h3>Tailored upon request</h3>
              <p>
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
            <FAQInlinePrompt />
          </div>
        </Container>
      </Section>

      <section className="section catering-inquiry-section">
        <Container>
          <div id="decoration-inquiry" className="catering-form-wrap">
            <div className="catering-form-aside">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="heading section-title">3-step setup</h2>
              <div className="catering-steps">
                {steps.map(([title, text], index) => (
                  <article className="catering-step" key={title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </article>
                ))}
              </div>
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
