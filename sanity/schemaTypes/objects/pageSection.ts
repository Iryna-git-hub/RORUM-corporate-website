import { defineArrayMember, defineField, defineType } from "sanity";
import { requiredWhen } from "@/sanity/lib/i18nValidation";
import { EventsStripLabelField } from "@/sanity/components/EventsStripLabelField";
import { CateringMenuDishItemsInput } from "@/sanity/components/CateringMenuDishItemsInput";
import { CateringMenuCategoryInput } from "@/sanity/components/CateringMenuCategoryInput";
import { CateringAllLanguagesInput } from "@/sanity/components/CateringAllLanguagesInput";

// The one section shape every page in the `page` document type is built from.
// `sectionKind` picks what the section visually is; the remaining fields
// (label/title/text/media/actions/items/settings) are generic and reused by
// every kind — this is the entire reason a 15-page site with dozens of
// one-off named fields per page can live under Sanity's free-plan
// 2,000-attribute cap: every section of every page shares the same handful of
// paths instead of inventing new ones. See MIGRATION_REPORT.md.
//
// Field visibility (`hidden` below) is PRESENTATION ONLY — it never adds or
// removes an attribute path, it just decides which fields a content editor
// sees for a given section. The model is an explicit allow-list:
//
//   SECTION_FIELD_VISIBILITY["<page-id>:<sectionKey>"] = exactly the fields
//   the frontend actually reads for that concrete section.
//
// That list is audited field-by-field against each page's own
// `getData()` / resolver + the live document (see
// `npm run sanity:audit-sections` and lib/content-contracts/*-studio-visibility.ts).
// A section with NO explicit entry — a brand-new one a manager just added, an
// open manager-extensible set (menu categories, FAQ categories), or a page
// not yet audited — falls back to the looser `SECTION_KIND_FALLBACK_VISIBILITY`
// keyed by `sectionKind`, so nothing is ever over-hidden by omission.

export const PAGE_SECTION_FIELDS = ["label", "title", "text", "media", "actions", "items", "settings"] as const;
export type PageSectionField = (typeof PAGE_SECTION_FIELDS)[number];

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

type SectionKind = (typeof SECTION_KINDS)[number];

/**
 * The EXPLICIT per-section allow-list — one entry per concrete section on
 * every page, keyed `<page-id>:<sectionKey>` (the page's dash id, e.g.
 * `page-events:hero`). The value is exactly the `pageSection` fields the
 * frontend reads for that section — every other field is hidden from the
 * editor there.
 *
 * Audited against each page's own `app/[locale]/(site)/<page>/page.tsx`
 * `getData()` / resolver, cross-checked with the live published document
 * (`npm run sanity:audit-sections`). "Empty but read with a fallback" still
 * counts as used — the field stays visible so an editor can fill it in.
 *
 * `sectionKey`/`sectionKind` (the technical routing fields) are NOT part of
 * this list — their visibility is handled separately by
 * `isCorrectlyShapedSection`.
 */
