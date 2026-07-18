import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  Cake,
  ChefHat,
  CircleEllipsis,
  ClipboardList,
  ConciergeBell,
  CookingPot,
  Flame,
  Gem,
  HandPlatter,
  Handshake,
  Landmark,
  Lightbulb,
  PartyPopper,
  Presentation,
  Users,
} from "lucide-react";
import { CateringInquiryForm } from "@/components/CateringInquiryForm";
import { CateringMenuButton } from "@/components/CateringMenuOverlay";
import { HorizontalGallery } from "@/components/HorizontalGallery";
import {
  Button,
  Container,
  FAQInlinePrompt,
  SectionLabel,
} from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/catering");

const galleryImages = [
  "/images/catering/catering-long-buffet.png",
  "/images/catering/catering-gallery-new-20.png",
  "/images/catering/catering-membership-table.png",
  "/images/catering/catering-gallery-new-31.png",
  "/images/catering/catering-gallery-added-03.png",
  "/images/catering/catering-gallery-new-01.png",
  "/images/catering/catering-buffet-table.png",
  "/images/catering/catering-gallery-new-23.png",
  "/images/catering/catering-gallery-added-17.png",
  "/images/catering/catering-gallery-new-13.png",
  "/images/catering/catering-welcome-drinks.png",
  "/images/catering/catering-gallery-new-07.png",
  "/images/catering/catering-gallery-added-06.png",
  "/images/catering/catering-gallery-new-29.png",
  "/images/catering/catering-ukrainian-spread.png",
  "/images/catering/catering-gallery-new-02.png",
  "/images/catering/catering-gallery-added-01.png",
  "/images/catering/catering-gallery-new-14.png",
  "/images/catering/catering-dumplings.png",
  "/images/catering/catering-gallery-new-21.png",
  "/images/catering/catering-gallery-added-16.png",
  "/images/catering/catering-gallery-new-32.png",
  "/images/catering/catering-modern-plates.png",
  "/images/catering/catering-gallery-new-04.png",
  "/images/catering/catering-gallery-added-08.png",
  "/images/catering/catering-gallery-new-24.png",
  "/images/catering/catering-dessert-flowers.png",
  "/images/catering/catering-gallery-new-10.png",
  "/images/catering/catering-gallery-added-13.png",
  "/images/catering/catering-gallery-new-27.png",
  "/images/catering/catering-board.png",
  "/images/catering/catering-gallery-new-03.png",
  "/images/catering/catering-gallery-added-04.png",
  "/images/catering/catering-gallery-new-15.png",
  "/images/catering/catering-charcuterie.png",
  "/images/catering/catering-gallery-new-25.png",
  "/images/catering/catering-gallery-added-18.png",
  "/images/catering/catering-gallery-new-08.png",
  "/images/catering/catering-borsch.png",
  "/images/catering/catering-gallery-new-33.png",
  "/images/catering/catering-gallery-added-12.png",
  "/images/catering/catering-gallery-new-11.png",
  "/images/catering/catering-dessert-table.png",
  "/images/catering/catering-gallery-new-28.png",
  "/images/catering/catering-gallery-added-15.png",
  "/images/catering/catering-gallery-new-05.png",
  "/images/catering/catering-cake.png",
  "/images/catering/catering-gallery-new-16.png",
  "/images/catering/catering-gallery-added-02.png",
  "/images/catering/catering-gallery-new-30.png",
  "/images/catering/catering-gallery-added-05.png",
  "/images/catering/catering-gallery-new-09.png",
  "/images/catering/catering-gallery-added-07.png",
  "/images/catering/catering-gallery-new-22.png",
  "/images/catering/catering-gallery-added-09.png",
  "/images/catering/catering-gallery-new-34.png",
  "/images/catering/catering-gallery-added-10.png",
  "/images/catering/catering-gallery-new-12.png",
  "/images/catering/catering-gallery-added-11.png",
  "/images/catering/catering-gallery-new-26.png",
  "/images/catering/catering-gallery-added-14.png",
  "/images/catering/catering-gallery-new-06.png",
  "/images/catering/catering-gallery-new-17.png",
  "/images/catering/catering-gallery-new-18.png",
  "/images/catering/catering-gallery-new-19.png",
  "/images/catering/catering-gallery-new-35.png",
];

const menuFormats = [
  {
    title: "Private dinner menu",
    description:
      "A seated dinner with seasonal starters, main courses, sides, and desserts.",
    image: "/images/catering/european-private-dinner-menu.png",
    alt: "Private dinner table with modern European dishes and wine",
  },
  {
    title: "Reception-style menu",
    description: "Elegant light dishes, small bites, and shareable plates.",
    image: "/images/catering/european-reception-style-menu.png",
    alt: "Reception-style buffet with small bites and shared plates",
  },
  {
    title: "Business meeting menu",
    description:
      "Balanced, easy-to-serve dishes suitable for workshops, presentations, and longer meetings.",
    image: "/images/catering/european-business-meeting-menu.png",
    alt: "Business meeting catering buffet with wraps, salad, fruit, water and coffee",
  },
];

