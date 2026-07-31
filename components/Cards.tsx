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
    <Card className="card-pad" variant="editorial">
      <h3 className="heading">{title}</h3>
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
    <Card className="service-card" variant="service">
      <div
        className="service-media"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="card-pad">
        <h3>{title}</h3>
        <p>{text}</p>
        <Link className="btn secondary" href={href}>
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
    <Card className="package card-pad" variant="package">
      <h3 className="package-title">{title}</h3>
      <span className="tag package-price">
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
        <a className="btn package-select-cta" href={ctaHref}>
          <span>{ctaLabel}</span>
          <ArrowRight aria-hidden="true" strokeWidth={1.9} />
        </a>
      ) : null}
      <ul className="package-options">
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
    <div className="grid-3">
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
    <div className="grid-3">
      {images.map((image) => (
        <div
          key={image}
          className="card gallery-img"
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}
    </div>
  );
}
