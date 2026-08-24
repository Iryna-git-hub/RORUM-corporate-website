import { defineField, defineType } from "sanity";
import { IconPickerInput } from "@/sanity/components/IconPickerInput";
import { CateringAllLanguagesInput } from "@/sanity/components/CateringAllLanguagesInput";
import { ItemRoleAwareFieldLabel } from "@/sanity/components/ItemRoleAwareFieldLabel";
import { ContactFormFieldTypeInput } from "@/sanity/components/ContactFormFieldTypeInput";
import { allOrNothingLanguages, requiredWhen } from "@/sanity/lib/i18nValidation";

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
export type ContentItemField = (typeof ALL_CONTENT_ITEM_FIELDS)[number];

interface ItemRoleRule {
  /** Human label only — not used for matching, just for readability/debugging. */
  role: string;
  /**
   * A rule matches an item if its enclosing section's `sectionKey` is in
   * `sectionKeys` OR (when given) its `sectionKind` is in `sectionKinds`.
   * `sectionKeys` suits a fixed, closed set of sections (e.g. Home's
   * `hero`/`quickPaths`, or Catering's `menuFormats`) where every relevant
   * section already exists and its key is known ahead of time.
   * `sectionKinds` suits an OPEN, manager-extensible set of sections that
   * all share one `sectionKind` — e.g. Catering's menu categories, where
   * each category is its own section with its own unique key, and a
   * manager can add a brand-new one at any time (see pageSection.ts's
   * `sectionKey` unlock). Matching by kind means a manager-added category's
   * dishes get the same clean field visibility automatically, with no code
   * change needed per new category.
   */
  sectionKeys?: readonly string[];
  sectionKinds?: readonly string[];
  itemKeyPattern: RegExp;
  visible: readonly ContentItemField[];
  /** Of `visible`, which fields are genuinely required (all 3 languages, for i18n fields) — read by title/text's shared `requiredWhen` validation below instead of one-off per-role predicates. */
  requiredFields?: readonly ContentItemField[];
  /** Overrides a field's Studio label for this role only (e.g. "Title" -> "Follow us heading") — read by ItemRoleAwareFieldLabel. No schema field/attribute changes; presentation only. */
  fieldLabels?: Partial<Record<ContentItemField, string>>;
}

