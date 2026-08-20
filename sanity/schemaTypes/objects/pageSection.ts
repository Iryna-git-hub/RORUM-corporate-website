import { defineArrayMember, defineField, defineType } from "sanity";
import { allOrNothingLanguages } from "@/sanity/lib/i18nValidation";
import { EventsStripLabelField } from "@/sanity/components/EventsStripLabelField";

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

// Section-level field-hide overrides: fieldName -> Set<sectionKey> where
// that field is hidden even though its sectionKind would otherwise show it.
// Narrowly scoped per `sectionKey`, not per kind, so any *other* section of
// the same kind keeps its normal visibility. Current entries, from the Home
// eventsStrip Studio-visibility audit: the section's own copy (`text`),
// photos (`media`) and generic list rows (`items`) are all empty in
// production and read by no frontend code for this section — the visible
// event cards come entirely from separate `event` documents, matched only
// by page position, never by anything stored here (see the section's own
// `description` below). Presented to a non-technical editor these 3 fields
// (plus `settings`, hidden here for the same reason) look editable but are
// dead ends. Still stored (not deleted) and still visible for every other
// "custom"-kind section.
const SECTION_FIELD_FORCE_HIDDEN: Partial<Record<string, ReadonlySet<string>>> = {
  settings: new Set(["eventsStrip"]),
  text: new Set(["eventsStrip"]),
  media: new Set(["eventsStrip"]),
  items: new Set(["eventsStrip"]),
};

// About's statement/community/pillars sections use sectionKind "iconGrid"/
// "steps", whose FIELD_VISIBILITY doesn't include "text" — but all 3
// sections' `text` holds real, published, rendered copy (the services
// paragraph, the community paragraph, the pillars intro). Rather than
// adding "text" to iconGrid/steps globally (which would also reveal empty,
// genuinely-unused text fields on catering/workWithUs/eventDecoration/
// hostAtRorum's iconGrid/steps sections, none of which have been audited
// yet), this force-shows `text` only for these 3 exact sections on the
// About document specifically — narrowed by document id (draft-stripped)
// AND sectionKey together, the same two-part scoping mediaItem.ts's
// isHomeDecorativeBackgroundMedia already uses for the equivalent problem
// in the opposite direction.
const ABOUT_TEXT_FORCE_VISIBLE_SECTION_KEYS = new Set(["statement", "community", "pillars"]);

// About's hero section has an empty, unused `actions` array — its 2 quick
// links live in `items`, not `actions` (unlike Home's hero, which uses
// `actions` for its 2 real CTA buttons and must keep seeing this field).
// Hidden only for page-about's own hero, not sectionKind "hero" generally.
const ABOUT_HERO_ACTIONS_HIDDEN_SECTION_KEYS = new Set(["hero"]);

function isPageAbout(document: unknown): boolean {
  const doc = document as { _id?: string } | undefined;
  return doc?._id?.replace(/^drafts\./, "") === "page-about";
}

function fieldHidden(fieldName: string) {
  return ({ parent, document }: { parent?: { sectionKind?: string; sectionKey?: string }; document?: unknown }) => {
    if (fieldName === "text" && parent?.sectionKey && ABOUT_TEXT_FORCE_VISIBLE_SECTION_KEYS.has(parent.sectionKey) && isPageAbout(document)) {
      return false; // force-visible override wins before the sectionKind-based hide below would otherwise hide it
    }
    if (fieldName === "actions" && parent?.sectionKey && ABOUT_HERO_ACTIONS_HIDDEN_SECTION_KEYS.has(parent.sectionKey) && isPageAbout(document)) {
      return true;
    }
    if (parent?.sectionKey && SECTION_FIELD_FORCE_HIDDEN[fieldName]?.has(parent.sectionKey)) {
      return true;
    }
    const kind = parent?.sectionKind as (typeof SECTION_KINDS)[number] | undefined;
    if (!kind) return false;
    const visible = FIELD_VISIBILITY[kind];
    return visible ? !visible.has(fieldName) : false;
  };
}

/**
 * A hidden field must never block publishing — reuses `fieldHidden`'s exact
 * logic (via the same `parent`/`document` shape validation contexts already
 * carry) so a section-level field's `hidden` and `validation` can never
 * drift out of sync.
 */
function skipValidationWhenHidden(fieldName: string) {
  return ({ parent, document }: { parent?: unknown; document?: unknown }) =>
    fieldHidden(fieldName)({ parent: parent as { sectionKind?: string; sectionKey?: string } | undefined, document });
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
      validation: allOrNothingLanguages({ skip: skipValidationWhenHidden("label") }),
      hidden: fieldHidden("label"),
      components: { field: EventsStripLabelField },
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      validation: allOrNothingLanguages({ skip: skipValidationWhenHidden("title") }),
      hidden: fieldHidden("title"),
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "internationalizedArrayText",
      validation: allOrNothingLanguages({ skip: skipValidationWhenHidden("text") }),
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
