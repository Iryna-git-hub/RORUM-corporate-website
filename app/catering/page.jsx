import { Coffee, Flower2, HandPlatter, Leaf, Sandwich, Sparkles, Users } from "lucide-react";
import { CateringInquiryForm } from "@/components/CateringInquiryForm";
import { HorizontalGallery } from "@/components/HorizontalGallery";
import { Button, Container, Section, SectionHeader, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/catering");

const galleryImages = [
  "/images/catering/catering-1.png",
  "/images/catering/catering-2.png",
  "/images/events/private-meetings.png",
  "/images/events/meeting.png",
  "/images/decoration/decoration-1.png",
  "/images/decoration/decoration-2.png",
  "/images/events/host-event-workshop-quickpath.png",
  "/images/hero.jpg"
];

const formats = [
  {
    title: "Coffee setup",
    text: "Coffee, tea and a simple refreshment moment for shorter sessions, meetings and workshops.",
    icon: Coffee
  },
  {
    title: "Light morning catering",
    text: "A gentle start with pastries, juice and simple seasonal additions.",
    icon: Leaf
  },
  {
    title: "Snacks and fruit",
    text: "Fresh, easy refreshments that keep the energy of the room balanced.",
    icon: Sparkles
  },
  {
    title: "Lunch options",
    text: "Simple lunch and snack options for full-day sessions, private meetings and professional events.",
    icon: Sandwich
  },
  {
    title: "Custom catering",
    text: "A tailored food setup for private celebrations, cultural events, diplomatic gatherings or larger external events.",
    icon: HandPlatter
  }
];

const suitableFor = [
  "Private meetings",
  "Workshops",
  "Community events",
  "Creative sessions",
  "Founder sessions",
  "Birthdays",
  "Weddings",
  "Diplomatic meetings",
  "Business meetings",
  "Conferences",
  "External events"
];

const steps = [
  ["Tell us about your event", "Share the date, location, guest count and format."],
  ["We suggest the right setup", "We help match the catering format to the rhythm and atmosphere of your event."],
  ["We prepare the experience", "Food and presentation are arranged with care so your guests feel welcomed."]
];

export default function CateringPage() {
  return (
    <>
      <section className="service-hero catering-hero">
        <Container>
          <div className="service-hero-grid service-hero-grid-text-only">
            <div className="service-hero-copy">
              <SectionLabel>CATERING</SectionLabel>
              <h1 className="heading">Thoughtful catering for meaningful gatherings</h1>
              <p>Simple, fresh and welcoming food options for private, cultural and professional events — at RORUM or selected external locations in Copenhagen.</p>
              <div className="hero-actions">
                <Button href="#catering-inquiry">Request Catering</Button>
                <Button href="#catering-gallery" variant="secondary">View Gallery</Button>
              </div>
              <p className="service-hero-microcopy">Available on request</p>
            </div>
          </div>
        </Container>
      </section>

      <section id="catering-gallery" className="catering-gallery-section">
        <Container>
          <HorizontalGallery images={galleryImages}/>
        </Container>
      </section>

      <Section tight>
        <Container>
          <div className="catering-intro">
            <SectionLabel>Food philosophy</SectionLabel>
            <h2 className="heading section-title">Food that supports the rhythm of the room</h2>
            <p>Catering is part of the atmosphere — a way to help people arrive, pause, connect and feel cared for. We focus on simple, thoughtful food moments that support the flow of your gathering without overwhelming it.</p>
          </div>
        </Container>
      </Section>

      <Section tight>
        <Container>
          <SectionHeader label="Formats" title="Choose the right catering format" text="From a simple coffee setup to a custom food experience, catering can be shaped around your event format."/>
          <div className="catering-format-grid">
            {formats.map(({ title, text, icon: Icon }) => (
              <article className="catering-format-card" key={title}>
                <Icon aria-hidden="true" strokeWidth={1.8}/>
                <h3>{title}</h3>
                <p>{text}</p>
                <span>Available on request</span>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section tight>
        <Container>
          <div className="suitable-section">
            <div>
              <SectionLabel>Suitable for</SectionLabel>
              <h2 className="heading section-title">Suitable for RORUM and external events</h2>
              <p>Catering can be requested for events at RORUM or for selected external gatherings in Copenhagen.</p>
            </div>
            <div className="catering-chip-grid">
              {suitableFor.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
        </Container>
      </Section>

      <Section tight>
        <Container>
          <SectionHeader label="How it works" title="How catering works"/>
          <div className="catering-steps">
            {steps.map(([title, text], index) => (
              <article className="catering-step" key={title}>
                <span>{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div id="catering-inquiry" className="catering-form-wrap">
            <div className="catering-form-aside">
              <SectionLabel>Inquiry</SectionLabel>
              <h2 className="heading section-title">Request catering</h2>
              <p>Tell us a little about your event and we&apos;ll get back to you with a suitable catering option.</p>
              <div className="catering-aside-note">
                <Users aria-hidden="true" strokeWidth={1.8}/>
                <span>For gatherings at RORUM and selected external locations in Copenhagen.</span>
              </div>
              <div className="catering-aside-note">
                <Flower2 aria-hidden="true" strokeWidth={1.8}/>
                <span>Food, presentation and atmosphere can be shaped together.</span>
              </div>
            </div>
            <CateringInquiryForm/>
          </div>
        </Container>
      </Section>
    </>
  );
}
