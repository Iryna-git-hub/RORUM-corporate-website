"use client";

import { set, unset, useFormValue, type StringInputProps } from "sanity";
import { Select } from "@sanity/ui";
import { matchItemRoleInContext } from "@/sanity/schemaTypes/objects/contentItem";

export const CONTACT_FORM_FIELD_TYPES = [
  { value: "text", title: "Short text" },
  { value: "email", title: "Email" },
  { value: "phone", title: "Phone" },
  { value: "multiline", title: "Multiline text" },
] as const;

/**
 * Replacement input for a "Contact form field" item's `value` (Field type)
 * — a friendly dropdown of the 4 supported types instead of a free-text
 * box a manager could mistype. Every other item's `value` field (bank
 * details, etc.) falls through to the unmodified default string input.
 */
export function ContactFormFieldTypeInput(props: StringInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const sections = useFormValue(["sections"]) as unknown;
  const parentPath = props.path && props.path.length > 0 ? props.path.slice(0, -1) : undefined;
  const parent = useFormValue(parentPath ?? []) as unknown;
  const document = { _id: documentId, sections };

  const isContactFormField = Boolean(parentPath) && matchItemRoleInContext(document, parent)?.role === "Contact form field";
  if (!isContactFormField) {
    return props.renderDefault(props);
  }

  return (
    <Select
      value={props.value ?? "text"}
      readOnly={props.readOnly}
      onChange={(event) => {
        const next = event.currentTarget.value;
        props.onChange(next ? set(next) : unset());
      }}
    >
      {CONTACT_FORM_FIELD_TYPES.map((option) => (
        <option key={option.value} value={option.value}>
          {option.title}
        </option>
      ))}
    </Select>
  );
}
