import { defineArrayMember, defineField, defineType } from "sanity";
import { requiredWhen } from "@/sanity/lib/i18nValidation";
import { EventsStripLabelField } from "@/sanity/components/EventsStripLabelField";
import { CateringMenuDishItemsInput } from "@/sanity/components/CateringMenuDishItemsInput";
import { CateringMenuCategoryInput } from "@/sanity/components/CateringMenuCategoryInput";
import { CateringAllLanguagesInput } from "@/sanity/components/CateringAllLanguagesInput";

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
  "faqCategory",
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
  // A FAQ category: only its Title and its Questions (items) — label/text/
  // media/actions/settings are all genuinely unused for this role (see
  // Task 1's audit — every existing category section only ever stores
  // title/items). See isCorrectlyShapedSection below for why sectionKey/
  // sectionKind are ALSO hidden once a category is correctly shaped —
  // same site-wide rule every other section now uses too.
  faqCategory: new Set(["title", "items"]),
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

export function isPageCateringMenuExamples(document: unknown): boolean {
  const doc = document as { _id?: string } | undefined;
  return doc?._id?.replace(/^drafts\./, "") === "page-catering-menu-examples";
}

export function isPageFaq(document: unknown): boolean {
  const doc = document as { _id?: string } | undefined;
  return doc?._id?.replace(/^drafts\./, "") === "page-faq";
}

export function isPageContact(document: unknown): boolean {
  const doc = document as { _id?: string } | undefined;
  return doc?._id?.replace(/^drafts\./, "") === "page-contact";
}

export function isPageEvents(document: unknown): boolean {
  const doc = document as { _id?: string } | undefined;
  return doc?._id?.replace(/^drafts\./, "") === "page-events";
}

export function isPageEventDecoration(document: unknown): boolean {
  const doc = document as { _id?: string } | undefined;
  return doc?._id?.replace(/^drafts\./, "") === "page-event-decoration";
}

export function isPageHostAtRorum(document: unknown): boolean {
  const doc = document as { _id?: string } | undefined;
  return doc?._id?.replace(/^drafts\./, "") === "page-host-at-rorum";
}

export function isPageCommunityMembership(document: unknown): boolean {
  const doc = document as { _id?: string } | undefined;
  return doc?._id?.replace(/^drafts\./, "") === "page-community-membership";
}

// Contact's hero ("Contact intro") genuinely uses label/title/text/items
// (the default "hero"-kind visibility already covers those) but never
// media/actions — confirmed by the live audit (no media/actions ever
// stored on this section). Contact's form section never uses label/text —
// its title is "Form title" and everything else lives in items (Form
// fields/Privacy consent/FAQ prompt/Submit button/Success message, laid out
// by ContactFormSectionInput).
const CONTACT_HERO_FORCE_HIDDEN_FIELDS = new Set(["media", "actions"]);
const CONTACT_FORM_FORCE_HIDDEN_FIELDS = new Set(["label", "text"]);

// Event Decoration's and Host at RORUM's hero sections both genuinely use
// label/title/text/actions (the default "hero"-kind visibility already
// covers those) but never media or items — confirmed by the live audit (no
// media/items ever stored on either hero section; their own real gallery
// photos live in a separate "gallery" section, and their real CTA is the
// hero's own `actions` array, not `items`).
const HERO_MEDIA_ITEMS_FORCE_HIDDEN_FIELDS = new Set(["media", "items"]);

// Community Membership's hero genuinely uses label/title/text (after the
// intro0/intro1 -> text migration)/actions/items (the price-strip row) —
// only `media` is confirmed unused (its own real gallery lives in the
// separate "gallery" section). Its "intro" section (the "Connecting
// Women..." block) genuinely uses label/title/items (the 2 text columns)
// but never text/media/actions — its own visible buttons are read from the
// hero section's actions instead (see page.tsx's own `membershipFormHref`/
// `externalSiteCta` — a disclosed, unchanged cross-section reuse, not a
// hidden dead field on THIS section).
const COMMUNITY_MEMBERSHIP_HERO_FORCE_HIDDEN_FIELDS = new Set(["media"]);
const COMMUNITY_MEMBERSHIP_INTRO_FORCE_HIDDEN_FIELDS = new Set(["text", "media", "actions"]);

