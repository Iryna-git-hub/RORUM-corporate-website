"use client";

import { useFormValue, type ArrayOfObjectsInputProps } from "sanity";
import { EventLocaleAwareInput } from "@/sanity/components/EventLocaleAwareInput";
import { AllLanguagesRows } from "@/sanity/components/AllLanguagesRows";
import { isFaqQuestionRole, matchItemRoleInContext } from "@/sanity/schemaTypes/objects/contentItem";

function isFaqCategoryTitleField(props: ArrayOfObjectsInputProps, parent: unknown): boolean {
  const fieldName = props.path[props.path.length - 1];
  if (fieldName !== "title") return false;
  return (parent as { sectionKind?: string } | undefined)?.sectionKind === "faqCategory";
}

/**
 * True for any `contentItem` whose ITEM_ROLE_RULES role is a Contact one —
 * generic on purpose: every Contact reserved role (Follow-us heading,
 * Submit button, Success message, a Contact form field's Label, the FAQ
 * prompt question/link text) needs the same always-show-3-languages
 * treatment, and new Contact roles added later get it automatically
 * without another one-off check being added here. Named by role prefix,
 * not by an enumerated list, so this can never silently drift from
 * contentItem.ts's own role table.
 */
function isContactRole(document: unknown, parent: unknown): boolean {
  return Boolean(matchItemRoleInContext(document, parent)?.role.startsWith("Contact "));
}

/**
 * Replacement input for every localized field across the shared
 * `pageSection`/`contentItem` architecture that needs to always show
 * EN/DA/UK, decided by the SAME `ITEM_ROLE_RULES`/sectionKind mechanism
 * validation itself uses (so this can never drift from what Publish
 * actually requires) — a FAQ category's Title, a FAQ question's Question/
 * Answer, and every Contact-only role's own localized field(s). Chained
 * onto `CateringAllLanguagesInput.tsx` (see that file), which is the actual
 * `components.input` on the underlying field types — an
 * internationalizedArray* field can only have one.
 *
 * Renamed from an earlier "FaqQuestionAllLanguagesInput" — the FAQ-only
 * name stopped describing what this component actually does once Contact's
 * roles were added on top of it; the CHECK is what's domain-specific here,
 * not the rendering, which now lives in the shared `AllLanguagesRows`.
 *
 * Every other field/document falls through to EventLocaleAwareInput,
 * unaffected — including a FAQ category's own (hidden) text/label fields,
 * which never reach this branch since `fieldName !== "title"`.
 */
export function RoleAwareAllLanguagesInput(props: ArrayOfObjectsInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const sections = useFormValue(["sections"]) as unknown;
  // A field path is always present on a real, mounted Studio input — an
  // undefined/empty path only happens in a test double that doesn't set one
  // (see CateringAllLanguagesInput.test.tsx's fakeProps()). Same fail-safe
  // direction as GalleryMediaAltInput's `recognized` check: an unrecognized
  // shape is never treated as a matched role.
  const parentPath = props.path && props.path.length > 0 ? props.path.slice(0, -1) : undefined;
  const parent = useFormValue(parentPath ?? []) as unknown;
  const document = { _id: documentId, sections };

  const applies = Boolean(parentPath) && (isFaqQuestionRole(document, parent) || isFaqCategoryTitleField(props, parent) || isContactRole(document, parent));
  if (!applies) {
    return <EventLocaleAwareInput {...props} />;
  }

  return <AllLanguagesRows {...props} />;
}
