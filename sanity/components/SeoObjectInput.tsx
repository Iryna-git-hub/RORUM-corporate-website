"use client";

import { useEffect, useState } from "react";
import { useClient, useFormValue, type ObjectInputProps } from "sanity";
import { Badge, Box, Card, Select, Stack, Text } from "@sanity/ui";
import { resolveSeoField, EMERGENCY_SEO_DESCRIPTION, EMERGENCY_SEO_TITLE, type SeoFieldTier, type SeoValueSource } from "@/shared/seoResolution";
import { PRODUCTION_ORIGIN, buildUrl } from "@/shared/siteIdentity";
import { PAGE_SEO_DEFAULTS } from "@/shared/pageSeoDefaults";

const LOCALE_OPTIONS = [
  { value: "en", title: "English" },
  { value: "da", title: "Danish" },
  { value: "uk", title: "Ukrainian" },
] as const;
type PreviewLocale = (typeof LOCALE_OPTIONS)[number]["value"];

// The exact `pageKey`/legalPage `pageKey` -> public route map — see the
// `pageByKeyQuery`/`legalPageQuery` call sites this mirrors (one per public
// route's own page.tsx). `cateringMenuExamples` is deliberately absent: it
// has no route of its own (see page.ts's own comment hiding this field for
// that one document) and must never gain a preview URL implying it has a
// public search-result entry. Also doubles as the key into
// shared/pageSeoDefaults.ts's PAGE_SEO_DEFAULTS table (same keys).
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

/** Manager-friendly bilingual label for a resolved field's source tier — never the old "your override"/raw-technical wording. */
function sourceLabel(source: SeoValueSource, field: "title" | "description", documentType: string | undefined): string {
  switch (source) {
    case "documentOverride":
      return documentType === "siteSettings"
        ? "Site default SEO value / Загальне значення SEO сайту"
        : "Page-specific SEO value / Значення SEO, властиве цій сторінці";
    case "documentContent":
      return field === "title"
        ? "Generated from event title / Сформовано із заголовка події"
        : "Generated from event description / Сформовано з опису події";
    case "pageDefault":
      return "This page's approved default / Затверджене значення за замовчуванням для сторінки";
    case "siteDefault":
      return "Site default / Загальне значення сайту";
    case "emergencyDefault":
      return "Emergency fallback / Резервне системне значення";
  }
}

/**
 * Object-level wrapper for the shared `seo` type (chained onto
 * `props.renderDefault` — every field below renders exactly as
 * schema-defined, this only PREPENDS a preview) — shows the exact effective
 * title/description/canonical URL a visitor or search engine would actually
 * receive for the selected locale, and WHY (which tier of the shared
 * documentOverride -> documentContent -> pageDefault -> siteDefault ->
 * emergencyDefault chain supplied it), using the same
 * `shared/seoResolution.ts` resolver `lib/seo.ts` uses for the public route
 * — never an approximate, Studio-only fallback chain that could drift from
 * what's actually published (see MIGRATION_REPORT.md's SEO-preview
 * correction for the full defect this replaces).
 *
 * An Event document's locale selector is gated to its own `visibleLocales`
 * ("Show on website languages") — never offering a locale the public site
 * itself doesn't serve this event on. Every other document (page/legalPage/
 * siteSettings) always offers EN/DA/UK, matching those documents' own
 * always-all-languages editing model.
 */
