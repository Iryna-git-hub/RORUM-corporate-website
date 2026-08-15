import type { ReactNode } from "react";
import { LocaleLink as Link } from "@/components/LocaleLink";
import { FAQInlinePrompt } from "@/components/FAQInlinePrompt";
import { getIconCardIcon } from "@/lib/iconCardIcons";
import { MessageCircle, MessagesSquare } from "lucide-react";

// NOTE ON THIS FILE'S MIGRATION APPROACH:
// Container/Section/SectionLabel/Card/HomeHero/FAQInlinePrompt/CTASection
// are fully Tailwind-driven now (context-dependent styling, e.g.
// `.home-hero-copy .label`, is resolved via each component's own
// `className` prop rather than a descendant selector living in
// globals.css). A few legacy class names are still deliberately kept
// present on their elements, for two different reasons:
//   1. `btn` (Button) and `heading`/`section-title` (SectionHeader,
//      CTASection's title) are still the ONLY styling source for many
//      other, not-yet-Tailwind-converted pages that apply these same
//      class names directly to their own elements — removing the CSS
//      would break those pages. Safe to remove once every consumer is
//      converted (tracked in MIGRATION_REPORT.md).
//   2. `card` stays because `.card h3, .package h3 { text-transform:
//      none; letter-spacing: 0 }` in globals.css is a narrow,
//      genuinely cross-cutting reset that's impractical to trace to
//      every Card consumer's children.
// The `.next-step-card-final .btn` / `.next-step-card-host .btn` pulse
// `@keyframes` animations (and their shared sizing/outline block) are also
// intentionally left as hand-written CSS — a deliberate "complex animation"
// exception, not a leftover.

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-[min(calc(100%_-_2.5rem),1180px)] max-w-[1180px] mx-auto max-sm:w-[min(calc(100%_-_2.5rem),100%)] ${className}`.trim()}
    >
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
      className={tight ? "py-[clamp(40px,6vw,76px)]" : "py-[clamp(52px,8vw,104px)]"}
    >
      {children}
    </section>
  );
}

export function SectionLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    // `label` is kept (deferred, like `btn`/`heading`/`section-head`): 18+
    // other, not-yet-converted pages reach into it with their own
    // `.some-hero .label { color: ...; border-bottom-color: ... }`
    // context overrides (see MIGRATION_REPORT.md for the full list).
    <span
      className={`label inline-flex items-center gap-[10px] text-red text-[0.78rem] font-extrabold tracking-[0.08em] uppercase w-fit border-b border-red ${className}`.trim()}
    >
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
  className = "",
  labelClassName = "",
  titleClassName = "",
  textClassName = "",
}: {
  label?: string;
  title: ReactNode;
  text?: string;
  level?: HeadingLevel;
  className?: string;
  labelClassName?: string;
  titleClassName?: string;
  textClassName?: string;
}) {
  // `level` is restricted to 1-6 above, so this is always a valid heading tag.
  const HeadingTag = `h${level}` as HeadingTagName;
  // `.section-head h3` in globals.css sets line-height:1.2 specifically for
  // h3 (vs. the generic `.section-title` rule's 1.25 for every other
  // level) - a real per-level variance, not an arbitrary leftover.
  const headingLeading = level === 3 ? "leading-[1.2]" : "leading-tight";
  return (
    // `section-head` is kept (deferred, like `btn`/`heading`): at least 6
    // other, not-yet-converted pages reach into it with their own
    // `.some-wrapper .section-head { margin-bottom: ... }`-style context
    // overrides (community-membership, home, host-at-rorum) - removing it
    // would silently drop their spacing until each of those is converted.
    // `className`/`labelClassName`/`titleClassName`/`textClassName` let a
    // caller supply its own context override (with `!important` since it's
    // competing against this component's own layered Tailwind defaults)
    // instead of reaching in via a `.context .section-head` CSS selector.
    <div className={`section-head grid gap-3.5 max-w-190 mb-7 ${className}`.trim()}>
      {label ? <SectionLabel className={labelClassName}>{label}</SectionLabel> : null}
      <HeadingTag
        className={`section-title font-heading font-medium text-text-primary m-0 text-[clamp(1.85rem,2.6vw,2.3rem)] ${headingLeading} tracking-normal normal-case ${titleClassName}`.trim()}
      >
        {title}
      </HeadingTag>
      {text ? <p className={textClassName}>{text}</p> : null}
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
  icon: "w-[46px] h-[46px] min-h-11.5 p-0 border border-primary rounded-full bg-primary text-white hover:bg-primary-dark hover:border-primary-dark active:bg-primary-darker active:border-primary-darker",
  "event-all":
    "min-h-[40px] w-fit gap-2 border border-primary-light rounded-pill px-[18px] py-[5px] bg-transparent text-primary-dark text-[12.5px] tracking-[0.02em] hover:bg-[rgba(var(--rgb-beige),0.14)] hover:border-primary-light hover:text-primary-dark",
};

export function Button({
  href,
  children,
  variant = "primary",
  className: extraClassName = "",
}: {
  href?: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  const variantClass = variant === "primary" ? "" : variant;
  const className =
    `btn inline-flex items-center justify-center font-bold uppercase cursor-pointer transition-all duration-[180ms] ease-[ease] group has-[.button-arrow]:gap-2 ${variantClass} ${BUTTON_VARIANT_CLASSES[variant]} ${extraClassName}`.trim();
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
    // `card` is kept (not just an inert legacy hook): `.card h3, .package
    // h3 { text-transform: none; letter-spacing: 0 }` in globals.css is a
    // narrow, genuinely cross-cutting reset for any heading a caller
    // happens to render inside a Card, impossible to trace to specific
    // call sites without auditing every Card consumer's children.
    <div
      className={`card border border-[rgba(var(--rgb-beige),0.42)] rounded-none bg-[rgba(var(--rgb-cream),0.72)] shadow-[0_12px_34px_rgba(var(--rgb-brown),0.045)] text-text-primary overflow-hidden ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export interface TrustItem {
  title: string;
  icon?: string;
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
  trustItems?: TrustItem[];
  image?: string;
  video?: string;
  actions?: ReactNode;
}) {
  return (
    <section
      className="home-hero-full relative min-h-[100svh] w-full grid items-center -mt-[78px] pt-[78px] bg-center bg-cover bg-no-repeat overflow-hidden max-sm:-mt-[68px] max-sm:pt-[68px]"
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
      <Container className="relative z-2">
        <div className="home-hero-copy w-[min(62%,730px)] grid gap-[22px] py-[clamp(42px,7vw,84px)] translate-y-[clamp(-42px,-3vw,-18px)] max-lg:w-[min(72vw,680px)] max-lg:translate-y-0 max-sm:w-full max-sm:-mt-[35%] max-sm:translate-y-0 max-sm:gap-[18px]">
          <SectionLabel className="text-beige! border-b-transparent!">{label}</SectionLabel>
          <h1 className="heading font-heading font-medium text-white text-[clamp(34px,3.95vw,66px)] leading-[1.1] tracking-[0] normal-case max-sm:text-[clamp(31px,9vw,42px)] max-sm:leading-[1.2]">
            {title}
          </h1>
          <p className="max-w-[58ch] m-0 text-text-on-image text-[18px] leading-[1.6]">{text}</p>
          {actions ? (
            <div className="flex flex-wrap gap-[12px]">
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
          className="home-hero-trust absolute inset-x-0 bottom-0 z-[2] grid grid-cols-4 gap-[18px] w-full m-0 py-[18px] px-[max(16px,calc((100vw_-_1180px)/2))] list-none bg-[rgba(var(--rgb-cream),0.14)] backdrop-blur-[12px] max-sm:grid-cols-1"
          aria-label="RORUM highlights"
        >
          {trustItems.map((item) => {
            const Icon = getIconCardIcon(item.icon);
            return (
              <li key={item.title}>
                <Icon
                  className="w-[22px] h-[22px] text-gold shrink-0"
                  aria-hidden="true"
                  strokeWidth={1.8}
                />
                <span>{item.title}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

// Lives in its own "use client" file (needs `useFormContent()` for its
// default question/label text), imported above and re-exported here so
// every existing `import { FAQInlinePrompt } from "@/components/ui"` keeps
// working.
export { FAQInlinePrompt };

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
  // Breakpoint note: the original CSS switched to the 2-column desktop
  // layout at `min-width:1024px` and to single-column at `max-width:980px`,
  // leaving a ~40px dead zone (981-1023px) where the *base* (unmediated)
  // 2-column rule applied. That sliver is folded into the single-column
  // (`lg:`) bucket here, matching this project's 981->1024 normalization
  // elsewhere — using `max-sm:` (640px) instead of `lg:` (1024px) here was
  // an earlier bug that produced 2 columns between 640-1023px.
  const cardVariantClass =
    variant === "final"
      ? "next-step-card-final relative isolate overflow-hidden grid grid-cols-1 items-center gap-x-[28px] gap-y-[28px] py-[clamp(42px,7vw,78px)] max-[360px]:py-9 text-cream rounded-none lg:items-start lg:grid-cols-[minmax(0,620px)_auto] lg:justify-start lg:gap-x-[clamp(18px,2.3vw,36px)] lg:gap-y-0 lg:min-h-[clamp(300px,34vw,420px)]"
      : variant === "host"
        ? "next-step-card-host relative isolate overflow-hidden flex items-center justify-start gap-[clamp(20px,7vw,100px)] py-[clamp(26px,4vw,44px)] rounded-none max-sm:grid"
        : "flex items-center justify-start gap-[clamp(20px,7vw,100px)] py-[clamp(26px,4vw,44px)] rounded-none max-sm:grid";
  // `!important`: Card's own className hardcodes an arbitrary-value
  // background/border/shadow, and Tailwind's utility sort order for
  // arbitrary-vs-named values of the same property isn't guaranteed to
  // match JSX string order, so a plain `bg-transparent` appended after it
  // isn't reliably guaranteed to win.
  const cardClass =
    `cta next-step-card px-0 bg-transparent! border-0! shadow-none! ${cardVariantClass} ${cardClassName}`.trim();

  const copyClass = `grid gap-[18px] max-w-[760px]${variant ? " relative z-[2]" : ""}`;

  const actionClass =
    variant === "final"
      ? "next-step-action relative z-[2] grid justify-items-end gap-[15px] min-w-[220px] p-[18px] max-lg:justify-items-start max-lg:min-w-0 lg:items-start lg:justify-items-start lg:min-w-[180px] lg:p-0 lg:mt-[clamp(48px,5.4vw,70px)] lg:mr-0 lg:transform-none"
      : variant === "host"
        ? "next-step-action relative z-[2] grid place-items-center gap-[15px] min-w-[220px] min-h-[132px]"
        : "next-step-action";

  // `.next-step-card .label` (host/default) sets font-weight:600, overriding
  // SectionLabel's own 800; `.next-step-card-final .label` (final) recolors
  // to gold instead. Both need `!important` because SectionLabel's base
  // `.label` class is still retained CSS (other, not-yet-converted pages
  // still reach into it), so it remains unlayered and would otherwise beat
  // a plain Tailwind override here.
  const eyebrowClassName =
    variant === "final"
      ? "text-gold! border-b-[rgba(var(--rgb-gold),0.72)]!"
      : "font-semibold!";
  // `text-cream!`: the h2 below still carries the (deferred, still-live)
  // `heading` class, whose unlayered `color: text-primary` would otherwise
  // beat a plain Tailwind color utility regardless of source order.
  const titleClassName =
    variant === "final"
      ? "text-cream! max-w-[13ch] text-[clamp(2.1rem,4vw,4rem)]"
      : "text-text-primary! text-[clamp(1.85rem,2.6vw,2.3rem)]";
  const textClassName =
    variant === "final"
      ? "m-0 max-w-[66ch] text-[rgba(var(--rgb-cream),0.9)] text-[clamp(16px,1.25vw,18px)] leading-[1.65]"
      : "m-0 text-dark-green leading-[1.65]";
  const isNotSure = className.includes("next-step-section-not-sure");

  return (
    <section className={sectionClass}>
      <Container className="relative z-2">
        <Card className={cardClass}>
          <div className={copyClass}>
            <SectionLabel className={eyebrowClassName}>{eyebrow}</SectionLabel>
            {/* No literal `heading` class here (unlike some other
                headings that keep it): its own line-height:1.2 would beat
                this element's intended 1.25 regardless of `!important`
                shenanigans, so every property it would have supplied is
                set directly below instead - same approach as
                SectionHeader's heading tag. */}
            <h2
              className={`font-heading font-medium m-0 leading-[1.25] tracking-[0] normal-case ${titleClassName}`}
            >
              {title}
            </h2>
            <p className={textClassName}>{text}</p>
            {links.length ? (
              <div className="flex flex-wrap gap-[10px] mt-1 max-sm:grid" aria-label="Suggested paths">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center min-h-9 py-2 px-3.75 border border-[rgba(var(--rgb-cream),0.22)] bg-[rgba(var(--rgb-cream),0.08)] text-cream text-xs font-semibold uppercase tracking-[0.04em] backdrop-blur-[10px] transition-[background,color,border-color] duration-200 ease-[ease] hover:bg-[rgba(var(--rgb-cream),0.16)] hover:border-[rgba(var(--rgb-gold),0.55)] hover:text-white max-sm:justify-center"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          {variant === "final" ? (
            <div
              className="absolute inset-0 z-[1] pointer-events-none flex items-center justify-end pr-[clamp(24px,4vw,80px)] text-[rgb(212,236,152)] opacity-[0.04] max-lg:transform-none max-lg:mt-0 max-lg:justify-center max-lg:pr-0"
              aria-hidden="true"
            >
              <MessagesSquare
                className="w-auto h-[95%] max-w-none translate-x-[8%] max-lg:h-[85%] max-lg:translate-x-0"
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
              <FAQInlinePrompt
                question={faqQuestion}
                label={faqLabel}
                className={`justify-self-center text-center ${isNotSure ? "pt-5" : ""} ${variant === "final" ? "text-[rgba(var(--rgb-cream),0.72)]!" : ""}`.trim()}
                linkClassName={variant === "final" ? "text-gold!" : ""}
              />
            ) : null}
          </div>
        </Card>
      </Container>
    </section>
  );
}