/** Fallback preview label (when title/text is empty) for known reserved itemKeys, so an empty row never shows a raw technical key or "(untitled item)" as its primary label. */
const ITEM_KEY_PREVIEW_LABELS: Record<string, string> = {
  followUsTitle: "Follow us heading",
  submitLabel: "Submit button",
  successMessage: "Success message",
};

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
  { role: "Catering hero menu-examples button", sectionKeys: ["hero"], itemKeyPattern: /^menuExamplesCta$/, visible: ["title"] },
  { role: "Catering gallery chip-group aria label", sectionKeys: ["gallery"], itemKeyPattern: /^ariaLabel$/, visible: ["title"] },
  { role: "Catering \"suitable for\" chip", sectionKeys: ["gallery"], itemKeyPattern: /^suitableFor\d+$/, visible: ["icon", "title"] },
  { role: "Catering menu format card", sectionKeys: ["menuFormats"], itemKeyPattern: /^format[0-2]$/, visible: ["title", "text", "image"] },
  { role: "Catering \"tailored upon request\" note", sectionKeys: ["philosophy"], itemKeyPattern: /^tailoredNote$/, visible: ["title", "text"] },
  // Matches both the 6 existing "format0".."format5" bullets AND a
  // manager-added new one (no itemKey at all — see
  // CateringOfferItemsInput.tsx, which always inserts blank). Previously
  // this only matched the fixed "format[0-5]" set, so a manually-added
  // 7th bullet (or anything created via the generic array "add" control)
  // matched no role at all — every generic contentItem field (image, href,
  // label, value, the technical itemKey) became visible, and validation on
  // fields like `label` ran unskipped despite being irrelevant to this
  // role, which is the exact defect a live manual Studio test found.
  { role: "Catering \"what we offer\" bullet", sectionKeys: ["philosophy"], itemKeyPattern: /^(format\d*)?$/, visible: ["icon", "title", "text"] },
  { role: "Catering 3-step setup row", sectionKeys: ["steps"], itemKeyPattern: /^step\d+$/, visible: ["title", "text"] },
  { role: "Catering inquiry form title-only row", sectionKeys: ["inquiryForm"], itemKeyPattern: /^(submitLabel|messagePlaceholder|footerNote)$/, visible: ["title"] },
  { role: "Catering inquiry form success message", sectionKeys: ["inquiryForm"], itemKeyPattern: /^successMessage$/, visible: ["text"] },
  { role: "Catering Menu Examples banner intro paragraph", sectionKeys: ["banner"], itemKeyPattern: /^intro\d+$/, visible: ["text"] },
  { role: "Catering Menu Examples banner request button", sectionKeys: ["banner"], itemKeyPattern: /^requestCta$/, visible: ["title"] },
  // Shown in place of the category nav/list only when the manager has
  // intentionally left `categories` empty — see
  // app/[locale]/(site)/catering/page.tsx's getData() and
  // CateringMenuOverlay.tsx. A manager-editable message, not a hidden
  // technical field, so an intentionally-empty menu never silently falls
  // back to old hardcoded categories AND never shows a blank/broken overlay.
  { role: "Catering Menu Examples empty-state message", sectionKeys: ["banner"], itemKeyPattern: /^emptyStateMessage$/, visible: ["text"] },
  { role: "Catering Menu Examples closing-section title-only row", sectionKeys: ["closing"], itemKeyPattern: /^(featuredDishesLabel|backToCateringCta)$/, visible: ["title"] },
  { role: "Catering Menu Examples closing-section disclaimer", sectionKeys: ["closing"], itemKeyPattern: /^disclaimerNote$/, visible: ["text"] },
  // Menu category dishes are a free-form, manager-extensible list (add/
  // remove/reorder). Live data uses a positional "dish0", "dish1", ...
  // itemKey per dish (written by the migration that populated
  // page-catering-menu-examples); a manager-added dish added fresh through
  // Studio's own array-item "+" button won't have one at all (matched by
  // the pattern's empty-string branch — see `matchItemRole`'s
  // `itemKey ?? ""`). Matched by `sectionKinds` (not a fixed `sectionKeys`
  // list) so a manager-added category's dishes get this same visibility
  // automatically, with no code change needed per new category.
  { role: "Catering menu dish", sectionKinds: ["menuCategory"], itemKeyPattern: /^(dish\d*)?$/, visible: ["title", "text", "image"] },
  // A category's own tab icon is stored as ONE reserved item (itemKey
  // "categoryIcon") inside that category's own items array, alongside its
  // free-form dishes — same "reserved item" convention as
  // hero.menuExamplesCta/form.submitLabel above, chosen so the manager-
  // editable icon lives with its category without adding a new attribute
  // path to pageSection.ts itself (see CateringMenuOverlay.tsx / page.tsx).
  { role: "Catering menu category tab icon", sectionKinds: ["menuCategory"], itemKeyPattern: /^categoryIcon$/, visible: ["icon"] },
  // A FAQ question row: Question (title) + Answer (text), plus an optional
  // link (href/label) rendered under the answer — see
  // components/FAQAccordion.tsx. Matched by sectionKind (open,
  // manager-extensible set of categories, same reasoning as "Catering menu
  // dish"), matching both existing rows (itemKey "q0"/"q1"/...) and a
  // manager-added question with no itemKey at all (via the "+ Add question"
  // button — see FaqQuestionItemsInput.tsx, which never sets one).
  { role: "FAQ question", sectionKinds: ["faqCategory"], itemKeyPattern: /^(q\d*)?$/, visible: ["title", "text", "href", "label"], requiredFields: ["title", "text"] },
  // Contact page reserved rows — see components/ContactForm.tsx,
  // app/[locale]/(site)/contact/page.tsx. All 3 are fixed, singular rows
  // (never manager-created), so itemKey is never shown.
  { role: "Contact Follow-us heading", sectionKeys: ["hero"], itemKeyPattern: /^followUsTitle$/, visible: ["title"], requiredFields: ["title"], fieldLabels: { title: "Follow us heading" } },
  { role: "Contact submit button", sectionKeys: ["form"], itemKeyPattern: /^submitLabel$/, visible: ["title"], requiredFields: ["title"], fieldLabels: { title: "Submit button text" } },
  { role: "Contact success message", sectionKeys: ["form"], itemKeyPattern: /^successMessage$/, visible: ["text"], requiredFields: ["text"], fieldLabels: { text: "Success message" } },
  // Display-order-only markers for the 3 supported contact-detail rows
  // (Address/Phone/Email) — the underlying facts stay in the contactInfo
  // singleton; presence + array order here is the entire signal (see
  // lib/sanityContact.ts's resolveContactDetailOrder). No generic field is
  // shown at all — ContactDetailsOrderInput renders its own friendly cards
  // instead of the default per-item form.
  { role: "Contact detail display row", sectionKeys: ["hero"], itemKeyPattern: /^contactDetail-(address|phone|email)$/, visible: [] },
  // A configurable Contact form field (Task 7) — Label (title)/Placeholder
  // (text)/Field type (value, one of "text"|"email"|"phone"|"multiline").
  // itemKey is a generated stable id used as the HTML name/id (see
  // components/ContactForm.tsx) — never shown, matching every other
  // reserved-row convention. Matched by sectionKind is unnecessary here
  // (form fields only ever live in Contact's own "form" section, a fixed
  // sectionKey, not an open manager-extensible kind).
  {
    role: "Contact form field",
    sectionKeys: ["form"],
    itemKeyPattern: /^field-.+$/,
    visible: ["title", "text", "value"],
    requiredFields: ["title"],
    fieldLabels: { title: "Field label", text: "Placeholder / help text", value: "Field type" },
  },
  // Contact-specific FAQ prompt override (Task 10) — present only when the
  // manager wants Contact's own question/link text instead of the shared
  // formMessages.faqQuestion/.faqLabel default (see lib/sanityContact.ts's
  // resolveFaqPrompt). Show/hide is a separate settings-level flag (see
  // ContactFormSectionInput) since presence-as-signal here only tells the
  // frontend "Contact-specific text is configured", not "show the prompt at
  // all" (the shared default is still shown when this is absent).
  { role: "Contact FAQ prompt question", sectionKeys: ["form"], itemKeyPattern: /^faqPromptQuestion$/, visible: ["title"], fieldLabels: { title: "FAQ prompt question" } },
  { role: "Contact FAQ prompt link", sectionKeys: ["form"], itemKeyPattern: /^faqPromptLabel$/, visible: ["title", "href"], fieldLabels: { title: "FAQ prompt link text", href: "FAQ prompt destination (defaults to /faq)" } },
];

