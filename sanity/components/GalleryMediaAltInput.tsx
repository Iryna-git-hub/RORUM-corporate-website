"use client";

import { insert, set, useFormValue, type ArrayOfObjectsInputProps } from "sanity";
import { Box, Card, Stack, Text, TextInput } from "@sanity/ui";
import { EventLocaleAwareInput } from "@/sanity/components/EventLocaleAwareInput";
import { isInformativeMedia } from "@/sanity/lib/galleryMediaContext";

const LOCALE_ORDER = ["en", "da", "uk"] as const;
const LOCALE_TITLES: Record<string, string> = { en: "English", da: "Danish", uk: "Ukrainian" };

interface I18nEntry {
  _key: string;
  _type: string;
  language?: string;
  value?: string;
}

/**
 * Rebuilds the `{ _id, sections }` document shape and `{ _key }` parent
 * shape `isInformativeMedia` expects, from the Studio form-state values
 * available to an input component (`_id`, the whole `sections[]` array, and
 * this field's own `path`) — a schema `validation` callback gets `document`/
 * `parent` for free from Sanity; a React input component has to assemble
 * the equivalent itself. `path[3]` is the mediaItem's own `{_key}` in the
 * `sections[_key].media[_key].alt` shape this field always has; any other
 * path shape (a mediaItem alt field this component doesn't recognize) is
 * treated as "not informative" — falls through to the default input, never
 * guessing.
 */
function useMediaAltContext(path: ArrayOfObjectsInputProps["path"]): { recognized: boolean; document: unknown; parent: unknown } {
  const documentId = useFormValue(["_id"]) as string | undefined;
  const sections = useFormValue(["sections"]) as { _key?: string; sectionKey?: string; media?: { _key?: string }[] }[] | undefined;
  const mediaRef = path[3];
  const mediaKey = typeof mediaRef === "object" && mediaRef !== null && "_key" in mediaRef ? mediaRef._key : undefined;
  if (path[0] !== "sections" || path[2] !== "media" || !mediaKey) {
    // `recognized: false` is checked BEFORE isInformativeMedia is ever
    // called with this undefined document/parent — isInformativeMedia is
    // the inverse of "is this Home's decorative background", so an
    // undefined document would otherwise fail the Home check and come back
    // "informative" (true) by accident, the wrong fail-safe direction for
    // a path shape this component doesn't even recognize.
    return { recognized: false, document: undefined, parent: undefined };
  }
  return { recognized: true, document: { _id: documentId, sections }, parent: { _key: mediaKey } };
}

/**
 * Replacement input for `mediaItem.alt` (internationalizedArrayString),
 * scoped via `isInformativeMedia` — the EXACT inverse of
 * `isHomeDecorativeBackgroundMedia` (galleryMediaContext.ts), the same
 * predicate mediaItem.ts's own `hidden`/`validation` already use. This is
 * deliberately NOT scoped to "gallery" sections only, or to the 3
 * HorizontalGallery pages only: an earlier, narrower version of this scope
 * (gallery-section-only, 3-pages-only) missed a real Publish blocker on
 * Event Decoration's OWN `styling.media[image]` — informative, alt-
 * required, but outside "gallery" — leaving it stuck on the plugin's
 * default "English only, use + Add language" input while its sibling
 * gallery photos already had the always-visible fix. Using the SAME
 * predicate as validation makes that kind of scope drift structurally
 * impossible: wherever alt is genuinely required, this input applies;
 * wherever it's decorative (only Home's hero/communityTeaser background
 * media), it doesn't.
 *
 * Root cause this fixes — the same one CateringAllLanguagesInput already
 * fixed for Catering Menu Examples (see that component's own comment for
 * the full "why not just change defaultLanguages globally" reasoning):
 * sanity.config.ts's `internationalizedArray` plugin only shows an English
 * row by default, so a manager adding a new photo/video has to notice and
 * use the plugin's own "+ Add language" affordance THREE times before
 * Publish is even possible.
 *
 * Home's hero/communityTeaser background media (hidden entirely — this
 * input never even renders there) is the only case that falls through to
 * `EventLocaleAwareInput` (itself a pass-through to the plugin's default
 * input for non-`event` documents).
 */
export function GalleryMediaAltInput(props: ArrayOfObjectsInputProps) {
  const { recognized, document, parent } = useMediaAltContext(props.path);

  if (!recognized || !isInformativeMedia(document, parent)) {
    return <EventLocaleAwareInput {...props} />;
  }

  const entries = ((props.value as unknown as I18nEntry[] | undefined) ?? []).filter(
    (entry): entry is I18nEntry => Boolean(entry?.language),
  );
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
                <TextInput
                  value={entry?.value ?? ""}
                  readOnly={readOnly}
                  onChange={(event) => handleValueChange(locale, event.currentTarget.value)}
                />
              </Box>
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
