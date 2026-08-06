import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleHelp,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Smile,
  Sparkles,
  Users,
  Wine,
} from "lucide-react";

// NOTE ON THIS FILE'S MIGRATION APPROACH:
// Every original hand-written class name (e.g. `container`, `btn`, `card`,
// `hero`, `next-step-card-final`, ...) is intentionally kept on its element
// exactly as before — none are removed. app/globals.css defines these as
// unlayered CSS, and it (and every other page/component file that still
// targets these class names with its own descendant selectors, e.g.
// `.home-hero-copy .btn`, `.wecoda-membership-content .faq-inline-prompt`)
// is out of scope for this change. Per the CSS cascade-layers spec, an
// unlayered rule always wins over a Tailwind utility (which lives in a
// `@layer`) for the same property, regardless of source order — so as long
// as the old classes stay, the Tailwind utilities added alongside them are
// visually inert today and the rendered result is unchanged. They exist so
// that a later cleanup pass can delete the now-redundant globals.css rules
// (and the matching cross-file selectors) with confidence that the visual
// result carries over unchanged. Where a property's effective value
// legitimately varies by ancestor/variant context in ways this component
// can't know about on its own (e.g. `.faq-inline-prompt-link` turning gold
// inside `.next-step-card-final`, or the `.next-step-card-final .btn` /
// `.next-step-card-host .btn` pulse `@keyframes` animations), that specific
// property was intentionally left untranslated and is still driven entirely
// by the retained class — flagged in the accompanying report.

export function Container({ children }: { children: ReactNode }) {
  return (
    <div className="container w-[min(calc(100%_-_2.5rem),1180px)] max-w-[1180px] mx-auto max-tablet:w-[min(calc(100%_-_2.5rem),100%)]">
      {children}
    </div>
  );
}

export function Section({
  children,
  tight = false,
}: {
  children: ReactNode;
  tight?: boolean;
}) {
  return (
    <section
      className={
        tight
          ? "section-tight py-[clamp(40px,6vw,76px)]"
          : "section py-[clamp(52px,8vw,104px)]"
      }
    >
      {children}
    </section>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="label inline-flex items-center gap-[10px] text-red text-[0.78rem] font-extrabold tracking-[0.08em] uppercase w-fit border-b border-red">
      {children}
    </span>
  );
}

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingTagName = `h${HeadingLevel}`;

