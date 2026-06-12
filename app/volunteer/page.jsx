import Image from "next/image";
import { ArrowRight, HandHeart, Rocket, Users } from "lucide-react";
import { Container, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/volunteer");

const highlightStatements = [
  { text: "A place where people know each other.", icon: Users },
  { text: "Support each other.", icon: HandHeart },
  { text: "Build something together.", icon: Rocket },
];

export default function VolunteerPage() {
  return (
    <div className="volunteer-page-main">
      <section className="volunteer-hero">
        <Container>
          <div className="volunteer-hero-grid">
            <div className="volunteer-hero-copy">
              <SectionLabel>Volunteer with us</SectionLabel>
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
                <p>
                  Volunteering here is more than helping at events.
                  <br />
                  It’s becoming part of a space where people create, connect,
                  and grow side by side.
                </p>
                <p>
                  You might be welcoming guests, supporting a workshop, or
                  simply helping shape the atmosphere — but along the way, you
                  become part of something real.
                </p>
              </div>
              <div className="volunteer-highlight-block">
                {highlightStatements.map(({ text, icon: Icon }) => (
                  <div className="volunteer-highlight-item" key={text}>
                    <Icon aria-hidden="true" strokeWidth={1.7} />
                    <p>{text}</p>
                  </div>
                ))}
              </div>
              <div className="volunteer-closing-copy">
                <p>
                  In return, you gain experience, meet inspiring people, and
                  become part of an international creative community in the
                  heart of Copenhagen.
                </p>
                <p>
                  If you feel a spark reading this — it probably means you
                  belong here.
                </p>
                <p>Apply to volunteer and join RORUM.</p>
              </div>
              <a id="volunteer-apply" className="btn" href="#volunteer-apply">
                <span>Apply to volunteer</span>
                <ArrowRight
                  className="button-arrow"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </a>
            </div>
            <div className="volunteer-hero-media">
              <Image
                src="/images/events/volunteer-with-us.png"
                alt="RORUM volunteers welcoming guests and preparing a gathering"
                fill
                priority
                sizes="(max-width: 980px) 100vw, 50vw"
              />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
