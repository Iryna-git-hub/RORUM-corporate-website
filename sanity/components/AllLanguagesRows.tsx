"use client";

import { insert, set, type ArrayOfObjectsInputProps } from "sanity";
import { Box, Card, Stack, Text, TextArea, TextInput } from "@sanity/ui";

const LOCALE_ORDER = ["en", "da", "uk"] as const;
const LOCALE_TITLES: Record<string, string> = { en: "English", da: "Danish", uk: "Ukrainian" };

interface I18nEntry {
  _key: string;
  _type: string;
  language?: string;
  value?: string;
}

/**
 * The actual EN/DA/UK "always show 3 rows" rendering — extracted so every
 * scoped wrapper (Catering Menu Examples' document-id check, the shared
 * role-aware check FAQ/Contact both use, socialLink's own always-on check)
 * renders identically instead of maintaining 3 near-duplicate copies of
 * this JSX. A caller decides WHETHER this should render at all; this
 * component only decides HOW, once that's already been decided.
 *
 * Lazy `insert` on first keystroke — never a silent auto-mutation from
 * merely opening a field. Root cause this exists to fix:
 * sanity.config.ts's `internationalizedArray` plugin only shows an English
 * row by default (`defaultLanguages: ["en"]`, site-wide — changing that
 * globally was audited and rejected, see CateringAllLanguagesInput.tsx's
 * own history), so a manager adding new content has to notice and use the
 * plugin's own "+ Add language" affordance twice before Publish is even
 * possible.
 */
export function AllLanguagesRows(props: ArrayOfObjectsInputProps) {
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