const SECTION_FIELD_VISIBILITY: Record<string, readonly PageSectionField[]> = {
  // ── Home (app/[locale]/(site)/page.tsx) ────────────────────────────────
  "page-home:hero": ["label", "title", "text", "media", "actions", "items"], // eyebrow, H1, intro, bg image/video, primary+secondary CTA, trust badges
  "page-home:quickPaths": ["label", "title", "items"], // 4 quick-path cards (title/text/href/image/label/icon)
  "page-home:eventsStrip": ["label", "title", "actions"], // "What's on" eyebrow, heading, "View all events" link — the event cards themselves are separate `event` documents
  "page-home:editorialAttendEvents": ["label", "title", "text", "media", "actions", "items"], // eyebrow, heading, intro, image, CTA, description + feature bullets
  "page-home:editorialHostAtRorum": ["label", "title", "text", "media", "actions", "items"], // same shape (the `reversed` layout is a code literal, not a stored setting)
  "page-home:servicesTeaser": ["label", "title", "items"], // 2 service teaser cards
  "page-home:communityTeaser": ["label", "title", "text", "media", "items"], // eyebrow, heading, paragraph, image, 3 community links
  "page-home:closingCta": ["label", "title", "text", "actions", "items"], // eyebrow, heading, text, main CTA, FAQ prompt + 4 suggested-path links

  // ── About (app/[locale]/(site)/about/page.tsx) ─────────────────────────
  "page-about:hero": ["label", "title", "text", "media", "items"], // eyebrow, H1, lead, 3 atmosphere photos, 2 intro quick-links (its CTA lives in items, not actions)
  "page-about:statement": ["title", "text", "items"], // heading, services paragraph, 2 service links
  "page-about:community": ["title", "text", "items"], // heading, community paragraph, 3 community links
  "page-about:pillars": ["label", "title", "text", "items"], // eyebrow, location heading, pillars intro, 4 pillar cards
  "page-about:closingCta": ["label", "title", "text", "actions", "items"], // eyebrow, heading, text, main CTA, FAQ prompt + suggested-path links

  // ── Catering (app/[locale]/(site)/catering/page.tsx) ───────────────────
  "page-catering:hero": ["label", "title", "text", "actions", "items"], // eyebrow, H1, intro, "Request catering" CTA, "Menu examples" button
  "page-catering:gallery": ["label", "media", "items"], // "Suitable for" label, ~60 gallery photos, aria-label + "suitable for" chips
  "page-catering:menuFormats": ["title", "items"], // heading, 3 format cards (title/text/image)
  "page-catering:philosophy": ["title", "text", "media", "items"], // heading, paragraph, image, "tailored" note + 6 "what we offer" bullets
  "page-catering:steps": ["label", "title", "items"], // "How it works" eyebrow, heading, 3 steps
  "page-catering:inquiryForm": ["title", "text", "items"], // form heading, intro, submit label / placeholder / success / footer note

  // ── Catering Menu Examples overlay (page-catering-menu-examples) ───────
  "page-catering-menu-examples:banner": ["title", "media", "items"], // overlay heading, banner image, "request" CTA + 2 intro paragraphs + empty-state message
  "page-catering-menu-examples:closing": ["title", "text", "items"], // "custom menu" heading + text, "featured dishes" label / disclaimer / "back to catering" link
  // menuCategory sections have no explicit entry — they're an open,
  // manager-extensible set, so they fall through to the `menuCategory` kind.

  // ── Community Membership (app/[locale]/(site)/community-membership/page.tsx)
  "page-community-membership:hero": ["label", "title", "text", "actions", "items"], // eyebrow, H1, intro, apply/support/external CTAs, price-strip row
  "page-community-membership:donation": ["label", "title", "text", "media", "items"], // section eyebrow/heading/paragraph (fallback-backed), QR image, scan/bank/support rows
  "page-community-membership:intro": ["label", "title", "items"], // "WECODA community" eyebrow, "Connecting Women…" heading, 2 text columns
  "page-community-membership:benefits": ["title", "items"], // "What You Gain" heading, 9 benefit cards
  "page-community-membership:application": ["title", "text", "actions", "items"], // heading, closing paragraph, "Become a Member" CTA, 4 application steps
  "page-community-membership:gallery": ["label", "title", "media"], // "Gallery" eyebrow, "WECODA Community Meetings" heading, 8 photos + 2 videos

  // ── Contact (app/[locale]/(site)/contact/page.tsx) ─────────────────────
  "page-contact:hero": ["label", "title", "text", "items"], // eyebrow, intro heading, intro text, "Follow us" heading + address/phone/email display-order rows
  "page-contact:form": ["title", "items"], // form heading + configurable fields / submit / success rows. Privacy-consent + FAQ-prompt toggles are a dedicated settings card (ContactFormSectionInput), so the raw `settings` field stays hidden.

  // ── Event Decoration (app/[locale]/(site)/event-decoration/page.tsx) ───
  "page-event-decoration:hero": ["label", "title", "text", "actions"], // eyebrow, H1, intro, "Request decoration" CTA
  "page-event-decoration:gallery": ["label", "media", "items"], // "Suitable for" label, 14 photos, aria-label + "suitable for" chips
  "page-event-decoration:styling": ["label", "title", "text", "media", "items"], // eyebrow, "What we style" heading, intro, image, "tailored" note + 5 style cards
  "page-event-decoration:steps": ["label", "title", "items"], // "How it works" eyebrow, heading, 3 steps
  "page-event-decoration:inquiryForm": ["title", "text", "items"], // form heading, intro, submit / placeholder / success rows

  // ── Events listing (app/[locale]/(site)/events/page.tsx) ───────────────
  "page-events:hero": ["title"], // ONLY the listing H1 ("Upcoming Events at RORUM"). No eyebrow/text/photos/buttons/items are read for this section.
  "page-events:filters": ["items"], // the 18 filter-bar / empty-state label rows (each uses `.title` only, via ITEM_ROLE_RULES)
  "page-events:closingCta": ["label", "title", "text", "actions", "items"], // "Would you like to host?" eyebrow, heading, text, main CTA. `items` stays visible only because EventsClosingCtaItemsInput renders a read-only "edit these in Shared form messages" card there — the public "Have questions?" prompt is actually read from `formMessages`, not these rows.

  // ── FAQ (app/[locale]/(site)/faq/page.tsx) ─────────────────────────────
  "page-faq:hero": ["label", "title", "text"], // eyebrow, H1, intro paragraph
  // faqCategory sections have no explicit entry — open, manager-extensible
  // set, so they fall through to the `faqCategory` kind (title + questions).

  // ── Host at RORUM (app/[locale]/(site)/host-at-rorum/page.tsx) ─────────
  "page-host-at-rorum:hero": ["label", "title", "text", "actions"], // eyebrow, H1, intro, apply + "view packages" CTAs
  "page-host-at-rorum:gallery": ["media"], // 14 photos only — this gallery has no heading or chips
  "page-host-at-rorum:session": ["label", "title", "media", "items"], // "Session details" eyebrow, "Each session includes" heading, photo, 7 included + optional-label + 2 optional rows
  "page-host-at-rorum:packages": ["label", "title", "text", "items"], // "Packages" eyebrow, heading, intro, 3 package cards + footer CTA/text + "select package" + cancellation rows
  "page-host-at-rorum:steps": ["label", "title", "items"], // "How it works" eyebrow, "3-step setup" heading, 3 steps + aria-label row
  "page-host-at-rorum:inquiryForm": ["title", "text", "items"], // form heading, intro, submit / placeholder / success + 4 additional-service rows

  // ── Volunteer (app/[locale]/(site)/volunteer/page.tsx) ────────────────
  "page-volunteer:hero": ["label", "title", "media", "actions", "items"], // eyebrow, H1, photo, "Apply to volunteer" CTA, hero/highlight/closing paragraph rows
  "page-volunteer:applicationForm": ["items"], // ONLY the modal-copy rows (modalTitle / messagePlaceholder / successMessage / errorMessage)

  // ── Work With Us (app/[locale]/(site)/work-with-us/page.tsx) ──────────
  "page-work-with-us:hero": ["label", "title", "media", "items"], // eyebrow, H1, 2 collaboration photos, hero-paragraph rows + "Send your CV" button row
  "page-work-with-us:features": ["items"], // ONLY the 3 "Why work with us" bullets (icon + one line each) — no section heading is read
  "page-work-with-us:cvUploadForm": ["items"], // ONLY the CV-modal copy rows
};

