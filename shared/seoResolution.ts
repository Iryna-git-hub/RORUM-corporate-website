// The one semantic SEO-resolution contract shared between the public
// metadata generator (lib/seo.ts) and the Sanity Studio SEO preview
// (sanity/components/SeoObjectInput.tsx) — dependency-free (no React,
// Next.js, Sanity, browser APIs, or server-only environment modules), same
// discipline as shared/siteIdentity.ts and shared/eventFilterDefinitions.ts.
//
// Each caller gathers its own tier VALUES (that part is inherently
// environment-specific: Next reads already-fetched page data, Studio reads
// `useFormValue`/a live Sanity client query) but both run those values
// through the exact same `resolveSeoField` — so "what wins, and why" can
// never quietly drift between what a visitor/search engine receives and
// what a manager is shown in Studio.
import { buildUrl } from "@/shared/siteIdentity";

/** Which tier of the fallback chain actually supplied a field's effective value. */
export type SeoValueSource =
  | "documentOverride"
  | "documentContent"
  | "pageDefault"
  | "siteDefault"
  | "emergencyDefault";

export interface SeoFieldTier {
  source: SeoValueSource;
  /** Untrimmed/possibly-empty candidate value for this tier — `resolveSeoField` trims and skips blank values itself. */
  value: string | undefined | null;
}

export interface SeoResolvedField {
  value: string;
  source: SeoValueSource;
}

/**
 * The one shared precedence rule: the first tier (in the order given) whose
 * trimmed value is non-empty wins. Callers supply tiers most-specific first
 * (e.g. documentOverride, then documentContent/pageDefault, then
 * siteDefault, then emergencyDefault) — this function has no opinion on
 * ordering, it only ever asks "is this tier non-empty" in the sequence it's
 * given.
 *
 * The LAST tier in the list is treated as the true floor: even if its own
 * value happens to be empty (a caller bug, not an expected state — every
 * real call site's last tier is a hardcoded non-empty emergency string),
 * this still returns *something* rather than throwing, so a resolution
 * failure can never crash metadata generation or the Studio preview.
 */
export function resolveSeoField(tiers: readonly SeoFieldTier[]): SeoResolvedField {
  for (const tier of tiers) {
    const trimmed = tier.value?.trim();
    if (trimmed) return { value: trimmed, source: tier.source };
  }
  const last = tiers[tiers.length - 1];
  return { value: last?.value?.trim() ?? "", source: last?.source ?? "emergencyDefault" };
}

export interface SeoResolutionResult {
  title: SeoResolvedField;
  description: SeoResolvedField;
  canonicalUrl: string;
}

/** Resolves title + description through `resolveSeoField` and builds the canonical URL from `origin`/`path` via `shared/siteIdentity.ts`'s `buildUrl` — one call for the full `{title, description, canonicalUrl}` contract described in MIGRATION_REPORT.md. */
export function resolveSeo(input: {
  origin: string;
  path: string;
  titleTiers: readonly SeoFieldTier[];
  descriptionTiers: readonly SeoFieldTier[];
}): SeoResolutionResult {
  return {
    title: resolveSeoField(input.titleTiers),
    description: resolveSeoField(input.descriptionTiers),
    canonicalUrl: buildUrl(input.origin, input.path),
  };
}

/**
 * The last-resort, hardcoded strings used only when NEITHER a document's own
 * SEO override NOR the sitewide `siteSettings.defaultSeo` has a value for a
 * given locale. Shared so `lib/seo.ts` and the Studio preview always show
 * the exact same emergency text rather than two similar-but-not-identical
 * hardcoded strings.
 */
export const EMERGENCY_SEO_TITLE = "RORUM";
export const EMERGENCY_SEO_DESCRIPTION = "RORUM — events, community and creative space in Copenhagen.";