/** True when this contentItem's ITEM_ROLE_RULES role is exactly "FAQ question" — used by the href/label link-pair validation and the always-3-languages Studio input, both below. */
export function isFaqQuestionRole(document: unknown, parent: unknown): boolean {
  return matchItemRoleInContext(document, parent)?.role === "FAQ question";
}

/** True when the matched role (if any) marks `fieldName` as required — read by title/text's shared validation instead of a growing list of one-off per-role predicates. */
export function isFieldRequiredByItemRole(fieldName: ContentItemField) {
  return (document: unknown, parent: unknown): boolean => Boolean(matchItemRoleInContext(document, parent)?.requiredFields?.includes(fieldName));
}

/** The matched role's Studio label override for `fieldName`, if any — read by ItemRoleAwareFieldLabel. */
export function fieldLabelForItemRole(fieldName: ContentItemField, document: unknown, parent: unknown): string | undefined {
  return matchItemRoleInContext(document, parent)?.fieldLabels?.[fieldName];
}

function hasNonEmptyI18nValue(entries: { value?: unknown }[] | null | undefined): boolean {
  return (entries ?? []).some((e) => (typeof e.value === "string" ? e.value.trim() !== "" : Boolean(e.value)));
}

export function matchItemRole(
  sectionKey: string | undefined,
  itemKey: string | undefined,
  sectionKind?: string,
): ItemRoleRule | undefined {
  if (!sectionKey) return undefined;
  const key = itemKey ?? "";
  return ITEM_ROLE_RULES.find(
    (rule) =>
      (rule.sectionKeys?.includes(sectionKey) || (sectionKind && rule.sectionKinds?.includes(sectionKind))) &&
      rule.itemKeyPattern.test(key),
  );
}

// `parent` here is the contentItem object itself (has its own `_key` and
// `itemKey`) — it has no `sectionKey`/`sectionKind` of its own, so (same
// pattern as mediaItem.ts's isHomeDecorativeBackgroundMedia) the enclosing
// section is found by walking `document.sections`, matching on the item's
// own `_key`.
function findEnclosingSection(
  document: unknown,
  parent: unknown,
): { sectionKey?: string; sectionKind?: string } | undefined {
  const doc = document as { sections?: { sectionKey?: string; sectionKind?: string; items?: { _key?: string }[] }[] } | undefined;
  const itemObjectKey = (parent as { _key?: string } | undefined)?._key;
  if (!itemObjectKey) return undefined;
  return doc?.sections?.find((s) => s.items?.some((i) => i._key === itemObjectKey));
}

