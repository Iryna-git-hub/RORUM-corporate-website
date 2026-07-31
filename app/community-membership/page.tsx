import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { ArrowRight, BadgeCheck, ExternalLink } from "lucide-react";
import {
  Button,
  Container,
  SectionHeader,
  SectionLabel,
  type ButtonVariant,
} from "@/components/ui";
import { MembershipBenefitsGrid } from "@/components/MembershipBenefitsGrid";
import { WecodaDonationSection } from "@/components/WecodaDonationSection";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/community-membership");

const wecodaFormUrl = "https://forms.gle/MpadaPTyL8YCHtAa9";
const wecodaDonationQrSrc = "/images/membership-week/wecoda-donation-qr.jpg";

interface MembershipWeekMediaItem {
  type: "image" | "video";
  src: string;
  alt?: string;
  label?: string;
  featured?: boolean;
}

const membershipWeekMedia: MembershipWeekMediaItem[] = [
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

function MembershipButton({
  children,
  variant = "primary",
}: {
  children: ReactNode;
  variant?: ButtonVariant;
}) {
  return (
    <Button href={wecodaFormUrl} variant={variant}>
      {children}
      <ArrowRight
        className="button-arrow w-[15px] h-[15px] shrink-0 transition-transform duration-[180ms] ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
        aria-hidden="true"
        strokeWidth={1.9}
      />
    </Button>
  );
}

type BenefitIndexStyle = CSSProperties & { "--benefit-index": number };

export default function CommunityMembershipPage() {
  return (
    <>
      <section className="wecoda-hero bg-cream py-[clamp(44px,5vw,6rem)] max-tablet:p-[24px_0_28px]">
        <Container>
          <div className="wecoda-hero-grid">
            <div className="wecoda-hero-copy grid gap-[clamp(10px,1.3vw,15px)] min-w-0">
              <SectionLabel>WECODA Community</SectionLabel>
              <h1 className="heading wecoda-hero-title font-heading text-text-primary font-medium normal-case tracking-[0] leading-[1.2] m-0 max-w-full text-[3rem] max-tablet:text-[clamp(2rem,10vw,2.5rem)]">
                Join a Community That Helps Women Move Forward
              </h1>
              <p className="wecoda-hero-intro text-text-primary text-[1rem] leading-[1.58] max-tablet:m-[2px_0_4px]">
                <strong>WECODA:</strong> Women Entrepreneurs Commerce &
                Development Association.
              </p>
              <p className="wecoda-hero-intro text-text-primary text-[1rem] leading-[1.58] max-tablet:m-[2px_0_4px]">
                Connect with women entrepreneurs, professionals, and
                changemakers. Exchange experience, discover new opportunities,
                and grow with the support of an international community.
              </p>
            </div>
            <div className="wecoda-hero-logo-panel grid place-items-center w-[clamp(240px,24vw,300px)] aspect-square justify-self-start bg-white rounded-full border border-[rgba(var(--rgb-brown),0.1)] shadow-[0_18px_40px_rgba(var(--rgb-brown),0.12)] max-[980px]:w-[clamp(200px,30vw,260px)] max-[980px]:justify-self-center max-tablet:w-[min(220px,60vw)]">
              <Image
                className="wecoda-hero-logo w-[75%] h-[75%] object-contain"
                src="/images/membership-week/wecoda-logo.jpg"
                alt="WECODA Women Entrepreneurs Commerce and Development Association logo"
                width={440}
                height={382}
                priority
              />
            </div>
            <div className="wecoda-hero-actions flex flex-wrap gap-5 items-center max-tablet:w-full max-tablet:mt-1">
              <MembershipButton>Become a Member</MembershipButton>
              <Button href="#support-wecoda" variant="secondary">
                Support WECODA
                <ArrowRight
                  className="button-arrow w-[15px] h-[15px] shrink-0 transition-transform duration-[180ms] ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </Button>
              <a
                className="wecoda-hero-external-link inline-flex items-center gap-1.5 w-fit text-[16px] font-bold leading-[1.45] no-underline transition-[color,transform] duration-[0.18s] max-tablet:w-full max-tablet:justify-center"
                href="https://wecoda.org"
                target="_blank"
                rel="noreferrer"
              >
                WECODA website
                <ExternalLink
                  className="wecoda-hero-external-link-icon w-[15px] h-[15px] shrink-0"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </a>
            </div>
          </div>
        </Container>
      </section>

      <section className="wecoda-membership-price-strip w-full py-[clamp(12px,1.5vw,16px)] bg-light-green text-white">
        <Container>
          <div className="membership-price__content flex items-center gap-3">
            <span className="membership-price__icon inline-flex items-center justify-center w-11 h-11 rounded-full bg-[color-mix(in_srgb,var(--color-light-green)_62%,var(--color-white))] text-white shrink-0" aria-hidden="true">
              <BadgeCheck size={23} strokeWidth={2} />
            </span>
            <p className="membership-price__text min-w-0 m-0 text-inherit text-[clamp(1.05rem,1.4vw,1.18rem)] leading-[1.4] font-normal">
              <span className="membership-price__label font-normal">
                Annual membership price:
              </span>{" "}
              <strong className="membership-price__value text-inherit font-extrabold">250 DKK</strong>
            </p>
          </div>
        </Container>
      </section>

      <WecodaDonationSection qrSrc={wecodaDonationQrSrc} />
      <section className="section wecoda-intro-section bg-cream text-text-primary">
        <Container>
          <SectionHeader
            label="WECODA community"
            title="Connecting Women Who Inspire, Build and Lead."
          />
          <div className="wecoda-intro-columns grid grid-cols-2 gap-[clamp(24px,3vw,56px)] max-[980px]:grid-cols-1 max-[980px]:gap-5">
            <div className="wecoda-intro-column grid gap-4 content-start">
              <p>
                WECODA is an international community where ambitious women
                entrepreneurs, professionals, and leaders connect to exchange
                knowledge, build meaningful partnerships, and grow together.
              </p>
              <p>
                What makes WECODA unique is our signature concept of
                Diplomatic Gastronomy—a distinctive approach that brings
                together business, culture, and international dialogue. We
                believe that genuine relationships are built through shared
                experiences, creating an environment where conversations
                become collaborations and ideas evolve into lasting
                partnerships.
              </p>
            </div>
            <div className="wecoda-intro-column grid gap-4 content-start">
              <p>
                Through curated networking events, business breakfasts,
                international forums, educational programs, and cultural
                initiatives, we create opportunities that extend far beyond
                traditional networking.
              </p>
              <p>
                Become part of a community where business meets purpose,
                relationships inspire growth, and every connection opens the
                door to new possibilities.
              </p>
            </div>
          </div>
          <div className="wecoda-hero-actions flex flex-wrap gap-5 items-center max-tablet:w-full max-tablet:mt-1">
            <MembershipButton>Become a Member</MembershipButton>
            <a
              className="wecoda-hero-external-link inline-flex items-center gap-1.5 w-fit text-[16px] font-bold leading-[1.45] no-underline transition-[color,transform] duration-[0.18s] max-tablet:w-full max-tablet:justify-center"
              href="https://wecoda.org"
              target="_blank"
              rel="noreferrer"
            >
              WECODA website
              <ExternalLink
                className="wecoda-hero-external-link-icon w-[15px] h-[15px] shrink-0"
                aria-hidden="true"
                strokeWidth={1.9}
              />
            </a>
          </div>
        </Container>
      </section>

      <section className="section wecoda-benefits-section bg-cream text-text-primary">
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
                style={{ "--benefit-index": index } as BenefitIndexStyle}
              >
                <span className="membership-benefit-card__icon flex items-center justify-start w-12 h-12 shrink-0">
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
          <p className="membership-icons text-[0.8rem] pt-8">
            Membership icons designed by{" "}
            <a
              href="https://www.flaticon.com/authors/freepik"
              target="_blank"
              rel="noreferrer"
            >
              Freepik
            </a>{" "}
            from{" "}
            <a
              href="https://www.flaticon.com/"
              target="_blank"
              rel="noreferrer"
            >
              Flaticon
            </a>
            .
          </p>
        </Container>
      </section>

      <section className="section wecoda-membership-section bg-light-green text-text-on-dark pb-24 max-tablet:pb-11">
        <Container>
          <div className="wecoda-membership-panel grid gap-24 w-full text-text-on-dark max-tablet:w-full max-tablet:gap-6">
            <div className="wecoda-membership-panel-main grid grid-cols-[minmax(180px,220px)_minmax(0,max-content)_auto] justify-start items-center gap-[75px] max-[980px]:grid-cols-1 max-[980px]:justify-items-center max-[980px]:text-center max-tablet:grid-cols-1 max-tablet:gap-11">
              <div className="wecoda-membership-illustration grid place-items-center min-w-0">
                <div className="wecoda-membership-logo-badge grid place-items-center w-[min(100%,200px)] aspect-square rounded-full bg-white p-[clamp(20px,2.2vw,28px)] shadow-[0_18px_40px_rgba(var(--rgb-brown),0.16)] max-[980px]:w-[min(40vw,185px)] max-tablet:w-[min(60vw,170px)]">
                  <Image
                    className="wecoda-membership-logo block w-full h-auto object-contain"
                    src="/images/membership-week/wecoda-logo.jpg"
                    alt="WECODA Women Entrepreneurs Commerce and Development Association logo"
                    width={300}
                    height={260}
                  />
                </div>
              </div>
              <div className="wecoda-membership-content grid justify-items-center gap-5 min-w-0">
                <h3>Annual Membership: 250 DKK</h3>
                <p className="wecoda-membership-statement max-w-[42ch] text-[rgba(var(--rgb-cream),0.9)] text-[clamp(1rem,1.3vw,1.12rem)] leading-[1.5]">
                  Together, we are building a strong international community.
                </p>
                <a
                  className="wecoda-hero-external-link inline-flex items-center gap-1.5 w-fit text-[16px] font-bold leading-[1.45] no-underline transition-[color,transform] duration-[0.18s] max-tablet:w-full max-tablet:justify-center"
                  href="https://wecoda.org"
                  target="_blank"
                  rel="noreferrer"
                >
                  WECODA website
                  <ExternalLink
                    className="wecoda-hero-external-link-icon w-[15px] h-[15px] shrink-0"
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                </a>
                <p className="faq-inline-prompt flex flex-wrap items-center gap-x-2 gap-y-1 m-0 text-[0.95rem] font-medium leading-[1.4] text-[rgba(var(--rgb-cream),0.72)]">
                  <span>Questions?</span>
                  <a
                    className="faq-inline-prompt-link group inline-flex items-center gap-1 text-gold font-semibold no-underline transition-opacity duration-[160ms] ease-[ease] hover:opacity-75"
                    href="/faq"
                  >
                    <span>Read our FAQs</span>
                    <ArrowRight
                      className="button-arrow w-[13px] h-[13px] shrink-0 transition-transform duration-[180ms] ease-[ease] group-hover:translate-x-1"
                      aria-hidden="true"
                      strokeWidth={1.9}
                    />
                  </a>
                </p>
              </div>
              <div className="wecoda-membership-cta flex justify-center min-w-max max-[980px]:justify-center max-[980px]:min-w-0">
                <MembershipButton variant="red">
                  Become a Member
                </MembershipButton>
              </div>
            </div>
            <div className="wecoda-application-process grid gap-[18px] pt-[clamp(24px,3vw,34px)]">
              <h4>Application Process</h4>
              <ol className="wecoda-application-steps grid grid-cols-2 gap-x-[clamp(32px,5vw,64px)] gap-y-0 p-0 list-none max-[980px]:grid-cols-1">
                {applicationProcess.map(({ title, text }, index) => (
                  <li key={title}>
                    <span
                      className="wecoda-application-step-number inline-block text-gold text-[13px] font-black leading-[1.2] tracking-[0.06em]"
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
          <div className="wecoda-membership-week-grid grid grid-cols-4 auto-rows-[clamp(230px,21vw,340px)] gap-[clamp(12px,1.6vw,18px)] max-[980px]:grid-cols-2 max-[980px]:auto-rows-[clamp(190px,38vw,320px)] max-[560px]:grid-cols-1 max-[560px]:auto-rows-[clamp(230px,72vw,380px)]">
            {membershipWeekMedia.map((item) => (
              <figure
                className={`wecoda-membership-week-item relative min-w-0 min-h-0 m-0 overflow-hidden bg-beige ${
                  item.featured
                    ? "wecoda-membership-week-item-featured col-span-2 row-span-2 max-[560px]:col-auto max-[560px]:row-span-1"
                    : ""
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
