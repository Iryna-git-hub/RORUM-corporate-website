"use client";

import { insert, set, useFormValue, type ArrayOfObjectsInputProps } from "sanity";
import { Box, Card, Stack, Text, TextArea, TextInput } from "@sanity/ui";
import { FaqQuestionAllLanguagesInput } from "@/sanity/components/FaqQuestionAllLanguagesInput";

const LOCALE_ORDER = ["en", "da", "uk"] as const;
const LOCALE_TITLES: Record<string, string> = { en: "English", da: "Danish", uk: "Ukrainian" };

interface I18nEntry {
  _key: string;
  _type: string;
  language?: string;
  value?: string;
}

function isPageCateringMenuExamples(documentId: string | undefined): boolean {
  return documentId?.replace(/^drafts\./, "") === "page-catering-menu-examples";
}

/**
 * Replacement input for every `internationalizedArrayString`/
 * `internationalizedArrayText` field reachable from
 * `page-catering-menu-examples` (menu category label/title/text, dish
 * title/text, dish image alt) — scoped by a live document-id check, exactly
 * like CateringMenuSectionsInput/CateringOfferItemsInput. Every other
 * document falls through to `EventLocaleAwareInput` (which itself falls
 * through to the plugin's own default input for every non-`event`
 * document), so Home/About/Events/every other Catering page is unaffected.
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

  if (!isPageCateringMenuExamples(documentId)) {
    // Chained (not both wired independently) — an internationalizedArray*
    // field can only have one components.input. FaqQuestionAllLanguagesInput
    // itself falls through to EventLocaleAwareInput for every non-FAQ-
    // question item, so every other document/field is unaffected.
    return <FaqQuestionAllLanguagesInput {...props} />;
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
      // Lazily creates the entry on the manager's first keystroke — never on
      // mere mount/open, so opening a blank field never mutates the document.
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
