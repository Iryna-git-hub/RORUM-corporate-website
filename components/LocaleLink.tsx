"use client";

import NextLink, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { localizedHref } from "@/lib/i18n";
import { useLocale } from "@/lib/useLocale";

type Props = LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> & { href: string };

/**
 * Drop-in `next/link` replacement that locale-prefixes internal hrefs
 * automatically. Swap `import Link from "next/link"` for
 * `import { LocaleLink as Link } from "@/components/LocaleLink"` — the JSX
 * itself (`<Link href="/events">`) doesn't need to change at call sites.
 * External/absolute hrefs (`http...`, `mailto:`, `tel:`, `#anchor`) pass
 * through unmodified.
 */
export function LocaleLink({ href, ...rest }: Props) {
  const { locale } = useLocale();
  const isInternal = href.startsWith("/") && !href.startsWith("//");
  return <NextLink href={isInternal ? localizedHref(href, locale) : href} {...rest} />;
}