const formats = [
  {
    title: "Ukrainian cuisine",
    text: "Traditional Ukrainian cuisine in harmony with modern European gastronomy, created with attention to taste, presentation and detail.",
    icon: ChefHat,
  },
  {
    title: "Finger food & buffet",
    text: "Elegant small bites, light buffet solutions and beautifully served dishes for receptions, celebrations and business events.",
    icon: HandPlatter,
  },
  {
    title: "Individual menu",
    text: "Each menu is tailored to your event format, number of guests, preferences and desired atmosphere.",
    icon: ClipboardList,
  },
  {
    title: "On-site cooking",
    text: "If needed, we can organize cooking directly at your location for a fresh, seamless and memorable experience.",
    icon: CookingPot,
  },
  {
    title: "Full event support",
    text: "Our professional team can support the event with preparation, serving and attentive service throughout the occasion.",
    icon: ConciergeBell,
  },
  {
    title: "Grill parties",
    text: "Lively grill experiences for warm, informal gatherings where food, conversation and atmosphere come together.",
    icon: Flame,
  },
];

const suitableFor = [
  ["Host at RORUM", CalendarCheck],
  ["Workshops", Presentation],
  ["Community events", Handshake],
  ["Creative sessions", Lightbulb],
  ["Founder sessions", BriefcaseBusiness],
  ["Birthdays", Cake],
  ["Weddings", Gem],
  ["Diplomatic meetings", Landmark],
  ["Business meetings", Building2],
  ["Conferences", Users],
  ["External events", PartyPopper],
  ["And more", CircleEllipsis],
];

const steps = [
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

export default function CateringPage() {
  return (
    <>
      <section className="service-hero catering-hero">
        <Container>
          <div className="catering-hero-layout">
            <div className="service-hero-copy">
              <SectionLabel>Catering</SectionLabel>
              <h1 className="heading">Catering</h1>
              <p>
                Traditional Ukrainian cuisine in harmonious combination with
                modern European gastronomy. We create not just dishes, but an
                atmosphere where taste, aesthetics, and service work together.
              </p>
              <div className="hero-actions catering-hero-actions">
                <CateringMenuButton
                  requestTargetId="catering-inquiry"
                  variant="secondary"
                >
                  Menu examples
                </CateringMenuButton>
                <Button href="#catering-inquiry">
                  Request catering
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

      <section id="catering-gallery" className="catering-gallery-section">
        <Container>
          <HorizontalGallery images={galleryImages} />
          <div className="catering-suitable-tags">
            <p>Suitable for:</p>
            <div
              className="catering-chip-grid"
              aria-label="Suitable catering formats"
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

      <section className="section catering-format-section">
        <Container>
          <div className="catering-format-intro">
            <SectionLabel>Catering</SectionLabel>
            <h2 className="heading section-title">Menu Formats</h2>
          </div>
          <div className="catering-format-grid">
            {menuFormats.map(({ title, description, image, alt }) => (
              <article className="catering-format-card" key={title}>
                <img src={image} alt={alt} loading="lazy" />
                <div className="catering-format-card-copy">
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section catering-offer-section">
        <Container>
          <div className="catering-offer-layout catering-philosophy-grid catering-offer-grid-mirror">
            <div className="catering-offer-media-frame">
              <img
                className="catering-philosophy-image catering-offer-media"
                src="/images/catering/catering-service-team.png"
                alt="RORUM catering team preparing food for an event"
              />
            </div>
            <div className="catering-intro catering-offer-intro-copy">
              <SectionLabel>Catering</SectionLabel>
              <h2 className="heading section-title">What we offer</h2>
              <p className="catering-philosophy-lead">
                Catering shaped around your event, your guests and your
                atmosphere.
              </p>
              <p>
                We create catering for different types of events - from elegant
                finger food and light buffet solutions to full menus for family
                celebrations, corporate events and official occasions. Each menu
                is developed individually, combining authentic Ukrainian recipes
                with a modern European approach, thoughtful presentation and
                attentive service.
              </p>
              <div className="catering-philosophy-list decoration-philosophy-list catering-offer-list">
                {formats.map(({ title, text, icon: Icon }) => (
                  <div className="catering-philosophy-item" key={title}>
                    <span className="decoration-philosophy-icon">
                      <Icon aria-hidden="true" strokeWidth={1.55} />
                    </span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="decoration-tailored-row catering-offer-tailored-row">
            <div className="decoration-tailored-note catering-offer-note">
              <h3>Tailored upon request</h3>
              <p>
                Every catering concept is created individually based on your
                event, location, guest count and wishes.
              </p>
            </div>
            <div className="catering-offer-actions">
              <CateringMenuButton
                requestTargetId="catering-inquiry"
                variant="secondary"
              >
                Menu examples
              </CateringMenuButton>
              <Button href="#catering-inquiry">Request catering</Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="section catering-inquiry-section">
        <Container>
          <div id="catering-inquiry" className="catering-form-wrap">
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
              <FAQInlinePrompt />
            </div>
            <CateringInquiryForm />
          </div>
        </Container>
      </section>
    </>
  );
}
