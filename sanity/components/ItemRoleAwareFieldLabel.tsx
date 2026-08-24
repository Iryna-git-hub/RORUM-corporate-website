"use client";

import { useFormValue, type FieldProps } from "sanity";
import { fieldLabelForItemRole, type ContentItemField } from "@/sanity/schemaTypes/objects/contentItem";

/**
 * Wraps a contentItem field (title/text/value) to show the matched
 * ITEM_ROLE_RULES role's own field label (e.g. "Title" -> "Follow us
 * heading") when one is configured — same "wrap, don't replace" approach as
 * EventsStripLabelField, generalized across every field instead of one
 * fixed message for one fixed section. No schema field/attribute changes;
 * renders alongside the existing input unchanged, just overrides the label
 * text passed to it.
 *
 * `props.path`'s last segment is this field's own name (title/text/value);
 * `document`/`parent` are rebuilt the same way FaqQuestionAllLanguagesInput
 * does, since a React field/input component doesn't get them for free the
 * way a schema `validation`/`hidden` callback does.
 */
export function ItemRoleAwareFieldLabel(props: FieldProps) {
  const fieldName = props.path[props.path.length - 1] as ContentItemField | undefined;
  const documentId = useFormValue(["_id"]) as string | undefined;
  const sections = useFormValue(["sections"]) as unknown;
  const parentPath = props.path && props.path.length > 0 ? props.path.slice(0, -1) : undefined;
  const parent = useFormValue(parentPath ?? []) as unknown;
  const document = { _id: documentId, sections };

  const override = fieldName && parentPath ? fieldLabelForItemRole(fieldName, document, parent) : undefined;

  return props.renderDefault(override ? { ...props, title: override } : props);
}