export function matchItemRoleInContext(document: unknown, parent: unknown): ItemRoleRule | undefined {
  const section = findEnclosingSection(document, parent);
  const itemKey = (parent as { itemKey?: string } | undefined)?.itemKey;
  return matchItemRole(section?.sectionKey, itemKey, section?.sectionKind);
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
      description: "Optional heading. Required for some reserved roles (e.g. a FAQ question's Question text, or Contact's Follow-us heading/Submit button/form-field Label) — see this row's own field label above. / Необов'язковий заголовок. Обов'язковий для деяких вбудованих ролей (напр. тексту запитання FAQ або заголовка «Слідкуйте за нами»/кнопки надсилання на сторінці контактів) — див. назву поля вище.",
      // isFieldRequiredByItemRole("title") behaves exactly like the
      // allOrNothingLanguages() this replaces for every role that doesn't
      // list "title" in its requiredFields (see requiredWhen's own doc
      // comment: !isRequired + fully empty => valid, same missing/empty
      // checks otherwise) — only a role that explicitly requires it does.
      validation: requiredWhen(({ document, parent }) => isFieldRequiredByItemRole("title")(document, parent), { skip: skipValidationWhenHiddenByItemRole("title") }),
      hidden: hiddenByItemRole("title"),
      components: { field: ItemRoleAwareFieldLabel, input: CateringAllLanguagesInput },
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "internationalizedArrayText",
      description: "Optional longer text (e.g. a description or answer). Required for some reserved roles (e.g. a FAQ question's Answer text, or Contact's Success message) — see this row's own field label above. / Необов'язковий довший текст. Обов'язковий для деяких вбудованих ролей — див. назву поля вище.",
      validation: requiredWhen(({ document, parent }) => isFieldRequiredByItemRole("text")(document, parent), { skip: skipValidationWhenHiddenByItemRole("text") }),
      hidden: hiddenByItemRole("text"),
      components: { field: ItemRoleAwareFieldLabel, input: CateringAllLanguagesInput },
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
      description: "Optional — set only if this item links somewhere. For a FAQ question, this is an optional link shown under the answer — requires Link text below too. / Необов'язково — заповніть, лише якщо елемент веде на іншу сторінку. Для запитання FAQ це необов'язкове посилання під відповіддю — також потрібен текст посилання нижче.",
      hidden: hiddenByItemRole("href"),
      validation: (rule) =>
        rule.custom((value: string | undefined, context) => {
          if (skipValidationWhenHiddenByItemRole("href")(context)) return true;
          if (!isFaqQuestionRole(context.document, context.parent)) return true;
          const parent = context.parent as { label?: { value?: unknown }[] } | undefined;
          const hasHref = Boolean(value?.trim());
          const hasLabel = hasNonEmptyI18nValue(parent?.label);
          if (hasHref && !hasLabel) return "Add link text (in English, Danish and Ukrainian) below, or clear this link destination.";
          return true;
        }),
    }),
    defineField({
      name: "label",
      title: "Link text / value",
      type: "internationalizedArrayString",
      description:
        "Optional — link text if this item has its own link, or the trilingual value for a small labeled row. For a FAQ question, this is the optional link's text — requires Link destination above too. / Необов'язково — текст посилання (якщо є) або текст значення для невеликого підпису. Для запитання FAQ це текст необов'язкового посилання — також потрібне посилання-призначення вище.",
      validation: (rule) => [
        allOrNothingLanguages({ skip: skipValidationWhenHiddenByItemRole("label") })(rule),
        rule.custom((value: { value?: unknown }[] | undefined, context) => {
          if (skipValidationWhenHiddenByItemRole("label")(context)) return true;
          if (!isFaqQuestionRole(context.document, context.parent)) return true;
          const parent = context.parent as { href?: string } | undefined;
          const hasHref = Boolean(parent?.href?.trim());
          const hasLabel = hasNonEmptyI18nValue(value);
          if (hasLabel && !hasHref) return "Add a link destination above, or clear this link text.";
          return true;
        }),
      ],
      hidden: hiddenByItemRole("label"),
    }),
    defineField({
      name: "value",
      title: "Raw value (not translated)",
      type: "string",
      description:
        "Only for values that shouldn't be translated, e.g. a bank account number. For a Contact form field, this is the field type. / Лише для значень, які не перекладаються, напр. номер банківського рахунку. Для поля форми контактів це тип поля.",
      hidden: hiddenByItemRole("value"),
      // ContactFormFieldTypeInput is scoped internally to items matching the
      // "Contact form field" role only — every other item's `value` field
      // (bank details, etc.) renders the unmodified default string input.
      components: { field: ItemRoleAwareFieldLabel, input: ContactFormFieldTypeInput },
    }),
  ],
  preview: {
    select: { title: "title", icon: "icon", itemKey: "itemKey" },
    prepare({ title, icon, itemKey }) {
      const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      const key = itemKey as string | undefined;
      return { title: en?.value ?? (key && ITEM_KEY_PREVIEW_LABELS[key]) ?? key ?? "(untitled item)", subtitle: icon as string | undefined };
    },
  },
});
