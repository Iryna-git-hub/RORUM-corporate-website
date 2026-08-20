import { defineField, defineType } from "sanity";
import { IconPickerInput } from "@/sanity/components/IconPickerInput";
import { allOrNothingLanguages } from "@/sanity/lib/i18nValidation";

// The one generic "list row" shape reused across every page section's
// `items[]` — icon cards, numbered steps, quick-path cards, menu dishes,
// FAQ question/answer pairs, benefit cards, bank-detail rows, and small
// named form-copy rows (e.g. a row with itemKey "submitLabel"). One shared
// shape means these all reuse the same attribute paths regardless of how
// many pages/sections use them — see MIGRATION_REPORT.md.
//
// ITEM_ROLE_RULES is the machine-readable field-visibility matrix for every
// contentItem "role" audited so far (Home + About only — see
// lib/content-contracts/*-studio-visibility.ts for the audit this was
// derived from). Each row says: for items in this exact sectionKey whose
// itemKey matches this pattern, show only these generic fields — hide
// every other one, because the frontend genuinely never reads it for that
// role. `itemKey` itself is only listed in `visible` where the item is a
// user-extensible row an editor might reasonably want to see the (locked)
// lookup key for (matching quickPaths/hero-intro-link/etc. precedent) — role
// rows that are a fixed, closed set (trust badges, description, features)
// hide it entirely, same as the original hiddenForTrustBadge behaviour.
//
// Scoped by sectionKey + itemKey pattern together (not itemKey alone) so a
// future page reusing the same itemKey string for an unrelated role is never
// silently affected — e.g. "hero" is used by both Home and About, but their
// itemKey patterns (trust0-3 vs intro0/intro1) never overlap, so no extra
// document-level scoping is needed for this table specifically. No schema
// field or attribute path is added or removed by any of this — every field
// below already exists; only Studio's `hidden` presentation changes.
//
// Sections/pages NOT listed here (every other page's iconGrid/steps/etc.
// sections) are untouched — they keep showing every contentItem field
// exactly as before, pending their own future audit.
export const ALL_CONTENT_ITEM_FIELDS = ["itemKey", "icon", "title", "text", "image", "href", "label", "value"] as const;
type ContentItemField = (typeof ALL_CONTENT_ITEM_FIELDS)[number];

interface ItemRoleRule {
  /** Human label only — not used for matching, just for readability/debugging. */
  role: string;
  sectionKeys: readonly string[];
  itemKeyPattern: RegExp;
  visible: readonly ContentItemField[];
}

export const ITEM_ROLE_RULES: readonly ItemRoleRule[] = [
  { role: "Home hero trust badge", sectionKeys: ["hero"], itemKeyPattern: /^trust[0-3]$/, visible: ["icon", "title"] },
  { role: "Home quick-path card", sectionKeys: ["quickPaths"], itemKeyPattern: /^(events|hostAtRorum|catering|eventDecoration)$/, visible: ["itemKey", "icon", "title", "text", "image", "href", "label"] },
  { role: "Home editorial description", sectionKeys: ["editorialAttendEvents", "editorialHostAtRorum"], itemKeyPattern: /^description$/, visible: ["text"] },
  { role: "Home editorial feature bullet", sectionKeys: ["editorialAttendEvents", "editorialHostAtRorum"], itemKeyPattern: /^feature[0-3]$/, visible: ["icon", "title"] },
  { role: "Home service teaser card", sectionKeys: ["servicesTeaser"], itemKeyPattern: /^(catering|eventDecoration)$/, visible: ["title", "text", "label", "href", "image"] },
  { role: "Home community quick link", sectionKeys: ["communityTeaser"], itemKeyPattern: /^(wecoda|workWithUs|volunteer)$/, visible: ["href", "label"] },
  { role: "Closing CTA FAQ prompt row (Home + About)", sectionKeys: ["closingCta"], itemKeyPattern: /^(faqQuestion|faqLabel)$/, visible: ["title"] },
  { role: "Closing CTA suggested-path link (Home + About)", sectionKeys: ["closingCta"], itemKeyPattern: /^link[0-3]$/, visible: ["href", "label"] },
  { role: "About hero intro link", sectionKeys: ["hero"], itemKeyPattern: /^intro[01]$/, visible: ["itemKey", "icon", "href", "label"] },
  { role: "About statement service link", sectionKeys: ["statement"], itemKeyPattern: /^service[01]$/, visible: ["itemKey", "icon", "href", "label"] },
  { role: "About community link", sectionKeys: ["community"], itemKeyPattern: /^community[0-2]$/, visible: ["itemKey", "icon", "href", "label"] },
  { role: "About pillar card", sectionKeys: ["pillars"], itemKeyPattern: /^pillar[0-3]$/, visible: ["itemKey", "title", "text"] },
  {
    role: "Events filter/empty-state label",
    sectionKeys: ["filters"],
    itemKeyPattern: /^(dateLabel|languageLabel|priceLabel|availabilityLabel|soonestLabel|weekLabel|monthLabel|priceAscLabel|priceDescLabel|availableLabel|soldOutLabel|clearFiltersLabel|emptyStateTitle|emptyStateText)$/,
    visible: ["title"],
  },
];

