"use client";

import { useState } from "react";
import { useFormValue, type ObjectInputProps } from "sanity";
import { Badge, Box, Card, Select, Stack, Text } from "@sanity/ui";

const LOCALE_OPTIONS = [
  { value: "en", title: "English" },
  { value: "da", title: "Danish" },
  { value: "uk", title: "Ukrainian" },
] as const;
type PreviewLocale = (typeof LOCALE_OPTIONS)[number]["value"];

// Kept local rather than imported from lib/i18n.ts — every other Studio
// component in this project avoids importing from lib/ (a Next-specific,
// server-oriented directory) into the separately-bundled Studio app; this
// is a small, disclosed duplication of the same 3 locale codes, not a new
// cross-boundary dependency.
const SITE_URL = "https://rorum.dk";

// The exact `pageKey`/legalPage `pageKey` -> public route map — see the
// `pageByKeyQuery`/`legalPageQuery` call sites this mirrors (one per public
// route's own page.tsx). `cateringMenuExamples` is deliberately absent: it
// has no route of its own (see page.ts's own comment hiding this field for
// that one document) and must never gain a preview URL implying it has a
// public search-result entry.
const PAGE_ROUTES: Record<string, string> = {
  home: "/",
  events: "/events",
  hostAtRorum: "/host-at-rorum",
  catering: "/catering",
  eventDecoration: "/event-decoration",
  communityMembership: "/community-membership",
  volunteer: "/volunteer",
  workWithUs: "/work-with-us",
  about: "/about",
  contact: "/contact",
  faq: "/faq",
};
const LEGAL_ROUTES: Record<string, string> = {
  terms: "/terms",
  "privacy-policy": "/privacy-policy",
  "cookie-policy": "/cookie-policy",
};

function localizedHref(path: string, locale: PreviewLocale): string {
  return locale === "en" ? path : `/${locale}${path}`;
}

function routeForDocument(documentType: string | undefined, pageKey: string | undefined, slug: string | undefined): string | undefined {
  if (documentType === "page" && pageKey) return PAGE_ROUTES[pageKey];
  if (documentType === "legalPage" && pageKey) return LEGAL_ROUTES[pageKey];
  if (documentType === "event" && slug) return `/events/${slug}`;
  return undefined;
}

interface I18nEntry {
  language?: string;
  value?: string;
}

function valueFor(entries: I18nEntry[] | undefined, locale: PreviewLocale): string | undefined {
  return entries?.find((e) => e.language === locale)?.value?.trim() || undefined;
}

/**
 * Object-level wrapper for the shared `seo` type (chained onto
 * `props.renderDefault` — every field below renders exactly as schema-
 * defined, this only PREPENDS a preview) — adds a locale-selectable search-
 * result preview showing the actual stored title/description for that
 * locale, and whether each is a manager override or currently unset (in
 * which case this page's own approved fallback, or the sitewide Default
 * SEO, is what will actually show — this preview intentionally does not
 * re-implement that per-document fallback chain, which differs by document
 * type and already lives in lib/seo.ts; claiming byte-for-byte accuracy
 * here would risk silently drifting from that resolver over time).
 *
 * `cateringMenuExamples` (no route of its own) and `siteSettings.defaultSeo`
 * (not a page, no single URL) both render with no preview URL — the card
 * still shows title/description override status for those.
 */
export function SeoObjectInput(props: ObjectInputProps) {
  const [locale, setLocale] = useState<PreviewLocale>("en");
  const documentType = useFormValue(["_type"]) as string | undefined;
  const pageKey = useFormValue(["pageKey"]) as string | undefined;
  const slugCurrent = useFormValue(["slug", "current"]) as string | undefined;

  const value = props.value as { title?: I18nEntry[]; description?: I18nEntry[] } | undefined;
  const title = valueFor(value?.title, locale);
  const description = valueFor(value?.description, locale);
  const route = routeForDocument(documentType, pageKey, slugCurrent);
  const url = route ? `${SITE_URL}${localizedHref(route, locale)}` : undefined;

  return (
    <Stack space={4}>
      <Card padding={3} radius={2} border tone="primary">
        <Stack space={3}>
          <Box>
            <Select value={locale} onChange={(event) => setLocale(event.currentTarget.value as PreviewLocale)}>
              {LOCALE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.title}
                </option>
              ))}
            </Select>
          </Box>
          <Stack space={2}>
            <Text size={1} weight="semibold" style={{ color: "#1a0dab" }}>
              {title ?? "(not set for this language — the page's own default title, or the sitewide Default SEO, will show instead)"}
            </Text>
            <Text size={1} muted>
              {url ?? "(no public URL for this document)"}
            </Text>
            <Text size={1}>
              {description ?? "(not set for this language — the page's own default description, or the sitewide Default SEO, will show instead)"}
            </Text>
            <Box>
              {title ? <Badge tone="positive">Title: your override</Badge> : <Badge tone="caution">Title: using fallback</Badge>}
              {" "}
              {description ? <Badge tone="positive">Description: your override</Badge> : <Badge tone="caution">Description: using fallback</Badge>}
            </Box>
          </Stack>
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  );
}
