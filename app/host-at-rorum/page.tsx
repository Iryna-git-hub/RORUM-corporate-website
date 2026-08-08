import type { LucideIcon } from "lucide-react";
import { InquiryForm } from "@/components/InquiryForm";
import { PackageGrid } from "@/components/Cards";
import { HorizontalGallery } from "@/components/HorizontalGallery";
import Link from "next/link";
import {
  Button,
  Container,
  FAQInlinePrompt,
  SectionHeader,
  SectionLabel,
} from "@/components/ui";
import { packages } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import {
  ArrowRight,
  Armchair,
  ChefHat,
  Coffee,
  DoorOpen,
  HandHeart,
  LampFloor,
  Monitor,
  SlidersHorizontal,
  Wifi,
} from "lucide-react";

export const metadata = pageMetadata("/host-at-rorum");

export default function HostAtRorumPage() {
  const sessionDetailsImage =
    "/images/private-meetings/private-meeting-room-10.png";
  const galleryImages = [
    "/images/private-meetings/private-meeting-room-7.png",
    "/images/private-meetings/private-meeting-people-1.png",
    "/images/private-meetings/private-meeting-room-3.png",
    "/images/private-meetings/private-meeting-room-10.png",
    "/images/private-meetings/private-meeting-people-3.png",
    "/images/private-meetings/private-meeting-room-1.png",
    "/images/private-meetings/private-meeting-room-8.png",
    "/images/private-meetings/private-meeting-room-5.png",
    "/images/private-meetings/private-meeting-people-2.png",
    "/images/private-meetings/private-meeting-room-11.png",
    "/images/private-meetings/private-meeting-room-2.png",
    "/images/private-meetings/private-meeting-room-6.png",
    "/images/private-meetings/private-meeting-room-9.png",
    "/images/private-meetings/private-meeting-room-4.png",
  ];
  const includedItems: [label: string, icon: LucideIcon][] = [
    ["Use of the space", DoorOpen],
    ["Coffee, tea and water", Coffee],
    ["On-site support", HandHeart],
    ["Simple and thoughtful interior setup", LampFloor],
  ];
  const basicsSetupItems: [label: string, icon: LucideIcon][] = [
    ["Screen", Monitor],
    ["Wi-Fi", Wifi],
    ["Tables and chairs", Armchair],
  ];
  const optionalItems: [label: string, icon: LucideIcon][] = [
    ["Catering", ChefHat],
    ["Customized food options", SlidersHorizontal],
  ];
  const meetingSetupSteps: [title: string, text: string][] = [
    [
      "Tell us about your gathering",
      "Tell us the format, guest count, timing and what kind of atmosphere you need.",
    ],
    [
      "We prepare the room",
      "We align tables, chairs, screen, Wi-Fi and simple hosting details before you arrive.",
    ],
    [
      "Arrive and focus",
      "The space is ready for your workshop, gathering, or private session, with on-site support.",
    ],
  ];
  return (
    <>
      {/* `book-space-hero`/`private-meetings-hero` are kept: they're the
          ancestors for the deferred `.book-space-hero .horizontal-gallery`
          (≥1280px full-bleed) and `.private-meetings-hero .horizontal-
          gallery-track` (custom scrollbar) rules that reach into the shared
          HorizontalGallery component's internals - out of scope here. */}
      <section className="book-space-hero private-meetings-hero bg-cream text-text-primary pt-16.25 pb-16.25 px-0 max-sm:pt-9.5 max-sm:pb-9.5">
        <Container>
          <div className="grid gap-3.5 w-[min(1120px,100%)] mb-[clamp(28px,4vw,48px)] lg:grid-cols-2 lg:gap-x-[clamp(40px,6vw,80px)] lg:gap-y-[clamp(12px,1.5vw,18px)] lg:items-start lg:mb-[clamp(34px,5vh,58px)] [@media(min-width:1024px)_and_(max-height:820px)]:mb-[clamp(26px,4vh,38px)]">
            <SectionLabel className="lg:col-start-1 lg:row-start-1">
              Host at RORUM
            </SectionLabel>
            <h1 className="font-heading font-medium text-text-primary m-0 max-w-full text-[3rem] leading-[1.2] tracking-normal normal-case max-sm:text-[clamp(2rem,10vw,2.5rem)] [@media(min-width:1024px)_and_(max-height:820px)]:text-[clamp(2.5rem,4.1vw,3rem)] lg:col-start-1 lg:row-start-2">
              Host Your Gathering at RORUM
            </h1>
            <div className="grid gap-2 max-w-[880px] [@media(min-width:1024px)_and_(max-height:820px)]:max-w-[96ch] [@media(min-width:1024px)_and_(max-height:820px)]:leading-[1.55] lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-end">
              <p className="m-0 text-[16px]">
                RORUM is a small, curated space in central Copenhagen, designed
                for meetings, workshops, and private events for up to 12 guests.
              </p>
              <p className="m-0 text-[16px]">
                Ideal for small teams, founders, and curated gatherings. We
                offer a calm and well-organized setting, with support before and
                during your event.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 max-sm:justify-center max-sm:w-full lg:col-start-1 lg:row-start-3 lg:justify-self-start lg:w-fit lg:mt-[clamp(6px,1vw,12px)]">
              <Button
                href="#request-private-meeting"
                className="whitespace-nowrap min-h-10! px-6.5! max-sm:flex-auto"
              >
                Apply to Host
                <ArrowRight
                  className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </Button>
              <Button
                href="#meeting-packages"
                variant="secondary"
                className="whitespace-nowrap min-h-10! px-6.5! max-sm:flex-auto"
              >
                View Packages &amp; Pricing
                <ArrowRight
                  className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </Button>
            </div>
          </div>
          <HorizontalGallery images={galleryImages} />
        </Container>
      </section>
      {/* `!important` on `p-0`: `.section`'s own deferred, still-unlayered
          `padding: clamp(52px,8vw,104px) 0` would otherwise beat a plain
          Tailwind override regardless of order. */}
      <section className="section bg-white p-0!">
        {/* `!important`: see the matching Container usage in
            HomeEditorialSections.tsx for why. */}
        <Container className="w-full! max-w-none! mx-0!">
          <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-0 items-stretch min-h-[clamp(560px,50vw,720px)] max-lg:min-h-auto">
            <div
              className="w-full min-w-0 min-h-full bg-beige bg-center bg-cover bg-no-repeat max-lg:min-h-[320px] max-sm:min-h-[clamp(280px,56vw,360px)]"
              role="img"
              aria-label="Hosted meeting room setup at RORUM"
              style={{ backgroundImage: `url(${sessionDetailsImage})` }}
            />
            <div className="grid gap-4.5 content-center py-[clamp(56px,8vw,96px)] pr-[max(16px,calc((100vw-1180px)/2))] pl-[clamp(42px,6vw,86px)] min-w-0 *:max-w-140 max-lg:py-11 max-lg:px-[max(16px,calc((100vw-720px)/2))]">
              <SectionHeader
                label="Session details"
                title="Each session includes:"
                level={3}
                className="gap-3! mb-[clamp(12px,1.5vw,20px)]!"
              />
              <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-y-[clamp(10px,1.5vw,14px)] gap-x-[clamp(16px,2vw,24px)]">
                <div className="grid content-start gap-[clamp(10px,1.5vw,14px)]">
                  {includedItems.map(([item, Icon]) => (
                    <div
                      className="grid grid-cols-[38px_minmax(0,1fr)] gap-3 items-start min-w-0"
                      key={item}
                    >
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.8}
                        className="w-7.5 h-7.5 text-red mt-px"
                      />
                      <p className="m-0 text-text-primary text-base leading-[1.45] font-[620]">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid content-start gap-[clamp(10px,1.5vw,14px)]">
                  {basicsSetupItems.map(([item, Icon]) => (
                    <div
                      className="grid grid-cols-[38px_minmax(0,1fr)] gap-3 items-start min-w-0"
                      key={item}
                    >
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.8}
                        className="w-7.5 h-7.5 text-red mt-px"
                      />
                      <p className="m-0 text-text-primary text-base leading-[1.45] font-[620]">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 mt-[clamp(6px,1.2vw,10px)] pt-[clamp(12px,1.6vw,18px)] border-t border-t-[rgba(var(--rgb-beige),0.68)]">
                <h3 className="m-0 font-body text-light-green text-xs leading-[1.2] font-black tracking-[0.08em] uppercase">
                  Optional
                </h3>
                <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-y-[clamp(10px,1.5vw,14px)] gap-x-[clamp(16px,2vw,24px)]">
                  {optionalItems.map(([item, Icon]) => (
                    <div
                      className="grid grid-cols-[38px_minmax(0,1fr)] gap-3 items-start min-w-0"
                      key={item}
                    >
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.8}
                        className="w-7.5 h-7.5 text-light-green mt-px"
                      />
                      <p className="m-0 text-text-primary text-base leading-[1.45] font-[620]">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-auto pt-[clamp(6px,1vw,12px)] max-sm:justify-center max-sm:w-full">
                <Button
                  href="#request-private-meeting"
                  className="whitespace-nowrap max-sm:flex-auto"
                >
                  Apply to Host
                  <ArrowRight
                    className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                </Button>
                <Button
                  href="#meeting-packages"
                  variant="secondary"
                  className="whitespace-nowrap max-sm:flex-auto"
                >
                  View Packages &amp; Pricing
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
      <section id="meeting-packages" className="section-tight bg-red text-white">
        <Container>
          <SectionHeader
            label="Packages"
            title="Hosting Packages"
            level={3}
            className="mb-[clamp(22px,3vw,34px)]!"
            labelClassName="text-[rgba(var(--rgb-cream),0.86)]!"
            titleClassName="text-white!"
          />
          <div className="grid gap-3 max-w-230 mb-[clamp(26px,4vw,40px)] text-[rgba(var(--rgb-cream),0.92)] leading-[1.7]">
            <p>
              <i className="text-[15px] italic">
                Every event has its own atmosphere and unique requirements,
                which is why the packages below are simply <strong className="font-extrabold"><em>examples</em></strong> of our most
                popular formats.
              </i>
            </p>

            <p>
              <strong className="font-extrabold">Looking for something different?</strong>
            </p>
            <p>
              <i className="text-[15px] italic">
                We would be happy to tailor the space and arrangements to your
                needs. Whether you require a different duration, specific days,
                recurring bookings, event support, or a fully customized
                collaboration, we will help you find the best solution.
              </i>
            </p>
            <p>
              <Link
                href="/contact"
                className="font-extrabold underline underline-offset-[3px] transition-colors duration-180 hover:text-white focus-visible:text-white"
              >
                Get in touch
              </Link>{" "}
              with us to discuss your event and receive a personalized
              proposal.
            </p>
          </div>
          <PackageGrid
            items={packages.booking}
            ctaHref="#request-private-meeting"
            ctaLabel="Select Package"
          />
          <div className="grid gap-2.5 max-w-230 mt-[clamp(26px,4vw,44px)] pt-0 border-t-0">
            {/* `.meeting-cancellation-policy p` (descendant, higher
                specificity) wins color/line-height over `.meeting-
                cancellation-title` (single class) in the original CSS -
                font-weight is the only property genuinely unique to the
                title. */}
            <p className="m-0 text-white text-[15px] leading-[1.7] font-black">
              Cancellation policy:
            </p>
            <ul className="grid gap-1.5 m-0 pl-4.5 list-disc text-white text-[15px] leading-[1.55]">
              <li>Free cancellation up to 5 working days before</li>
              <li>50% charge if cancelled within 24 hours before the event</li>
              <li>100% charge if cancelled less than 24 hours before</li>
            </ul>
          </div>
        </Container>
      </section>
      <section className="section bg-light-green text-cream">
        <Container>
          <div
            id="request-private-meeting"
            className="split private-meeting-request"
          >
            <div className="grid gap-8 max-w-[48ch]">
              <SectionLabel className="text-gold! border-b-gold!">How it works</SectionLabel>
              <h2 className="font-heading font-medium text-white m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-tight tracking-normal normal-case">
                3-step setup
              </h2>
              <div
                className="grid gap-3"
                aria-label="Host at RORUM request process"
              >
                {meetingSetupSteps.map(([title, text], index) => (
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
              <FAQInlinePrompt
                questionClassName="text-[rgba(var(--rgb-cream),0.88)]!"
                linkClassName="text-gold!"
              />
            </div>
            <InquiryForm
              type="booking"
              title="Apply to Host at RORUM"
              submitLabel="Submit Hosting Request"
            />
          </div>
        </Container>
      </section>
    </>
  );
}
