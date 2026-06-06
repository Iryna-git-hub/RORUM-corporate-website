import Image from "next/image";
import { FileText, Handshake, Lightbulb, MessageCircle } from "lucide-react";
import { CvUploadButton } from "@/components/CvUploadModal";
import { Container, FAQInlinePrompt, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/work-with-us");

const alignmentLabels = ["CV", "Story", "Connection"];

const possibilityCards = [
  "Maybe it leads to a collaboration.",
  "Maybe to a role.",
  "Or maybe to a connection that brings something unexpected.",
];

export default function WorkWithUsPage() {
  return (
    <>
      <section className="work-hero">
        <Container>
          <div className="work-hero-grid">
            <div className="work-hero-copy">
              <SectionLabel>Community</SectionLabel>
              <h1 className="heading">Work with us</h1>
              <div className="work-hero-text">
                <p>At RORUM, work often begins with a connection.</p>
                <p>
                  A conversation at an event.
                  <br />
                  A shared idea.
                  <br />A person you meet at the right moment.
                </p>
              </div>
              <CvUploadButton>Send your CV</CvUploadButton>
            </div>
            <div className="work-hero-media">
              <Image
                src="/images/space/space-2.png"
                alt="Warm RORUM space for conversation and creative collaboration"
                fill
                priority
                sizes="(max-width: 980px) 100vw, 50vw"
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="section-tight work-statement-section">
        <Container>
          <div className="work-statement">
            <p>
              We believe that opportunities grow through people — and sometimes
              the right environment can open doors you didn’t even know existed.
            </p>
          </div>
        </Container>
      </section>

      <section className="section work-alignment-section">
        <Container>
          <div className="work-alignment-grid">
            <div className="work-alignment-copy">
              <p>
                If you feel aligned with what we create, you can send us your CV
                and tell us a bit about yourself.
              </p>
            </div>
            <aside
              className="work-alignment-card"
              aria-label="CV story connection"
            >
              {alignmentLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </aside>
          </div>
        </Container>
      </section>

      <section className="section work-possibility-section">
        <Container>
          <div className="work-possibility-grid">
            {possibilityCards.map((text, index) => {
              const icons = [Handshake, FileText, Lightbulb];
              const Icon = icons[index];
              return (
                <article className="work-possibility-card" key={text}>
                  <Icon aria-hidden="true" strokeWidth={1.7} />
                  <p>{text}</p>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="section-tight work-start-section">
        <Container>
          <p>Either way — it starts here.</p>
        </Container>
      </section>

      <section className="section work-final-section">
        <Container>
          <div className="work-final-panel">
            <div>
              <p>👉 Send us your CV and let’s stay connected</p>
              <CvUploadButton>Send your CV</CvUploadButton>{" "}
              <FAQInlinePrompt
                question="Questions before reaching out?"
                label="Read FAQ"
              />{" "}
            </div>
            <MessageCircle aria-hidden="true" strokeWidth={1.2} />
          </div>
        </Container>
      </section>
    </>
  );
}
