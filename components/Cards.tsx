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
    <Card className="package p-[clamp(20px,3vw,4rem)]" variant="package">
      <h3>{title}</h3>
      <span className="tag">
        {priceMatch ? (
          <>
            {priceMatch[1] ? (
              <span className="package-price-label">
                {priceMatch[1].trim()}
              </span>
            ) : null}
            <span className="package-price-main">{priceMatch[2]}</span>
            <span className="package-price-vat">{priceMatch[3]}</span>
          </>
        ) : (
          price
        )}
      </span>
      {ctaHref && ctaLabel ? (
        <a
          className="package-select-cta inline-flex items-center justify-center border border-primary rounded-pill bg-primary text-white tracking-[0.02em] uppercase cursor-pointer [transition:transform_0.18s_ease,background_0.18s_ease,border-color_0.18s_ease,color_0.18s_ease] hover:-translate-y-px hover:bg-primary-dark hover:border-primary-dark hover:text-white active:bg-primary-darker active:border-primary-darker"
          href={ctaHref}
        >
          <span>{ctaLabel}</span>
          <ArrowRight aria-hidden="true" strokeWidth={1.9} />
        </a>
      ) : null}
      <ul>
        {items.map((item) => (
          <li key={item}>
            <CircleCheckBig aria-hidden="true" strokeWidth={1.9} />
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
    <div className="grid grid-cols-3 gap-5.5 max-[980px]:grid-cols-1">
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
    <div className="grid grid-cols-3 gap-5.5 max-[980px]:grid-cols-1">
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