export function matchItemRole(sectionKey: string | undefined, itemKey: string | undefined): ItemRoleRule | undefined {
  if (!sectionKey || !itemKey) return undefined;
  return ITEM_ROLE_RULES.find((rule) => rule.sectionKeys.includes(sectionKey) && rule.itemKeyPattern.test(itemKey));
}

// `parent` here is the contentItem object itself (has its own `_key` and
// `itemKey`) — it has no `sectionKey` of its own, so (same pattern as
// mediaItem.ts's isHomeDecorativeBackgroundMedia) the enclosing section is
// found by walking `document.sections`, matching on the item's own `_key`.
function findEnclosingSectionKey(document: unknown, parent: unknown): string | undefined {
  const doc = document as { sections?: { sectionKey?: string; items?: { _key?: string }[] }[] } | undefined;
  const itemObjectKey = (parent as { _key?: string } | undefined)?._key;
  if (!itemObjectKey) return undefined;
  return doc?.sections?.find((s) => s.items?.some((i) => i._key === itemObjectKey))?.sectionKey;
}

export function matchItemRoleInContext(document: unknown, parent: unknown): ItemRoleRule | undefined {
  const sectionKey = findEnclosingSectionKey(document, parent);
  const itemKey = (parent as { itemKey?: string } | undefined)?.itemKey;
  return matchItemRole(sectionKey, itemKey);
}

function hiddenByItemRole(fieldName: ContentItemField) {
  return ({ document, parent }: { document?: unknown; parent?: unknown }) => {
    const rule = matchItemRoleInContext(document, parent);
    if (!rule) return false; // no audited role for this item — every field stays visible, unchanged from before
    return !rule.visible.includes(fieldName);
  };
}

/**
 * A hidden field must never block publishing — reuses the exact same
 * hidden-by-role check as `hiddenByItemRole` above so a field's `hidden` and
 * `validation` can never drift out of sync. Any stray/partial data left in a
 * field the editor can no longer see (e.g. leftover from before a role's
 * ITEM_ROLE_RULES entry was added) is inert instead of invalidating the
 * whole document.
 */
function skipValidationWhenHiddenByItemRole(fieldName: ContentItemField) {
  return ({ document, parent }: { document?: unknown; parent?: unknown }) => hiddenByItemRole(fieldName)({ document, parent });
}

export default defineType({
  name: "contentItem",
  title: "Item",
  type: "object",
  description:
    "A single list entry — fill in only the fields this item actually needs. / Один елемент списку — заповніть лише ті поля, які дійсно потрібні цьому елементу.",
  fields: [
    defineField({
      name: "itemKey",
      title: "Key (do not change)",
      type: "string",
      readOnly: ({ value }) => Boolean(value),
      description:
        "Only present (and locked) on built-in items the website looks up by key, e.g. a specific form-button label. New items you add don't need one. / Присутній (і заблокований) лише для вбудованих елементів, які сайт шукає за ключем. Новим елементам ключ не потрібен.",
      hidden: hiddenByItemRole("itemKey"),
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      components: { input: IconPickerInput },
      description: "Optional icon — search by name. / Необов'язкова іконка — пошук за назвою.",
      hidden: hiddenByItemRole("icon"),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      description: "Optional heading. / Необов'язковий заголовок.",
      validation: allOrNothingLanguages({ skip: skipValidationWhenHiddenByItemRole("title") }),
      hidden: hiddenByItemRole("title"),
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "internationalizedArrayText",
      description: "Optional longer text (e.g. a description or answer). / Необов'язковий довший текст (напр. опис або відповідь).",
      validation: allOrNothingLanguages({ skip: skipValidationWhenHiddenByItemRole("text") }),
      hidden: hiddenByItemRole("text"),
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "imageWithAlt",
      description: "Optional image for this item. / Необов'язкове зображення для цього елемента.",
      hidden: hiddenByItemRole("image"),
    }),
    defineField({
      name: "href",
      title: "Link destination",
      type: "string",
      description: "Optional — set only if this item links somewhere. / Необов'язково — заповніть, лише якщо елемент веде на іншу сторінку.",
      hidden: hiddenByItemRole("href"),
    }),
    defineField({
      name: "label",
      title: "Link text / value",
      type: "internationalizedArrayString",
      description:
        "Optional — link text if this item has its own link, or the trilingual value for a small labeled row. / Необов'язково — текст посилання (якщо є) або текст значення для невеликого підпису.",
      validation: allOrNothingLanguages({ skip: skipValidationWhenHiddenByItemRole("label") }),
      hidden: hiddenByItemRole("label"),
    }),
    defineField({
      name: "value",
      title: "Raw value (not translated)",
      type: "string",
      description:
        "Only for values that shouldn't be translated, e.g. a bank account number. / Лише для значень, які не перекладаються, напр. номер банківського рахунку.",
      hidden: hiddenByItemRole("value"),
    }),
  ],
  preview: {
    select: { title: "title", icon: "icon", itemKey: "itemKey" },
    prepare({ title, icon, itemKey }) {
      const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? itemKey ?? "(untitled item)", subtitle: icon as string | undefined };
    },
  },
});
