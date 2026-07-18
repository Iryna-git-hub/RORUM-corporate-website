import Image from "next/image";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  Globe2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Landmark,
  Presentation,
  UserRoundCheck,
} from "lucide-react";
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
    icon: CalendarDays,
  },
  {
    title: "Training and Learning",
    text: "Access to training sessions, educational programmes, and masterclasses.",
    icon: GraduationCap,
  },
  {
    title: "International Networking",
    text: "International business networking and new partnerships.",
    icon: Handshake,
  },
  {
    title: "International Opportunities",
    text: "Participation in international projects, forums, and business missions.",
    icon: Globe2,
  },
  {
    title: "Funding Information",
    text: "Information about grants, accelerator programmes, and funding opportunities.",
    icon: Banknote,
  },
  {
    title: "Mentoring and Expert Advice",
    text: "Mentoring support and consultations with experts.",
    icon: UserRoundCheck,
  },
  {
    title: "Visibility for Your Work",
    text: "Opportunities to present your business, projects, and professional experience.",
    icon: Presentation,
  },
  {
    title: "Diplomatic and Cultural Events",
    text: "Participation in unique WECODA events focused on diplomatic gastronomy and cultural diplomacy.",
    icon: Landmark,
  },
  {
    title: "A Supportive Community",
    text: "A community of active women who support one another, exchange experience, and create new opportunities.",
    icon: HeartHandshake,
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
            title="What You Gain as WECODA Member"
          />
          <MembershipBenefitsGrid>
            {benefits.map(({ title, text, icon: Icon }, index) => (
              <article
                className="wecoda-benefit-item"
                key={title}
                style={{ "--benefit-index": index }}
              >
                <span className="wecoda-benefit-icon" aria-hidden="true">
                  <Icon strokeWidth={1.7} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </MembershipBenefitsGrid>
          <div className="wecoda-membership-panel">
            <h3>Annual membership: 250 DKK</h3>
            <p>
              After submitting your application and paying the annual
              membership fee, the WECODA Board will review your application.
              Once approved, you will receive an official membership
              confirmation.
            </p>
            <p>
              Together, we are building a strong international community of
              women who inspire, collaborate, and create positive impact.
            </p>
            <MembershipButton variant="red">
              Become a WECODA Member
            </MembershipButton>
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
