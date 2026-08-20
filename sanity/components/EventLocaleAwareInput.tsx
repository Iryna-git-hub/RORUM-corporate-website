"use client";

import { useFormValue, type ArrayOfObjectsInputProps, type InputProps } from "sanity";

/**
 * Filters which language rows an internationalized-array field actually
 * RENDERS down to the event's own `visibleLocales` ("Show on website
 * languages") — scoped to `event` documents only via a live `_type` check;
 * every other document type (Home/About/page/eventMessages/etc.) falls
 * straight through to `renderDefault` completely unmodified, since this
 * component is wired directly onto shared field types too (imageWithAlt.alt,
 * seo.title/.description/.ogImage.alt) that Home/About also use.
 *
 * Deliberately filters `members` (the rendered row list) ONLY — `value` and
 * `onChange` are handed to `renderDefault` untouched, so editing/adding a
 * VISIBLE row still goes through Sanity's own (and the
 * sanity-plugin-internationalized-array's own) array-of-objects editing,
 * which already patches exactly one item by `_key` rather than rewriting
 * the whole array. Concretely, this means:
 *   - a currently-inactive locale's stored entry is never read, patched, or
 *     removed by this component — it's simply excluded from `members`, so
 *     no row renders for it, and it stays in the document exactly as-is;
 *   - editing a visible entry's value patches only that entry's own
 *     `[{_key}, "value"]` path — every other entry (visible or hidden) is
 *     untouched, satisfied entirely by Sanity's existing per-item patching,
 *     not by anything reimplemented here;
 *   - reselecting a previously-deselected locale needs no "restore" logic:
 *     the filter is re-evaluated live against the same underlying `value`,
 *     so the moment its locale reappears in `visibleLocales`, its untouched
 *     stored entry is included in `members` again, original value intact;
 *   - adding a NEWLY-active locale with no stored entry yet uses the
 *     plugin's own "+ language" button, whose offered languages already
 *     come from the visibleLocales-aware `languages` callback configured in
 *     sanity.config.ts — it can only ever offer to add a currently-selected
 *     locale, and inserting a new item is an `insert`/`append` patch that
 *     cannot touch existing entries either.
 */
export function EventLocaleAwareInput(props: ArrayOfObjectsInputProps) {
  const documentType = useFormValue(["_type"]) as string | undefined;
  const visibleLocales = useFormValue(["visibleLocales"]) as unknown;

  if (documentType !== "event" || !Array.isArray(visibleLocales) || visibleLocales.length === 0) {
    return props.renderDefault(props as unknown as InputProps);
  }

  const activeLocales = new Set(visibleLocales as string[]);
  const filteredMembers = props.members.filter((member) => {
    if (member.kind !== "item") return true;
    const language = (member.item as unknown as { value?: { language?: string } }).value?.language;
    // No language yet (a row still being created) stays visible rather than
    // risk hiding something the editor is actively interacting with.
    return !language || activeLocales.has(language);
  });

  return props.renderDefault({ ...props, members: filteredMembers } as unknown as InputProps);
}
