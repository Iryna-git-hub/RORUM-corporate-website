"use client";

import {
  ArrayOfObjectsItem,
  insert,
  PatchEvent,
  set,
  setIfMissing,
  useFormValue,
  type ArrayOfObjectsInputProps,
} from "sanity";
import { Box, Button, Card, Flex, Stack, Text, TextArea, TextInput } from "@sanity/ui";

// Fixed display order for the 3 supported website locales — independent of
// whatever order `visibleLocales` happens to store them in, so the field
// never visually reorders itself as an editor toggles checkboxes elsewhere
// in the form.
const LOCALE_ORDER = ["en", "da", "uk"] as const;
const LOCALE_TITLES: Record<string, string> = { en: "English", da: "Danish", uk: "Ukrainian" };

interface I18nEntry {
  _key: string;
  _type: string;
  language?: string;
  value?: unknown;
}

/**
 * Event-specific replacement input for every `internationalizedArrayString`/
 * `internationalizedArrayText`/`internationalizedArrayBodyPortableText`
 * field reachable from an `event` document
 * (directly, or nested inside `imageWithAlt`/`seo`/`shareSettings[]`/
 * `ticketProviderInfo`). Scoped to `event` documents only via a live
 * `_type` check — every other document type (Home/About/page/eventMessages/
 * etc., which also use these same shared object types) falls straight
 * through to `renderDefault` completely unmodified.
 *
 * This does NOT delegate to the plugin's own default array input
 * (`sanity-plugin-internationalized-array`'s `InternationalizedArray`
 * component) for `event` documents, because that component's "add language"
 * affordances are driven entirely by React context sourced from the
 * PLUGIN'S GLOBAL `languages` config (`sanity.config.ts`) — there is no
 * per-field or per-document prop that narrows which languages it offers to
 * add (confirmed by reading the plugin's source: `filteredLanguages` in
 * `InternationalizedArray` comes from `useInternationalizedArrayContext()`,
 * fed by the top-level plugin registration, filtered only by the separate,
 * unconfigured `@sanity/language-filter` plugin — never by anything this
 * component could pass in). Making that global config depend on
 * `visibleLocales` is exactly the mistake that broke Publish (see the
 * revert in sanity.config.ts) — the global registry must always recognize
 * all 3 locale codes so every already-stored entry stays valid.
 *
 * So instead, for `event` documents this fully replaces the array's UI:
 *   - renders one editable row per locale in `visibleLocales` that has (or
 *     is being given) a stored entry — editing patches only that entry's
 *     own `[{_key}, "value"]` path (`set`), never touching any other entry;
 *   - offers an "+ Add <Language>" button ONLY for locales that are both
 *     selected in `visibleLocales` AND don't already have a stored entry —
 *     inserting a new entry appends exactly one new array item (`insert`)
 *     without reading, copying, or rewriting any existing item;
 *   - never renders a row, or an add button, for a locale NOT in
 *     `visibleLocales` — an inactive-but-stored entry (e.g. a preserved
 *     Danish translation after Danish is deselected) is simply left out of
 *     what's rendered; it is never read, patched, unset, or otherwise
 *     touched by this component, so it reappears untouched the moment its
 *     locale is reselected;
 *   - renders Portable Text entries through Sanity's resolved object-item
 *     member so their nested `bodyPortableText` field keeps the native rich
 *     editor; string/text fields retain their compact primitive controls;
 *   - uses no CSS to hide anything — inactive rows and locked-out "add"
 *     options are absent from the render tree entirely, not hidden via a
 *     stylesheet.
 */
export function EventLocaleAwareInput(props: ArrayOfObjectsInputProps) {
  const documentType = useFormValue(["_type"]) as string | undefined;
  const visibleLocales = useFormValue(["visibleLocales"]) as unknown;

  if (documentType !== "event" || !Array.isArray(visibleLocales) || visibleLocales.length === 0) {
    return props.renderDefault(props);
  }

  const activeLocales = (visibleLocales as unknown[]).filter((l): l is string => typeof l === "string");
  const entries = ((props.value as unknown as I18nEntry[] | undefined) ?? []).filter(
    (entry): entry is I18nEntry => Boolean(entry?.language),
  );
  const isMultiline = props.schemaType.name === "internationalizedArrayText";
  const isPortableText = props.schemaType.name === "internationalizedArrayBodyPortableText";
  const valueTypeName = `${props.schemaType.name}Value`;
  const readOnly = Boolean(props.readOnly);

  function entryFor(locale: string) {
    return entries.find((entry) => entry.language === locale);
  }

  function handleValueChange(entry: I18nEntry, nextValue: string) {
    props.onChange(set(nextValue, [{ _key: entry._key }, "value"]));
  }

  function handleAdd(locale: string) {
    const newEntry: I18nEntry = {
      _key: locale,
      _type: valueTypeName,
      language: locale,
      value: isPortableText ? [] : "",
    };
    props.onChange(PatchEvent.from([setIfMissing([]), insert([newEntry], "after", [-1])]));
  }

  const orderedLocales = LOCALE_ORDER.filter((locale) => activeLocales.includes(locale));

  return (
    <Stack space={3}>
      {orderedLocales.map((locale) => {
        const entry = entryFor(locale);
        const title = LOCALE_TITLES[locale] ?? locale;

        if (!entry) {
          return (
            <Button
              key={locale}
              mode="ghost"
              tone="primary"
              text={`+ Add ${title}`}
              disabled={readOnly}
              onClick={() => handleAdd(locale)}
            />
          );
        }

        if (isPortableText) {
          const member = props.members.find((candidate) => candidate.kind === "item" && candidate.key === entry._key);
          if (!member || member.kind !== "item") return null;

          // The plugin has already resolved this locale's `value` field as
          // `bodyPortableText`. Sanity's native item renderer therefore keeps
          // the block array structured and supplies the Portable Text editor.
          return <ArrayOfObjectsItem {...props} key={member.key} member={member} />;
        }

        return (
          <Card key={entry._key} padding={3} radius={2} border>
            <Stack space={2}>
              <Flex align="center" justify="space-between">
                <Text size={1} weight="semibold">
                  {title}
                </Text>
              </Flex>
              <Box>
                {isMultiline ? (
                  <TextArea
                    rows={4}
                    value={typeof entry.value === "string" ? entry.value : ""}
                    readOnly={readOnly}
                    onChange={(event) => handleValueChange(entry, event.currentTarget.value)}
                  />
                ) : (
                  <TextInput
                    value={typeof entry.value === "string" ? entry.value : ""}
                    readOnly={readOnly}
                    onChange={(event) => handleValueChange(entry, event.currentTarget.value)}
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