export function SeoObjectInput(props: ObjectInputProps) {
  const documentType = useFormValue(["_type"]) as string | undefined;
  const pageKey = useFormValue(["pageKey"]) as string | undefined;
  const slugCurrent = useFormValue(["slug", "current"]) as string | undefined;
  const visibleLocalesRaw = useFormValue(["visibleLocales"]) as unknown;
  const eventTitle = useFormValue(["title"]) as I18nEntry[] | undefined;
  const eventLongDescription = useFormValue(["longDescription"]) as I18nEntry[] | undefined;

  const isEvent = documentType === "event";
  const activeLocales: readonly PreviewLocale[] = isEvent
    ? LOCALE_OPTIONS.map((o) => o.value).filter(
        (l) => Array.isArray(visibleLocalesRaw) && (visibleLocalesRaw as unknown[]).includes(l),
      )
    : LOCALE_OPTIONS.map((o) => o.value);

  // Derived during render, not synced via an effect+setState (which would
  // cascade an extra render every time `activeLocales` changes shape, e.g.
  // when an Event's `visibleLocales` loads) — the manager's own manual pick
  // is remembered, but the effective locale falls back to the first active
  // one whenever that pick isn't (or is no longer) one of them.
  const [manualLocale, setManualLocale] = useState<PreviewLocale | undefined>(undefined);
  const locale: PreviewLocale = manualLocale && activeLocales.includes(manualLocale) ? manualLocale : (activeLocales[0] ?? "en");

  const client = useClient({ apiVersion: "2025-02-19" });
  const [siteDefault, setSiteDefault] = useState<{ title?: I18nEntry[]; description?: I18nEntry[] } | undefined>(undefined);
  useEffect(() => {
    if (documentType === "siteSettings") return; // editing the site default itself — nothing beneath it but the emergency fallback
    let cancelled = false;
    client
      .fetch<{ defaultSeo?: { title?: I18nEntry[]; description?: I18nEntry[] } } | null>(`*[_type == "siteSettings"][0]{defaultSeo}`)
      .then((doc) => {
        if (!cancelled) setSiteDefault(doc?.defaultSeo ?? {});
      })
      .catch(() => {
        if (!cancelled) setSiteDefault({});
      });
    return () => {
      cancelled = true;
    };
  }, [client, documentType]);

  const value = props.value as { title?: I18nEntry[]; description?: I18nEntry[] } | undefined;
  const route = routeForDocument(documentType, pageKey, slugCurrent);
  const canonicalUrl = route ? buildUrl(PRODUCTION_ORIGIN, localizedHref(route, locale)) : undefined;

  const documentOverrideTitle = valueFor(value?.title, locale);
  const documentOverrideDescription = valueFor(value?.description, locale);

  const titleTiers: SeoFieldTier[] = [{ source: "documentOverride", value: documentOverrideTitle }];
  const descriptionTiers: SeoFieldTier[] = [{ source: "documentOverride", value: documentOverrideDescription }];

  if (isEvent) {
    const localizedEventTitle = valueFor(eventTitle, locale);
    titleTiers.push({ source: "documentContent", value: localizedEventTitle ? `${localizedEventTitle} | RORUM` : undefined });
    descriptionTiers.push({ source: "documentContent", value: valueFor(eventLongDescription, locale) });
  } else if (pageKey && PAGE_SEO_DEFAULTS[pageKey]) {
    // Static pages' own approved fallback (see shared/pageSeoDefaults.ts's
    // own doc comment) — currently a single English string per page,
    // matching every page.tsx's own real fallback behavior exactly (not a
    // per-locale translation this preview would otherwise have to invent).
    titleTiers.push({ source: "pageDefault", value: PAGE_SEO_DEFAULTS[pageKey].title });
    descriptionTiers.push({ source: "pageDefault", value: PAGE_SEO_DEFAULTS[pageKey].description });
  }

  if (documentType !== "siteSettings") {
    titleTiers.push({ source: "siteDefault", value: valueFor(siteDefault?.title, locale) });
    descriptionTiers.push({ source: "siteDefault", value: valueFor(siteDefault?.description, locale) });
  }

  titleTiers.push({ source: "emergencyDefault", value: EMERGENCY_SEO_TITLE });
  descriptionTiers.push({ source: "emergencyDefault", value: EMERGENCY_SEO_DESCRIPTION });

  const resolvedTitle = resolveSeoField(titleTiers);
  const resolvedDescription = resolveSeoField(descriptionTiers);

  return (
    <Stack space={4}>
      <Card padding={3} radius={2} border tone="primary">
        <Stack space={3}>
          <Box>
            <Select value={locale} onChange={(event) => setManualLocale(event.currentTarget.value as PreviewLocale)}>
              {LOCALE_OPTIONS.filter((option) => activeLocales.includes(option.value)).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.title}
                </option>
              ))}
            </Select>
          </Box>
          <Stack space={2}>
            <Text size={1} muted>
              This is the exact text that will be published — not a placeholder. / Це точний текст, який буде опубліковано, а не заповнювач.
            </Text>
            <Text size={1} weight="semibold" style={{ color: "#1a0dab" }}>
              {resolvedTitle.value}
            </Text>
            <Text size={1} muted>
              {canonicalUrl ?? "(no public URL for this document)"}
            </Text>
            <Text size={1}>{resolvedDescription.value}</Text>
            <Box>
              <Badge tone={resolvedTitle.source === "documentOverride" ? "positive" : "primary"}>
                Title: {sourceLabel(resolvedTitle.source, "title", documentType)}
              </Badge>
              {" "}
              <Badge tone={resolvedDescription.source === "documentOverride" ? "positive" : "primary"}>
                Description: {sourceLabel(resolvedDescription.source, "description", documentType)}
              </Badge>
            </Box>
            {resolvedTitle.source !== "documentOverride" || resolvedDescription.source !== "documentOverride" ? (
              <Text size={1} muted>
                This document&rsquo;s own SEO field is empty for this language — the metadata above is still valid and is exactly what will be emitted. /
                Власне поле SEO цього документа порожнє для цієї мови — метадані вище дійсні та є точним значенням, яке буде опубліковано.
              </Text>
            ) : null}
          </Stack>
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  );
}