/**
 * Fallback visibility for any section NOT in `SECTION_FIELD_VISIBILITY`
 * above — a brand-new section a manager just added, an open
 * manager-extensible set (menu categories, FAQ categories), or a page whose
 * sections haven't been audited yet. Deliberately loose: it's better to show
 * an unused field on an unaudited section than to hide a used one.
 */
const SECTION_KIND_FALLBACK_VISIBILITY: Record<SectionKind, ReadonlySet<PageSectionField>> = {
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
  // A menu category: its nav-tab label, heading, description and dishes. All
  // required (see isMenuCategorySection) — a blank one renders an empty tab.
  menuCategory: new Set(["label", "title", "text", "items"]),
  donation: new Set(["label", "title", "text", "media", "items"]),
  filters: new Set(["label", "title", "items"]),
  // A FAQ category: only its heading and its questions.
  faqCategory: new Set(["title", "items"]),
  custom: new Set(["label", "title", "text", "media", "actions", "items"]),
};

// `settings` (a raw key/value array of layout flags) is never in any explicit
// allow-list entry and no longer in any kind fallback either — it is a
// code-side concern, not editorial. Its one genuine consumer,
// `page-contact:form`, exposes those flags through the friendly
// `ContactFormSectionInput` toggle card instead. A future section that truly
// needs an editor-visible flag should get an explicit `SECTION_FIELD_VISIBILITY`
// entry that lists `"settings"`, not a loosening of the fallback.

function normalizeDocId(id: string | undefined): string | undefined {
  return id?.replace(/^drafts\./, "");
}

export function isPageCateringMenuExamples(document: unknown): boolean {
  return normalizeDocId((document as { _id?: string } | undefined)?._id) === "page-catering-menu-examples";
}

export function isPageFaq(document: unknown): boolean {
  return normalizeDocId((document as { _id?: string } | undefined)?._id) === "page-faq";
}

export function isPageContact(document: unknown): boolean {
  return normalizeDocId((document as { _id?: string } | undefined)?._id) === "page-contact";
}