export function SectionHeader({
  label,
  title,
  text,
  level = 2,
}: {
  label?: string;
  title: ReactNode;
  text?: string;
  level?: HeadingLevel;
}) {
  // `level` is restricted to 1-6 above, so this is always a valid heading tag.
  const HeadingTag = `h${level}` as HeadingTagName;
  return (
    <div className="section-head grid gap-[14px] max-w-[760px] mb-7">
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      <HeadingTag className="heading section-title font-heading font-medium text-text-primary m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] leading-[1.25] tracking-[0] normal-case">
        {title}
      </HeadingTag>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "red"
  | "ghost"
  | "plum"
  | "icon"
  | "event-all";

// Fully-resolved Tailwind equivalent of each `.btn.<variant>` rule in
// globals.css (base size/shape + color + hover/active/focus-visible
// states). Each variant's utilities are self-contained rather than layered
// on top of a shared "base" string, so there's no dependency on Tailwind's
// internal utility ordering to resolve conflicting values (e.g. `icon`'s
// 46px size vs the default 42px min-height).
const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "min-h-[42px] w-fit px-6 border border-primary rounded-pill bg-primary text-white text-[12.5px] tracking-[0.02em] hover:-translate-y-px hover:bg-primary-dark hover:border-primary-dark hover:text-white active:bg-primary-darker active:border-primary-darker",
  secondary:
    "min-h-[42px] w-fit px-6 border border-primary rounded-pill bg-transparent text-primary-dark text-[12.5px] tracking-[0.02em] hover:bg-[rgba(var(--rgb-light-green),0.1)] hover:text-primary-dark hover:border-primary-dark focus-visible:bg-[rgba(var(--rgb-light-green),0.1)] focus-visible:text-primary-dark focus-visible:border-primary-dark",
  red: "min-h-[42px] w-fit px-6 border border-cta-red rounded-pill bg-cta-red text-white text-[12.5px] tracking-[0.02em] hover:border-cta-red-hover hover:bg-cta-red-hover hover:text-white focus-visible:border-cta-red-hover focus-visible:bg-cta-red-hover focus-visible:text-white",
  ghost:
    "min-h-[42px] w-fit px-0 border border-transparent rounded-pill bg-transparent text-inherit text-[12.5px] tracking-[0.02em] hover:bg-transparent hover:text-primary-dark hover:border-transparent",
  plum: "min-h-[42px] w-fit px-6 border border-secondary rounded-pill bg-secondary text-primary-dark text-[12.5px] tracking-[0.02em]",
  icon: "w-[46px] h-[46px] min-h-[46px] p-0 border border-primary rounded-full bg-primary text-white hover:bg-primary-dark hover:border-primary-dark active:bg-primary-darker active:border-primary-darker",
  "event-all":
    "min-h-[40px] w-fit gap-2 border border-primary-light rounded-pill px-[18px] py-[5px] bg-transparent text-primary-dark text-[12.5px] tracking-[0.02em] hover:bg-[rgba(var(--rgb-beige),0.14)] hover:border-primary-light hover:text-primary-dark",
};

export function Button({
  href,
  children,
  variant = "primary",
}: {
  href?: string;
  children: ReactNode;
  variant?: ButtonVariant;
}) {
  const variantClass = variant === "primary" ? "" : variant;
  const className =
    `btn inline-flex items-center justify-center font-bold uppercase cursor-pointer transition-all duration-[180ms] ease-[ease] group has-[.button-arrow]:gap-2 ${variantClass} ${BUTTON_VARIANT_CLASSES[variant]}`.trim();
  if (!href)
    return (
      <button className={className} type="button">
        {children}
      </button>
    );
  return href.startsWith("http") ? (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

export type CardVariant = "editorial" | "service" | "package" | "event" | "";

export function Card({
  children,
  className = "",
  variant,
}: {
  children: ReactNode;
  className?: string;
  /**
   * @deprecated Dead prop, kept only so existing call sites (e.g.
   * components/Cards.tsx, out of scope for this change) that still pass
   * `variant` keep type-checking. It used to generate a `card-{variant}`
   * class with zero matching CSS for any value (confirmed dead against
   * globals.css) — that class-generation logic has been removed. Do not
   * use in new code; safe to delete once all call sites stop passing it.
   */
  variant?: CardVariant;
}) {
  void variant;
  return (
    <div
      className={`card border border-[rgba(var(--rgb-beige),0.42)] rounded-none bg-[rgba(var(--rgb-cream),0.72)] shadow-[0_12px_34px_rgba(var(--rgb-brown),0.045)] text-text-primary overflow-hidden ${className}`.trim()}
    >
      {children}
    </div>
  );
}

function TrustIcon({ item }: { item: string }) {
  const normalized = item.toLowerCase();
  const Icon = normalized.includes("guest")
    ? Users
    : normalized.includes("copenhagen")
      ? MapPin
      : normalized.includes("support")
        ? Smile
        : normalized.includes("catering")
          ? Wine
          : Sparkles;
  return (
    <Icon
      className="w-[22px] h-[22px] text-gold shrink-0"
      aria-hidden="true"
      strokeWidth={1.8}
    />
  );
}

export function PageHero({
  label,
  title,
  text,
  image = "/images/hero.jpg",
  actions,
}: {
  label?: string;
  title: ReactNode;
  text?: string;
  image?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="hero pt-[clamp(56px,8vw,104px)] pb-[clamp(38px,6vw,72px)] max-tablet:pt-[38px]">
      <Container>
        <div className="hero-grid grid grid-cols-[minmax(0,0.9fr)_minmax(340px,1fr)] gap-[34px] items-stretch max-[980px]:grid-cols-1">
          <div className="hero-copy grid content-center gap-[22px]">
            <SectionLabel>{label}</SectionLabel>
            <h1 className="heading page-hero-title font-heading font-medium text-text-primary m-0 text-[clamp(34px,4.5vw,64px)] leading-[0.96] tracking-[0] max-w-[14ch] normal-case max-[980px]:max-w-[12ch]">
              {title}
            </h1>
            <p>{text}</p>
            {actions ? (
              <div className="hero-actions flex flex-wrap gap-[12px]">
                {actions}
              </div>
            ) : null}
          </div>
          <div
            className="hero-image"
            style={{ backgroundImage: `url(${image})` }}
          >
            <div className="hero-note absolute left-[18px] right-[18px] bottom-[18px] z-[1] p-[18px] border border-[rgba(var(--rgb-cream),0.42)] rounded-none bg-[rgba(var(--rgb-cream),0.88)]">
              A warm Copenhagen room for people, ideas, food and thoughtful
              gatherings.
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function HomeHero({
  label,
  title,
  text,
  microcopy,
  trustItems = [],
  image = "/images/hero.jpg",
  video,
  actions,
}: {
  label?: string;
  title: ReactNode;
  text?: string;
  microcopy?: string;
  trustItems?: string[];
  image?: string;
  video?: string;
  actions?: ReactNode;
}) {
  return (
    <section
      className="home-hero-full relative min-h-[100svh] w-full grid items-center -mt-[78px] pt-[78px] bg-center bg-cover bg-no-repeat overflow-hidden max-tablet:-mt-[68px] max-tablet:pt-[68px]"
      style={{ backgroundImage: `url(${image})` }}
    >
      {video ? (
        <video
          className="home-hero-video absolute inset-0 w-full h-full object-cover z-0"
          src={video}
          poster={image}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ) : null}
      <div className="home-hero-overlay absolute inset-0 bg-[#00000080] z-[1]" />
      <Container>
        <div className="home-hero-copy w-[min(62%,730px)] grid gap-[22px] py-[clamp(42px,7vw,84px)] translate-y-[clamp(-42px,-3vw,-18px)] max-[980px]:w-[min(72vw,680px)] max-[980px]:translate-y-0 max-tablet:w-full max-tablet:-mt-[35%] max-tablet:translate-y-0 max-tablet:gap-[18px]">
          <SectionLabel>{label}</SectionLabel>
          <h1 className="heading font-heading font-medium text-white text-[clamp(34px,3.95vw,66px)] leading-[1.1] tracking-[0] normal-case max-tablet:text-[clamp(31px,9vw,42px)] max-tablet:leading-[1.2]">
            {title}
          </h1>
          <p>{text}</p>
          {actions ? (
            <div className="hero-actions flex flex-wrap gap-[12px]">
              {actions}
            </div>
          ) : null}
          {microcopy ? (
            <p className="home-hero-microcopy text-gold text-[14px] font-medium">
              {microcopy}
            </p>
          ) : null}
        </div>
      </Container>
      {trustItems.length ? (
        <ul
          className="home-hero-trust absolute inset-x-0 bottom-0 z-[2] grid grid-cols-4 gap-[18px] w-full m-0 py-[18px] px-[max(16px,calc((100vw_-_1180px)/2))] list-none bg-[rgba(var(--rgb-cream),0.14)] backdrop-blur-[12px] max-tablet:grid-cols-1"
          aria-label="RORUM highlights"
        >
          {trustItems.map((item) => (
            <li key={item}>
              <TrustIcon item={item} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function FAQInlinePrompt({
  href = "/faq",
  question,
  label,
  questionClassName = "",
}: {
  href?: string;
  question?: string;
  label?: string;
  questionClassName?: string;
}) {
  return (
    <p className="faq-inline-prompt flex flex-wrap items-center gap-x-2 gap-y-1 m-0 text-[0.8125rem] font-medium leading-[1.4]">
      <span className={questionClassName}>{question || "Questions?"}</span>
      <Link
        className="faq-inline-prompt-link group inline-flex items-center gap-1 font-semibold no-underline transition-opacity duration-[160ms] ease-[ease] hover:opacity-75"
        href={href}
      >
        <span>{label || "Read our FAQs"}</span>
        <ArrowRight
          className="button-arrow w-[13px] h-[13px] shrink-0 transition-transform duration-[180ms] ease-[ease] group-hover:translate-x-1"
          aria-hidden="true"
          strokeWidth={1.9}
        />
      </Link>
    </p>
  );
}

export interface CTALink {
  href: string;
  label: string;
}

export function CTASection({
  title,
  text,
  href,
  label,
  eyebrow = "Next step",
  links = [],
  variant = "",
  className = "",
  cardClassName = "",
  faqQuestion = "",
  faqLabel = "Read FAQ",
}: {
  title: ReactNode;
  text?: string;
  href?: string;
  label?: ReactNode;
  eyebrow?: string;
  links?: CTALink[];
  variant?: "final" | "host" | "";
  className?: string;
  cardClassName?: string;
  faqQuestion?: string;
  faqLabel?: string;
}) {
  const sectionBg = variant === "final" ? "bg-light-green" : "bg-cream";
  const sectionClass =
    `section-tight py-[clamp(40px,6vw,76px)] next-step-section relative isolate ${sectionBg} ${variant ? `next-step-section-${variant}` : ""} ${className}`.trim();

  // Each `next-step-card-*` variant's layout is fully resolved on its own
  // (rather than layering diff-only utilities on top of a shared base), to
  // avoid depending on Tailwind's internal ordering to settle conflicts
  // like `display: flex` vs `display: grid` between variants.
  const cardVariantClass =
    variant === "final"
      ? "next-step-card-final relative isolate overflow-hidden grid grid-cols-[minmax(0,1fr)_auto] items-center min-h-[clamp(300px,34vw,420px)] py-[clamp(42px,7vw,78px)] text-cream rounded-none max-tablet:grid-cols-1 max-tablet:gap-[28px] max-tablet:min-h-0 max-tablet:py-9 min-[1024px]:items-start min-[1024px]:grid-cols-[minmax(0,620px)_auto] min-[1024px]:justify-start min-[1024px]:gap-x-[clamp(18px,2.3vw,36px)]"
      : variant === "host"
        ? "next-step-card-host relative isolate overflow-hidden flex items-center justify-between gap-6 py-[clamp(26px,4vw,44px)] rounded-none"
        : "flex items-center justify-between gap-6 py-[clamp(26px,4vw,44px)] rounded-none";
  const cardClass =
    `cta next-step-card px-0 bg-transparent border-0 shadow-none ${cardVariantClass} ${cardClassName}`.trim();

  const copyClass = `next-step-copy grid gap-[18px] max-w-[760px]${variant ? " relative z-[2]" : ""}`;

  const actionClass =
    variant === "final"
      ? "next-step-action relative z-[2] grid justify-items-end gap-[15px] min-w-[220px] p-[18px] max-[980px]:justify-items-start max-[980px]:min-w-0 min-[1024px]:items-start min-[1024px]:justify-items-start min-[1024px]:min-w-[180px] min-[1024px]:p-0 min-[1024px]:mt-[clamp(48px,5.4vw,70px)] min-[1024px]:mr-0 min-[1024px]:transform-none"
      : variant === "host"
        ? "next-step-action relative z-[2] grid place-items-center gap-[15px] min-w-[220px] min-h-[132px]"
        : "next-step-action";

  return (
    <section className={sectionClass}>
      <Container>
        <Card className={cardClass}>
          <div className={copyClass}>
            <SectionLabel>{eyebrow}</SectionLabel>
            <h2 className="heading cta-title font-heading font-medium m-0 leading-[1.25] tracking-[0] normal-case">
              {title}
            </h2>
            <p>{text}</p>
            {links.length ? (
              <div
                className="next-step-links flex flex-wrap gap-[10px] mt-1"
                aria-label="Suggested paths"
              >
                {links.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          {variant === "final" ? (
            <div
              className="final-cta-illustration absolute inset-0 z-[1] pointer-events-none flex items-center justify-end pr-[clamp(24px,4vw,80px)] text-[rgb(212,236,152)] opacity-[0.04] max-[980px]:transform-none max-[980px]:mt-0 max-[980px]:justify-center max-[980px]:pr-0"
              aria-hidden="true"
            >
              <MessagesSquare
                className="w-auto h-[95%] max-w-none translate-x-[8%] max-[980px]:h-[85%] max-[980px]:translate-x-0"
                strokeWidth={1.15}
              />
            </div>
          ) : null}
          <div className={actionClass}>
            <Button href={href}>
              {variant === "final" ? (
                <MessageCircle
                  className="w-[18px] h-[18px] text-current"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              ) : null}
              {label}
            </Button>
            {faqQuestion ? (
              <FAQInlinePrompt question={faqQuestion} label={faqLabel} />
            ) : null}
          </div>
        </Card>
      </Container>
    </section>
  );
}

export function FAQHelpStrip({
  title = "Questions before booking?",
  text = "Find answers about hosting at RORUM, catering, events and practical details before you send a request.",
  href = "/faq",
  label = "Read FAQ",
  className = "",
}: {
  title?: string;
  text?: string;
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <section
      className={`section-tight py-[clamp(40px,6vw,76px)] faq-help-strip-section bg-beige ${className}`.trim()}
    >
      <Container>
        <div className="faq-help-strip grid grid-cols-[auto_minmax(0,1fr)_auto] gap-[clamp(18px,3vw,34px)] items-center py-[clamp(26px,4vw,42px)] border-t border-b border-[rgba(var(--rgb-beige),0.72)] max-tablet:grid-cols-1 max-tablet:justify-items-start">
          <div
            className="faq-help-icon w-[54px] h-[54px] inline-flex items-center justify-center border border-[rgba(var(--rgb-light-green),0.78)] rounded-full text-dark-green bg-[rgba(var(--rgb-light-green),0.18)]"
            aria-hidden="true"
          >
            <CircleHelp className="w-6 h-6" strokeWidth={1.7} />
          </div>
          <div className="faq-help-copy grid gap-2 min-w-0">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="heading font-heading font-medium text-text-primary tracking-[-0.03em] m-0 text-[clamp(1.6rem,3vw,2.35rem)] leading-[1.08]">
              {title}
            </h2>
            <p>{text}</p>
          </div>
          <div className="faq-help-action flex justify-end max-tablet:justify-start">
            <Button href={href} variant="secondary">
              <span>{label}</span>
              <ArrowRight
                className="button-arrow w-[15px] h-[15px] shrink-0 transition-transform duration-[180ms] ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                aria-hidden="true"
                strokeWidth={1.9}
              />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
