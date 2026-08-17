import { defineArrayMember, defineField, defineType } from "sanity";
import { allOrNothingLanguages } from "@/sanity/lib/i18nValidation";

// The one section shape every page in the new `page` document type is built
// from. `sectionKind` picks what the section visually is; the remaining
// fields (label/title/text/media/actions/items/settings) are generic and
// reused by every kind — this is the entire reason a 15-page site with
// dozens of one-off named fields per page can live under Sanity's free-plan
// 2,000-attribute cap: every section of every page shares the same handful
// of paths instead of inventing new ones. See MIGRATION_REPORT.md.
//
// `hidden` below only shows the fields a given `sectionKind` actually uses,
// so editors never see empty, irrelevant fields — this is presentation only
// and doesn't add attributes.
const SECTION_KINDS = [
  "hero",
  "gallery",
  "iconGrid",
  "split",
  "steps",
  "cta",
  "form",
  "quickPaths",
  "editorial",
  "servicesTeaser",
  "communityTeaser",
  "benefits",
  "menuCategory",
  "donation",
  "filters",
  "custom",
] as const;

const FIELD_VISIBILITY: Record<(typeof SECTION_KINDS)[number], Set<string>> = {
  hero: new Set(["label", "title", "text", "media", "actions", "items"]),
  gallery: new Set(["label", "media", "items"]),
  iconGrid: new Set(["label", "title", "items"]),
  split: new Set(["label", "title", "text", "media", "items", "actions"]),
  steps: new Set(["label", "title", "items"]),
  cta: new Set(["label", "title", "text", "actions", "items"]),
  form: new Set(["label", "title", "text", "items"]),
  quickPaths: new Set(["label", "title", "items"]),
  editorial: new Set(["label", "title", "text", "media", "actions", "items"]),
  servicesTeaser: new Set(["label", "title", "items"]),
  communityTeaser: new Set(["label", "title", "text", "media", "items"]),
  benefits: new Set(["label", "title", "items"]),
  menuCategory: new Set(["label", "title", "text", "items"]),
  donation: new Set(["label", "title", "text", "media", "items"]),
  filters: new Set(["label", "title", "items"]),
  custom: new Set(["label", "title", "text", "media", "actions", "items", "settings"]),
};

// Sections whose `settings` field is hidden even though their `sectionKind`
// would otherwise show it — narrowly scoped per `sectionKey`, not per kind,
// so any *other* "custom"-kind section keeps using `settings` exactly as
// before. Home's `eventsStrip` is the only current entry: the field is
// empty in production, has no description of what a key/value pair should
// contain, and no frontend code reads it for this section — presented to a
// non-technical editor it's a dead, unexplained input. Still stored (not
// deleted) and still visible for every other section, "custom"-kind or not.
const SETTINGS_HIDDEN_FOR_SECTION_KEYS = new Set(["eventsStrip"]);

function fieldHidden(fieldName: string) {
  return ({ parent }: { parent?: { sectionKind?: string; sectionKey?: string } }) => {
    if (fieldName === "settings" && parent?.sectionKey && SETTINGS_HIDDEN_FOR_SECTION_KEYS.has(parent.sectionKey)) {
      return true;
    }
    const kind = parent?.sectionKind as (typeof SECTION_KINDS)[number] | undefined;
    if (!kind) return false;
    const visible = FIELD_VISIBILITY[kind];
    return visible ? !visible.has(fieldName) : false;
  };
}

export default defineType({
  name: "pageSection",
  title: "Section",
  type: "object",
  description: "One section of the page, shown in the order sections appear below. / Один розділ сторінки — показується в тому порядку, у якому розділи розташовані нижче.",
  fields: [
    defineField({
      name: "sectionKey",
      title: "Key (do not change)",
      type: "string",
      readOnly: true,
      validation: (rule) => rule.required(),
      description: "Stable identifier the website looks this section up by. / Стабільний ідентифікатор, за яким сайт знаходить цей розділ.",
    }),
    defineField({
      name: "sectionKind",
      title: "Section type",
      type: "string",
      options: {
        list: SECTION_KINDS.map((kind) => ({ title: kind, value: kind })),
      },
      validation: (rule) => rule.required(),
      description: "What kind of section this is — controls which fields below apply. / Тип розділу — визначає, які поля нижче застосовуються.",
    }),
    defineField({
      name: "label",
      title: "Small label",
      type: "internationalizedArrayString",
      description: 'Small eyebrow text above the title, e.g. "Catering". / Невеликий напис над заголовком.',
      validation: allOrNothingLanguages(),
      hidden: fieldHidden("label"),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      validation: allOrNothingLanguages(),
      hidden: fieldHidden("title"),
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "internationalizedArrayText",
      validation: allOrNothingLanguages(),
      hidden: fieldHidden("text"),
    }),
    defineField({
      name: "media",
      title: "Photos / video",
      type: "array",
      of: [defineArrayMember({ type: "mediaItem" })],
      hidden: fieldHidden("media"),
    }),
    defineField({
      name: "actions",
      title: "Buttons",
      type: "array",
      of: [defineArrayMember({ type: "ctaAction" })],
      hidden: fieldHidden("actions"),
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      of: [defineArrayMember({ type: "contentItem" })],
      hidden: fieldHidden("items"),
    }),
    defineField({
      name: "settings",
      title: "Advanced settings",
      type: "array",
      description: "Rarely needed — small layout flags such as a visual variant. / Рідко потрібно — невеликі налаштування вигляду.",
      of: [
        defineArrayMember({
          type: "object",
          name: "sectionSetting",
          fields: [
            defineField({ name: "key", title: "Key", type: "string", readOnly: ({ value }) => Boolean(value) }),
            defineField({ name: "value", title: "Value", type: "string" }),
          ],
          preview: {
            select: { title: "key", subtitle: "value" },
          },
        }),
      ],
      hidden: fieldHidden("settings"),
    }),
  ],
  preview: {
    select: { title: "title", kind: "sectionKind", key: "sectionKey" },
    prepare({ title, kind, key }) {
      const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? key ?? "(untitled section)", subtitle: kind as string | undefined };
    },
  },
});
