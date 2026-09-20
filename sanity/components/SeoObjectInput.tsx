"use client";

import { useEffect, useState } from "react";
import { useClient, useFormValue, type Image, type ObjectInputProps } from "sanity";
import { Badge, Box, Card, Flex, Select, Stack, Text } from "@sanity/ui";
import { resolveSeoField, EMERGENCY_SEO_DESCRIPTION, EMERGENCY_SEO_IMAGE_PATH, EMERGENCY_SEO_TITLE, type SeoFieldTier, type SeoValueSource } from "@/shared/seoResolution";
import { SITE_ORIGIN, buildUrl } from "@/shared/siteIdentity";
import { PAGE_SEO_DEFAULTS } from "@/shared/pageSeoDefaults";
import { urlForImage } from "@/sanity/lib/image";
import { portableTextToPlainText } from "@/lib/portableText";

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

interface I18nBodyEntry {
  language?: string;
  value?: unknown[];
}

function valueFor(entries: I18nEntry[] | undefined, locale: PreviewLocale): string | undefined {
  return entries?.find((e) => e.language === locale)?.value?.trim() || undefined;
}

function bodyValueFor(entries: I18nBodyEntry[] | undefined, locale: PreviewLocale): string | undefined {
  return portableTextToPlainText(entries?.find((entry) => entry.language === locale)?.value) || undefined;
}

