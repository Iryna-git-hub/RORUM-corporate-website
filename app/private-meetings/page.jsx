import { InquiryForm } from "@/components/InquiryForm";
import { PackageGrid } from "@/components/Cards";
import { HorizontalGallery } from "@/components/HorizontalGallery";
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

export const metadata = pageMetadata("/private-meetings");

export default function PrivateMeetingsPage() {
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
  const includedItems = [
    ["Private use of the space", DoorOpen],
    ["Coffee, tea and water", Coffee],
    ["On-site support and hosting", HandHeart],
    ["Simple and thoughtful interior setup", LampFloor],
  ];
  const basicsSetupItems = [
    ["Screen", Monitor],
    ["Wi-Fi", Wifi],
    ["Tables and chairs", Armchair],
  ];
  const optionalItems = [
    ["Catering", ChefHat],
    ["Customized food options", SlidersHorizontal],
  ];
  const meetingSetupSteps = [
    [
      "Share your meeting plan",
      "Tell us the format, guest count, timing and what kind of atmosphere you need.",
    ],
    [
      "We prepare the room",
      "We align tables, chairs, screen, Wi-Fi and simple hosting details before you arrive.",
    ],
    [
      "Arrive and focus",
      "The space is ready for your meeting, workshop or private session with on-site support.",
    ],
  ];
  return (
    <>
      <section className="book-space-hero private-meetings-hero">
        <Container>
          <div className="book-space-hero-copy">
            <SectionLabel>Private meetings</SectionLabel>
            <h1 className="heading">Meetings &amp; private events</h1>
            <p>
              RORUM is a small, curated space in central Copenhagen, designed
              for meetings, workshops, and private events for up to 12 guests.
              Ideal for small teams, founders, and curated gatherings.
            </p>
            <p>
              We offer a calm and well-organized setting, with support before
              and during your event.
            </p>
            <div className="hero-actions private-meetings-hero-actions">
              <Button href="#request-private-meeting">
                Request private meeting
                <ArrowRight
                  className="button-arrow"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </Button>
              <Button href="#meeting-packages" variant="secondary">
                View meeting packages
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
          <div className="meeting-session-layout">
            <div
              className="meeting-session-media"
              role="img"
              aria-label="Private meeting room setup at RORUM"
              style={{ backgroundImage: `url(${sessionDetailsImage})` }}
            />
            <div className="meeting-session-content">
              <SectionHeader
                label="Session details"
                title="Each session includes:"
                level={3}
              />
              <div className="meeting-session-included-list">
                <div className="meeting-session-included-col">
                  {includedItems.map(([item, Icon]) => (
                    <div className="meeting-session-item" key={item}>
                      <Icon aria-hidden="true" strokeWidth={1.8} />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
                <div className="meeting-session-included-col">
                  {basicsSetupItems.map(([item, Icon]) => (
                    <div className="meeting-session-item" key={item}>
                      <Icon aria-hidden="true" strokeWidth={1.8} />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="meeting-session-optional-group">
                <h3 className="meeting-session-optional-title">Optional</h3>
                <div className="meeting-session-optional-list">
                  {optionalItems.map(([item, Icon]) => (
                    <div
                      className="meeting-session-item meeting-session-item-optional"
                      key={item}
                    >
                      <Icon aria-hidden="true" strokeWidth={1.8} />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="meeting-session-cta">
                <Button href="#request-private-meeting">
                  Request private meeting
                  <ArrowRight
                    className="button-arrow"
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                </Button>
                <Button href="#meeting-packages" variant="secondary">
                  View meeting packages
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
          <SectionHeader label="Packages" title="Meeting packages" level={3} />
          <PackageGrid
            items={packages.booking}
            ctaHref="#request-private-meeting"
            ctaLabel="Select package"
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
            <div className="private-meeting-request-copy">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="heading section-title">3-step setup</h2>
              <div
                className="catering-steps"
                aria-label="Private meeting request process"
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
              title="Private meeting request"
              submitLabel="Send request"
            />
          </div>
        </Container>
      </section>
    </>
  );
}