// Live audit (Events Listing Studio task): `app/[locale]/(site)/events/page.tsx`
// reads the page's own H1 from `sections[sectionKey=="hero"].title` — the
// `filters` section's own `label`/`title` fields are never read anywhere
// (only `getItem(filtersSection, key)?.title` for individual filter-label
// ITEMS, via a completely separate field path) — so `filters`'s own
// section-level Title/Small label would otherwise mislead a manager into
// thinking IT controls the page heading. `closingCta`'s `settings` (a
// `variant` flag) is likewise stored but never read — the frontend hardcodes
// `variant="host"` directly in JSX; no separate override is needed for it,
// though — sectionKind "cta"'s own FIELD_VISIBILITY already omits `settings`
// for every closingCta section on every page (Home/About included).
const EVENTS_FILTERS_FORCE_HIDDEN_FIELDS = new Set(["label", "title"]);

/**
 * The one, site-wide, document-agnostic rule for `sectionKey`/`sectionKind`
 * visibility (Phase 1 — technical-field hygiene): once a section already
 * has a `sectionKind` value, it is a real, correctly-shaped section —
 * `sectionKey`/`sectionKind` are stable technical routing facts the
 * frontend depends on, never something a manager should read or edit, on
 * ANY page. This generalizes the exact reasoning first established for
 * Catering Menu Examples' categories and FAQ's categories (every section a
 * semantic "+ Add" action creates already has its `sectionKind` set) to
 * every section of every document, replacing what used to be a growing set
 * of per-document special cases (Contact's fixed hero/form, Events' fixed
 * hero/filters/closingCta, Catering Menu Examples' categories, FAQ's
 * categories) with one shared predicate.
 *
 * Deliberately NEVER hidden while `sectionKind` is unset — a stray raw
 * section added through Sanity's own generic array "add" control (still
 * technically reachable, just not the advertised path) still shows these
 * two required fields until they're filled in, instead of being
 * hidden-but-required and silently blocking Publish forever.
 */
function isCorrectlyShapedSection(parent: { sectionKind?: string } | undefined): boolean {
  return Boolean(parent?.sectionKind);
}

export function isFaqCategorySection(parent: { sectionKind?: string } | undefined): boolean {
  return parent?.sectionKind === "faqCategory";
}

/**
 * A menu category's label/title/text are NOT optional the way most
 * sections' are — see requiredWhen()'s own doc comment in i18nValidation.ts
 * for the frontend proof (no fallback text exists beyond the original 6
 * hardcoded categories; a blank one renders an empty nav tab/heading/
 * description). Scoped by `sectionKind` alone (not document id) so this
 * requirement follows the role wherever a `menuCategory`-kind section
 * exists, matching contentItem.ts's ITEM_ROLE_RULES `sectionKinds`
 * precedent for the same open, manager-extensible-set reasoning.
 */
