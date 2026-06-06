import Image from "next/image";
import { Coffee, HandHeart, Sparkles, Users, Wand2 } from "lucide-react";
import { Container, FAQInlinePrompt, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/volunteer");

const participationCards = [
  { label: "Welcoming guests", icon: Users },
  { label: "Supporting a workshop", icon: HandHeart },
  { label: "Shaping the atmosphere", icon: Sparkles },
];

const gainCards = [
  { label: "Gain experience", icon: Wand2 },
  { label: "Meet inspiring people", icon: Coffee },
  { label: "Join an international creative community", icon: HandHeart },
];

export default function VolunteerPage() {
  return (
    <>
      <section className="volunteer-hero">
        <Container>
          <div className="volunteer-hero-grid">
            <div className="volunteer-hero-copy">
              <SectionLabel>Community</SectionLabel>
              <h1 className="heading">Volunteer at RORUM</h1>
              <div className="volunteer-hero-text">
                <p>
                  It often starts with something simple — a conversation, a
                  shared idea, a moment that brings people together.
                </p>
                <p>
                  At RORUM, these moments turn into experiences.
                  <br />
                  And experiences turn into community.
                </p>
              </div>
              <a className="btn" href="#volunteer-apply">
                Apply to volunteer
              </a>
            </div>
            <div className="volunteer-hero-media">
              <Image
                src="/images/events/meeting.png"
                alt="Warm community gathering at RORUM"
                fill
                priority
                sizes="(max-width: 980px) 100vw, 50vw"
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="section-tight volunteer-story-section">
        <Container>
          <div className="volunteer-story">
            <p>Volunteering here is more than helping at events.</p>
            <p>
              It’s becoming part of a space where people create, connect, and
              grow side by side.
            </p>
          </div>
        </Container>
      </section>

      <section className="section volunteer-participation-section">
        <Container>
          <div className="volunteer-section-intro">
            <p>
              You might be welcoming guests, supporting a workshop, or simply
              helping shape the atmosphere — but along the way, you become part
              of something real.
            </p>
          </div>
          <div className="volunteer-card-grid">
            {participationCards.map(({ label, icon: Icon }) => (
              <article className="volunteer-card" key={label}>
                <Icon aria-hidden="true" strokeWidth={1.7} />
                <h2>{label}</h2>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section volunteer-atmosphere-section">
        <Container>
          <div className="volunteer-atmosphere">
            <p>A place where people know each other.</p>
            <p>Support each other.</p>
            <p>Build something together.</p>
          </div>
        </Container>
      </section>

      <section className="section volunteer-gain-section">
        <Container>
          <div className="volunteer-section-intro">
            <p>
              In return, you gain experience, meet inspiring people, and become
              part of an international creative community in the heart of
              Copenhagen.
            </p>
          </div>
          <div className="volunteer-card-grid">
            {gainCards.map(({ label, icon: Icon }) => (
              <article
                className="volunteer-card volunteer-card-light"
                key={label}
              >
                <Icon aria-hidden="true" strokeWidth={1.7} />
                <h2>{label}</h2>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section-tight volunteer-belonging-section">
        <Container>
          <p>
            If you feel a spark reading this — it probably means you belong
            here.
          </p>
        </Container>
      </section>

      <section id="volunteer-apply" className="section volunteer-final-section">
        <Container>
          <div className="volunteer-final-panel">
            <p>👉 Apply to volunteer and join RORUM</p>
            <a className="btn" href="#volunteer-apply">
              Apply to volunteer
            </a>
            <FAQInlinePrompt
              question="Questions about volunteering at RORUM?"
              label="Read FAQ"
            />
          </div>
        </Container>
      </section>
    </>
  );
}
