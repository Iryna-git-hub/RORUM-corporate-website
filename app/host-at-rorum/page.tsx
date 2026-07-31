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
      <section className="book-space-hero private-meetings-hero">
        <Container>
          <div className="book-space-hero-copy">
            <SectionLabel>Host at RORUM</SectionLabel>
            <h1 className="heading">Host Your Gathering at RORUM</h1>
            <div className="private-meetings-hero-text">
              <p>
                RORUM is a small, curated space in central Copenhagen, designed
                for meetings, workshops, and private events for up to 12 guests.
              </p>
              <p>
                Ideal for small teams, founders, and curated gatherings. We
                offer a calm and well-organized setting, with support before and
                during your event.
              </p>
            </div>
            <div className="hero-actions private-meetings-hero-actions">
              <Button href="#request-private-meeting">
                Apply to Host
                <ArrowRight
                  className="button-arrow"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </Button>
              <Button href="#meeting-packages" variant="secondary">
                View Packages &amp; Pricing
                <ArrowRight
                  className="button-arrow"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </Button>
            </div>
          </div>
          <HorizontalGallery images={galleryImages} />
        </Container>
      </section>
      <section className="section meeting-includes-section">
        <Container>
          <div className="grid grid-cols-2 max-desktop:grid-cols-1 gap-0 items-stretch min-h-[clamp(560px,50vw,720px)] max-desktop:min-h-auto">
            <div
              className="w-full min-w-0 min-h-full bg-beige bg-center bg-cover bg-no-repeat max-desktop:min-h-[320px] max-tablet:min-h-[clamp(280px,56vw,360px)]"
              role="img"
              aria-label="Hosted meeting room setup at RORUM"
              style={{ backgroundImage: `url(${sessionDetailsImage})` }}
            />
            <div className="meeting-session-content">
              <SectionHeader
                label="Session details"
                title="Each session includes:"
                level={3}
              />
              <div className="grid grid-cols-2 max-tablet:grid-cols-1 gap-y-[clamp(10px,1.5vw,14px)] gap-x-[clamp(16px,2vw,24px)]">
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
                <div className="grid grid-cols-2 max-tablet:grid-cols-1 gap-y-[clamp(10px,1.5vw,14px)] gap-x-[clamp(16px,2vw,24px)]">
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
              <div className="meeting-session-cta">
                <Button href="#request-private-meeting">
                  Apply to Host
                  <ArrowRight
                    className="button-arrow"
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                </Button>
                <Button href="#meeting-packages" variant="secondary">
                  View Packages &amp; Pricing
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
        id="meeting-packages"
        className="section-tight private-meeting-packages-section"
      >
        <Container>
          <SectionHeader label="Packages" title="Hosting Packages" level={3} />
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
          <div className="meeting-cancellation-policy">
            <p className="meeting-cancellation-title">Cancellation policy:</p>
            <ul>
              <li>Free cancellation up to 5 working days before</li>
              <li>50% charge if cancelled within 24 hours before the event</li>
              <li>100% charge if cancelled less than 24 hours before</li>
            </ul>
          </div>
        </Container>
      </section>
      <section className="section form-section">
        <Container>
          <div
            id="request-private-meeting"
            className="split private-meeting-request"
          >
            <div className="grid gap-8 max-w-[48ch]">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="heading section-title">3-step setup</h2>
              <div
                className="catering-steps"
                aria-label="Host at RORUM request process"
              >
                {meetingSetupSteps.map(([title, text], index) => (
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