/** Manager-friendly bilingual label for a resolved field's source tier — never the old "your override"/raw-technical wording. */
function sourceLabel(source: SeoValueSource, field: "title" | "description" | "image", documentType: string | undefined): string {
  if (field === "image") {
    switch (source) {
      case "documentOverride":
        return documentType === "siteSettings"
          ? "Site default social image / Загальне зображення сайту для соцмереж"
          : "Page-specific social image / Зображення для соцмереж, властиве цій сторінці";
      case "documentContent":
        return "Generated from the event's own photo / Сформовано з фото події";
      case "pageDefault":
        return "This page's approved default image / Затверджене зображення за замовчуванням для сторінки";
      case "siteDefault":
        return "Site default image / Загальне зображення сайту";
      case "emergencyDefault":
        return "Emergency fallback image / Резервне системне зображення";
    }
  }
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
  const eventFormattedDescription = useFormValue(["formattedDescription"]) as I18nBodyEntry[] | undefined;
  const eventImage = useFormValue(["image"]) as Image | undefined;

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
  const [siteDefault, setSiteDefault] = useState<
    { title?: I18nEntry[]; description?: I18nEntry[]; ogImage?: Image } | undefined
  >(undefined);
  useEffect(() => {
    if (documentType === "siteSettings") return; // editing the site default itself — nothing beneath it but the emergency fallback
    let cancelled = false;
    client
      .fetch<{ defaultSeo?: { title?: I18nEntry[]; description?: I18nEntry[]; ogImage?: Image } } | null>(
        `*[_type == "siteSettings"][0]{defaultSeo}`,
      )
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

  const value = props.value as { title?: I18nEntry[]; description?: I18nEntry[]; ogImage?: Image } | undefined;
  const route = routeForDocument(documentType, pageKey, slugCurrent);
  const canonicalUrl = route ? buildUrl(SITE_ORIGIN, localizedHref(route, locale)) : undefined;

  const documentOverrideTitle = valueFor(value?.title, locale);
  const documentOverrideDescription = valueFor(value?.description, locale);

  const titleTiers: SeoFieldTier[] = [{ source: "documentOverride", value: documentOverrideTitle }];
  const descriptionTiers: SeoFieldTier[] = [{ source: "documentOverride", value: documentOverrideDescription }];
  // Same documentOverride -> documentContent (events only) -> siteDefault ->
  // emergencyDefault chain as title/description, run through the exact same
  // `resolveSeoField` (shared/seoResolution.ts) — the priority this project
  // actually implements for social images (`seo.ogImageUrl` -> the event's
  // own photo -> the sitewide default -> the static emergency placeholder),
  // matching `resolveEventShareData()` (lib/eventSharing.ts) for events and
  // `localizedPageMetadata()` (lib/seo.ts) for every other page. Preview-only
  // thumbnails (`.width(160)`) — never the full-resolution asset — to keep
  // Studio load bandwidth-safe.
  const imageTiers: SeoFieldTier[] = [
    { source: "documentOverride", value: urlForImage(value?.ogImage)?.width(160).url() },
  ];

  if (isEvent) {
    const localizedEventTitle = valueFor(eventTitle, locale);
    titleTiers.push({ source: "documentContent", value: localizedEventTitle ? `${localizedEventTitle} | RORUM` : undefined });
    descriptionTiers.push({ source: "documentContent", value: bodyValueFor(eventFormattedDescription, locale) });
    imageTiers.push({ source: "documentContent", value: urlForImage(eventImage)?.width(160).url() });
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
    imageTiers.push({ source: "siteDefault", value: urlForImage(siteDefault?.ogImage)?.width(160).url() });
  }

  titleTiers.push({ source: "emergencyDefault", value: EMERGENCY_SEO_TITLE });
  descriptionTiers.push({ source: "emergencyDefault", value: EMERGENCY_SEO_DESCRIPTION });
  // The exact same static placeholder `localizedPageMetadata()` (lib/seo.ts)
  // falls back to when nothing else is set — joined with the deployed site
  // origin here purely for previewing (Studio has no other reachable origin
  // for a `/public` asset), never a second, independently-chosen fallback.
  imageTiers.push({ source: "emergencyDefault", value: buildUrl(SITE_ORIGIN, EMERGENCY_SEO_IMAGE_PATH) });

  const resolvedTitle = resolveSeoField(titleTiers);
  const resolvedDescription = resolveSeoField(descriptionTiers);
  const resolvedImage = resolveSeoField(imageTiers);
  // Deliberately title/description only, unchanged from before this image
  // preview was added — most documents legitimately have no image
  // override at all and rely on the sitewide default photo, so folding the
  // image tier into this note would make it fire on nearly every document
  // and defeat its purpose. The image's own fallback tier is still visible
  // via its badge just below, same as title/description.
  const anyFieldFellThrough = resolvedTitle.source !== "documentOverride" || resolvedDescription.source !== "documentOverride";

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
              This is the exact text and image that will be published — not a placeholder. / Це точний текст і зображення, які будуть опубліковані, а не заповнювач.
            </Text>
            <Flex gap={3} align="flex-start">
              {resolvedImage.value ? (
                // eslint-disable-next-line @next/next/no-img-element -- Studio plugin code, not a Next.js page; a small preview thumbnail, not the full asset.
                <img
                  src={resolvedImage.value}
                  alt="Resolved social sharing image preview"
                  width={96}
                  height={50}
                  style={{ objectFit: "cover", borderRadius: 4, border: "1px solid var(--card-border-color)", flexShrink: 0 }}
                />
              ) : null}
              <Stack space={2} flex={1}>
                <Text size={1} weight="semibold" style={{ color: "#1a0dab" }}>
                  {resolvedTitle.value}
                </Text>
                <Text size={1} muted>
                  {canonicalUrl ?? "(no public URL for this document)"}
                </Text>
                <Text size={1}>{resolvedDescription.value}</Text>
              </Stack>
            </Flex>
            <Box>
              <Badge tone={resolvedTitle.source === "documentOverride" ? "positive" : "primary"}>
                Title: {sourceLabel(resolvedTitle.source, "title", documentType)}
              </Badge>
              {" "}
              <Badge tone={resolvedDescription.source === "documentOverride" ? "positive" : "primary"}>
                Description: {sourceLabel(resolvedDescription.source, "description", documentType)}
              </Badge>
              {" "}
              <Badge tone={resolvedImage.source === "documentOverride" ? "positive" : "primary"}>
                Image: {sourceLabel(resolvedImage.source, "image", documentType)}
              </Badge>
            </Box>
            {anyFieldFellThrough ? (
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