export function isPageEvents(document: unknown): boolean {
  return normalizeDocId((document as { _id?: string } | undefined)?._id) === "page-events";
}

/**
 * The one, site-wide rule for `sectionKey`/`sectionKind` visibility: once a
 * section already has a `sectionKind` value it is a real, correctly-shaped
 * section — `sectionKey`/`sectionKind` are stable technical routing facts the
 * frontend depends on, never something a manager should read or edit.
 * Deliberately NEVER hidden while `sectionKind` is unset, so a stray raw
 * section added through Sanity's generic array control still shows these two
 * required fields until they're filled in, instead of being hidden-but-
 * required and silently blocking Publish forever.
 */
function isCorrectlyShapedSection(parent: { sectionKind?: string } | undefined): boolean {
  return Boolean(parent?.sectionKind);
}

export function isFaqCategorySection(parent: { sectionKind?: string } | undefined): boolean {
  return parent?.sectionKind === "faqCategory";
}

/**
 * A menu category's label/title/text are NOT optional the way most sections'
 * are — see requiredWhen()'s own doc comment in i18nValidation.ts for the
 * frontend proof (no fallback text exists beyond the original 6 hardcoded
 * categories; a blank one renders an empty nav tab/heading/description).
 * Scoped by `sectionKind` alone so this follows the role wherever a
 * `menuCategory`-kind section exists.
 */
function isMenuCategorySection(parent: { sectionKind?: string } | undefined): boolean {
  return parent?.sectionKind === "menuCategory";
}

/**
 * The set of fields visible for a concrete section: the explicit allow-list
 * entry if there is one, otherwise the loose `sectionKind` fallback. Returns
 * `undefined` only when there is neither (no `sectionKind` yet).
 */
function visibleFieldsFor(
  document: unknown,
  parent: { sectionKind?: string; sectionKey?: string } | undefined,
): ReadonlySet<PageSectionField> | undefined {
  const docId = normalizeDocId((document as { _id?: string } | undefined)?._id);
  const sectionKey = parent?.sectionKey;
  if (docId && sectionKey) {
    const explicit = SECTION_FIELD_VISIBILITY[`${docId}:${sectionKey}`];
    if (explicit) return new Set(explicit);
  }
  const kind = parent?.sectionKind as SectionKind | undefined;
  if (!kind) return undefined;
  return SECTION_KIND_FALLBACK_VISIBILITY[kind];
}

function fieldHidden(fieldName: PageSectionField) {
  return ({ parent, document }: { parent?: { sectionKind?: string; sectionKey?: string }; document?: unknown }) => {
    const visible = visibleFieldsFor(document, parent);
    if (!visible) return false; // section not shaped yet — show everything
    return !visible.has(fieldName);
  };
}

/**
 * A hidden field must never block publishing — reuses `fieldHidden`'s exact
 * logic so a section-level field's `hidden` and `validation` can never drift
 * out of sync.
 */
function skipValidationWhenHidden(fieldName: PageSectionField) {
  return ({ parent, document }: { parent?: unknown; document?: unknown }) =>
    fieldHidden(fieldName)({ parent: parent as { sectionKind?: string; sectionKey?: string } | undefined, document });
}

export default defineType({
  name: "pageSection",
  title: "Section",
  type: "object",
  description: "One section of the page, shown in the order sections appear below. / Один розділ сторінки — показується в тому порядку, у якому розділи розташовані нижче.",
  // CateringMenuCategoryInput is the type-level input; it delegates to
  // ContactFormSectionInput / the default input for every non-menu-category
  // section, so every other pageSection instance renders exactly as before.
  components: { input: CateringMenuCategoryInput },
  fields: [
    defineField({
      name: "sectionKey",
      title: "Key (do not change)",
      type: "string",
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
      // page-catering-menu-examples's menuCategory sections (Dishes); for
      // every other items array it delegates to CateringOfferItemsInput,
      // itself scoped to page-catering's "philosophy" and otherwise the
      // unmodified default input.
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

/**
 * Exported for tests + the audit script: the resolved set of visible fields
 * for a `(document, parent)` context, exactly as `fieldHidden` sees it.
 */
export function resolveVisibleSectionFields(
  document: unknown,
  parent: { sectionKind?: string; sectionKey?: string } | undefined,
): ReadonlySet<PageSectionField> {
  return visibleFieldsFor(document, parent) ?? new Set(PAGE_SECTION_FIELDS);
}

export { SECTION_FIELD_VISIBILITY, SECTION_KIND_FALLBACK_VISIBILITY, SECTION_KINDS };