function isMenuCategorySection(parent: { sectionKind?: string } | undefined): boolean {
  return parent?.sectionKind === "menuCategory";
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
    if (isPageContact(document) && parent?.sectionKey === "hero" && CONTACT_HERO_FORCE_HIDDEN_FIELDS.has(fieldName)) {
      return true;
    }
    if (isPageContact(document) && parent?.sectionKey === "form" && CONTACT_FORM_FORCE_HIDDEN_FIELDS.has(fieldName)) {
      return true;
    }
    if (isPageEvents(document) && parent?.sectionKey === "filters" && EVENTS_FILTERS_FORCE_HIDDEN_FIELDS.has(fieldName)) {
      return true;
    }
    if ((isPageEventDecoration(document) || isPageHostAtRorum(document)) && parent?.sectionKey === "hero" && HERO_MEDIA_ITEMS_FORCE_HIDDEN_FIELDS.has(fieldName)) {
      return true;
    }
    if (isPageCommunityMembership(document) && parent?.sectionKey === "hero" && COMMUNITY_MEMBERSHIP_HERO_FORCE_HIDDEN_FIELDS.has(fieldName)) {
      return true;
    }
    if (isPageCommunityMembership(document) && parent?.sectionKey === "intro" && COMMUNITY_MEMBERSHIP_INTRO_FORCE_HIDDEN_FIELDS.has(fieldName)) {
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
  // CateringMenuCategoryInput is scoped internally to page-catering-menu-
  // examples's menuCategory sections only — it renders the reserved
  // categoryIcon item as a real Icon field above the rest of the (otherwise
  // unmodified) default form. Every other pageSection instance on every
  // other document/section renders exactly as before.
  components: { input: CateringMenuCategoryInput },
  fields: [
    defineField({
      name: "sectionKey",
      title: "Key (do not change)",
      type: "string",
      // Locked once set (matching contentItem.itemKey/ctaAction.actionKey's
      // existing convention) — not unconditionally read-only. Every
      // pre-existing section already has a value, so this is a no-op for
      // them; the one case this unlocks is a brand-new section a manager
      // adds themselves (e.g. a new catering menu category), which needs to
      // receive a fresh, unique key once before it locks for good.
      readOnly: ({ value }) => Boolean(value),
      validation: (rule) => rule.required(),
      description: "Stable identifier the website looks this section up by. / Стабільний ідентифікатор, за яким сайт знаходить цей розділ.",
      hidden: ({ parent }) => isCorrectlyShapedSection(parent as { sectionKind?: string } | undefined),
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
      hidden: ({ parent }) => isCorrectlyShapedSection(parent as { sectionKind?: string } | undefined),
    }),
    defineField({
      name: "label",
      title: "Small label",
      type: "internationalizedArrayString",
      description:
        'Small eyebrow text above the title, e.g. "Catering" (optional for most sections). For a menu category, this is the short label shown in the horizontal navigation tab, and is required. / Невеликий напис над заголовком (необов\'язково для більшості розділів). Для категорії меню це короткий напис на вкладці горизонтальної навігації, і він обов\'язковий.',
      validation: requiredWhen(({ parent }) => isMenuCategorySection(parent as { sectionKind?: string } | undefined), { skip: skipValidationWhenHidden("label") }),
      hidden: fieldHidden("label"),
      components: { field: EventsStripLabelField, input: CateringAllLanguagesInput },
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      description:
        "Optional for most sections. For a menu category, this is the category heading, and is required. For a FAQ category, this is the category heading (e.g. \"Events\"), and is required. / Необов'язково для більшості розділів. Для категорії меню це заголовок категорії, і він обов'язковий. Для категорії FAQ це заголовок категорії (напр. «Події»), і він обов'язковий.",
      validation: requiredWhen(
        ({ parent }) => {
          const p = parent as { sectionKind?: string } | undefined;
          return isMenuCategorySection(p) || isFaqCategorySection(p);
        },
        { skip: skipValidationWhenHidden("title") },
      ),
      hidden: fieldHidden("title"),
      components: { input: CateringAllLanguagesInput },
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "internationalizedArrayText",
      description:
        "Optional for most sections. For a menu category, this is the category description, and is required. / Необов'язково для більшості розділів. Для категорії меню це опис категорії, і він обов'язковий.",
      validation: requiredWhen(({ parent }) => isMenuCategorySection(parent as { sectionKind?: string } | undefined), { skip: skipValidationWhenHidden("text") }),
      hidden: fieldHidden("text"),
      components: { input: CateringAllLanguagesInput },
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
      // CateringMenuDishItemsInput is scoped internally to
      // page-catering-menu-examples's menuCategory sections (Dishes) — for
      // every other items array (including page-catering's "philosophy"
      // section) it delegates unchanged to CateringOfferItemsInput, which
      // itself is scoped to that one case and otherwise renders the
      // unmodified default input. Chained (not both wired independently)
      // because `items` can only ever have one `components.input`.
      components: { input: CateringMenuDishItemsInput },
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
    select: { title: "title", kind: "sectionKind", key: "sectionKey", items: "items" },
    prepare({ title, kind, key, items }) {
      const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      const itemCount = (items as unknown[] | undefined)?.length ?? 0;
      const subtitle = kind === "faqCategory" ? `${itemCount} question${itemCount === 1 ? "" : "s"}` : (kind as string | undefined);
      return { title: en?.value ?? key ?? "(untitled section)", subtitle };
    },
  },
});
