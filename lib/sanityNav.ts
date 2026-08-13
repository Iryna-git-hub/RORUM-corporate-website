import { pickLocalized, type I18nEntry } from "@/lib/sanity-i18n";
import type { Locale } from "@/lib/i18n";
import { navItems as staticNavItems, type NavItem } from "@/lib/data";

type Localized = I18nEntry<string>[] | null | undefined;

interface SanityNavChild {
  href?: string | null;
  label?: Localized;
}
interface SanityNavItem {
  href?: string | null;
  label?: Localized;
  children?: SanityNavChild[] | null;
}

export function resolveNavItems(items: SanityNavItem[] | null | undefined, locale: Locale): NavItem[] {
  if (!items?.length) return staticNavItems;
  const resolved = items
    .map((item): NavItem | null => {
      const label = pickLocalized(item.label, locale);
      if (!label) return null;
      if (item.children?.length) {
        const children = item.children
          .map((c) => {
            const childLabel = pickLocalized(c.label, locale);
            return c.href && childLabel ? { href: c.href, label: childLabel } : null;
          })
          .filter((c): c is { href: string; label: string } => c !== null);
        return { href: null, label, children };
      }
      return item.href ? { href: item.href, label } : null;
    })
    .filter((item): item is NavItem => item !== null);
  return resolved.length ? resolved : staticNavItems;
}

interface SanityFooterColumn {
  title?: Localized;
  links?: { href?: string | null; label?: Localized }[] | null;
}
interface SanityFooterDoc {
  columns?: SanityFooterColumn[] | null;
  legalLinks?: { href?: string | null; label?: Localized }[] | null;
  copyrightText?: Localized;
  contactDetailsLabel?: Localized;
}

export interface ResolvedFooter {
  columns: { title: string; links: { href: string; label: string }[] }[];
  legalLinks: { href: string; label: string }[];
  copyrightText?: string;
  contactDetailsLabel?: string;
}

export function resolveFooter(doc: SanityFooterDoc | null | undefined, locale: Locale): ResolvedFooter | null {
  if (!doc?.columns?.length) return null;
  const columns = doc.columns.map((c) => ({
    title: pickLocalized(c.title, locale) ?? "",
    links: (c.links ?? [])
      .map((l) => {
        const label = pickLocalized(l.label, locale);
        return l.href && label ? { href: l.href, label } : null;
      })
      .filter((l): l is { href: string; label: string } => l !== null),
  }));
  const legalLinks = (doc.legalLinks ?? [])
    .map((l) => {
      const label = pickLocalized(l.label, locale);
      return l.href && label ? { href: l.href, label } : null;
    })
    .filter((l): l is { href: string; label: string } => l !== null);
  return {
    columns,
    legalLinks,
    copyrightText: pickLocalized(doc.copyrightText, locale),
    contactDetailsLabel: pickLocalized(doc.contactDetailsLabel, locale),
  };
}
