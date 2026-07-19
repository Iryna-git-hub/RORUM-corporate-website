import Image from "next/image";
import { ArrowRight, BadgeCheck } from "lucide-react";
import {
  Button,
  Container,
  SectionHeader,
  SectionLabel,
} from "@/components/ui";
import { MembershipBenefitsGrid } from "@/components/MembershipBenefitsGrid";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/community-membership");

const wecodaFormUrl = "https://forms.gle/MpadaPTyL8YCHtAa9";
const wecodaDonationQrSrc =
  "/images/membership-week/wecoda-donation-qr.jpg";

const membershipWeekMedia = [
  {
    type: "image",
    src: "/images/membership-week/members-balloon-arch.png",
    alt: "WECODA members celebrating in the garden by a green and white balloon arch",
    featured: true,
  },
  {
    type: "video",
    src: "/videos/membership-week/members-week-01.mp4",
    label: "Muted video from the WECODA membership gathering",
  },
  {
    type: "image",
    src: "/images/membership-week/members-table-laughing.jpg",
    alt: "WECODA members smiling around a garden table",
  },
  {
    type: "image",
    src: "/images/membership-week/garden-table-catering.png",
    alt: "Catering table prepared for a WECODA member gathering",
  },
  {
    type: "video",
    src: "/videos/membership-week/members-week-02.mp4",
    label: "Muted video of members gathering outdoors",
  },
  {
    type: "image",
    src: "/images/membership-week/members-long-table.jpg",
    alt: "WECODA members seated at a long outdoor table",
  },
  {
    type: "image",
    src: "/images/membership-week/members-group-garden.jpg",
    alt: "Group portrait of WECODA members in the garden",
  },
  {
    type: "image",
    src: "/images/membership-week/members-portrait.png",
    alt: "Two WECODA members smiling at the gathering",
  },
];

const benefits = [
  {
    title: "Event Access",
    text: "Free or discounted participation in WECODA events.",
    icon: "/images/membership-benefits/event-access.png",
  },
  {
    title: "Training and Learning",
    text: "Access to training sessions, educational programmes, and masterclasses.",
    icon: "/images/membership-benefits/training-learning.png",
  },
  {
    title: "International Networking",
    text: "International business networking and new partnerships.",
    icon: "/images/membership-benefits/international-networking.png",
  },
  {
    title: "International Opportunities",
    text: "Participation in international projects, forums, and business missions.",
    icon: "/images/membership-benefits/international-opportunities.png",
  },
  {
    title: "Funding Information",
    text: "Information about grants, accelerator programmes, and funding opportunities.",
    icon: "/images/membership-benefits/funding-information.png",
  },
  {
    title: "Mentoring and Expert Advice",
    text: "Mentoring support and consultations with experts.",
    icon: "/images/membership-benefits/mentoring-advice.png",
  },
  {
    title: "Visibility for Your Work",
    text: "Opportunities to present your business, projects, and professional experience.",
    icon: "/images/membership-benefits/visibility-work.png",
  },
  {
    title: "Diplomatic and Cultural Events",
    text: "Participation in unique WECODA events focused on diplomatic gastronomy and cultural diplomacy.",
    icon: "/images/membership-benefits/diplomatic-cultural-events.png",
  },
  {
    title: "A Supportive Community",
    text: "A community of active women who support one another, exchange experience, and create new opportunities.",
    icon: "/images/membership-benefits/supportive-community.png",
  },
];

const applicationProcess = [
  {
    title: "Submit your application",
    text: "Complete the WECODA membership application form.",
  },
  {
    title: "Pay the annual membership fee",
    text: "The annual membership fee is 250 DKK.",
  },
  {
    title: "Board review",
    text: "The WECODA Board reviews your application and payment.",
  },
  {
    title: "Membership confirmation",
    text: "You will receive confirmation after your membership has been approved.",
  },
];

function MembershipButton({ children, variant = "primary" }) {
  return (
    <Button href={wecodaFormUrl} variant={variant}>
      {children}
      <ArrowRight className="button-arrow" aria-hidden="true" strokeWidth={1.9} />
    </Button>
  );
}

