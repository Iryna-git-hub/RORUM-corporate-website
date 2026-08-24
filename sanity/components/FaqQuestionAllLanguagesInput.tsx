"use client";

import { insert, set, useFormValue, type ArrayOfObjectsInputProps } from "sanity";
import { Box, Card, Stack, Text, TextArea, TextInput } from "@sanity/ui";
import { EventLocaleAwareInput } from "@/sanity/components/EventLocaleAwareInput";
import { isFaqQuestionRole } from "@/sanity/schemaTypes/objects/contentItem";

const LOCALE_ORDER = ["en", "da", "uk"] as const;
const LOCALE_TITLES: Record<string, string> = { en: "English", da: "Danish", uk: "Ukrainian" };

interface I18nEntry {
  _key: string;
  _type: string;
  language?: string;
  value?: string;
}

function isFaqCategoryTitleField(props: ArrayOfObjectsInputProps, parent: unknown): boolean {
  const fieldName = props.path[props.path.length - 1];
  if (fieldName !== "title") return false;
  return (parent as { sectionKind?: string } | undefined)?.sectionKind === "faqCategory";
}

/**
 * Replacement input for two FAQ fields — a category's Title, and a
 * question's Question (title) / Answer (text) — chained onto
 * CateringAllLanguagesInput.tsx (see that file), which is the actual
 * `components.input` on all 3 underlying fields (pageSection.title and
 * contentItem.title/text share the same field type, so only one
 * `components.input` chain is possible for all of them). Rendering logic
 * mirrors CateringAllLanguagesInput exactly (EN/DA/UK rows shown
 * unconditionally, lazy `insert` on first keystroke, never a silent
 * auto-mutation from opening the field) — duplicated rather than shared
 * because the two inputs' *scoping* differs (a live document-id check there
 * vs. a role-in-context check here, via contentItem.ts's own
 * ITEM_ROLE_RULES/pageSection.ts's sectionKind, so this can never drift from
 * what Publish actually requires — see requiredWhen(isFaqQuestionRole, ...)
 * on contentItem's title/text and requiredWhen(isFaqCategorySection, ...)
 * on pageSection's title).
 *
 * Every other field/document falls through to EventLocaleAwareInput,
 * unaffected — including a FAQ category's own (hidden) text/label fields,
 * which never reach this branch since `fieldName !== "title"`.
 */
export function FaqQuestionAllLanguagesInput(props: ArrayOfObjectsInputProps) {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const sections = useFormValue(["sections"]) as unknown;
  // A field path is always present on a real, mounted Studio input — an
  // undefined/empty path only happens in a test double that doesn't set one
  // (see CateringAllLanguagesInput.test.tsx's fakeProps()). Same fail-safe
  // direction as GalleryMediaAltInput's `recognized` check: an unrecognized
  // shape is never treated as a FAQ field.
  const parentPath = props.path && props.path.length > 0 ? props.path.slice(0, -1) : undefined;
  const parent = useFormValue(parentPath ?? []) as unknown;
  const document = { _id: documentId, sections };

  const applies = Boolean(parentPath) && (isFaqQuestionRole(document, parent) || isFaqCategoryTitleField(props, parent));
  if (!applies) {
    return <EventLocaleAwareInput {...props} />;
  }

  const entries = ((props.value as unknown as I18nEntry[] | undefined) ?? []).filter(
    (entry): entry is I18nEntry => Boolean(entry?.language),
  );
  const isMultiline = props.schemaType.name === "internationalizedArrayText";
  const valueTypeName = `${props.schemaType.name}Value`;
  const readOnly = Boolean(props.readOnly);

  function entryFor(locale: string) {
    return entries.find((entry) => entry.language === locale);
  }

  function handleValueChange(locale: string, nextValue: string) {
    const existing = entryFor(locale);
    if (existing) {
      props.onChange(set(nextValue, [{ _key: existing._key }, "value"]));
    } else {
      const newEntry: I18nEntry = { _key: locale, _type: valueTypeName, language: locale, value: nextValue };
      props.onChange(insert([newEntry], "after", [-1]));
    }
  }

  return (
    <Stack space={3}>
      {LOCALE_ORDER.map((locale) => {
        const entry = entryFor(locale);
        const title = LOCALE_TITLES[locale] ?? locale;
        return (
          <Card key={locale} padding={3} radius={2} border>
            <Stack space={2}>
              <Text size={1} weight="semibold">
                {title}
              </Text>
              <Box>
                {isMultiline ? (
                  <TextArea
                    rows={4}
                    value={entry?.value ?? ""}
                    readOnly={readOnly}
                    onChange={(event) => handleValueChange(locale, event.currentTarget.value)}
                  />
                ) : (
                  <TextInput
                    value={entry?.value ?? ""}
                    readOnly={readOnly}
                    onChange={(event) => handleValueChange(locale, event.currentTarget.value)}
                  />
                )}
              </Box>
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
