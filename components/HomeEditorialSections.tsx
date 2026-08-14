import type { LucideIcon } from "lucide-react";
import { LocaleLink as Link } from "@/components/LocaleLink";
import { ArrowRight, Wrench } from "lucide-react";
import {
  Container,
  Section,
  SectionHeader,
  SectionLabel,
} from "@/components/ui";

export function EditorialFeatureSection({
  eyebrow,
  title,
  intro,
  description,
  ctaLabel,
  ctaHref,
  image,
  imageAlt,
  features = [],
  featureIcons = [],
  reversed = false,
  note,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  features?: string[];
  featureIcons?: LucideIcon[];
  reversed?: boolean;
  note?: string;
}) {
  return (
    <section className="editorial-feature">
      {/* `!important`: Container's own base className sets an arbitrary-
          value width/max-width, and a plain named `w-full`/`max-w-none`
          isn't reliably guaranteed to win over it (Tailwind's generated
          order for arbitrary-vs-named utilities of the same property
          doesn't follow this string's order). */}
      <Container className="w-full! max-w-none! mx-0!">
        <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-0 items-stretch min-h-[clamp(560px,50vw,720px)] max-lg:min-h-auto">
          <div
            className={`grid gap-[18px] content-center max-w-none pt-[clamp(56px,8vw,96px)] pb-[clamp(56px,8vw,96px)] max-lg:pt-[44px] max-lg:pb-[44px] max-lg:pl-[max(16px,calc((100vw_-_720px)/2))] max-lg:pr-[max(16px,calc((100vw_-_720px)/2))] ${
              reversed
                ? "pr-[max(16px,calc((100vw_-_1180px)/2))] pl-[clamp(42px,6vw,86px)] lg:order-2"
                : "pl-[max(16px,calc((100vw_-_1180px)/2))] pr-[clamp(42px,6vw,86px)]"
            }`}
          >
            <SectionLabel>{eyebrow}</SectionLabel>
            <h2 className="font-heading font-medium leading-tight text-text-primary m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] max-w-140">
              {title}
            </h2>
            {intro ? (
              <p className="m-0 leading-[1.7] max-w-140">{intro}</p>
            ) : null}
            <p className="m-0 leading-[1.7] max-w-140">{description}</p>
            {features.length ? (
              <ul className="grid grid-cols-2 max-sm:grid-cols-1 gap-x-4 gap-y-3 mt-4 mb-6 mx-0 p-0 list-none max-w-140">
                {features.map((feature, index) => {
                  const FeatureIcon = featureIcons[index] ?? Wrench;
                  return (
                    <li
                      key={feature}
                      className="grid grid-cols-[30px_minmax(0,1fr)] gap-[14px] items-start text-text-primary text-sm font-bold"
                    >
                      <FeatureIcon
                        aria-hidden="true"
                        strokeWidth={1.9}
                        className="w-[28px] h-[28px] text-red -translate-y-[2px]"
                      />
                      <span>{feature}</span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {note ? (
              <p className="border-l-2 border-l-gold pl-[14px] text-text-muted text-sm font-semibold m-0 leading-[1.7] max-w-140">
                {note}
              </p>
            ) : null}
            <Link
              className={`group inline-flex items-center justify-center min-h-[42px] w-fit px-6 border border-primary rounded-pill bg-primary text-white! text-[12.5px] font-bold tracking-[0.02em] uppercase cursor-pointer transition-[transform,background,border-color,color] duration-[180ms] ease-[ease] gap-2 max-w-140 hover:-translate-y-px hover:bg-primary-dark hover:border-primary-dark hover:text-white! active:bg-primary-darker active:border-primary-darker focus-visible:text-white!`}
              href={ctaHref}
            >
              <span>{ctaLabel}</span>
              <ArrowRight
                aria-hidden="true"
                strokeWidth={1.9}
                className="w-[17px] h-[17px] text-current transition-transform duration-200 ease-[ease] group-hover:translate-x-[5px] group-focus-visible:translate-x-[5px]"
              />
            </Link>
          </div>
          <div
            className={`min-h-full bg-beige bg-center bg-cover bg-no-repeat max-lg:min-h-[320px] max-sm:min-h-[260px] ${reversed ? "lg:order-1" : ""}`}
            role="img"
            aria-label={imageAlt}
            style={{ backgroundImage: `url(${image})` }}
          />
        </div>
      </Container>
    </section>
  );
}

export interface ServiceTeaser {
  title: string;
  text: string;
  cta?: string;
  href: string;
  image: string;
}

export function ServicesTeaserSection({
  services,
  label = "Services",
  title = "Services for thoughtful gatherings",
}: {
  services: ServiceTeaser[];
  label?: string;
  title?: string;
}) {
  return (
    <Section>
      <Container>
        <SectionHeader label={label} title={title} />
        <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-[22px]">
          {services.map((service) => (
            <Link
              className="group grid grid-cols-[minmax(170px,0.72fr)_minmax(0,1fr)] max-lg:grid-cols-1 border border-border bg-surface-light min-h-[250px] cursor-pointer [transition:grid-template-columns_0.32s_ease,box-shadow_0.2s_ease,border-color_0.2s_ease] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(var(--rgb-gold),0.72)] focus-visible:outline-offset-4 lg:hover:grid-cols-[minmax(180px,0.77fr)_minmax(0,0.95fr)] lg:focus-visible:grid-cols-[minmax(180px,0.77fr)_minmax(0,0.95fr)]"
              href={service.href}
              aria-label={service.cta ?? service.title}
              key={service.title}
            >
              <div className="relative min-h-full bg-beige overflow-hidden max-lg:min-h-[220px] max-sm:min-h-[190px]">
                <span
                  className="absolute inset-0 bg-center bg-cover bg-no-repeat scale-100 [transition:transform_0.42s_ease,filter_0.24s_ease] group-hover:scale-[1.07] group-hover:[filter:saturate(1.04)_contrast(1.02)] group-focus-visible:scale-[1.07] group-focus-visible:[filter:saturate(1.04)_contrast(1.02)]"
                  style={{ backgroundImage: `url(${service.image})` }}
                  aria-hidden="true"
                />
              </div>
              <div className="grid content-center gap-[14px] p-[clamp(22px,3vw,34px)] origin-left transition-transform duration-[320ms] ease-[ease] group-hover:scale-[0.98] group-focus-visible:scale-[0.98]">
                <h3 className="m-0 font-heading text-text-primary text-[clamp(20px,2vw,26px)] leading-[1.08] font-bold">
                  {service.title}
                </h3>
                <p className="m-0 leading-[1.65]">{service.text}</p>
                <span className="inline-flex items-center gap-2 w-fit mt-[14px] p-0 border-0 bg-transparent text-accent text-xs leading-none font-extrabold uppercase tracking-[0.02em] transition-colors duration-200 ease-[ease]">
                  <span>{service.cta}</span>
                  <ArrowRight
                    aria-hidden="true"
                    strokeWidth={1.9}
                    className="w-[17px] h-[17px] text-current transition-[transform,color] duration-200 ease-[ease] group-hover:translate-x-[4px] group-focus-visible:translate-x-[4px]"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export interface CommunityLink {
  href: string;
  label: string;
}

const fallbackCommunityLinks: CommunityLink[] = [
  { href: "/community-membership", label: "WECODA membership" },
  { href: "/work-with-us", label: "Work with us" },
  { href: "/volunteer", label: "Volunteer with us" },
];

const DEFAULT_COMMUNITY_IMAGE = "/images/catering/community-catering-bg.png";

export function CommunityTeaserSection({
  label = "Community",
  title = "More than a space",
  text = "RORUM is a place for events, ideas and meaningful connections. Join our community, collaborate with us or become part of the team behind the experiences.",
  links = fallbackCommunityLinks,
  backgroundImage = DEFAULT_COMMUNITY_IMAGE,
}: {
  label?: string;
  title?: string;
  text?: string;
  links?: CommunityLink[];
  backgroundImage?: string;
}) {
  return (
    <section
      className="py-[clamp(40px,6vw,76px)] relative isolate overflow-hidden bg-dark-green bg-position-[center_45%] bg-cover bg-no-repeat before:content-[''] before:absolute before:inset-0 before:z-0 before:bg-[linear-gradient(90deg,rgb(0_0_0/58%)_0%,rgb(0_0_0/38%)_52%,rgb(0_0_0/16%)_100%)]"
      style={{ backgroundImage: `url('${backgroundImage}')` }}
    >
      <Container>
        <div className="grid grid-cols-[minmax(220px,0.62fr)_minmax(0,1fr)_auto] max-lg:grid-cols-1 gap-[clamp(20px,4vw,48px)] relative z-1 items-center py-[clamp(34px,5vw,64px)]">
          <div className="grid gap-2">
            <SectionLabel className="text-gold! border-b-[rgba(var(--rgb-gold),0.72)]!">
              {label}
            </SectionLabel>
            <h2 className="font-heading font-medium leading-tight text-cream m-0 text-[clamp(1.85rem,2.6vw,2.3rem)]">
              {title}
            </h2>
          </div>
          <p className="m-0 text-[rgba(var(--rgb-cream),0.9)] leading-[1.65]">
            {text}
          </p>
          <div className="flex flex-wrap justify-end max-lg:justify-start gap-2.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center min-h-9.5 py-2.5 px-5 border border-[rgba(var(--rgb-cream),0.28)] text-cream bg-[rgba(var(--rgb-cream),0.24)] backdrop-blur-md text-xs font-medium uppercase tracking-[0.04em] hover:bg-[rgba(var(--rgb-cream),0.25)] hover:border-[rgba(var(--rgb-cream),0.52)] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
