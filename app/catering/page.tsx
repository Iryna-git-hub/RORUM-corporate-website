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
  type LucideIcon,
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

const suitableFor: [label: string, icon: LucideIcon][] = [
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

const steps: [title: string, text: string][] = [
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
      <section className="bg-secondary px-0 pt-16.25 pb-0 max-sm:pt-9.5 lg:grid lg:items-center lg:min-h-auto">
        <Container>
          <div className="grid grid-cols-1 gap-[clamp(28px,5vw,72px)] items-end lg:items-center">
            <div className="grid gap-4.5 lg:grid-cols-2 lg:gap-x-[clamp(40px,6vw,80px)] lg:gap-y-[clamp(12px,1.5vw,18px)] lg:items-start">
              <SectionLabel className="lg:col-start-1 lg:row-start-1">
                Catering
              </SectionLabel>
              <h1 className="font-heading font-medium text-text-primary m-0 text-[3rem] leading-[1.02] tracking-normal normal-case [@media(min-width:1024px)_and_(max-height:820px)]:text-[clamp(2.55rem,4.2vw,3rem)] lg:col-start-1 lg:row-start-2">
                Catering
              </h1>
              <p className="m-0 text-text-primary text-base leading-[1.7] [@media(min-width:1024px)_and_(max-height:820px)]:max-w-[88ch] [@media(min-width:1024px)_and_(max-height:820px)]:leading-[1.55] lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-end">
                Traditional Ukrainian cuisine in harmonious combination with
                modern European gastronomy. We create not just dishes, but an
                atmosphere where taste, aesthetics, and service work together.
              </p>
              <div className="flex flex-wrap items-center gap-3 max-lg:mt-4.5 max-sm:justify-center max-sm:w-full lg:col-start-1 lg:row-start-3 lg:justify-self-start lg:w-fit lg:mt-[clamp(6px,1vw,12px)]">
                <Button
                  href="#catering-inquiry"
                  className="min-h-10! px-6.5! max-sm:flex-auto"
                >
                  Request catering
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
                >
                  Menu examples
                </CateringMenuButton>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="catering-gallery" className="catering-gallery-section">
        <Container>
          <HorizontalGallery images={galleryImages} />
          <div className="grid gap-2.5 mt-[clamp(18px,3vw,28px)]">
            <p className="m-0 text-text-primary text-[15px] font-black">
              Suitable for:
            </p>
            <div
              className="flex flex-wrap gap-2.5"
              aria-label="Suitable catering formats"
            >
              {suitableFor.map(([item, Icon]) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 min-h-9.5 px-3.25 rounded-none bg-[rgba(var(--rgb-beige),0.5)] border-0 text-red text-[13.5px] font-[850]"
                >
                  <Icon
                    aria-hidden="true"
                    strokeWidth={1.8}
                    className="w-4 h-4 text-red"
                  />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="section bg-white">
        <Container>
          <div className="grid justify-items-center gap-3 mb-[clamp(30px,6vw,54px)] text-center">
            <SectionLabel>Catering</SectionLabel>
            <h2 className="font-heading font-medium text-text-primary m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-tight tracking-normal normal-case">
              Menu Formats
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-[clamp(30px,4vw,48px)] gap-x-[clamp(22px,3vw,36px)]">
            {menuFormats.map(({ title, description, image, alt }) => (
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
                src="/images/catering/catering-service-team.png"
                alt="RORUM catering team preparing food for an event"
              />
            </div>
            <div className="grid gap-4 max-w-205">
              <SectionLabel>Catering</SectionLabel>
              <h2 className="font-heading font-medium text-text-primary m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-tight tracking-normal normal-case">
                What we offer
              </h2>
              <p className="max-w-[48ch] m-0 text-text-primary text-[clamp(17px,1.4vw,20px)] leading-[1.65]">
                Catering shaped around your event, your guests and your
                atmosphere.
              </p>
              <p className="m-0 text-text-primary text-[18px] leading-[1.75]">
                We create catering for different types of events - from elegant
                finger food and light buffet solutions to full menus for family
                celebrations, corporate events and official occasions. Each menu
                is developed individually, combining authentic Ukrainian recipes
                with a modern European approach, thoughtful presentation and
                attentive service.
              </p>
              <div className="grid gap-0 mt-2 border-t border-t-[rgba(var(--rgb-beige),0.64)]">
                {formats.map(({ title, text, icon: Icon }) => (
                  <div
                    className="grid grid-cols-[54px_minmax(0,1fr)] gap-4.5 items-start py-4.5 border-b border-b-[rgba(var(--rgb-beige),0.64)]"
                    key={title}
                  >
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[rgba(var(--rgb-red),0.1)] text-red">
                      <Icon aria-hidden="true" strokeWidth={1.55} className="w-5.5 h-5.5" />
                    </span>
                    <div>
                      <h3 className="mb-1 text-text-primary font-body text-[clamp(16px,1.2vw,18px)] leading-tight font-black">
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
              <h3>Tailored upon request</h3>
              <p>
                Every catering concept is created individually based on your
                event, location, guest count and wishes.
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-3 mt-0 max-sm:justify-center">
              <Button href="#catering-inquiry">Request catering</Button>
              <CateringMenuButton
                requestTargetId="catering-inquiry"
                variant="secondary"
              >
                Menu examples
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
          <div id="catering-inquiry" className="grid grid-cols-[minmax(260px,0.62fr)_minmax(0,1fr)] gap-24 items-start scroll-mt-24 max-lg:grid-cols-1">
            <div className="grid gap-8 pt-2">
              <SectionLabel className="text-gold! border-b-gold!">How it works</SectionLabel>
              <h2 className="font-heading font-medium text-white! m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-tight tracking-normal normal-case">
                3-step setup
              </h2>
              <div className="grid gap-3">
                {steps.map(([title, text], index) => (
                  <article
                    className="grid grid-cols-[42px_minmax(0,1fr)] gap-3.5 items-start py-4.5 bg-transparent border-t border-t-[rgba(var(--rgb-cream),0.34)] rounded-none last:border-b last:border-b-[rgba(var(--rgb-cream),0.34)]"
                    key={title}
                  >
                    <span className="inline-block w-auto h-auto rounded-none bg-transparent p-0 text-gold text-[13px] font-black leading-tight tracking-[0.06em]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="mb-1 text-white font-body text-[clamp(16px,1.2vw,18px)] leading-tight font-black">
                        {title}
                      </h3>
                      <p className="m-0 text-[rgba(var(--rgb-cream),0.88)] text-[15px] leading-[1.55]">
                        {text}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
              <FAQInlinePrompt linkClassName="text-gold!" />
            </div>
            <CateringInquiryForm />
          </div>
        </Container>
      </section>
    </>
  );
}
