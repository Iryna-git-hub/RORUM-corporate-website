"use client";

import { useFormValue, type ArrayOfObjectsInputProps } from "sanity";
import { AllLanguagesRows } from "@/sanity/components/AllLanguagesRows";
import { EventLocaleAwareInput } from "@/sanity/components/EventLocaleAwareInput";

/**
 * Replacement input for `seo.title`/`seo.description`/`seo.ogImage.alt` —
 * the one shared "SEO" object type embedded in every page/legalPage/event/
 * siteSettings document (see sanity/schemaTypes/objects/seo.ts). Two
 * different locale behaviors, chosen by document type:
 *
 *   - `event` documents: delegates entirely to EventLocaleAwareInput, which
 *     already implements the correct behavior (only the event's own
 *     `visibleLocales` are shown/addable — see that file's own doc comment
 *     for exactly why the plugin's global "+ Add language" can't be scoped
 *     any other way). This preserves Event SEO's existing locale
 *     architecture unchanged — never weakens it, never adds DA/UK merely
 *     because this field was opened.
 *   - every other document (page/legalPage/siteSettings): always shows
 *     EN/DA/UK immediately via the shared `AllLanguagesRows` (same
 *     component RoleAwareAllLanguagesInput and SocialLinkLabelInput already
 *     use) — these are fixed, non-visibleLocales-gated documents, so there
 *     is no "which locales" question to answer; opening the field writes
 *     nothing, and only the locale the manager actually types into gets a
 *     lazily-inserted entry.
 *
 * One shared input reused across all 3 fields (not 3 near-duplicate
 * components) — the SEO schema itself is not duplicated by this file.
 */
export function SeoAllLanguagesInput(props: ArrayOfObjectsInputProps) {
  const documentType = useFormValue(["_type"]) as string | undefined;

  if (documentType === "event") {
    return <EventLocaleAwareInput {...props} />;
  }

  return <AllLanguagesRows {...props} />;
}
