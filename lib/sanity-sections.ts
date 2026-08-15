// Generic lookup helpers for the compact `page` + `sections[]` content model
// (see sanity/schemaTypes/documents/page.ts, MIGRATION_REPORT.md). Each page
// component looks up its known sections/items/actions by the stable keys the
// migration script wrote (e.g. `getSection(page.sections, "hero")`), then
// reads fields with the existing `pickLocalized`/`pickLabel` helpers — this
// file only finds things by key, it doesn't know what any particular page
// looks like.

interface I18nEntry {
  _key: string;
  _type?: string;
  language?: string;
  value?: string;
}

export interface RawImage {
  asset?: { _ref?: string; _id?: string } | null;
}

export interface RawMediaItem {
  _key: string;
  kind?: string | null;
  image?: RawImage | null;
  videoFile?: { asset?: { _ref?: string; _id?: string } | null } | null;
  videoUrl?: string | null;
  posterImage?: RawImage | null;
  alt?: I18nEntry[] | null;
  caption?: I18nEntry[] | null;
}

export interface RawCtaAction {
  _key: string;
  actionKey?: string | null;
  label?: I18nEntry[] | null;
  linkType?: string | null;
  href?: string | null;
  openInNewTab?: boolean | null;
  enabled?: boolean | null;
}

export interface RawContentItem {
  _key: string;
  itemKey?: string | null;
  icon?: string | null;
  title?: I18nEntry[] | null;
  text?: I18nEntry[] | null;
  image?: (RawImage & { alt?: I18nEntry[] | null }) | null;
  href?: string | null;
  label?: I18nEntry[] | null;
  value?: string | null;
}

export interface RawPageSection {
  _key: string;
  sectionKey?: string | null;
  sectionKind?: string | null;
  label?: I18nEntry[] | null;
  title?: I18nEntry[] | null;
  text?: I18nEntry[] | null;
  media?: RawMediaItem[] | null;
  actions?: RawCtaAction[] | null;
  items?: RawContentItem[] | null;
  settings?: { key?: string | null; value?: string | null }[] | null;
}

export interface RawPage {
  _id: string;
  pageKey?: string | null;
  sections?: RawPageSection[] | null;
}

export function getSection(sections: RawPageSection[] | null | undefined, key: string): RawPageSection | undefined {
  return sections?.find((s) => s.sectionKey === key);
}

export function getItem(section: RawPageSection | undefined, key: string): RawContentItem | undefined {
  return section?.items?.find((i) => i.itemKey === key);
}

export function getAction(section: RawPageSection | undefined, key: string): RawCtaAction | undefined {
  return section?.actions?.find((a) => a.actionKey === key);
}

export function getSetting(section: RawPageSection | undefined, key: string): string | undefined {
  return section?.settings?.find((s) => s.key === key)?.value ?? undefined;
}

/** Every item whose `itemKey` is NOT one of the given reserved keys — i.e. the "free-form list" part of a section's items. */
export function listItems(section: RawPageSection | undefined, reservedKeys: string[]): RawContentItem[] {
  return (section?.items ?? []).filter((i) => !i.itemKey || !reservedKeys.includes(i.itemKey));
}
