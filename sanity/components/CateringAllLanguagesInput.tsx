"use client";

import { useFormValue, type ArrayOfObjectsInputProps } from "sanity";
import { AllLanguagesRows } from "@/sanity/components/AllLanguagesRows";
import { RoleAwareAllLanguagesInput } from "@/sanity/components/RoleAwareAllLanguagesInput";

// Every manager-facing PAGE document (`page-*`, `legalPage-*`) shows explicit
// English / Danish / Ukrainian inputs on every localized field that wires
// THIS input (`pageSection.label/title/text`, `contentItem.title/text`,
// `imageWithAlt.alt`, `ctaAction.label`) — Model B in the Phase 11 spec: all
// three locales always visible, no "+ Add language", no remove-language, no
// anonymous-array feel. Scoped by document id, not field, because on a page
// every one of these fields is manager-facing editorial copy that must exist
// in all 3 locales — there is no `event`-style `visibleLocales` subset to
// respect. (SEO fields don't wire this input and stay genuinely per-locale-
// optional; `mediaItem.alt` has its own always-3-rows input, GalleryMediaAltInput.)
//
// `event` is deliberately NOT matched here — it keeps its additive,
// per-event `visibleLocales` behaviour via EventLocaleAwareInput (the chain
// below). Global singletons don't wire this input at all.
function isAlwaysAllLanguagesDoc(documentId: string | undefined): boolean {
  const id = (documentId ?? "").replace(/^drafts\./, "");
  return id.startsWith("page-") || id.startsWith("legalPage-");
}

/**
 * Replacement input for the `internationalizedArrayString`/
 * `internationalizedArrayText` fields that wire it when the open document is
 * a manager-facing page (see `isAlwaysAllLanguagesDoc` above) — every
 * `page-*` / `legalPage-*` document's section labels/titles/text, item
 * titles/text, image alt text and CTA button labels render as fixed EN/DA/UK
 * rows. `event` documents fall through to `EventLocaleAwareInput` (additive
 * `visibleLocales` behaviour); global singletons don't wire this input.
 *
 * Root cause this fixes: sanity.config.ts's `internationalizedArray` plugin
 * is configured with `defaultLanguages: ["en"]` (site-wide) — a brand-new
 * field starts showing only an English row; the manager has to notice and
 * use the plugin's own "+ Add language" affordance to reveal Danish/
 * Ukrainian, and validation (correctly) blocks Publish once English alone
 * is filled in. Changing `defaultLanguages` globally was audited and
 * rejected: the plugin's own "auto-add default languages" effect runs for
 * EVERY internationalized-array field mounted anywhere in Studio (see
 * node_modules/sanity-plugin-internationalized-array's `InternationalizedArray`
 * component) and would insert stored (not just displayed) Danish/Ukrainian
 * entries into `event` fields the moment a manager opens an event whose
 * `visibleLocales` intentionally excludes those locales — the exact class
 * of regression sanity.config.ts's own comment already documents once
 * (turning stored-but-deselected-locale data into apparent validation
 * errors). A scoped Catering-only input avoids that risk entirely: EN/DA/UK
 * rows render unconditionally for THIS document only, and nothing is
 * written to the document until the manager actually types into a
 * previously-empty row (a lazy `insert`, matching EventLocaleAwareInput's
 * own `handleAdd` — never a silent auto-mutation from merely opening a
 * field).
 */
export function CateringAllLanguagesInput(props: ArrayOfObjectsInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;

  if (!isAlwaysAllLanguagesDoc(documentId)) {
    // Chained (not both wired independently) — an internationalizedArray*
    // field can only have one components.input. RoleAwareAllLanguagesInput
    // itself falls through to EventLocaleAwareInput for every unmatched
    // field/item, so every other document/field is unaffected.
    return <RoleAwareAllLanguagesInput {...props} />;
  }

  return <AllLanguagesRows {...props} />;
}
