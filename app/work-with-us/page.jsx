import Image from "next/image";
import { ArrowRight, DoorOpen, Handshake, Users } from "lucide-react";
import { CvUploadButton } from "@/components/CvUploadModal";
import { Container, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/work-with-us");

const featureItems = [
  {
    text: "Opportunities grow through people",
    icon: Users,
  },
  {
    text: "The right environment opens new doors",
    icon: DoorOpen,
  },
  {
    text: "Let’s create something meaningful together",
    icon: Handshake,
  },
];

export default function WorkWithUsPage() {
  return (
    <>
      <section className="work-hero">
        <Container>
          <div className="work-hero-grid">
            <div className="work-hero-copy">
              <SectionLabel>Work with us</SectionLabel>
              <h1 className="heading">Work with us</h1>
              <div className="work-hero-text">
                <p>At RORUM, work often begins with a connection.</p>
                <p>
                  A conversation at an event.
                  <br />
                  A shared idea.
                  <br />A person you meet at the right moment.
                </p>
                <p>
                  We believe that opportunities grow through people — and
                  sometimes the right environment can open doors you didn’t even
                  know existed.
                </p>
                <p>
                  If you feel aligned with what we create, you can send us your
                  CV and tell us a bit about yourself.
                </p>
                <p>
                  Maybe it leads to a collaboration.
                  <br />
                  Maybe to a role.
                  <br />
                  Or maybe to a connection that brings something unexpected.
                </p>
                <p>Either way — it starts here.</p>
              </div>
              <CvUploadButton className="btn work-hero-cta">
                <span>Send your CV</span>
                <ArrowRight
                  className="button-arrow"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </CvUploadButton>
            </div>
            <div className="work-hero-media">
              <div className="work-hero-image-main">
                <Image
                  src="/images/space/space-2.png"
                  alt="Warm RORUM space for conversation and creative collaboration"
                  fill
                  priority
                  sizes="(max-width: 980px) 100vw, 50vw"
                />
              </div>
              <div className="work-hero-image-overlay">
                <Image
                  src="/images/space/space-about-room.png"
                  alt="Quiet RORUM room detail"
                  fill
                  sizes="(max-width: 640px) 34vw, 14vw"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-tight work-feature-section">
        <Container>
          <div className="work-feature-grid">
            {featureItems.map(({ text, icon: Icon }) => (
              <article className="work-feature-item" key={text}>
                <Icon aria-hidden="true" strokeWidth={1.7} />
                <p>{text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

    </>
  );
}
