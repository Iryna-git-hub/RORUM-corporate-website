import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { ArrowRight, CircleCheckBig } from "lucide-react";

export function EditorialCard({
  title,
  text,
  children,
}: {
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <Card className="p-[clamp(20px,3vw,4rem)]" variant="editorial">
      <h3 className="font-heading font-medium leading-[1.2] tracking-[-0.03em] text-text-primary">
        {title}
      </h3>
      {text ? <p>{text}</p> : null}
      {children}
    </Card>
  );
}

export function ServiceCard({
  title,
  text,
  href,
  image,
}: {
  title: string;
  text: string;
  href: string;
  image: string;
}) {
  return (
    <Card className="grid gap-4 min-h-full" variant="service">
      <div
        className="aspect-4/3 bg-secondary-soft bg-center bg-cover bg-no-repeat border-b border-border"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="p-[clamp(20px,3vw,4rem)]">
        <h3 className="m-0 font-heading font-light text-[clamp(20px,2vw,30px)] leading-[1.2]">
          {title}
        </h3>
        <p>{text}</p>
        <Link
          className="inline-flex items-center justify-center min-h-[42px] w-fit px-6 border border-primary rounded-pill bg-transparent text-primary-dark text-[12.5px] font-bold tracking-[0.02em] uppercase cursor-pointer [transition:transform_0.18s_ease,background_0.18s_ease,border-color_0.18s_ease,color_0.18s_ease] hover:-translate-y-px hover:bg-[rgba(var(--rgb-light-green),0.1)] hover:border-primary-dark hover:text-primary-dark focus-visible:bg-[rgba(var(--rgb-light-green),0.1)] focus-visible:border-primary-dark focus-visible:text-primary-dark"
          href={href}
        >
          Explore
        </Link>
      </div>
    </Card>
  );
}

export interface PackageItem {
  title: string;
  price: string;
  items: string[];
}

export function PackageCard({
  title,
  price,
  items,
  ctaHref,
  ctaLabel,
}: PackageItem & { ctaHref?: string; ctaLabel?: string }) {
  const priceMatch =
    typeof price === "string"
      ? price.match(/^(Price:\s*)?(.+?)\s+(ex VAT)$/i)
      : null;
  return (
    // Only ever rendered inside host-at-rorum's private-meeting-packages
    // section (red bg), so - unlike most shared components in this file -
    // its styling is baked in directly rather than parameterized: there's
    // no other call site to keep working. `!important` overrides Card's own
    // layered defaults (border/bg/shadow/text color).
    <Card className="p-[clamp(20px,3vw,4rem)] grid content-start gap-3 min-h-full bg-red! border-[rgba(var(--rgb-white),0.3)]! shadow-[0_16px_34px_rgba(var(--rgb-brown),0.09)]! text-white!">
      {/* `!important` on uppercase/tracking: Card's own `card` class is
          still targeted by the deferred `.card h3, .section-head h3 {
          text-transform: none; letter-spacing: 0 }` reset, which - being
          unlayered - beats a plain Tailwind utility regardless of order. */}
      <h3 className="m-0 font-body text-cream text-[clamp(1.125rem,1rem_+_1vw,1.5rem)] leading-[1.2] font-black tracking-[0.04em]! uppercase! border-b border-b-[rgba(var(--rgb-white),0.3)] pb-3.75">
        {title}
      </h3>
      <span className="flex flex-nowrap items-baseline gap-2 w-full text-cream text-xs font-bold">
        {priceMatch ? (
          <>
            {priceMatch[1] ? (
              <span className="hidden">{priceMatch[1].trim()}</span>
            ) : null}
            <span className="flex-none whitespace-nowrap text-white text-lg leading-[1.2] font-black">
              {priceMatch[2]}
            </span>
            <span className="flex-none whitespace-nowrap ml-1.25 text-[rgba(var(--rgb-cream),0.9)] text-[0.8125rem] leading-none font-medium normal-case tracking-normal">
              {priceMatch[3]}
            </span>
          </>
        ) : (
          price
        )}
      </span>
      {ctaHref && ctaLabel ? (
        <a
          className="group justify-self-stretch w-full min-h-[42px] mt-3.25 mb-5 inline-flex items-center justify-center gap-2 px-4.5 border border-cream rounded-pill bg-cream text-red text-xs font-bold tracking-[0.02em] uppercase cursor-pointer whitespace-nowrap"
          href={ctaHref}
        >
          <span>{ctaLabel}</span>
          <ArrowRight
            className="w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
            aria-hidden="true"
            strokeWidth={1.9}
          />
        </a>
      ) : null}
      <ul className="grid gap-2.5 m-0 p-0 list-none text-white text-base leading-[1.6]">
        {items.map((item) => (
          <li key={item} className="grid grid-cols-[18px_1fr] gap-2.5">
            <CircleCheckBig
              className="w-4.25 h-4.25 mt-1 text-cream"
              aria-hidden="true"
              strokeWidth={1.9}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function PackageGrid({
  items,
  ctaHref,
  ctaLabel,
}: {
  items: PackageItem[];
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-5.5 max-lg:grid-cols-1">
      {items.map((item) => {
        const packageHref = ctaHref
          ? ctaHref.includes("?")
            ? ctaHref
            : `${ctaHref.split("#")[0]}?package=${encodeURIComponent(item.title)}#${ctaHref.split("#")[1]}`
          : "";
        return (
          <PackageCard
            key={item.title}
            {...item}
            ctaHref={packageHref}
            ctaLabel={ctaLabel}
          />
        );
      })}
    </div>
  );
}

export function ImageGallery({ images }: { images: string[] }) {
  return (
    <div className="grid grid-cols-3 gap-5.5 max-lg:grid-cols-1">
      {images.map((image) => (
        <div
          key={image}
          className="border border-[rgba(var(--rgb-beige),0.42)] border-b-border rounded-none shadow-[0_12px_34px_rgba(var(--rgb-brown),0.045)] text-text-primary overflow-hidden aspect-4/3 bg-secondary-soft bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}
    </div>
  );
}