export default function CommunityMembershipPage() {
  return (
    <>
      <section className="wecoda-hero">
        <Container>
          <div className="wecoda-hero-grid">
            <div className="wecoda-hero-copy">
              <SectionLabel>WECODA Community</SectionLabel>
              <h1 className="heading wecoda-hero-title">
                Join a Community That Helps Women Move Forward
              </h1>
              <p className="wecoda-hero-intro">
                Connect with women entrepreneurs, professionals, and
                changemakers. Exchange experience, discover new opportunities,
                and grow with the support of an international community.
              </p>
              <div className="wecoda-hero-actions">
                <MembershipButton>Become a Member</MembershipButton>
                <Button href="#support-wecoda" variant="secondary">
                  Support WECODA
                  <ArrowRight
                    className="button-arrow"
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                </Button>
              </div>
            </div>
            <div className="wecoda-hero-logo-panel">
              <Image
                className="wecoda-hero-logo"
                src="/images/membership-week/wecoda-logo.jpg"
                alt="WECODA Women Entrepreneurs Commerce and Development Association logo"
                width={440}
                height={382}
                priority
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="wecoda-membership-price-strip">
        <Container>
          <div className="membership-price__content">
            <span className="membership-price__icon" aria-hidden="true">
              <BadgeCheck size={23} strokeWidth={2} />
            </span>
            <p className="membership-price__text">
              <span className="membership-price__label">
                Annual membership price:
              </span>{" "}
              <strong className="membership-price__value">250 DKK</strong>
            </p>
          </div>
        </Container>
      </section>

      <section
        id="support-wecoda"
        className="section wecoda-donation-section"
      >
        <Container>
          <div className="wecoda-donation-layout">
            <div className="wecoda-donation-copy">
              <SectionHeader
                label="Donation"
                title="Donate to the WECODA Community"
              />
              <p className="wecoda-donation-text">
                Your support helps WECODA organise educational programmes,
                community events, international collaborations, and new
                opportunities for women.
              </p>
              <p className="wecoda-support-statement">
                RORUM proudly supports WECODA by providing a welcoming space
                for community events, learning, and collaboration.
              </p>
            </div>
            <div className="wecoda-donation-qr">
              <div className="wecoda-donation-qr-wrap">
                <Image
                  src={wecodaDonationQrSrc}
                  alt="QR code for supporting WECODA"
                  width={800}
                  height={800}
                />
              </div>
              <p>Scan QR code to support WECODA.</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="section wecoda-benefits-section">
        <Container>
          <SectionHeader
            label="Membership Benefits"
            title="What You Gain as a Member"
          />
          <MembershipBenefitsGrid>
            {benefits.map(({ title, text, icon }, index) => (
              <article
                className="wecoda-benefit-item"
                key={title}
                style={{ "--benefit-index": index }}
              >
                <span className="membership-benefit-card__icon">
                  <Image
                    src={icon}
                    alt=""
                    aria-hidden="true"
                    width={48}
                    height={48}
                  />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </MembershipBenefitsGrid>
        </Container>
      </section>

      <section className="section wecoda-membership-section">
        <Container>
          <div className="wecoda-membership-panel">
            <div className="wecoda-membership-panel-main">
              <div className="wecoda-membership-illustration">
                <Image
                  src="/images/membership-benefits/annual-membership-women-networking.svg"
                  alt=""
                  aria-hidden="true"
                  width={750}
                  height={500}
                />
              </div>
              <div className="wecoda-membership-content">
                <h3>Annual Membership: 250 DKK</h3>
                <p className="wecoda-membership-statement">
                  Together, we are building a strong international community.
                </p>
              </div>
              <div className="wecoda-membership-cta">
                <MembershipButton variant="red">
                  Become a Member
                </MembershipButton>
              </div>
            </div>
            <div className="wecoda-application-process">
              <h4>Application Process</h4>
              <ol className="wecoda-application-steps">
                {applicationProcess.map(({ title, text }, index) => (
                  <li key={title}>
                    <span
                      className="wecoda-application-step-number"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <p>{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </section>

      <section className="section wecoda-membership-week-section">
        <Container>
          <SectionHeader label="Gallery" title="WECODA Community Meetings" />
          <div className="wecoda-membership-week-grid">
            {membershipWeekMedia.map((item) => (
              <figure
                className={`wecoda-membership-week-item ${
                  item.featured ? "wecoda-membership-week-item-featured" : ""
                }`}
                key={item.src}
              >
                {item.type === "video" ? (
                  <video
                    src={item.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    aria-label={item.label}
                  />
                ) : (
                  <img src={item.src} alt={item.alt} loading="lazy" />
                )}
              </figure>
            ))}
          </div>
        </Container>
      </section>

    </>
  );
}
