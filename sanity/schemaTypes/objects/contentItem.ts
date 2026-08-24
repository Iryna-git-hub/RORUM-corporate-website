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
  /**
   * When given, this rule only matches on these documents (draft-prefix
   * stripped before comparing — a rule written as `["page-contact"]`
   * matches both `page-contact` and `drafts.page-contact`). Required for
   * any role whose `sectionKeys` string is NOT provably unique across the
   * whole site — `"hero"` and `"form"` in particular are generic section
   * keys plenty of future pages could reasonably reuse. Omit only for
   * roles that are genuinely meant to be shared/open across documents
   * (FAQ questions, Catering menu dishes, the Home/About closingCta rows)
   * where the existing contract already relies on that.
   */
  documentIds?: readonly string[];
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
  faqPromptQuestion: "FAQ prompt question",
  faqPromptLabel: "FAQ prompt link",
  // Events Listing filters (see the "Events filter/empty-state label" role
  // below) — group headings, then each group's own options, then the
  // shared filter-messages rows.
  dateLabel: "Date — group heading",
  languageLabel: "Language — group heading",
  priceLabel: "Price — group heading",
  availabilityLabel: "Availability — group heading",
  soonestLabel: "Soonest first",
  weekLabel: "This week",
  monthLabel: "This month",
  languageDaLabel: "Danish (language option)",
  languageEnLabel: "English (language option)",
  languageUkLabel: "Ukrainian (language option)",
  priceAscLabel: "Price: low to high",
  priceDescLabel: "Price: high to low",
  availableLabel: "Available",
  soldOutLabel: "Sold out",
  clearFiltersLabel: "Clear filters",
  emptyStateTitle: "Empty-state title",
  emptyStateText: "Empty-state text",
  // Event Decoration
  tailoredNote: "Tailored upon request note",
  // Host at RORUM
  optionalLabel: "Optional — column heading",
  footerCtaLabel: "Footer CTA link text",
  footerText: "Footer text (after the CTA link)",
  selectPackageCta: "Select-package button label",
  cancellationTitle: "Cancellation policy heading",
  requestProcessAriaLabel: "Accessibility label (not visibly shown)",
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
  // Every one of these 17 rows is read by app/[locale]/(site)/events/page.tsx
  // via `getItem(filtersSection, key)?.title` ONLY (never .text/.href/.label/
  // .value/.icon/.image/.itemKey) — confirmed live. `languageDaLabel`/
  // `languageEnLabel`/`languageUkLabel` are new (Events Listing Studio task,
  // Section 6): the 3 event-language *display names* ("Danish"/"English"/
  // "Ukrainian" — the same 3 values `event.language` itself stores) were
  // previously hardcoded in lib/eventLanguage.ts; EventsFiltersInput.tsx
  // groups these 17 into 5 manager-facing groups. `documentIds`-scoped (like
  // every other Contact/page-specific role) since "filters" is a section key
  // in principle any future page could reuse. Required (blank labels would
  // produce unusable filter controls, per the task's own explicit rule).
  {
    role: "Events filter/empty-state label",
    documentIds: ["page-events"],
    sectionKeys: ["filters"],
    itemKeyPattern: /^(dateLabel|languageLabel|priceLabel|availabilityLabel|soonestLabel|weekLabel|monthLabel|languageDaLabel|languageEnLabel|languageUkLabel|priceAscLabel|priceDescLabel|availableLabel|soldOutLabel|clearFiltersLabel|emptyStateTitle|emptyStateText)$/,
    visible: ["title"],
    requiredFields: ["title"],
    fieldLabels: { title: "Label text" },
  },
  { role: "Catering hero menu-examples button", sectionKeys: ["hero"], itemKeyPattern: /^menuExamplesCta$/, visible: ["title"] },
  { role: "Catering gallery chip-group aria label", sectionKeys: ["gallery"], itemKeyPattern: /^ariaLabel$/, visible: ["title"] },
  { role: "Catering \"suitable for\" chip", sectionKeys: ["gallery"], itemKeyPattern: /^suitableFor\d+$/, visible: ["icon", "title"] },
  { role: "Catering menu format card", sectionKeys: ["menuFormats"], itemKeyPattern: /^format[0-2]$/, visible: ["title", "text", "image"] },
  // Shared between Catering's "philosophy" section and Event Decoration's
  // "styling" section — both use the exact same closing note role (title +
  // text, e.g. "Tailored upon request") — one rule, not two near-duplicates.
  { role: "\"Tailored upon request\" note (Catering + Event Decoration)", sectionKeys: ["philosophy", "styling"], itemKeyPattern: /^tailoredNote$/, visible: ["title", "text"] },
  // Event Decoration's "What we style" cards (Table styling/Florals/Balloon
  // accents/Atmosphere details/Personal touches) — icon + Title + Text, plus
  // an OPTIONAL Link destination/text (not currently used by any live item,
  // but kept genuinely visible and functional per explicit product
  // decision, not a fake field — see EventDecorationStyleCard's own
  // conditional rendering in the frontend for the "if present" half of that
  // contract). `documentIds`-scoped since "styling" is not (yet) a shared
  // sectionKey the way "gallery"/"steps"/"inquiryForm" already are.
  {
    role: "Event Decoration 'What We Style' item",
    documentIds: ["page-event-decoration"],
    sectionKeys: ["styling"],
    // The outer `(...)?` makes the whole match optional, so a manager-added
    // card with no itemKey yet (added via the generic array control) also
    // matches — same "" branch as Catering's own "what we offer" bullet role.
    itemKeyPattern: /^(format\d*)?$/,
    visible: ["icon", "title", "text", "href", "label"],
    fieldLabels: { label: "Link text" },
  },
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
  // Host at RORUM's "Each Session Includes" section (sectionKey "session") —
  // 7 "includedN" rows (rendered as 2 visual columns by position, see
  // app/[locale]/(site)/host-at-rorum/page.tsx's own `.slice(0,4)`/`.slice(4,7)`
  // split — the icons themselves are a fixed, code-side ordered list with no
  // schema field), 2 "optionalN" rows, and the "optionalLabel" heading row
  // for the Optional column — all title-only.
  {
    role: "Host at RORUM session-includes item",
    documentIds: ["page-host-at-rorum"],
    sectionKeys: ["session"],
    itemKeyPattern: /^(included\d+|optional\d+|optionalLabel)$/,
    visible: ["title"],
    requiredFields: ["title"],
  },
  // Host at RORUM's "Hosting Packages" section (sectionKey "packages") — the
  // package cards themselves (Title = package name, Link text / value =
  // price, Text = one included item per line — see PackageGrid.tsx) need
  // their own 3-field role; every other row in this section (footer CTA/
  // text, "Select Package" button, cancellation policy title + its own
  // bullet rows) is title-only.
  {
    role: "Host at RORUM package",
    documentIds: ["page-host-at-rorum"],
    sectionKeys: ["packages"],
    itemKeyPattern: /^package\d*$/,
    visible: ["title", "label", "text"],
    requiredFields: ["title", "label"],
    fieldLabels: { title: "Package name", label: "Price", text: "Included items (one per line)" },
  },
  {
    role: "Host at RORUM packages title-only row",
    documentIds: ["page-host-at-rorum"],
    sectionKeys: ["packages"],
    itemKeyPattern: /^(footerCtaLabel|footerText|selectPackageCta|cancellationTitle|cancellation\d+)$/,
    visible: ["title"],
  },
  // Host at RORUM's "Additional Services" checkboxes (Breakfast/Snacks/
  // Lunch/Coffee setup) — added to `inquiryForm` (sectionKey, not a new
  // section) as itemKey "service0".."service3" so the booking form's
  // checkboxes read localized EN/DA/UK labels from Sanity instead of
  // components/InquiryForm.tsx's own hardcoded, English-only
  // `bookingServiceOptions` array (see
  // scripts/migrate-host-additional-services.ts). `itemKey` itself is the
  // stable submitted checkbox value — editing/reordering the Title never
  // changes it.
  {
    role: "Host at RORUM additional service",
    documentIds: ["page-host-at-rorum"],
    sectionKeys: ["inquiryForm"],
    itemKeyPattern: /^service\d+$/,
    visible: ["title"],
    requiredFields: ["title"],
    fieldLabels: { title: "Service name" },
  },
  // The Steps section's own aria-label row (itemKey "requestProcessAriaLabel")
  // — same "one row, title-only, read as an accessibility string not a
  // visible chip" pattern as Catering's gallery ariaLabel role, just scoped
  // to Host at RORUM's own steps section instead.
  {
    role: "Host at RORUM step-list aria label",
    documentIds: ["page-host-at-rorum"],
    sectionKeys: ["steps"],
    itemKeyPattern: /^requestProcessAriaLabel$/,
    visible: ["title"],
    fieldLabels: { title: "Accessibility label (not visibly shown)" },
  },
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
  // (never manager-created), so itemKey is never shown. Every Contact role
  // below is `documentIds`-scoped to `page-contact` specifically — unlike
  // "FAQ question"/"Catering menu dish" above, `sectionKeys: ["hero"]`/
  // `["form"]` are generic strings plenty of OTHER pages already use for
  // unrelated purposes (Home's hero, Event Decoration's hero, etc.) — a
  // live regression test proves an identical sectionKey+itemKey on another
  // page's document does NOT activate a Contact role.
  { role: "Contact Follow-us heading", documentIds: ["page-contact"], sectionKeys: ["hero"], itemKeyPattern: /^followUsTitle$/, visible: ["title"], requiredFields: ["title"], fieldLabels: { title: "Follow us heading" } },
  { role: "Contact submit button", documentIds: ["page-contact"], sectionKeys: ["form"], itemKeyPattern: /^submitLabel$/, visible: ["title"], requiredFields: ["title"], fieldLabels: { title: "Submit button text" } },
  { role: "Contact success message", documentIds: ["page-contact"], sectionKeys: ["form"], itemKeyPattern: /^successMessage$/, visible: ["text"], requiredFields: ["text"], fieldLabels: { text: "Success message" } },
  // Display-order-only markers for the 3 supported contact-detail rows
  // (Address/Phone/Email) — the underlying facts stay in the contactInfo
  // singleton; presence + array order here is the entire signal (see
  // lib/sanityContact.ts's resolveContactDetailOrder). No generic field is
  // shown at all — ContactDetailsOrderInput renders its own friendly cards
  // instead of the default per-item form.
  { role: "Contact detail display row", documentIds: ["page-contact"], sectionKeys: ["hero"], itemKeyPattern: /^contactDetail-(address|phone|email)$/, visible: [] },
  // A configurable Contact form field (Task 7) — Label (title)/Placeholder
  // (text)/Field type (value, one of "text"|"email"|"phone"|"multiline").
  // itemKey is a generated stable id used as the HTML name/id (see
  // components/ContactForm.tsx) — never shown, matching every other
  // reserved-row convention. Matched by sectionKind is unnecessary here
  // (form fields only ever live in Contact's own "form" section, a fixed
  // sectionKey, not an open manager-extensible kind).
  {
    role: "Contact form field",
    documentIds: ["page-contact"],
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
  { role: "Contact FAQ prompt question", documentIds: ["page-contact"], sectionKeys: ["form"], itemKeyPattern: /^faqPromptQuestion$/, visible: ["title"], fieldLabels: { title: "FAQ prompt question" } },
  { role: "Contact FAQ prompt link", documentIds: ["page-contact"], sectionKeys: ["form"], itemKeyPattern: /^faqPromptLabel$/, visible: ["title", "href"], fieldLabels: { title: "FAQ prompt link text", href: "FAQ prompt destination (defaults to /faq)" } },
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

/** Strips the `drafts.` prefix so a rule's `documentIds` (canonical ids only) matches both the published and draft copy of a document. */
export function normalizeDocumentId(id: string | undefined): string | undefined {
  return id?.replace(/^drafts\./, "");
}

export function matchItemRole(
  sectionKey: string | undefined,
  itemKey: string | undefined,
  sectionKind?: string,
  documentId?: string,
): ItemRoleRule | undefined {
  if (!sectionKey) return undefined;
  const key = itemKey ?? "";
  const normalizedDocId = normalizeDocumentId(documentId);
  return ITEM_ROLE_RULES.find(
    (rule) =>
      (rule.sectionKeys?.includes(sectionKey) || (sectionKind && rule.sectionKinds?.includes(sectionKind))) &&
      rule.itemKeyPattern.test(key) &&
      // A `documentIds`-scoped rule only matches when we actually know
      // which document this is AND it's in the list — an unknown/absent
      // document id must never accidentally satisfy a document-scoped
      // rule (same fail-safe direction as every other "recognized"-gated
      // predicate in this project — see GalleryMediaAltInput.tsx).
      (!rule.documentIds || (normalizedDocId !== undefined && rule.documentIds.includes(normalizedDocId))),
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
  const documentId = (document as { _id?: string } | undefined)?._id;
  return matchItemRole(section?.sectionKey, itemKey, section?.sectionKind, documentId);
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
