import Link from "next/link";
import {
  CalendarCheck,
  CalendarPlus,
  ChefHat,
  HandHeart,
  Handshake,
  Users,
  WandSparkles,
} from "lucide-react";
import { Container, CTASection, Section, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/about");

const principles: [number: string, title: string, text: string][] = [
  [
    "01",
    "Calm first",
    "The space should help guests arrive, settle and understand where they are.",
  ],
  [
    "02",
    "Useful hospitality",
    "Coffee, water, food, layout and timing are treated as part of the experience.",
  ],
  [
    "03",
    "Flexible but not blank",
    "Tables, seating, screen, Wi-Fi and styling options give hosts a clear starting point.",
  ],
  [
    "04",
    "Personal without noise",
    "The space has character, but leaves enough space for each format to feel like its own.",
  ],
];

const introLinks = [
  { href: "/host-at-rorum", label: "Host at RORUM", icon: CalendarPlus },
  { href: "/events", label: "Attend Events", icon: CalendarCheck },
];

const serviceLinks = [
  { href: "/catering", label: "Catering", icon: ChefHat },
  {
    href: "/event-decoration",
    label: "Event Decoration",
    icon: WandSparkles,
  },
];

const communityLinks = [
  { href: "/community-membership", label: "WECODA membership", icon: Users },
  { href: "/work-with-us", label: "Work with us", icon: Handshake },
  { href: "/volunteer", label: "Volunteer with us", icon: HandHeart },
];

const INLINE_LINK_CLASS =
  "inline-flex items-center gap-2 min-h-10 px-4 border border-white rounded-full bg-white text-dark-green text-[13px] font-black tracking-[0.03em] uppercase transition-[color,background-color,border-color,transform] duration-[180ms] ease-[ease] hover:text-red hover:border-[rgba(var(--rgb-red),0.44)] hover:-translate-y-px focus-visible:text-red focus-visible:border-[rgba(var(--rgb-red),0.44)] focus-visible:-translate-y-px";

const VISUAL_IMG_CLASS =
  "w-full h-full object-cover block shadow-[0_16px_34px_rgba(var(--rgb-brown),0.09)] max-desktop:min-h-[220px] max-tablet:min-h-[210px]";

export default function AboutPage() {
  return (
    <>
      <section className="pt-[65px] pb-[clamp(34px,5vw,58px)] bg-cream text-text-primary max-tablet:pt-[38px]">
        <Container>
          <div className="grid grid-cols-[minmax(0,0.88fr)_minmax(360px,0.86fr)] gap-[clamp(28px,5vw,72px)] items-center max-desktop:grid-cols-1">
            <div className="grid gap-[18px]">
              <SectionLabel>About</SectionLabel>
              <h1 className="font-heading font-medium text-text-primary m-0 max-w-[12ch] text-[3rem] leading-[1.02] tracking-[-0.03em] max-desktop:max-w-[16ch]">
                About RORUM
              </h1>
              <p className="m-0 max-w-[68ch] text-text-primary text-base leading-[1.7] font-medium">
                RORUM is a curated creative and event space in central
                Copenhagen, designed for small teams, founders, facilitators,
                hosts and community-minded guests who want gatherings to feel
                warm, clear and easy to be present in.
              </p>
              <div
                className="flex flex-wrap gap-2.5 mt-1.5"
                aria-label="RORUM event paths"
              >
                {introLinks.map(({ href, label, icon: Icon }) => (
                  <Link className={INLINE_LINK_CLASS} href={href} key={href}>
                    <Icon
                      className="w-4 h-4 text-red"
                      aria-hidden="true"
                      strokeWidth={1.8}
                    />
                    {label}
                  </Link>
                ))}
              </div>
              <div className="grid gap-2.5 mt-2.5 pt-[18px] border-t border-[rgba(var(--rgb-beige),0.72)]">
                <h2 className="m-0 text-text-primary font-body text-[16px] leading-[1.25] font-black uppercase tracking-[0.06em]">
                  Services
                </h2>
                <p className="m-0 max-w-[68ch] text-text-primary font-medium text-[15px] leading-[1.65]">
                  Our catering and decoration services are available off-site
                  and can be brought to your chosen location.
                </p>
                <div
                  className="flex flex-wrap gap-2.5 mt-1.5"
                  aria-label="RORUM service paths"
                >
                  {serviceLinks.map(({ href, label, icon: Icon }) => (
                    <Link className={INLINE_LINK_CLASS} href={href} key={href}>
                      <Icon
                        className="w-4 h-4 text-red"
                        aria-hidden="true"
                        strokeWidth={1.8}
                      />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="grid gap-2.5 mt-2.5 pt-[18px] border-t border-[rgba(var(--rgb-beige),0.72)]">
                <h2 className="m-0 text-text-primary font-body text-[16px] leading-[1.25] font-black uppercase tracking-[0.06em]">
                  Community
                </h2>
                <p className="m-0 max-w-[68ch] text-text-primary font-medium text-[15px] leading-[1.65]">
                  RORUM is also shaped by members, collaborators and people who
                  want to support thoughtful local gatherings.
                </p>
                <div
                  className="flex flex-wrap gap-2.5 mt-0"
                  aria-label="Community paths"
                >
                  {communityLinks.map(({ href, label, icon: Icon }) => (
                    <Link className={INLINE_LINK_CLASS} href={href} key={href}>
                      <Icon
                        className="w-4 h-4 text-red"
                        aria-hidden="true"
                        strokeWidth={1.8}
                      />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] grid-rows-[repeat(2,minmax(170px,1fr))] gap-3 min-h-[clamp(380px,43vw,560px)] max-desktop:min-h-auto max-desktop:grid-rows-[auto] max-tablet:grid-cols-1"
              aria-label="RORUM atmosphere"
            >
              <img
                className={`${VISUAL_IMG_CLASS} row-span-2 max-tablet:[grid-row:auto]`}
                src="/images/about/about-room-borscht.png"
                alt="Ukrainian borscht with pampushky prepared for a RORUM gathering"
              />
              <img
                className={VISUAL_IMG_CLASS}
                src="/images/space/space-about-room.png"
                alt="Warm RORUM room prepared for a meeting"
              />
              <img
                className={VISUAL_IMG_CLASS}
                src="/images/decoration/decoration-floral-table.png"
                alt="Decorated table with flowers and place settings"
              />
            </div>
          </div>
        </Container>
      </section>

      <Section tight>
        <Container>
          <div className="grid grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] gap-[clamp(28px,5vw,72px)] items-start max-desktop:grid-cols-1">
            <div className="grid gap-3.5 sticky top-[108px] max-desktop:static">
              <SectionLabel>Experience principles</SectionLabel>
              <h2 className="font-heading font-medium text-text-primary m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-[1.25] tracking-[0] normal-case">
                Thoughtful and practical
              </h2>
              <p className="m-0 text-text-primary text-[clamp(16px,1.2vw,18px)] leading-[1.75]">
                These principles shape the way RORUM approaches meetings, hosted
                events, catering, decoration and community collaborations.
              </p>
            </div>
            <div className="grid border-t border-[rgba(var(--rgb-beige),0.7)]">
              {principles.map(([number, title, text]) => (
                <div
                  className="grid grid-cols-[54px_minmax(0,1fr)] gap-[18px] py-5 border-b border-[rgba(var(--rgb-beige),0.7)]"
                  key={number}
                >
                  <span className="text-gold text-[20px] font-semibold leading-[1.2]">
                    {number}
                  </span>
                  <div>
                    <h3 className="mb-[5px] text-text-primary font-body text-[clamp(16px,1.2vw,18px)] leading-[1.25] font-black">
                      {title}
                    </h3>
                    <p className="text-text-primary text-[15px] leading-[1.55]">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        variant="final"
        className="next-step-section-not-sure"
        eyebrow="NOT SURE WHERE TO START?"
        title="Let's shape your idea together"
        text="Whether you are planning a workshop, private session, community gathering, catering request or event styling idea — tell us what you have in mind, and we'll help you find the right format."
        href="/contact"
        label="Let's talk"
        faqQuestion="Have questions?"
        faqLabel="Read our FAQs"
        links={[
          { href: "/events", label: "Attend Events" },
          { href: "/host-at-rorum", label: "Host at RORUM" },
          { href: "/catering", label: "Catering" },
          {
            href: "/event-decoration",
            label: "Event decoration",
          },
        ]}
      />
    </>
  );
}
