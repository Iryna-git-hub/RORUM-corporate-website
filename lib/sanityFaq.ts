// Canonical-vs-legacy resolution for the FAQ page's category groups — same
// missing/intentionally-empty/present 3-way policy established for gallery
// media this session (see lib/sanityGallery.ts's resolveCanonicalGalleryItems
// and its own doc comment for the full rationale). Extracted here rather
// than inlined in app/[locale]/(site)/faq/page.tsx so the policy has one
// place to read and one place to test.

import type { Locale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/sanity-i18n";
import type { RawPageSection } from "@/lib/sanity-sections";
import type { FaqGroupData } from "@/components/FAQAccordion";

interface LegacyI18nEntry {
  _key: string;
  language?: string;
  value?: string;
}

interface LegacyFaqGroup {
  title?: LegacyI18nEntry[] | null;
  items?: { question?: LegacyI18nEntry[] | null; answer?: LegacyI18nEntry[] | null }[] | null;
}

/**
 * `newPageSections` is the canonical `page-faq` document's `sections[]` —
 * `undefined` means the canonical page itself doesn't exist yet (Sanity
 * unavailable, or migration not done); an empty array (no `sectionKey`
 * starting "group-") means the manager has intentionally deleted every FAQ
 * category, which must render an empty state, never resurrect `legacyGroups`.
 * `legacyGroups` is the old `faqPage.groups[]` singleton — read only when
 * `newPageSections` is `undefined`.
 */
export function resolveCanonicalFaqGroups(
  newPageSections: RawPageSection[] | null | undefined,
  legacyGroups: LegacyFaqGroup[] | null | undefined,
  locale: Locale,
): FaqGroupData[] | undefined {
  if (newPageSections == null) {
    return legacyGroups?.length
      ? legacyGroups.map((group) => ({
          title: pickLocalized(group.title, locale) ?? "",
          items: (group.items ?? []).map((item) => ({
            question: pickLocalized(item?.question, locale) ?? "",
            answer: pickLocalized(item?.answer, locale) ?? "",
          })),
        }))
      : undefined;
  }

  const groupSections = newPageSections.filter((s) => s.sectionKey?.startsWith("group-"));
  return groupSections.map((group) => ({
    title: pickLocalized(group.title, locale) ?? "",
    items: (group.items ?? []).map((item) => {
      const href = item.href?.trim();
      const label = pickLocalized(item.label, locale);
      return {
        question: pickLocalized(item.title, locale) ?? "",
        answer: pickLocalized(item.text, locale) ?? "",
        link: href && label ? { href, label } : undefined,
      };
    }),
  }));
}
