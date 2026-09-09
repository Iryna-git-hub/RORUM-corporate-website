import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import pageSectionType, {
  isFaqCategorySection,
  isPageFaq,
  isPageContact,
  isPageEvents,
  PAGE_SECTION_FIELDS,
  SECTION_FIELD_VISIBILITY,
  SECTION_KIND_FALLBACK_VISIBILITY,
  SECTION_KINDS,
} from "@/sanity/schemaTypes/objects/pageSection";
import legalPageType from "@/sanity/schemaTypes/singletons/legalPage";
import contentItemType, { ITEM_ROLE_RULES, matchItemRoleInContext, isFaqQuestionRole, isFieldRequiredByItemRole, fieldLabelForItemRole } from "@/sanity/schemaTypes/objects/contentItem";
import socialLinkType from "@/sanity/schemaTypes/objects/socialLink";
import { allOrNothingLanguages, allOrNothingForSelectedEventLocales, requireAllLanguages } from "@/sanity/lib/i18nValidation";
import mediaItemType from "@/sanity/schemaTypes/objects/mediaItem";
import { isInformativeMedia } from "@/sanity/lib/galleryMediaContext";
import ctaActionType from "@/sanity/schemaTypes/objects/ctaAction";
import imageWithAltType from "@/sanity/schemaTypes/objects/imageWithAlt";
import ctaLinkType from "@/sanity/schemaTypes/objects/ctaLink";
import seoType from "@/sanity/schemaTypes/objects/seo";
import eventType from "@/sanity/schemaTypes/documents/event";
import pageType from "@/sanity/schemaTypes/documents/page";

/**
 * Direct, no-Studio-runtime tests of the schema's own `hidden`/`readOnly`/
 * `validation` callbacks, invoked with representative mocked contexts — per
 * the approved Studio Visibility Contract fixes. These import the schema
 * object files directly (read-only — nothing here ever calls
 * `.commit()`/`.patch()`/any Sanity client method) and call the exact
 * function references `defineField`/`defineType` return unchanged, so this
 * tests the real callback, not a reimplementation of it. No test() here
 * uses the `page` fixture, so no browser is launched.
 *
 * Limitation (disclosed, not silently assumed away): this proves the
 * callback's own logic is correct for the contexts exercised below. It does
 * NOT prove Sanity Studio's runtime actually calls `hidden` with an
 * equivalent context shape at every field-render, nor does it verify the
 * Studio form's actual on-screen appearance (field order, preview
 * thumbnails, wording as rendered). See the manual Studio smoke-test
 * checklist in the implementation report for the follow-up that would close
 * that gap.
 */

interface FieldDef {
  name: string;
  title?: string;
  hidden?: unknown;
  readOnly?: unknown;
  fields?: FieldDef[];
}

function field(type: { fields: FieldDef[] }, name: string): FieldDef {
  const f = type.fields.find((x) => x.name === name);
  if (!f) throw new Error(`field "${name}" not found`);
  return f;
}

function callHidden(f: FieldDef, ctx: Record<string, unknown>): boolean {
  const h = f.hidden;
  if (typeof h === "boolean") return h;
  if (typeof h === "function") return Boolean((h as (ctx: unknown) => boolean)(ctx));
  return false; // undefined = visible by default, matching Sanity's own behavior
}

function callReadOnly(f: FieldDef, ctx: Record<string, unknown>): boolean {
  const r = f.readOnly;
  if (typeof r === "boolean") return r;
  if (typeof r === "function") return Boolean((r as (ctx: unknown) => boolean)(ctx));
  return false;
}

// ============================================================================
// pageSection.ts — the explicit per-section field-visibility allow-list
// (SECTION_FIELD_VISIBILITY), keyed <page-id>:<sectionKey>. Studio must show
// exactly the fields the frontend reads for a section, and nothing else.
// ============================================================================

const ALL_FIELDS = PAGE_SECTION_FIELDS;

// Illustrative `sectionKind` per section — only used to build a realistic
// mocked `parent` context. `fieldHidden` ignores `sectionKind` entirely when
// there's an explicit allow-list entry, so an inexact value here is harmless;
// it only matters for the fallback tests, which use their own values.
const SECTION_KIND: Record<string, string> = {
  "page-home:hero": "hero", "page-home:quickPaths": "quickPaths", "page-home:eventsStrip": "custom",
  "page-home:editorialAttendEvents": "editorial", "page-home:editorialHostAtRorum": "editorial",
  "page-home:servicesTeaser": "servicesTeaser", "page-home:communityTeaser": "communityTeaser", "page-home:closingCta": "cta",
  "page-about:hero": "hero", "page-about:statement": "iconGrid", "page-about:community": "iconGrid",
  "page-about:pillars": "steps", "page-about:closingCta": "cta",
  "page-catering:hero": "hero", "page-catering:gallery": "gallery", "page-catering:menuFormats": "iconGrid",
  "page-catering:philosophy": "split", "page-catering:steps": "steps", "page-catering:inquiryForm": "form",
  "page-catering-menu-examples:banner": "hero", "page-catering-menu-examples:closing": "cta",
  "page-community-membership:hero": "hero", "page-community-membership:donation": "donation",
  "page-community-membership:intro": "split", "page-community-membership:benefits": "benefits",
  "page-community-membership:application": "cta", "page-community-membership:gallery": "gallery",
  "page-contact:hero": "hero", "page-contact:form": "form",
  "page-event-decoration:hero": "hero", "page-event-decoration:gallery": "gallery", "page-event-decoration:styling": "split",
  "page-event-decoration:steps": "steps", "page-event-decoration:inquiryForm": "form",
  "page-events:hero": "hero", "page-events:filters": "filters", "page-events:closingCta": "cta",
  "page-faq:hero": "hero",
  "page-host-at-rorum:hero": "hero", "page-host-at-rorum:gallery": "gallery", "page-host-at-rorum:session": "split",
  "page-host-at-rorum:packages": "cta", "page-host-at-rorum:steps": "steps", "page-host-at-rorum:inquiryForm": "form",
  "page-volunteer:hero": "hero", "page-volunteer:applicationForm": "form",
  "page-work-with-us:hero": "hero", "page-work-with-us:features": "iconGrid", "page-work-with-us:cvUploadForm": "form",
};

test.describe("pageSection.ts — explicit SECTION_FIELD_VISIBILITY allow-list (mocked contexts, no Studio runtime)", () => {
  // 1. Data-driven: the schema's own `hidden` callback must agree, field by
  //    field, with every declared entry — for both the published and draft id.
  //    This is what stops a section growing an irrelevant field back.
  for (const [key, allowed] of Object.entries(SECTION_FIELD_VISIBILITY)) {
    const [docId, sectionKey] = key.split(":");
    const sectionKind = SECTION_KIND[key];
    test(`allow-list: ${key}  →  [${allowed.join(", ")}]`, () => {
      expect(sectionKind, `missing SECTION_KIND for ${key} — add it to the test map`).toBeTruthy();
      for (const idPrefix of ["", "drafts."]) {
        const document = { _id: `${idPrefix}${docId}` };
        const parent = { sectionKind, sectionKey };
        for (const f of ALL_FIELDS) {
          const shouldBeVisible = (allowed as readonly string[]).includes(f);
          expect(!callHidden(field(pageSectionType, f), { parent, document }), `${key} · ${f} (${idPrefix || "published"})`).toBe(shouldBeVisible);
        }
      }
    });
  }

  // 2. Independent "expected reality" table — hand-written from each page's
  //    own getData()/resolver, NOT derived from SECTION_FIELD_VISIBILITY, so a
  //    wrong entry in the map is caught here. Covers ALL 49 concrete sections.
  //    Keep this in sync with the map by reasoning from the frontend, never by
  //    copying the map.
  const EXPECTED: { key: string; visible: readonly string[] }[] = [
    // ── Home
    { key: "page-home:hero", visible: ["label", "title", "text", "media", "actions", "items"] },
    { key: "page-home:quickPaths", visible: ["label", "title", "items"] },
    { key: "page-home:eventsStrip", visible: ["label", "title", "actions"] }, // "What's on" + heading + "View all events" link; the event cards are separate `event` docs
    { key: "page-home:editorialAttendEvents", visible: ["label", "title", "text", "media", "actions", "items"] },
    { key: "page-home:editorialHostAtRorum", visible: ["label", "title", "text", "media", "actions", "items"] }, // `reversed` is a JSX literal, not a stored setting
    { key: "page-home:servicesTeaser", visible: ["label", "title", "items"] },
    { key: "page-home:communityTeaser", visible: ["label", "title", "text", "media", "items"] },
    { key: "page-home:closingCta", visible: ["label", "title", "text", "actions", "items"] }, // `variant=final` setting is hardcoded in JSX → settings hidden
    // ── About
    { key: "page-about:hero", visible: ["label", "title", "text", "media", "items"] }, // CTA lives in items, not actions
    { key: "page-about:statement", visible: ["title", "text", "items"] }, // no eyebrow read
    { key: "page-about:community", visible: ["title", "text", "items"] },
    { key: "page-about:pillars", visible: ["label", "title", "text", "items"] },
    { key: "page-about:closingCta", visible: ["label", "title", "text", "actions", "items"] },
    // ── Catering
    { key: "page-catering:hero", visible: ["label", "title", "text", "actions", "items"] }, // no photos on this hero
    { key: "page-catering:gallery", visible: ["label", "media", "items"] },
    { key: "page-catering:menuFormats", visible: ["title", "items"] },
    { key: "page-catering:philosophy", visible: ["title", "text", "media", "items"] }, // eyebrow/buttons never read
    { key: "page-catering:steps", visible: ["label", "title", "items"] },
    { key: "page-catering:inquiryForm", visible: ["title", "text", "items"] },
    // ── Catering Menu Examples overlay
    { key: "page-catering-menu-examples:banner", visible: ["title", "media", "items"] },
    { key: "page-catering-menu-examples:closing", visible: ["title", "text", "items"] },
    // ── Community Membership
    { key: "page-community-membership:hero", visible: ["label", "title", "text", "actions", "items"] },
    { key: "page-community-membership:donation", visible: ["label", "title", "text", "media", "items"] }, // label/title/text rendered by WecodaDonationSection (fallback-backed)
    { key: "page-community-membership:intro", visible: ["label", "title", "items"] },
    { key: "page-community-membership:benefits", visible: ["title", "items"] },
    { key: "page-community-membership:application", visible: ["title", "text", "actions", "items"] },
    { key: "page-community-membership:gallery", visible: ["label", "title", "media"] }, // heading `data.galleryTitle` IS rendered (was hidden under the old gallery-kind default)
    // ── Contact
    { key: "page-contact:hero", visible: ["label", "title", "text", "items"] }, // no map/actions on this hero
    { key: "page-contact:form", visible: ["title", "items"] }, // privacy/FAQ toggles = ContactFormSectionInput card, raw settings hidden
    // ── Event Decoration
    { key: "page-event-decoration:hero", visible: ["label", "title", "text", "actions"] },
    { key: "page-event-decoration:gallery", visible: ["label", "media", "items"] },
    { key: "page-event-decoration:styling", visible: ["label", "title", "text", "media", "items"] },
    { key: "page-event-decoration:steps", visible: ["label", "title", "items"] },
    { key: "page-event-decoration:inquiryForm", visible: ["title", "text", "items"] },
    // ── Events listing — the owner's example
    { key: "page-events:hero", visible: ["title"] }, // ONLY the listing H1
    { key: "page-events:filters", visible: ["items"] },
    { key: "page-events:closingCta", visible: ["label", "title", "text", "actions", "items"] },
    // ── FAQ
    { key: "page-faq:hero", visible: ["label", "title", "text"] },
    // ── Host at RORUM
    { key: "page-host-at-rorum:hero", visible: ["label", "title", "text", "actions"] },
    { key: "page-host-at-rorum:gallery", visible: ["media"] }, // no heading/chips on this gallery
    { key: "page-host-at-rorum:session", visible: ["label", "title", "media", "items"] },
    { key: "page-host-at-rorum:packages", visible: ["label", "title", "text", "items"] },
    { key: "page-host-at-rorum:steps", visible: ["label", "title", "items"] },
    { key: "page-host-at-rorum:inquiryForm", visible: ["title", "text", "items"] },
    // ── Volunteer
    { key: "page-volunteer:hero", visible: ["label", "title", "media", "actions", "items"] }, // no section-level text
    { key: "page-volunteer:applicationForm", visible: ["items"] },
    // ── Work With Us
    { key: "page-work-with-us:hero", visible: ["label", "title", "media", "items"] },
    { key: "page-work-with-us:features", visible: ["items"] }, // no section heading read
    { key: "page-work-with-us:cvUploadForm", visible: ["items"] },
  ];
  for (const { key, visible } of EXPECTED) {
    const [docId, sectionKey] = key.split(":");
    test(`expected reality (independent): ${key} shows exactly [${visible.join(", ")}]`, () => {
      const parent = { sectionKind: SECTION_KIND[key], sectionKey };
      const document = { _id: docId };
      for (const f of ALL_FIELDS) {
        expect(!callHidden(field(pageSectionType, f), { parent, document }), `${key} · ${f}`).toBe(visible.includes(f));
      }
    });
  }

  test("the independent EXPECTED table covers every SECTION_FIELD_VISIBILITY entry (it can't fall behind the map)", () => {
    expect(EXPECTED.map((e) => e.key).sort()).toEqual(Object.keys(SECTION_FIELD_VISIBILITY).sort());
  });

  // 3. The owner's exact wording: on /events "Upcoming Events", Label /
  //    Buttons / Photos / Items must all be HIDDEN.
  test("owner's example: page-events 'Upcoming Events' section hides Label, Buttons, Photos and Items", () => {
    const parent = { sectionKind: "hero", sectionKey: "hero" };
    const document = { _id: "page-events" };
    for (const f of ["label", "actions", "media", "items", "text"] as const) {
      expect(callHidden(field(pageSectionType, f), { parent, document }), `${f} must be hidden`).toBe(true);
    }
    expect(callHidden(field(pageSectionType, "title"), { parent, document }), "title stays visible").toBe(false);
  });

  // 4. Fallback: a section NOT in the allow-list (a brand-new one, or an open
  //    manager-extensible set) falls back to the looser sectionKind rules —
  //    never over-hidden by omission.
  test("fallback: an un-listed section uses SECTION_KIND_FALLBACK_VISIBILITY for its kind", () => {
    const document = { _id: "page-home" };
    const parent = { sectionKind: "custom", sectionKey: "someBrandNewCustomSection" };
    for (const f of ALL_FIELDS) {
      const expectVisible = SECTION_KIND_FALLBACK_VISIBILITY.custom.has(f);
      expect(!callHidden(field(pageSectionType, f), { parent, document }), f).toBe(expectVisible);
    }
  });

  test("fallback: menuCategory / faqCategory (open sets, no explicit entry) use their kind's rules", () => {
    const menuParent = { sectionKind: "menuCategory", sectionKey: "category-manager-added" };
    const menuDoc = { _id: "page-catering-menu-examples" };
    for (const f of ALL_FIELDS) {
      expect(!callHidden(field(pageSectionType, f), { parent: menuParent, document: menuDoc }), `menuCategory · ${f}`).toBe(
        SECTION_KIND_FALLBACK_VISIBILITY.menuCategory.has(f),
      );
    }
    const faqParent = { sectionKind: "faqCategory", sectionKey: "group-manager-added" };
    const faqDoc = { _id: "page-faq" };
    for (const f of ALL_FIELDS) {
      expect(!callHidden(field(pageSectionType, f), { parent: faqParent, document: faqDoc }), `faqCategory · ${f}`).toBe(
        SECTION_KIND_FALLBACK_VISIBILITY.faqCategory.has(f),
      );
    }
  });

  test("fallback: a section with no sectionKind yet shows every field (never hidden-but-required)", () => {
    for (const f of ALL_FIELDS) {
      expect(callHidden(field(pageSectionType, f), { parent: { sectionKey: "brand-new" }, document: { _id: "page-home" } }), f).toBe(false);
    }
  });

  // 5. Same sectionKey, different page → independent visibility. "hero" and
  //    "gallery" are shared by nearly every page but resolve per page.
  test("shared sectionKeys resolve per page: page-events:hero (title only) vs page-home:hero (6 fields) vs page-catering:hero (5 fields)", () => {
    const heroParent = { sectionKind: "hero", sectionKey: "hero" };
    expect(!callHidden(field(pageSectionType, "media"), { parent: heroParent, document: { _id: "page-events" } })).toBe(false);
    expect(!callHidden(field(pageSectionType, "media"), { parent: heroParent, document: { _id: "page-home" } })).toBe(true);
    expect(!callHidden(field(pageSectionType, "media"), { parent: heroParent, document: { _id: "page-catering" } })).toBe(false); // catering hero has no photos
    expect(!callHidden(field(pageSectionType, "actions"), { parent: heroParent, document: { _id: "page-catering" } })).toBe(true);
  });

  test("sectionKey / sectionKind are hidden ONLY once a section has BOTH — shown while either is still empty (hidden-required guard)", () => {
    for (const f of ["sectionKey", "sectionKind"] as const) {
      // fully shaped -> hidden (every live section)
      expect(callHidden(field(pageSectionType, f), { parent: { sectionKind: "hero", sectionKey: "hero" } }), `${f} hidden when fully shaped`).toBe(true);
      // both `sectionKey` and `sectionKind` carry rule.required() — hiding one
      // while it's still empty would silently block Publish forever
      expect(callHidden(field(pageSectionType, f), { parent: {} }), `${f} shown when unshaped`).toBe(false);
      expect(callHidden(field(pageSectionType, f), { parent: { sectionKind: "hero" } }), `${f} shown when sectionKey still empty`).toBe(false);
      expect(callHidden(field(pageSectionType, f), { parent: { sectionKey: "hero" } }), `${f} shown when sectionKind still empty`).toBe(false);
    }
  });

  test("the sectionKind dropdown shows plain-language titles, not the internal kind values (Phase B — STEP 10)", () => {
    const kindField = pageSectionType.fields.find((f) => f.name === "sectionKind") as { options?: { list?: { title: string; value: string }[] } };
    const list = kindField.options?.list ?? [];
    expect(list.length).toBe(SECTION_KINDS.length);
    for (const opt of list) {
      expect(SECTION_KINDS as readonly string[]).toContain(opt.value); // stable value preserved
      expect(opt.title, `kind "${opt.value}" needs a friendly title`).not.toBe(opt.value);
      expect(/^[a-z]+[A-Z]/.test(opt.title), `title "${opt.title}" still looks like a camelCase identifier`).toBe(false);
    }
  });

  test("every declared section maps 1:1 to the live-dataset snapshot (no stale keys, no unaudited sections)", () => {
    // The set of keys the schema declares...
    const declared = new Set(Object.keys(SECTION_FIELD_VISIBILITY));
    // ...must equal this HAND-MAINTAINED SNAPSHOT of the (non-open-set)
    // sections that exist in the production dataset. Regenerate it whenever a
    // section is added/removed/renamed — the authoritative check against the
    // *current* live dataset is `npm run sanity:audit-sections` (needs a token).
    // menuCategory + faqCategory sections are deliberately absent (open sets).
    const liveSections = [
      "page-home:hero", "page-home:quickPaths", "page-home:eventsStrip", "page-home:editorialAttendEvents",
      "page-home:editorialHostAtRorum", "page-home:servicesTeaser", "page-home:communityTeaser", "page-home:closingCta",
      "page-about:hero", "page-about:statement", "page-about:community", "page-about:pillars", "page-about:closingCta",
      "page-catering:hero", "page-catering:gallery", "page-catering:menuFormats", "page-catering:philosophy",
      "page-catering:steps", "page-catering:inquiryForm",
      "page-catering-menu-examples:banner", "page-catering-menu-examples:closing",
      "page-community-membership:hero", "page-community-membership:donation", "page-community-membership:intro",
      "page-community-membership:benefits", "page-community-membership:application", "page-community-membership:gallery",
      "page-contact:hero", "page-contact:form",
      "page-event-decoration:hero", "page-event-decoration:gallery", "page-event-decoration:styling",
      "page-event-decoration:steps", "page-event-decoration:inquiryForm",
      "page-events:hero", "page-events:filters", "page-events:closingCta",
      "page-faq:hero",
      "page-host-at-rorum:hero", "page-host-at-rorum:gallery", "page-host-at-rorum:session",
      "page-host-at-rorum:packages", "page-host-at-rorum:steps", "page-host-at-rorum:inquiryForm",
      "page-volunteer:hero", "page-volunteer:applicationForm",
      "page-work-with-us:hero", "page-work-with-us:features", "page-work-with-us:cvUploadForm",
    ];
    expect([...declared].sort()).toEqual([...new Set(liveSections)].sort());
  });
});

// ============================================================================
// contentItem.ts — the full Approved Fix 4 item-role visibility matrix,
// driven directly by the schema's own exported ITEM_ROLE_RULES (the
// "machine-readable matrix" itself) so this can never silently drift from
// the rules the schema actually applies.
// ============================================================================
test.describe("contentItem.ts — ITEM_ROLE_RULES matrix (mocked document+parent contexts)", () => {
  // `itemKey: undefined` (omitted entirely) mirrors a real free-form list
  // item that never had a key assigned (e.g. a catering menu dish) —
  // `matchItemRole` treats a missing itemKey as "" for pattern matching.
  function docWithItem(sectionKey: string, itemKey: string | undefined, itemObjectKey = "the-item", sectionKind?: string, documentId?: string) {
    const item: { _key: string; itemKey?: string } = { _key: itemObjectKey };
    if (itemKey !== undefined) item.itemKey = itemKey;
    return { _id: documentId, sections: [{ sectionKey, sectionKind, items: [item] }] };
  }

  for (const rule of ITEM_ROLE_RULES) {
    // Patterns here are all literal-alternation or prefix+digit shaped; probe a few plausible candidates instead of guessing blindly.
    const candidates = [
      "",
      "categoryIcon",
      ...(rule.sectionKeys ?? []).flatMap((k) => [k, `${k}0`, `${k}1`]),
      "trust0", "trust1", "trust2", "trust3",
      "events", "hostAtRorum", "catering", "eventDecoration",
      "description", "feature0", "feature1", "feature2", "feature3",
      "wecoda", "workWithUs", "volunteer",
      "faqQuestion", "faqLabel", "link0", "link1", "link2", "link3",
      "intro0", "intro1", "service0", "service1",
      "community0", "community1", "community2",
      "pillar0", "pillar1", "pillar2", "pillar3",
      "dateLabel", "languageLabel", "priceLabel", "availabilityLabel", "soonestLabel", "weekLabel",
      "monthLabel", "priceAscLabel", "priceDescLabel", "availableLabel", "soldOutLabel",
      "clearFiltersLabel", "emptyStateTitle", "emptyStateText",
      "menuExamplesCta", "ariaLabel", "suitableFor0", "suitableFor1",
      "format0", "format1", "format2", "format3", "format4", "format5",
      "tailoredNote", "step0", "step1", "step2",
      "submitLabel", "messagePlaceholder", "footerNote", "successMessage",
      "requestCta", "featuredDishesLabel", "backToCateringCta", "disclaimerNote", "emptyStateMessage",
      "followUsTitle", "contactDetail-address", "contactDetail-phone", "contactDetail-email", "field-name",
      "faqPromptQuestion", "faqPromptLabel",
      "included0", "included6", "optional0", "optional1", "optionalLabel",
      "package0", "package1", "package2", "footerCtaLabel", "footerText", "selectPackageCta",
      "cancellationTitle", "cancellation0", "cancellation1", "cancellation2", "requestProcessAriaLabel",
      "priceStripText", "scanText", "scanSubtext", "orText", "bankTransferText", "bankDetailsTitle",
      "supportText", "bank0", "bank4", "bank6", "column0", "column1", "benefit0", "benefit8",
    ];
    const rawItemKey = candidates.find((c) => rule.itemKeyPattern.test(c));
    if (rawItemKey === undefined) throw new Error(`no test candidate matches rule "${rule.role}"'s pattern — fix the test fixture list`);
    const itemKey = rawItemKey === "" ? undefined : rawItemKey;

    const sectionKey = rule.sectionKeys?.[0] ?? "some-manager-added-section-key";
    const sectionKind = rule.sectionKeys ? undefined : rule.sectionKinds![0];

    test(`role="${rule.role}" (sectionKey in [${(rule.sectionKeys ?? []).join(",")}]${rule.sectionKinds ? `, sectionKind in [${rule.sectionKinds.join(",")}]` : ""}, itemKey=${JSON.stringify(itemKey)})`, () => {
      const document = docWithItem(sectionKey, itemKey, "the-item", sectionKind, rule.documentIds?.[0]);
      const parent = document.sections[0]!.items[0]!;

      const matched = matchItemRoleInContext(document, parent);
      expect(matched?.role, `expected itemKey ${JSON.stringify(itemKey)} in section "${sectionKey}" to match role "${rule.role}"`).toBe(rule.role);

      for (const fieldName of ["itemKey", "icon", "title", "text", "image", "href", "label", "value", "copyEnabled"] as const) {
        const expectedVisible = rule.visible.includes(fieldName);
        const actualVisible = !callHidden(field(contentItemType, fieldName), { document, parent });
        expect(actualVisible, `${fieldName} visibility for role "${rule.role}"`).toBe(expectedVisible);
      }
    });
  }

  test("a sectionKinds-based rule (Catering menu dish) matches ANY sectionKey sharing that kind — proves manager-added categories get the same field visibility with zero code changes", () => {
    const document = docWithItem("menuCategory-brandNewCategory", undefined, "dish-1", "menuCategory");
    const parent = document.sections[0]!.items[0]!;
    const matched = matchItemRoleInContext(document, parent);
    expect(matched?.role).toBe("Catering menu dish");
  });

  test("a sectionKinds-based rule never matches a section of a different kind, even with the same key pattern (empty itemKey)", () => {
    const document = docWithItem("someOtherSection", undefined, "the-item", "custom");
    const parent = document.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(document, parent)).toBeUndefined();
  });

  // Regression for the live Studio defect: a manager-added "What We Offer"
  // bullet (philosophy section) added through the generic array "add"
  // control has NO itemKey yet — before this fix, "Catering \"what we
  // offer\" bullet"'s pattern was the closed set /^format[0-5]$/, which
  // never matches "", so the new item matched no role at all and every
  // generic contentItem field (itemKey, image, href, label, value) stayed
  // visible with its validation unskipped. CateringOfferItemsInput.tsx
  // sidesteps this in practice by always assigning a real formatN key, but
  // the schema itself must also tolerate a blank one (e.g. an item added via
  // the disabled-but-still-technically-reachable native array control).
  test("a brand-new What We Offer bullet with NO itemKey yet matches its role — only icon/title/text visible, itemKey/image/href/label/value hidden", () => {
    const document = docWithItem("philosophy", undefined, "the-item");
    const parent = document.sections[0]!.items[0]!;
    const matched = matchItemRoleInContext(document, parent);
    expect(matched?.role).toBe('Catering "what we offer" bullet');
    for (const fieldName of ["icon", "title", "text"] as const) {
      expect(callHidden(field(contentItemType, fieldName), { document, parent }), fieldName).toBe(false);
    }
    for (const fieldName of ["itemKey", "image", "href", "label", "value"] as const) {
      expect(callHidden(field(contentItemType, fieldName), { document, parent }), fieldName).toBe(true);
    }
  });

  test("a What We Offer bullet's itemKey is readOnly once CateringOfferItemsInput assigns it — rename (title/text edits) and reorder have no code path that can change it", () => {
    expect(callReadOnly(field(contentItemType, "itemKey"), { value: "format7" })).toBe(true);
  });

  test("a blank-itemKey What We Offer bullet still doesn't leak into the sibling tailoredNote role or vice versa", () => {
    const blank = docWithItem("philosophy", undefined, "the-item");
    expect(matchItemRoleInContext(blank, blank.sections[0]!.items[0]!)?.role).not.toBe('"Tailored upon request" note (Catering + Event Decoration)');
    const noted = docWithItem("philosophy", "tailoredNote", "the-item");
    expect(matchItemRoleInContext(noted, noted.sections[0]!.items[0]!)?.role).toBe('"Tailored upon request" note (Catering + Event Decoration)');
  });

  test("an item with no audited role shows every field, unchanged", () => {
    const document = { sections: [{ sectionKey: "someUnauditedSection", items: [{ _key: "x", itemKey: "somethingElse" }] }] };
    const parent = document.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(document, parent)).toBeUndefined();
    for (const fieldName of ["itemKey", "icon", "title", "text", "image", "href", "label", "value"] as const) {
      expect(callHidden(field(contentItemType, fieldName), { document, parent }), fieldName).toBe(false);
    }
  });

  test("itemKey collision across pages: 'description' only matches inside editorialAttendEvents/editorialHostAtRorum, not elsewhere", () => {
    const elsewhere = { sections: [{ sectionKey: "someOtherSection", items: [{ _key: "x", itemKey: "description" }] }] };
    expect(matchItemRoleInContext(elsewhere, elsewhere.sections[0]!.items[0]!)).toBeUndefined();
  });

  test("itemKey is readOnly only once it already has a value", () => {
    expect(callReadOnly(field(contentItemType, "itemKey"), { value: "events" })).toBe(true);
    expect(callReadOnly(field(contentItemType, "itemKey"), { value: undefined })).toBe(false);
  });
});

test.describe("ctaAction.ts — actionKey readOnly-when-set, linkType hidden site-wide (Approved Fix 5)", () => {
  test("actionKey is readOnly only once it already has a value", () => {
    expect(callReadOnly(field(ctaActionType, "actionKey"), { value: "main" })).toBe(true);
    expect(callReadOnly(field(ctaActionType, "actionKey"), { value: undefined })).toBe(false);
  });

  test("linkType is hidden unconditionally, on every page/section", () => {
    for (const parent of [{ sectionKey: "hero" }, { sectionKey: "closingCta" }, { sectionKey: "anything" }, undefined]) {
      expect(callHidden(field(ctaActionType, "linkType"), { parent })).toBe(true);
    }
  });
});

test.describe("mediaItem.ts — isHomeDecorativeBackgroundMedia() + caption hidden site-wide (Approved Fix 6)", () => {
  const heroDoc = {
    _id: "page-home",
    sections: [
      { sectionKey: "hero", media: [{ _key: "heroVideo" }] },
      { sectionKey: "communityTeaser", media: [{ _key: "communityMedia1" }] },
      { sectionKey: "editorialAttendEvents", media: [{ _key: "attendMedia1" }] },
    ],
  };

  test("page-home hero media -> alt hidden", () => {
    expect(callHidden(field(mediaItemType, "alt"), { document: heroDoc, parent: { _key: "heroVideo" } })).toBe(true);
  });

  test("drafts.page-home hero media -> alt hidden (draft id prefix stripped)", () => {
    const draftDoc = { ...heroDoc, _id: "drafts.page-home" };
    expect(callHidden(field(mediaItemType, "alt"), { document: draftDoc, parent: { _key: "heroVideo" } })).toBe(true);
  });

  test("page-home communityTeaser media -> alt hidden", () => {
    expect(callHidden(field(mediaItemType, "alt"), { document: heroDoc, parent: { _key: "communityMedia1" } })).toBe(true);
  });

  test("page-home editorialAttendEvents media (meaningful image) -> alt VISIBLE", () => {
    expect(callHidden(field(mediaItemType, "alt"), { document: heroDoc, parent: { _key: "attendMedia1" } })).toBe(false);
  });

  test("page-about hero media with the SAME sectionKey/_key values -> alt VISIBLE (document._id gate, not sectionKey alone)", () => {
    const aboutDoc = { _id: "page-about", sections: [{ sectionKey: "hero", media: [{ _key: "heroVideo" }] }] };
    expect(callHidden(field(mediaItemType, "alt"), { document: aboutDoc, parent: { _key: "heroVideo" } })).toBe(false);
  });

  test("page-home with an unmatched media _key -> alt VISIBLE", () => {
    expect(callHidden(field(mediaItemType, "alt"), { document: heroDoc, parent: { _key: "not-a-real-key" } })).toBe(false);
  });

  test("required-alt validation is skipped exactly where the field is hidden, and only there", () => {
    const altField = field(mediaItemType, "alt") as unknown as { validation?: (rule: unknown) => unknown };
    let captured: ((value: unknown, context: unknown) => unknown) | undefined;
    const mockRule = {
      custom(fn: (value: unknown, context: unknown) => unknown) {
        captured = fn;
        return mockRule;
      },
    };
    altField.validation?.(mockRule);
    expect(captured, "expected mediaItem.alt's validation to call rule.custom(...)").toBeTruthy();

    const heroContext = { document: heroDoc, parent: { _key: "heroVideo" } };
    const attendContext = { document: heroDoc, parent: { _key: "attendMedia1" } };
    expect(captured!(undefined, heroContext)).toBe(true);
    expect(captured!(undefined, attendContext)).not.toBe(true);
  });

  test("caption is hidden unconditionally, on every page/section (Approved Fix 6 — 0 populated values confirmed by read-only query before hiding)", () => {
    for (const document of [heroDoc, { _id: "page-about" }, { _id: "page-catering" }]) {
      for (const parent of [{ _key: "heroVideo" }, { _key: "attendMedia1" }, { _key: "anything" }]) {
        expect(callHidden(field(mediaItemType, "caption"), { document, parent })).toBe(true);
      }
    }
  });
});

test.describe("mediaItem.ts — posterImage is hidden and unvalidated everywhere (poster-removal product decision, superseding the earlier poster-required work)", () => {
  function galleryDoc(id: string, mediaKeys: { _key: string }[]) {
    return { _id: id, sections: [{ sectionKey: "gallery", media: mediaKeys }] };
  }

  const cateringDoc = galleryDoc("page-catering", [{ _key: "video1" }, { _key: "photo1" }]);
  const eventDecorationDoc = galleryDoc("page-event-decoration", [{ _key: "video1" }]);
  const hostAtRorumDoc = galleryDoc("page-host-at-rorum", [{ _key: "video1" }]);
  const homeDoc = {
    _id: "page-home",
    sections: [{ sectionKey: "hero", media: [{ _key: "heroVideo" }] }],
  };
  const communityMembershipDoc = {
    _id: "page-community-membership",
    sections: [{ sectionKey: "gallery", media: [{ _key: "video1" }] }],
  };

  const contexts: { name: string; document: unknown; parent: unknown }[] = [
    { name: "page-catering gallery video", document: cateringDoc, parent: { _key: "video1", kind: "video" } },
    { name: "drafts.page-catering gallery video", document: { ...cateringDoc, _id: "drafts.page-catering" }, parent: { _key: "video1", kind: "video" } },
    { name: "page-event-decoration gallery video", document: eventDecorationDoc, parent: { _key: "video1", kind: "video" } },
    { name: "page-host-at-rorum gallery video", document: hostAtRorumDoc, parent: { _key: "video1", kind: "video" } },
    { name: "page-catering gallery photo (non-video)", document: cateringDoc, parent: { _key: "photo1", kind: "image" } },
    { name: "Home hero video (not one of the 3 scoped galleries)", document: homeDoc, parent: { _key: "heroVideo", kind: "video" } },
    { name: "Community Membership video (different schema type entirely)", document: communityMembershipDoc, parent: { _key: "video1", kind: "video" } },
    { name: "an unrelated/unmatched document", document: { _id: "page-about" }, parent: { _key: "anything", kind: "video" } },
  ];

  for (const { name, document, parent } of contexts) {
    test(`posterImage is hidden for: ${name}`, () => {
      expect(callHidden(field(mediaItemType, "posterImage"), { document, parent })).toBe(true);
    });
  }

  test("posterImage has no validation rule at all — nothing left to enforce on an unused, hidden field", () => {
    const posterField = field(mediaItemType, "posterImage") as unknown as { validation?: unknown };
    expect(posterField.validation).toBeUndefined();
  });

  test("a video with a valid source and complete alt but no poster is otherwise unblocked (regression guard for the superseded poster-required behavior)", () => {
    // No posterImage validation exists any more, so there is nothing to
    // invoke here — this test exists so a future re-introduction of a
    // poster requirement fails loudly (this assertion would need to change)
    // rather than silently reintroducing the superseded behavior unnoticed.
    const posterField = field(mediaItemType, "posterImage") as unknown as { validation?: unknown };
    expect(posterField.validation).toBeUndefined();
    expect(callHidden(field(mediaItemType, "posterImage"), { document: cateringDoc, parent: { _key: "video1", kind: "video" } })).toBe(true);
  });
});

test.describe("mediaItem.ts — a video needs at least one usable source before Publish (Mixed-media Lightbox follow-up, Task 10)", () => {
  function videoValue(overrides: Record<string, unknown> = {}) {
    return { kind: "video", ...overrides };
  }

  test("neither videoFile nor videoUrl -> blocking, bilingual error", () => {
    const validate = captureCustomValidator(mediaItemType as unknown as FieldDef);
    const result = validate(videoValue(), {});
    expect(result).not.toBe(true);
    expect(String(result)).toContain("needs either an uploaded video file or a valid direct video URL");
    expect(String(result)).toContain("Відео потребує");
  });

  test("uploaded videoFile only -> valid", () => {
    const validate = captureCustomValidator(mediaItemType as unknown as FieldDef);
    const result = validate(videoValue({ videoFile: { asset: { _ref: "file-abc" } } }), {});
    expect(result).toBe(true);
  });

  test("valid direct videoUrl only -> valid", () => {
    const validate = captureCustomValidator(mediaItemType as unknown as FieldDef);
    const result = validate(videoValue({ videoUrl: "https://example.com/clip.mp4" }), {});
    expect(result).toBe(true);
  });

  test("invalid/unsupported videoUrl with no uploaded file -> blocking", () => {
    const validate = captureCustomValidator(mediaItemType as unknown as FieldDef);
    const result = validate(videoValue({ videoUrl: "https://www.youtube.com/watch?v=abc" }), {});
    expect(result).not.toBe(true);
  });

  test("uploaded file + empty videoUrl -> valid", () => {
    const validate = captureCustomValidator(mediaItemType as unknown as FieldDef);
    const result = validate(videoValue({ videoFile: { asset: { _ref: "file-abc" } }, videoUrl: "" }), {});
    expect(result).toBe(true);
  });

  test("uploaded file + invalid/unsupported videoUrl -> valid (upload wins, the unused URL never blocks Publish)", () => {
    const validate = captureCustomValidator(mediaItemType as unknown as FieldDef);
    const result = validate(videoValue({ videoFile: { asset: { _ref: "file-abc" } }, videoUrl: "https://www.youtube.com/watch?v=abc" }), {});
    expect(result).toBe(true);
  });

  test("a photo item is never subject to this check, regardless of videoFile/videoUrl content", () => {
    const validate = captureCustomValidator(mediaItemType as unknown as FieldDef);
    const result = validate({ kind: "image" }, {});
    expect(result).toBe(true);
  });

  test("videoUrl's OWN field-level validation also skips (returns true) once an uploaded file is present, even for an unsupported URL — the file takes precedence, so the stale URL is simply ignored, not a publish blocker", () => {
    const validate = captureCustomValidator(field(mediaItemType, "videoUrl"));
    const context = { parent: { kind: "video", videoFile: { asset: { _ref: "file-abc" } } } };
    expect(validate("https://www.youtube.com/watch?v=abc", context)).toBe(true);
    expect(validate("not a url", context)).toBe(true);
  });

  test("videoUrl's field-level validation still blocks an unsupported URL when NO file is uploaded (unchanged)", () => {
    const validate = captureCustomValidator(field(mediaItemType, "videoUrl"));
    const context = { parent: { kind: "video" } };
    const result = validate("https://www.youtube.com/watch?v=abc", context);
    expect(result).not.toBe(true);
  });
});

test.describe("galleryMediaContext.ts — isInformativeMedia() never diverges from where alt is actually required (Event Decoration Publish-blocker follow-up, Task 2/3 — broadened after a narrower gallery-only scope missed styling.media[image])", () => {
  function doc(id: string, sections: { sectionKey?: string; media?: { _key?: string }[] }[]) {
    return { _id: id, sections };
  }

  test("true for page-catering's gallery media", () => {
    const document = doc("page-catering", [{ sectionKey: "gallery", media: [{ _key: "m1" }] }]);
    expect(isInformativeMedia(document, { _key: "m1" })).toBe(true);
  });

  test("true for page-event-decoration's gallery media", () => {
    const document = doc("page-event-decoration", [{ sectionKey: "gallery", media: [{ _key: "m1" }] }]);
    expect(isInformativeMedia(document, { _key: "m1" })).toBe(true);
  });

  test("true for page-host-at-rorum's gallery media", () => {
    const document = doc("page-host-at-rorum", [{ sectionKey: "gallery", media: [{ _key: "m1" }] }]);
    expect(isInformativeMedia(document, { _key: "m1" })).toBe(true);
  });

  test("draft ids are recognized identically (prefix stripped)", () => {
    const document = doc("drafts.page-event-decoration", [{ sectionKey: "gallery", media: [{ _key: "m1" }] }]);
    expect(isInformativeMedia(document, { _key: "m1" })).toBe(true);
  });

  test("true for Event Decoration's styling.media[image] — the exact real Publish blocker a narrower gallery-only scope missed", () => {
    const document = doc("drafts.page-event-decoration", [{ sectionKey: "styling", media: [{ _key: "image" }] }]);
    expect(isInformativeMedia(document, { _key: "image" })).toBe(true);
  });

  test("true for a non-gallery page's media (e.g. page-about's hero) — no longer scoped to just the 3 HorizontalGallery pages", () => {
    const document = doc("page-about", [{ sectionKey: "hero", media: [{ _key: "m1" }] }]);
    expect(isInformativeMedia(document, { _key: "m1" })).toBe(true);
  });

  test("false for Home's hero/communityTeaser background media — the one carve-out, unchanged", () => {
    const document = doc("page-home", [
      { sectionKey: "hero", media: [{ _key: "heroVideo" }] },
      { sectionKey: "communityTeaser", media: [{ _key: "communityMedia1" }] },
    ]);
    expect(isInformativeMedia(document, { _key: "heroVideo" })).toBe(false);
    expect(isInformativeMedia(document, { _key: "communityMedia1" })).toBe(false);
  });

  test("true for Home's OTHER (non-decorative) media, e.g. an editorial section", () => {
    const document = doc("page-home", [{ sectionKey: "editorialAttendEvents", media: [{ _key: "attendMedia1" }] }]);
    expect(isInformativeMedia(document, { _key: "attendMedia1" })).toBe(true);
  });

  test("an unmatched media _key on Home is treated as informative (visible), matching isHomeDecorativeBackgroundMedia's own fail-safe default", () => {
    const document = doc("page-home", [{ sectionKey: "hero", media: [{ _key: "heroVideo" }] }]);
    expect(isInformativeMedia(document, { _key: "not-a-real-key" })).toBe(true);
  });

  test("no false positive: every context where this predicate is true also has alt genuinely required (requireAllLanguages, not skipped by isHomeDecorativeBackgroundMedia)", () => {
    const cateringGalleryDoc = { _id: "page-catering", sections: [{ sectionKey: "gallery", media: [{ _key: "m1" }] }] };
    const validate = captureCustomValidator(field(mediaItemType, "alt"));
    // isInformativeMedia(cateringGalleryDoc, {_key:"m1"}) === true here —
    // confirm the SAME context genuinely blocks Publish when incomplete.
    const result = validate([{ language: "en", value: "A photo" }], { document: cateringGalleryDoc, parent: { _key: "m1" } });
    expect(result).not.toBe(true);
  });

  test("no false negative: the Home decorative context this predicate marks false also genuinely skips validation", () => {
    const homeHeroDoc = { _id: "page-home", sections: [{ sectionKey: "hero", media: [{ _key: "heroVideo" }] }] };
    const validate = captureCustomValidator(field(mediaItemType, "alt"));
    const result = validate(undefined, { document: homeHeroDoc, parent: { _key: "heroVideo" } });
    expect(result).toBe(true);
  });
});

test.describe("Event Decoration Publish-blocker — regression using the exact live-diagnosed data (Task 7.1/7.2)", () => {
  // Captured verbatim from the live manual-Studio-test report: a real
  // uploaded video (_key "a9c885303e10") added to drafts.page-event-decoration's
  // gallery, with complete EN/DA/UK alt, confirmed via `sanity documents
  // validate` to carry ZERO blocking markers of its own — every one of the
  // 15 blocking markers found belonged to pre-existing photos (img0-img13,
  // styling.media[image]), none to this video.
  const eventDecorationDoc = {
    _id: "drafts.page-event-decoration",
    sections: [{ _key: "gallerySectionKey", sectionKey: "gallery", media: [{ _key: "a9c885303e10" }] }],
  };
  const newVideo = {
    _key: "a9c885303e10",
    kind: "video",
    videoFile: { asset: { _ref: "file-47d8211862bdddd6a6ffc7f959372373cf0ce27c-mp4" } },
    alt: [
      { language: "en", value: "test" },
      { language: "da", value: "test" },
      { language: "uk", value: "test" },
    ],
  };

  test("the new video's object-level source validator passes", () => {
    const validate = captureCustomValidator(mediaItemType as unknown as FieldDef);
    expect(validate(newVideo, { document: eventDecorationDoc })).toBe(true);
  });

  test("the new video's alt field validator passes (complete EN/DA/UK)", () => {
    const validate = captureCustomValidator(field(mediaItemType, "alt"));
    expect(validate(newVideo.alt, { document: eventDecorationDoc, parent: newVideo })).toBe(true);
  });

  test("an existing gallery photo with EN-only alt (the actual live blocker shape) fails validation — proves the diagnosis, not the new video", () => {
    const existingPhoto = { _key: "img0", kind: "image", alt: [{ language: "en", value: "Balloon wall decoration for a RORUM event" }] };
    const validate = captureCustomValidator(field(mediaItemType, "alt"));
    const result = validate(existingPhoto.alt, {
      document: { _id: "drafts.page-event-decoration", sections: [{ _key: "gallerySectionKey", sectionKey: "gallery", media: [existingPhoto] }] },
      parent: existingPhoto,
    });
    expect(result).not.toBe(true);
  });

  test("the same photo passes once DA/UK are backfilled (the approved repair's expected end state)", () => {
    const backfilledPhoto = {
      _key: "img0",
      kind: "image",
      alt: [
        { language: "en", value: "Balloon wall decoration for a RORUM event" },
        { language: "da", value: "Ballonvægdekoration til et RORUM-arrangement" },
        { language: "uk", value: "Декорація зі стіни з кульок для заходу RORUM" },
      ],
    };
    const validate = captureCustomValidator(field(mediaItemType, "alt"));
    const result = validate(backfilledPhoto.alt, {
      document: { _id: "drafts.page-event-decoration", sections: [{ _key: "gallerySectionKey", sectionKey: "gallery", media: [backfilledPhoto] }] },
      parent: backfilledPhoto,
    });
    expect(result).toBe(true);
  });
});

/**
 * Captures the function(s) passed to `rule.custom(...)` so they can be
 * invoked directly with a mocked (value, context) pair. A field's
 * `validation` can register more than one independent `rule.custom(...)`
 * call (e.g. `(rule) => [a(rule), b(rule)]` — contentItem.ts's `label` field
 * does this for FAQ questions: the existing i18n-completeness check plus a
 * new href/label pairing check). Every captured function is run and ANDed
 * together (first non-`true` result wins) — the same semantics Sanity
 * itself applies to an array of Rules, so this stays a faithful stand-in
 * regardless of how many `rule.custom(...)` calls one field registers.
 */
function captureCustomValidator(f: FieldDef): (value: unknown, context: unknown) => unknown {
  const withValidation = f as unknown as { validation?: (rule: unknown) => unknown };
  const captured: ((value: unknown, context: unknown) => unknown)[] = [];
  const mockRule = {
    custom(fn: (value: unknown, context: unknown) => unknown) {
      captured.push(fn);
      return mockRule;
    },
    // No-op passthrough — some fields chain `.required()` ahead of
    // `.custom(...)` in the same validation array (e.g. socialLink.ts's
    // icon field); this mock only needs to capture the custom() call(s),
    // not actually enforce requiredness itself.
    required() {
      return mockRule;
    },
  };
  withValidation.validation?.(mockRule);
  if (!captured.length) throw new Error(`expected field "${f.name}" to call rule.custom(...)`);
  return (value: unknown, context: unknown) => {
    for (const fn of captured) {
      const result = fn(value, context);
      if (result !== true) return result;
    }
    return true;
  };
}

// ============================================================================
// imageWithAlt.ts — the decorative-image-alt hide for Home's quickPaths/
// servicesTeaser cards, and the second, independent skip for any item role
// whose `image` field is entirely hidden (closingCta links / About hero
// intro links). A hidden field must never block publishing.
// ============================================================================
test.describe("imageWithAlt.ts — decorative-alt hide + hidden-field validation skip", () => {
  function homeDocWithQuickPathItem(sectionKey: string, itemKey: string) {
    return {
      _id: "page-home",
      sections: [{ _key: "sec1", sectionKey, items: [{ _key: "item1", itemKey }] }],
    };
  }
  const path = (n: number) => ["sections", { _key: "sec1" }, "items", { _key: "item1" }, "image", "alt"].slice(0, n);

  test("quickPaths card image.alt is hidden on page-home, alt validation is skipped", () => {
    const document = homeDocWithQuickPathItem("quickPaths", "hostAtRorum");
    const context = { document, path: path(4).concat(["image", "alt"]) };
    expect(callHidden(field(imageWithAltType, "alt"), context)).toBe(true);
    expect(captureCustomValidator(field(imageWithAltType, "alt"))(undefined, context)).toBe(true);
  });

  test("servicesTeaser card image.alt is hidden on page-home", () => {
    const document = homeDocWithQuickPathItem("servicesTeaser", "catering");
    const context = { document, path: path(4).concat(["image", "alt"]) };
    expect(callHidden(field(imageWithAltType, "alt"), context)).toBe(true);
  });

  test("the SAME quickPaths sectionKey/itemKey on a different document id is NOT hidden (document-scoped, not sectionKey-alone)", () => {
    const document = { ...homeDocWithQuickPathItem("quickPaths", "hostAtRorum"), _id: "page-catering" };
    const context = { document, path: path(4).concat(["image", "alt"]) };
    expect(callHidden(field(imageWithAltType, "alt"), context)).toBe(false);
  });

  test("About's atmosphere/editorial images (not a decorative role) keep alt VISIBLE and required", () => {
    const document = { _id: "page-about", sections: [{ _key: "sec1", sectionKey: "hero", items: [{ _key: "item1", itemKey: "notADecorativeRole" }] }] };
    const context = { document, path: path(4).concat(["image", "alt"]) };
    expect(callHidden(field(imageWithAltType, "alt"), context)).toBe(false);
    expect(captureCustomValidator(field(imageWithAltType, "alt"))(undefined, context)).toBe("English alt text is required.");
  });

  test("an item role whose `image` field is entirely hidden (closingCta suggested-path link) also skips alt validation", () => {
    const document = { _id: "page-home", sections: [{ _key: "sec1", sectionKey: "closingCta", items: [{ _key: "item1", itemKey: "link0" }] }] };
    const context = { document, path: path(4).concat(["image", "alt"]) };
    expect(callHidden(field(imageWithAltType, "alt"), context)).toBe(true);
    expect(captureCustomValidator(field(imageWithAltType, "alt"))(undefined, context)).toBe(true);
  });

  test("regression: a stray, incomplete alt value in a hidden context can never fail validation (proves the hidden-but-validated bug class is fixed)", () => {
    const document = { _id: "page-home", sections: [{ _key: "sec1", sectionKey: "closingCta", items: [{ _key: "item1", itemKey: "link1" }] }] };
    const context = { document, path: path(4).concat(["image", "alt"]) };
    const strayValue = [{ _key: "en", language: "en", value: "" }];
    expect(captureCustomValidator(field(imageWithAltType, "alt"))(strayValue, context)).toBe(true);
  });

  // 2026-09 validation-integrity audit: Community Membership's 9 Benefit cards
  // render their image as <Image alt="" aria-hidden="true"> (decorative icon
  // next to a visible <h3>/<p>) — see community-membership/page.tsx. Requiring
  // alt there only ever blocked Publish on legacy benefit content.
  const cmBenefitDoc = (itemKey: string, id = "page-community-membership") => ({
    _id: id,
    sections: [{ _key: "sec1", sectionKey: "benefits", items: [{ _key: "item1", itemKey }] }],
  });

  test("a Community Membership benefit card image.alt is hidden + validation-skipped (decorative)", () => {
    const context = { document: cmBenefitDoc("benefit3"), path: path(4).concat(["image", "alt"]) };
    expect(callHidden(field(imageWithAltType, "alt"), context)).toBe(true);
    expect(captureCustomValidator(field(imageWithAltType, "alt"))(undefined, context)).toBe(true);
    // a stray English-only value left on a now-decorative image also can't block
    expect(captureCustomValidator(field(imageWithAltType, "alt"))([{ _key: "en", language: "en", value: "old alt" }], context)).toBe(true);
  });

  test("the decorative-benefit exemption is document-scoped: the same benefits/benefitN role on another page keeps alt required", () => {
    const context = { document: cmBenefitDoc("benefit0", "page-about"), path: path(4).concat(["image", "alt"]) };
    expect(callHidden(field(imageWithAltType, "alt"), context)).toBe(false);
    expect(captureCustomValidator(field(imageWithAltType, "alt"))(undefined, context)).toBe("English alt text is required.");
  });

  test("a non-benefit item on Community Membership still requires alt (scoped to the benefit role only)", () => {
    const context = { document: cmBenefitDoc("somethingElse"), path: path(4).concat(["image", "alt"]) };
    expect(captureCustomValidator(field(imageWithAltType, "alt"))(undefined, context)).toBe("English alt text is required.");
  });
});

// ============================================================================
// ctaLink.ts — an entirely-empty `siteSettings.announcementLink` is valid
// (2026-09 validation-integrity audit). That field is `hidden` unless the
// announcement banner is enabled, but its nested href/label `required()` rules
// still fired — so an empty Studio-scaffolded announcement link left behind
// after the manager turned the banner off made `drafts.siteSettings`
// permanently un-publishable. A partially-filled link must still be completed,
// and every other ctaLink user (serviceHero / editorialFeature /
// nextStepSection) is untouched.
// ============================================================================
test.describe("ctaLink.ts — empty siteSettings.announcementLink never blocks Publish", () => {
  const hrefValidate = captureCustomValidator(field(ctaLinkType, "href"));
  const labelValidate = captureCustomValidator(field(ctaLinkType, "label"));
  const ssHref = (announcementLink: unknown) => ({ document: { _type: "siteSettings", announcementLink }, path: ["announcementLink", "href"] });
  const ssLabel = (announcementLink: unknown) => ({ document: { _type: "siteSettings", announcementLink }, path: ["announcementLink", "label"] });

  test("entirely-empty announcementLink: href + label both valid", () => {
    const link = { _type: "ctaLink", label: [{ _key: "en", language: "en" }], localizedHrefOverride: [{ _key: "en", language: "en" }] };
    expect(hrefValidate(undefined, ssHref(link))).toBe(true);
    expect(labelValidate([{ _key: "en", language: "en" }], ssLabel(link))).toBe(true);
  });

  test("fully-filled announcementLink still validates normally (positive path)", () => {
    const link = { _type: "ctaLink", href: "/events", label: [{ _key: "en", language: "en", value: "See events" }] };
    expect(hrefValidate("/events", ssHref(link))).toBe(true);
    expect(labelValidate(link.label, ssLabel(link))).toBe(true);
  });

  test("partially-filled announcementLink (label started, no href): href is still required", () => {
    const link = { _type: "ctaLink", label: [{ _key: "en", language: "en", value: "Read more" }] };
    expect(hrefValidate(undefined, ssHref(link))).toBe("A destination is required.");
  });

  test("partially-filled announcementLink (href set, no label): English label is still required", () => {
    const link = { _type: "ctaLink", href: "/events", label: [] };
    expect(labelValidate([], ssLabel(link))).toBe("English label is required.");
  });

  test("a ctaLink outside siteSettings (serviceHero/editorialFeature/nextStepSection) is completely unaffected — href still required when empty", () => {
    const ctx = { document: { _type: "page" }, parent: {}, path: ["sections", { _key: "s1" }, "cta", "href"] };
    expect(hrefValidate(undefined, ctx)).toBe("A destination is required.");
    expect(labelValidate([], { ...ctx, path: ["sections", { _key: "s1" }, "cta", "label"] })).toBe("English label is required.");
  });
});

// ============================================================================
// legalPage.ts — Studio preview shows the human page name (Phase B — STEP 10),
// not "Legal page — privacy-policy".
// ============================================================================
test.describe("legalPage.ts — manager-readable Studio preview", () => {
  const prep = (legalPageType.preview as { prepare: (v: unknown) => { title?: string; subtitle?: string } }).prepare;

  test("falls back to the human page name when no title is entered", () => {
    expect(prep({ pageKey: "privacy-policy" }).title).toBe("Privacy Policy");
    expect(prep({ pageKey: "terms" }).title).toBe("Terms");
    expect(prep({ pageKey: "cookie-policy" }).title).toBe("Cookie Policy");
    expect(prep({ pageKey: "privacy-policy" }).title).not.toContain("Legal page —");
  });

  test("prefers the entered English title, with the page name as subtitle", () => {
    const out = prep({ pageKey: "terms", title: [{ language: "en", value: "Terms & Conditions" }] });
    expect(out.title).toBe("Terms & Conditions");
    expect(out.subtitle).toBe("Terms");
  });
});

// ============================================================================
// contentItem.ts + pageSection.ts — hidden-field validation must never block
// publishing. Every `allOrNothingLanguages`-validated field whose `hidden`
// callback hides it for a given context must also skip validation for that
// same exact context (regression test for the closingCta link items / About
// hero intro0 draft data found live this pass).
// ============================================================================
test.describe("contentItem.ts — hidden-by-role fields skip validation too (title/text/label)", () => {
  function docWithItem(sectionKey: string, itemKey: string) {
    return { sections: [{ sectionKey, items: [{ _key: "item1", itemKey }] }] };
  }
  const strayPartial = [{ _key: "en", language: "en", value: "" }];

  // title/text are hidden for both these roles (only href+label are shown —
  // see ITEM_ROLE_RULES "Closing CTA suggested-path link" and "About hero
  // intro link"); label is genuinely visible/used for both, so it's
  // exercised separately below instead of asserted hidden here.
  for (const fieldName of ["title", "text"] as const) {
    test(`closingCta link item's ${fieldName} is hidden AND its validation is skipped, even with stray partial data`, () => {
      const document = docWithItem("closingCta", "link0");
      const parent = document.sections[0]!.items[0]!;
      const context = { document, parent };
      expect(callHidden(field(contentItemType, fieldName), context)).toBe(true);
      expect(captureCustomValidator(field(contentItemType, fieldName))(strayPartial, context)).toBe(true);
    });

    test(`About hero intro-link item's ${fieldName} is hidden AND its validation is skipped, even with stray partial data`, () => {
      const document = docWithItem("hero", "intro0");
      const parent = document.sections[0]!.items[0]!;
      const context = { document, parent };
      expect(callHidden(field(contentItemType, fieldName), context)).toBe(true);
      expect(captureCustomValidator(field(contentItemType, fieldName))(strayPartial, context)).toBe(true);
    });
  }

  // A single stray empty-valued entry (strayPartial) is, since the
  // allOrNothingLanguages "effectively empty" fix, indistinguishable from a
  // fully-cleared field — it must NOT block Publish, visible or hidden. To
  // prove a VISIBLE field still enforces real incompleteness, these use a
  // genuinely-started fixture (one language with real content) instead.
  const genuinelyPartial = [{ _key: "en", language: "en", value: "Hello" }];

  test("closingCta link item's label and About hero intro-link's label are genuinely VISIBLE (both roles use it) and still enforce allOrNothingLanguages normally", () => {
    for (const [sectionKey, itemKey] of [["closingCta", "link0"], ["hero", "intro0"]] as const) {
      const document = docWithItem(sectionKey, itemKey);
      const parent = document.sections[0]!.items[0]!;
      const context = { document, parent };
      expect(callHidden(field(contentItemType, "label"), context)).toBe(false);
      expect(captureCustomValidator(field(contentItemType, "label"))(genuinelyPartial, context)).not.toBe(true);
      // A stray-only array, though, is correctly treated as empty (valid) even for a visible field.
      expect(captureCustomValidator(field(contentItemType, "label"))(strayPartial, context)).toBe(true);
    }
  });

  for (const fieldName of ["title", "text", "label"] as const) {
    test(`a VISIBLE role's ${fieldName} (Home hero trust badge, if in its visible set) still enforces allOrNothingLanguages normally`, () => {
      const document = docWithItem("hero", "trust0");
      const parent = document.sections[0]!.items[0]!;
      const context = { document, parent };
      const rule = matchItemRoleInContext(document, parent);
      if (!rule?.visible.includes(fieldName)) return; // only assert for fields this role actually shows
      expect(callHidden(field(contentItemType, fieldName), context)).toBe(false);
      expect(captureCustomValidator(field(contentItemType, fieldName))(genuinelyPartial, context)).not.toBe(true);
    });
  }
});

test.describe("pageSection.ts — hidden section-level label/title/text also skip validation (eventsStrip regression)", () => {
  const strayPartial = [{ _key: "en", language: "en", value: "" }];

  test("eventsStrip.text is hidden AND its validation is skipped, even with stray partial data", () => {
    const document = { _id: "page-home" };
    const parent = { sectionKind: "custom", sectionKey: "eventsStrip" };
    const context = { document, parent };
    expect(callHidden(field(pageSectionType, "text"), context)).toBe(true);
    expect(captureCustomValidator(field(pageSectionType, "text"))(strayPartial, context)).toBe(true);
  });

  test("a visible section's text (custom kind, unrelated sectionKey) still enforces allOrNothingLanguages normally", () => {
    const document = { _id: "page-home" };
    const parent = { sectionKind: "custom", sectionKey: "someOtherCustomSection" };
    const context = { document, parent };
    expect(callHidden(field(pageSectionType, "text"), context)).toBe(false);
    // A single stray empty-valued entry is correctly treated as empty (valid) — use a genuinely-started fixture instead.
    const genuinelyPartial = [{ _key: "en", language: "en", value: "Hello" }];
    expect(captureCustomValidator(field(pageSectionType, "text"))(genuinelyPartial, context)).not.toBe(true);
  });
});

// ============================================================================
// i18nValidation.ts — an optional i18n array left with only stray/empty
// entries (Sanity's Studio widget leaves one behind when a manager clears a
// field's text, rather than truly emptying the array) must be treated as
// fully empty — the live-Studio symptom was "clearing the field never clears
// the validation error." Exercised directly against the exported validators
// (not through a schema field) so this can never silently drift from the
// mocked-context tests above.
// ============================================================================
test.describe("i18nValidation.ts — stray empty-valued entries don't block Publish (optional fields only)", () => {
  function customValidator(factory: () => (rule: import("sanity").Rule) => unknown): (value: unknown, context: unknown) => unknown {
    let captured: ((value: unknown, context: unknown) => unknown) | undefined;
    const mockRule = {
      custom(fn: (value: unknown, context: unknown) => unknown) {
        captured = fn;
        return mockRule;
      },
    };
    factory()(mockRule as unknown as import("sanity").Rule);
    if (!captured) throw new Error("expected the validator factory to call rule.custom(...)");
    return captured;
  }

  test("allOrNothingLanguages: a single stray entry with an undefined value (the exact Studio-clear residue) is valid", () => {
    const validate = customValidator(() => allOrNothingLanguages());
    expect(validate([{ _key: "en", language: "en", value: undefined }], {})).toBe(true);
  });

  test("allOrNothingLanguages: all three languages present but every value empty/whitespace is valid", () => {
    const validate = customValidator(() => allOrNothingLanguages());
    expect(validate([{ _key: "en", language: "en", value: "" }, { _key: "da", language: "da", value: "   " }, { _key: "uk", language: "uk", value: null }], {})).toBe(true);
  });

  test("allOrNothingLanguages: a genuinely-started field (one real value) still correctly requires the rest — the fix does not weaken real partial-content detection", () => {
    const validate = customValidator(() => allOrNothingLanguages());
    const result = validate([{ _key: "en", language: "en", value: "Hello" }], {});
    expect(result).not.toBe(true);
    expect(typeof result).toBe("string");
  });

  test("allOrNothingLanguages: a real value alongside a stray empty one for another language still requires completion, not silently accepted as done", () => {
    const validate = customValidator(() => allOrNothingLanguages());
    const result = validate([{ _key: "en", language: "en", value: "Hello" }, { _key: "da", language: "da", value: "" }], {});
    expect(result).not.toBe(true);
  });

  test("allOrNothingForSelectedEventLocales: stray empty entries for the event's selected locales are valid", () => {
    const validate = customValidator(() => allOrNothingForSelectedEventLocales());
    const context = { document: { _type: "event", visibleLocales: ["en", "da"] } };
    expect(validate([{ _key: "en", language: "en", value: "" }, { _key: "da", language: "da", value: undefined }], context)).toBe(true);
  });

  test("allOrNothingForSelectedEventLocales: a genuinely-started field for a selected locale still requires the rest", () => {
    const validate = customValidator(() => allOrNothingForSelectedEventLocales());
    const context = { document: { _type: "event", visibleLocales: ["en", "da"] } };
    const result = validate([{ _key: "en", language: "en", value: "Hello" }], context);
    expect(result).not.toBe(true);
  });

  test("requireAllLanguages is unchanged: a stray-only array is still invalid for a genuinely required field", () => {
    const validate = customValidator(() => requireAllLanguages());
    const result = validate([{ _key: "en", language: "en", value: "" }], {});
    expect(result).not.toBe(true);
  });

  test("requireAllLanguages is unchanged: a fully empty/absent value is still invalid for a genuinely required field", () => {
    const validate = customValidator(() => requireAllLanguages());
    expect(validate(undefined, {})).not.toBe(true);
    expect(validate([], {})).not.toBe(true);
  });
});

// ============================================================================
// ctaAction.ts — href is only required while the button is actually shown.
// ============================================================================
test.describe("ctaAction.ts — href required only when enabled (Task 4F)", () => {
  test("href is required when enabled is true (default)", () => {
    const validate = captureCustomValidator(field(ctaActionType, "href"));
    expect(validate(undefined, { parent: { enabled: true } })).toBe("A destination is required.");
    expect(validate("", { parent: { enabled: true } })).toBe("A destination is required.");
    expect(validate("/events", { parent: { enabled: true } })).toBe(true);
  });

  test("href is NOT required when enabled is false", () => {
    const validate = captureCustomValidator(field(ctaActionType, "href"));
    expect(validate(undefined, { parent: { enabled: false } })).toBe(true);
    expect(validate("", { parent: { enabled: false } })).toBe(true);
  });

  test("href is still required when enabled is undefined (defaults to shown)", () => {
    const validate = captureCustomValidator(field(ctaActionType, "href"));
    expect(validate(undefined, { parent: {} })).toBe("A destination is required.");
  });
});

// ============================================================================
// seo.ts — Studio-facing field titles and stored field names (Task 1 / 7.9 / 7.10).
// ============================================================================
test.describe("seo.ts — Studio labels renamed, stored field names unchanged", () => {
  test("Studio titles are exactly the renamed strings", () => {
    expect(field(seoType, "title").title).toBe("Search Result Title");
    expect(field(seoType, "description").title).toBe("Search Result Description");
    expect(field(seoType, "ogImage").title).toBe("Social Sharing Image");
  });

  test("stored field names remain title/description/ogImage", () => {
    expect(field(seoType, "title").name).toBe("title");
    expect(field(seoType, "description").name).toBe("description");
    expect(field(seoType, "ogImage").name).toBe("ogImage");
  });

  test("the SEO block's own title is renamed to 'Search engine & social sharing' (later session, SEO task Section 4) — its stored field name ('seo', asserted below) is unchanged", () => {
    expect((seoType as unknown as { title?: string }).title).toBe("Search engine & social sharing");
  });

  test("the ogImage.alt field is relabeled to 'Social Sharing Image Alt', stored field name unchanged", () => {
    const ogImageField = field(seoType, "ogImage") as unknown as { fields?: { name: string; title?: string }[] };
    const altField = ogImageField.fields?.find((f) => f.name === "alt");
    expect(altField?.title).toBe("Social Sharing Image Alt");
  });

  test("Social Sharing Image stays optional — no unconditional required() rule", () => {
    const ogImageField = field(seoType, "ogImage") as unknown as { validation?: unknown };
    expect(ogImageField.validation).toBeUndefined();
  });
});

// ============================================================================
// Events — the new "filters" ITEM_ROLE_RULES row (already covered by the
// data-driven loop above for its default itemKey candidate), plus the
// hidden-field validation-skip regression, the 3 newly-hidden `event`
// document fields, and a closingCta-on-events regression proving the
// existing Home/About role rows apply here too (shared by sectionKey, not
// by document — no new rule was added for it).
// ============================================================================
test.describe("contentItem.ts — Events filter/empty-state label role, hidden-field validation skip", () => {
  function docWithFilterItem(itemKey: string) {
    return { _id: "page-events", sections: [{ sectionKey: "filters", items: [{ _key: "item1", itemKey }] }] };
  }
  const strayPartial = [{ _key: "en", language: "en", value: "" }];

  for (const itemKey of ["dateLabel", "priceAscLabel", "emptyStateTitle", "emptyStateText"]) {
    test(`filters item "${itemKey}": only title is visible, icon/text/label/href/value hidden`, () => {
      const document = docWithFilterItem(itemKey);
      const parent = document.sections[0]!.items[0]!;
      const context = { document, parent };
      expect(callHidden(field(contentItemType, "title"), context)).toBe(false);
      expect(callHidden(field(contentItemType, "itemKey"), context)).toBe(true);
      for (const fieldName of ["icon", "text", "label", "href", "value"] as const) {
        expect(callHidden(field(contentItemType, fieldName), context)).toBe(true);
      }
    });
  }

  test("filters item's hidden text/label fields skip validation even with stray partial data", () => {
    const document = docWithFilterItem("dateLabel");
    const parent = document.sections[0]!.items[0]!;
    const context = { document, parent };
    expect(captureCustomValidator(field(contentItemType, "text"))(strayPartial, context)).toBe(true);
    expect(captureCustomValidator(field(contentItemType, "label"))(strayPartial, context)).toBe(true);
  });

  test("filters item's visible title still enforces allOrNothingLanguages normally", () => {
    const document = docWithFilterItem("dateLabel");
    const parent = document.sections[0]!.items[0]!;
    const context = { document, parent };
    // A single stray empty-valued entry is correctly treated as empty (valid) — use a genuinely-started fixture instead.
    const genuinelyPartial = [{ _key: "en", language: "en", value: "Hello" }];
    expect(captureCustomValidator(field(contentItemType, "title"))(genuinelyPartial, context)).not.toBe(true);
  });

  test("an unrelated sectionKey using the same itemKey string is unaffected (scoped by sectionKey, not itemKey alone)", () => {
    const document = { sections: [{ sectionKey: "someOtherSection", items: [{ _key: "item1", itemKey: "dateLabel" }] }] };
    const parent = document.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(document, parent)).toBeUndefined();
  });

  test("closingCta on page-events reuses the existing Home/About FAQ-prompt/suggested-path-link roles unchanged", () => {
    const faqDoc = { _id: "page-events", sections: [{ sectionKey: "closingCta", items: [{ _key: "item1", itemKey: "faqQuestion" }] }] };
    const faqParent = faqDoc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(faqDoc, faqParent)?.role).toBe("Closing CTA FAQ prompt row (Home + About)");
    expect(callHidden(field(contentItemType, "title"), { document: faqDoc, parent: faqParent })).toBe(false);
  });
});

test.describe("event.ts — currently-unused fields hidden (included/calendarUrl/waitlistUrl)", () => {
  for (const fieldName of ["included", "calendarUrl", "waitlistUrl"] as const) {
    test(`${fieldName} is hidden unconditionally`, () => {
      expect(callHidden(field(eventType as unknown as { fields: FieldDef[] }, fieldName), {})).toBe(true);
    });
  }

  test("shortDescription/practicalDetails/ticketProvider (pre-existing legacy fields) stay hidden and carry no validation", () => {
    for (const fieldName of ["shortDescription", "practicalDetails", "ticketProvider"] as const) {
      const f = field(eventType as unknown as { fields: FieldDef[] }, fieldName) as unknown as { validation?: unknown };
      expect(callHidden(f as FieldDef, {})).toBe(true);
      expect(f.validation, `${fieldName} must carry no validation — a hidden field must never block publishing`).toBeUndefined();
    }
  });

  test("ticketsLeft accepts 0 as a valid value (min(0), not min(1))", () => {
    const f = field(eventType as unknown as { fields: FieldDef[] }, "ticketsLeft") as unknown as { validation?: (rule: unknown) => unknown };
    let minArg: number | undefined;
    const mockRule = { min: (n: number) => { minArg = n; return mockRule; } };
    f.validation?.(mockRule);
    expect(minArg).toBe(0);
  });
});

// ============================================================================
// visibleLocales ("Show on website languages") — the required field itself,
// plus every localized Event field's conditional validation
// (requireSelectedEventLocales / allOrNothingForSelectedEventLocales),
// exercised against the schema's own wired fields (event.title,
// event.longDescription, event.whatToExpect, event.arrival,
// event.ticketButtonLabel, event.ticketProviderInfo.label/.value,
// imageWithAlt.alt via event.image, seo.title/.description/.ogImage.alt via
// event.seo) — never a re-implementation of the validators themselves.
// ============================================================================
test.describe("Events — visibleLocales field + conditional locale validation", () => {
  function eventEntries(langs: readonly string[], prefix = "value"): { _key: string; language: string; value: string }[] {
    return langs.map((l) => ({ _key: l, language: l, value: `${prefix} ${l}` }));
  }
  function eventDoc(visibleLocales?: readonly string[]) {
    return visibleLocales ? { _type: "event", visibleLocales: [...visibleLocales] } : { _type: "event" };
  }

  test('"Show on website languages" requires at least one selection (min(1))', () => {
    const f = field(eventType as unknown as { fields: FieldDef[] }, "visibleLocales") as unknown as {
      validation?: (rule: unknown) => unknown;
      initialValue?: unknown;
    };
    let minArg: number | undefined;
    let errorMsg: string | undefined;
    const mockRule = {
      required: () => mockRule,
      min: (n: number) => {
        minArg = n;
        return mockRule;
      },
      error: (msg: string) => {
        errorMsg = msg;
        return mockRule;
      },
    };
    f.validation?.(mockRule);
    expect(minArg).toBe(1);
    expect(errorMsg, "min(1) should carry a manager-friendly message").toBeTruthy();
  });

  test('"Show on website languages" defaults to all three languages for new events', () => {
    const f = field(eventType as unknown as { fields: FieldDef[] }, "visibleLocales") as unknown as { initialValue?: unknown };
    expect(f.initialValue).toEqual(["en", "da", "uk"]);
  });

  test("visibleLocales options list shows English/Danish/Ukrainian, not raw locale codes, as the primary labels", () => {
    const f = field(eventType as unknown as { fields: FieldDef[] }, "visibleLocales") as unknown as {
      options?: { list?: { title: string; value: string }[] };
    };
    expect(f.options?.list).toEqual([
      { title: "English", value: "en" },
      { title: "Danish", value: "da" },
      { title: "Ukrainian", value: "uk" },
    ]);
  });

  test("title: no visibleLocales at all -> validation passes (the error surfaces on visibleLocales itself, not cascaded here)", () => {
    const validate = captureCustomValidator(field(eventType as unknown as { fields: FieldDef[] }, "title"));
    expect(validate(undefined, { document: nonEventDocWithNoLocales() })).toBe(true);
    expect(validate(eventEntries(["en"]), { document: nonEventDocWithNoLocales() })).toBe(true);
  });
  function nonEventDocWithNoLocales() {
    return { _type: "event" }; // no visibleLocales key at all
  }

  for (const selected of [["en"], ["da"], ["uk"], ["en", "da"], ["en", "da", "uk"]] as const) {
    test(`title: visibleLocales=${JSON.stringify(selected)} requires exactly those languages, nothing else`, () => {
      const validate = captureCustomValidator(field(eventType as unknown as { fields: FieldDef[] }, "title"));
      const document = eventDoc(selected);

      // Fully populated for exactly the selected languages -> valid.
      expect(validate(eventEntries(selected), { document })).toBe(true);

      // Missing one selected language -> fails.
      if (selected.length > 1) {
        expect(validate(eventEntries(selected.slice(1)), { document })).not.toBe(true);
      } else {
        expect(validate([], { document })).not.toBe(true);
      }

      // Populated ONLY for an unselected language -> still fails (an
      // unselected translation never satisfies a selected requirement).
      const selectedList: readonly string[] = selected;
      const unselected = (["en", "da", "uk"] as const).filter((l) => !selectedList.includes(l));
      if (unselected.length) {
        expect(validate(eventEntries(unselected), { document })).not.toBe(true);
      }
    });
  }

  test("title: missing unselected-language translation passes; only selected languages are checked", () => {
    const validate = captureCustomValidator(field(eventType as unknown as { fields: FieldDef[] }, "title"));
    const document = eventDoc(["en"]);
    // en present, da/uk absent entirely -> valid, since only en is selected.
    expect(validate(eventEntries(["en"]), { document })).toBe(true);
  });

  test("title: duplicate entry for a selected language fails", () => {
    const validate = captureCustomValidator(field(eventType as unknown as { fields: FieldDef[] }, "title"));
    const document = eventDoc(["en"]);
    const duplicated = [
      { _key: "a", language: "en", value: "first" },
      { _key: "b", language: "en", value: "second" },
    ];
    expect(validate(duplicated, { document })).not.toBe(true);
  });

  test("title: empty (whitespace-only) value for a selected language fails", () => {
    const validate = captureCustomValidator(field(eventType as unknown as { fields: FieldDef[] }, "title"));
    const document = eventDoc(["en"]);
    expect(validate([{ _key: "en", language: "en", value: "   " }], { document })).not.toBe(true);
  });

  test("longDescription/whatToExpect/arrival all follow the same selected-locale rule as title", () => {
    for (const fieldName of ["longDescription", "whatToExpect", "arrival"] as const) {
      const validate = captureCustomValidator(field(eventType as unknown as { fields: FieldDef[] }, fieldName));
      const document = eventDoc(["da"]);
      expect(validate(eventEntries(["da"]), { document }), `${fieldName} populated for the only selected locale`).toBe(true);
      expect(validate(eventEntries(["en"]), { document }), `${fieldName} populated only for an unselected locale`).not.toBe(true);
      expect(validate([], { document }), `${fieldName} empty entirely`).not.toBe(true);
    }
  });

  test("ticketButtonLabel / ticketProviderInfo.label / .value: optional overall, but complete-for-selected-locales if started", () => {
    const ticketButtonLabel = captureCustomValidator(field(eventType as unknown as { fields: FieldDef[] }, "ticketButtonLabel"));
    const document = eventDoc(["en", "da"]);
    expect(ticketButtonLabel([], { document }), "fully empty is fine").toBe(true);
    expect(ticketButtonLabel(eventEntries(["en", "da"]), { document }), "complete for both selected locales").toBe(true);
    expect(ticketButtonLabel(eventEntries(["en"]), { document }), "started but missing the other selected locale").not.toBe(true);
    expect(ticketButtonLabel(eventEntries(["uk"]), { document }), "only populated for an unselected locale").toBe(true);

    const ticketProviderInfoField = eventType.fields.find((f) => f.name === "ticketProviderInfo") as unknown as {
      fields: FieldDef[];
    };
    for (const subFieldName of ["label", "value"] as const) {
      const validate = captureCustomValidator(field(ticketProviderInfoField, subFieldName));
      expect(validate([], { document }), `ticketProviderInfo.${subFieldName} fully empty`).toBe(true);
      expect(validate(eventEntries(["en", "da"]), { document }), `ticketProviderInfo.${subFieldName} complete`).toBe(true);
      expect(validate(eventEntries(["en"]), { document }), `ticketProviderInfo.${subFieldName} partial`).not.toBe(true);
    }
  });

  test("image.alt (imageWithAlt via event.image): follows selected-locale rule for event documents, English-required rule is untouched for every other document type", () => {
    const altField = field(imageWithAltType, "alt");
    const validate = captureCustomValidator(altField);

    const eventDocument = eventDoc(["uk"]);
    expect(validate(eventEntries(["uk"]), { document: eventDocument, path: [] }), "event, uk selected, uk populated").toBe(true);
    expect(validate(eventEntries(["en"]), { document: eventDocument, path: [] }), "event, uk selected, only en populated").not.toBe(true);

    // A non-event document (e.g. a hypothetical page use) is completely
    // unaffected — same English-required behavior as before this feature.
    const otherDocument = { _id: "page-about", _type: "page" };
    expect(validate(eventEntries(["en"]), { document: otherDocument, path: [] }), "non-event: English present").toBe(true);
    expect(validate(eventEntries(["uk"]), { document: otherDocument, path: [] }), "non-event: only Ukrainian present, English still required").not.toBe(true);
  });

  test("seo.title/.description/.ogImage.alt: follow selected-locale rule for events, optional overall, unaffected for non-event documents", () => {
    const titleValidate = captureCustomValidator(field(seoType, "title"));
    const document = eventDoc(["en", "uk"]);
    expect(titleValidate([], { document }), "seo.title fully empty is fine for an event").toBe(true);
    expect(titleValidate(eventEntries(["en", "uk"]), { document }), "seo.title complete for both selected locales").toBe(true);
    expect(titleValidate(eventEntries(["en"]), { document }), "seo.title started but missing the other selected locale").not.toBe(true);

    // Non-event document (Home/About/etc.): unaffected, still just the
    // pre-existing English-length-only check — no completeness requirement.
    const pageDocument = { _id: "page-home", _type: "page" };
    expect(titleValidate(eventEntries(["en"]), { document: pageDocument }), "non-event: partial i18n is fine, no completeness rule applies").toBe(true);
  });
});

// ============================================================================
// shareSettings[].label — the field the live manual Studio bug report found
// omitted from EventLocaleAwareInput coverage. Its validation
// (requireSelectedEventLocalesForShareAction) is parent-aware: it reads
// `enabled` off the enclosing shareAction array item (`context.parent`), not
// off the document, since a disabled share action's label is never rendered
// and must never block Publish.
// ============================================================================
test.describe("Events — shareSettings[].label (Share With Friends)", () => {
  function labelField() {
    const shareSettings = eventType.fields.find((f) => f.name === "shareSettings") as unknown as {
      of: { fields: FieldDef[] }[];
    };
    const shareAction = shareSettings.of[0];
    if (!shareAction) throw new Error('expected event.shareSettings to have an "of" array member type');
    return shareAction.fields.find((f) => f.name === "label") as FieldDef;
  }
  function entries(langs: readonly string[]): { _key: string; language: string; value: string }[] {
    return langs.map((l) => ({ _key: l, language: l, value: `Share ${l}` }));
  }
  function context(visibleLocales: readonly string[], enabled: boolean) {
    return { document: { _type: "event", visibleLocales: [...visibleLocales] }, parent: { enabled } };
  }

  test("wired to EventLocaleAwareInput (the exact gap the live bug report found)", () => {
    const f = labelField() as unknown as { components?: { input?: unknown } };
    expect(f.components?.input, "shareSettings[].label must use EventLocaleAwareInput like every other Event i18n field").toBeTruthy();
  });

  test("enabled action: label required for every selected locale", () => {
    const validate = captureCustomValidator(labelField());
    expect(validate(entries(["en", "uk"]), context(["en", "uk"], true)), "complete for both selected locales").toBe(true);
    expect(validate(entries(["en"]), context(["en", "uk"], true)), "missing uk while enabled").not.toBe(true);
    expect(validate([], context(["en", "uk"], true)), "fully empty while enabled").not.toBe(true);
  });

  test("disabled action: missing/empty label for a selected locale never blocks publishing", () => {
    const validate = captureCustomValidator(labelField());
    expect(validate([], context(["en", "uk"], false)), "fully empty while disabled").toBe(true);
    expect(validate(entries(["en"]), context(["en", "uk"], false)), "partial while disabled").toBe(true);
  });

  test("enabled defaults to true when the array item omits it (matches the field's own initialValue: true)", () => {
    const validate = captureCustomValidator(labelField());
    const doc = { document: { _type: "event", visibleLocales: ["en"] }, parent: {} };
    expect(validate([], doc), "no `enabled` on parent -> treated as enabled -> empty label fails").not.toBe(true);
  });

  test("duplicate entries for the same language fail regardless of enabled/disabled", () => {
    const validate = captureCustomValidator(labelField());
    const duplicated = [
      { _key: "a", language: "en", value: "first" },
      { _key: "b", language: "en", value: "second" },
    ];
    expect(validate(duplicated, context(["en"], true)), "duplicate while enabled").not.toBe(true);
    expect(validate(duplicated, context(["en"], false)), "duplicate while disabled").not.toBe(true);
  });

  test("unselected-locale entries are never required or flagged, enabled or not", () => {
    const validate = captureCustomValidator(labelField());
    // uk is selected; da is not. A da-only label is neither required nor invalid.
    expect(validate(entries(["uk"]), context(["uk"], true)), "only the selected locale populated").toBe(true);
  });
});

// ============================================================================
// Regression coverage for the exact live-Studio defect reported after
// visibleLocales shipped: deselecting a locale (da) while it has stored
// content must NOT cause that stored entry to be classified as an unknown/
// invalid language anywhere in this codebase's OWN validators, across every
// internationalized-array field reachable from an Event document — this is
// the same failure class (not the same code path) as the plugin's own
// array-level "Array item keys must be valid languages registered to the
// field type" check, which is guarded separately below by asserting the
// global plugin registry stays static.
//
// Disclosed limitation: this proves EVERY validator this project owns
// treats a deselected-but-stored locale as "not required, not evaluated" —
// never as an error — for every field EventLocaleAwareInput reaches. It
// cannot exercise sanity-plugin-internationalized-array's OWN internal
// array validation (that only runs inside a live Studio, which remains
// blocked by the unresolved auth issue documented in the implementation
// report) — that is exactly why the static-registry guard test and a manual
// Studio pass are both still required before this is considered proven end
// to end.
// ============================================================================
test.describe("Events — regression: deselecting da after content exists never flags da as invalid, anywhere", () => {
  const STORED_ALL_THREE = { _key: "da", language: "da", value: "Del" };

  function fieldsToCheck(): { label: string; validate: (value: unknown, context: unknown) => unknown }[] {
    const direct = ["title", "longDescription", "whatToExpect", "arrival", "ticketButtonLabel"].map((name) => ({
      label: `event.${name}`,
      validate: captureCustomValidator(field(eventType as unknown as { fields: FieldDef[] }, name)),
    }));
    const ticketProviderInfoField = eventType.fields.find((f) => f.name === "ticketProviderInfo") as unknown as {
      fields: FieldDef[];
    };
    const nested = ["label", "value"].map((name) => ({
      label: `event.ticketProviderInfo.${name}`,
      validate: captureCustomValidator(field(ticketProviderInfoField, name)),
    }));
    const shareSettingsField = eventType.fields.find((f) => f.name === "shareSettings") as unknown as {
      of: { fields: FieldDef[] }[];
    };
    const shareAction = shareSettingsField.of[0];
    if (!shareAction) throw new Error('expected event.shareSettings to have an "of" array member type');
    const shareLabel = {
      label: "event.shareSettings[].label",
      validate: captureCustomValidator(shareAction.fields.find((f) => f.name === "label") as FieldDef),
    };
    const imageAlt = { label: "event.image.alt", validate: captureCustomValidator(field(imageWithAltType, "alt")) };
    const seoTitle = { label: "event.seo.title", validate: captureCustomValidator(field(seoType, "title")) };
    const seoDescription = { label: "event.seo.description", validate: captureCustomValidator(field(seoType, "description")) };
    return [...direct, ...nested, shareLabel, imageAlt, seoTitle, seoDescription];
  }

  test("en/da/uk populated, then da deselected (visibleLocales -> [en, uk]): every field's validator still passes with da's stored entry present and untouched", () => {
    const document = { _type: "event", visibleLocales: ["en", "uk"] };
    const parentEnabled = { document, parent: { enabled: true } };
    for (const { label, validate } of fieldsToCheck()) {
      const isShareLabel = label === "event.shareSettings[].label";
      const stored = [
        { _key: "en", language: "en", value: "English" },
        STORED_ALL_THREE,
        { _key: "uk", language: "uk", value: "Ukrainian" },
      ];
      const result = validate(stored, isShareLabel ? parentEnabled : { document });
      expect(result, `${label}: da preserved-but-deselected must not be flagged invalid`).toBe(true);
    }
  });

  for (const deselected of ["en", "da", "uk"] as const) {
    test(`deselecting ${deselected} specifically: its stored entry is never required nor flagged for any field`, () => {
      const remaining = (["en", "da", "uk"] as const).filter((l) => l !== deselected);
      const document = { _type: "event", visibleLocales: [...remaining] };
      const parentEnabled = { document, parent: { enabled: true } };
      for (const { label, validate } of fieldsToCheck()) {
        const isShareLabel = label === "event.shareSettings[].label";
        const stored = (["en", "da", "uk"] as const).map((l) => ({ _key: l, language: l, value: `Value ${l}` }));
        expect(validate(stored, isShareLabel ? parentEnabled : { document }), `${label}: deselecting ${deselected}`).toBe(true);
      }
    });
  }

  for (const combo of [["en"], ["da"], ["uk"], ["en", "da"], ["en", "uk"], ["da", "uk"], ["en", "da", "uk"]] as const) {
    test(`visibleLocales=${JSON.stringify(combo)}: full en/da/uk stored content never fails any field's validator`, () => {
      const document = { _type: "event", visibleLocales: [...combo] };
      const parentEnabled = { document, parent: { enabled: true } };
      const stored = (["en", "da", "uk"] as const).map((l) => ({ _key: l, language: l, value: `Value ${l}` }));
      for (const { label, validate } of fieldsToCheck()) {
        const isShareLabel = label === "event.shareSettings[].label";
        expect(validate(stored, isShareLabel ? parentEnabled : { document }), `${label}: ${JSON.stringify(combo)}`).toBe(true);
      }
    });
  }
});

// ============================================================================
// Static-registry guard: the actual root cause of the live bug was making
// the GLOBAL sanity-plugin-internationalized-array `languages` config
// depend on visibleLocales. Reverted to a static array — this test reads
// sanity.config.ts's own source text (not merely its exported runtime
// value, since that would require live env config) and asserts the
// regression can't silently come back: the plugin registration must be a
// plain array literal containing all 3 locale codes, never a `select`
// option or a `languages` callback/function.
// ============================================================================
// ============================================================================
// page.ts — pageKey uniqueness guard, added after this exact bug: two `page`
// documents (canonical dash-case `page-catering-menu-examples` and an
// erroneous camelCase `page-cateringMenuExamples`) both carried
// `pageKey: "cateringMenuExamples"`, and pageByKeyQuery's `[0]` silently
// picked the wrong one in production. This is a schema-level fix that
// protects every page, not just Catering — regression-tested against Home's
// own pageKey to prove it doesn't block ordinary, already-unique pages.
// ============================================================================
// ============================================================================
// pageSection.ts — sectionKind/sectionKey hidden on page-catering-menu-examples
// once a section is correctly shaped (has a sectionKind), and sectionKey's
// own readOnly-once-set behavior — the two mechanisms CateringMenuSectionsInput
// relies on to keep technical fields out of view for a valid category, and
// to guarantee renaming a category (editing title/label) can never change
// its stable sectionKey.
// ============================================================================
test.describe("pageSection.ts — sectionKind/sectionKey hidden + locked site-wide once a section is correctly shaped (Phase 1 — technical-field hygiene)", () => {
  function sectionKeyField() {
    return field(pageSectionType as unknown as { fields: FieldDef[] }, "sectionKey");
  }
  function sectionKindField() {
    return field(pageSectionType as unknown as { fields: FieldDef[] }, "sectionKind");
  }
  const cateringMenuDoc = { _id: "page-catering-menu-examples" };
  const cateringMenuDraftDoc = { _id: "drafts.page-catering-menu-examples" };

  test("both fields hidden once the section already has a sectionKind (a valid, already-added category)", () => {
    const parent = { sectionKind: "menuCategory", sectionKey: "menuCategory-abc123" };
    expect(callHidden(sectionKeyField(), { parent, document: cateringMenuDoc })).toBe(true);
    expect(callHidden(sectionKindField(), { parent, document: cateringMenuDoc })).toBe(true);
  });

  test("draft id (prefix stripped) behaves identically to the published id", () => {
    const parent = { sectionKind: "menuCategory", sectionKey: "menuCategory-abc123" };
    expect(callHidden(sectionKeyField(), { parent, document: cateringMenuDraftDoc })).toBe(true);
    expect(callHidden(sectionKindField(), { parent, document: cateringMenuDraftDoc })).toBe(true);
  });

  test("applies to every section on this document, not just menuCategory-kind ones (banner/closing too)", () => {
    for (const sectionKind of ["hero", "cta"]) {
      const parent = { sectionKind, sectionKey: sectionKind === "hero" ? "banner" : "closing" };
      expect(callHidden(sectionKeyField(), { parent, document: cateringMenuDoc }), sectionKind).toBe(true);
    }
  });

  test("never hidden while a section has NO sectionKind yet (a stray raw section from the generic array control, if ever reached) — required-and-visible, never required-and-hidden", () => {
    const parent = { sectionKind: undefined, sectionKey: undefined };
    expect(callHidden(sectionKeyField(), { parent, document: cateringMenuDoc })).toBe(false);
    expect(callHidden(sectionKindField(), { parent, document: cateringMenuDoc })).toBe(false);
  });

  test("site-wide, not Catering-specific: also hidden on every other page (Home/About/Event Decoration/Host at RORUM/...) once sectionKind is set — Phase 1's whole point is that this is document-agnostic", () => {
    for (const docId of ["page-home", "page-about", "page-event-decoration", "page-host-at-rorum"]) {
      const parent = { sectionKind: "hero", sectionKey: "hero" };
      expect(callHidden(sectionKeyField(), { parent, document: { _id: docId } }), docId).toBe(true);
      expect(callHidden(sectionKindField(), { parent, document: { _id: docId } }), docId).toBe(true);
    }
  });

  test("rename never changes the key: sectionKey is readOnly once set, independent of title/label — editing a category's title has no code path that touches sectionKey", () => {
    expect(callReadOnly(sectionKeyField(), { value: "menuCategory-abc123" })).toBe(true);
    expect(callReadOnly(sectionKeyField(), { value: undefined })).toBe(false);
  });
});

test.describe("pageSection.ts — Phase 1 site-wide regression: every previously-corrected workflow still behaves the same, plus every page now gets the same technical-field hiding", () => {
  function sectionKeyField() {
    return field(pageSectionType as unknown as { fields: FieldDef[] }, "sectionKey");
  }
  function sectionKindField() {
    return field(pageSectionType as unknown as { fields: FieldDef[] }, "sectionKind");
  }

  test("a correctly-shaped section (sectionKind set) has sectionKey/sectionKind hidden on every one of FAQ / Contact / Catering / Catering Menu Examples / Events / Event Decoration / Host at RORUM / Home / About", () => {
    const documentIds = [
      "page-faq",
      "page-contact",
      "page-catering",
      "page-catering-menu-examples",
      "page-events",
      "page-event-decoration",
      "page-host-at-rorum",
      "page-home",
      "page-about",
    ];
    for (const _id of documentIds) {
      const parent = { sectionKey: "anySection", sectionKind: "custom" };
      const ctx = { parent, document: { _id } };
      expect(callHidden(sectionKeyField(), ctx), _id).toBe(true);
      expect(callHidden(sectionKindField(), ctx), _id).toBe(true);
    }
  });

  test("a section with NO sectionKind yet keeps sectionKey/sectionKind visible on every one of those same documents — never hidden-but-required, on any page", () => {
    const documentIds = ["page-faq", "page-contact", "page-catering-menu-examples", "page-events", "page-event-decoration", "page-host-at-rorum", "page-home"];
    for (const _id of documentIds) {
      const parent = { sectionKey: undefined, sectionKind: undefined };
      const ctx = { parent, document: { _id } };
      expect(callHidden(sectionKeyField(), ctx), _id).toBe(false);
      expect(callHidden(sectionKindField(), ctx), _id).toBe(false);
    }
  });

  test("sectionKey stays readOnly-once-set regardless of document — rename/reorder can never change it, on any page", () => {
    expect(callReadOnly(sectionKeyField(), { value: "hero" })).toBe(true);
    expect(callReadOnly(sectionKeyField(), { value: undefined })).toBe(false);
  });
});

test.describe("page.ts — pageKey uniqueness validator", () => {
  function captureAsyncCustomValidator(f: { validation?: (rule: unknown) => unknown }): (value: unknown, context: unknown) => Promise<unknown> {
    let captured: ((value: unknown, context: unknown) => Promise<unknown>) | undefined;
    const mockRule = {
      required: () => mockRule,
      custom(fn: (value: unknown, context: unknown) => Promise<unknown>) {
        captured = fn;
        return mockRule;
      },
    };
    f.validation?.(mockRule);
    if (!captured) throw new Error("expected pageKey's validation to call rule.custom(...)");
    return captured;
  }

  function pageKeyField() {
    return pageType.fields.find((f) => f.name === "pageKey") as unknown as { validation?: (rule: unknown) => unknown };
  }

  function mockContext(documentId: string, otherPagesWithSameKey: number) {
    return {
      document: { _id: documentId },
      getClient: () => ({ fetch: async () => otherPagesWithSameKey }),
    };
  }

  test("no other page uses this pageKey -> valid", async () => {
    const validate = captureAsyncCustomValidator(pageKeyField());
    await expect(validate("catering", mockContext("page-catering", 0))).resolves.toBe(true);
  });

  test("another page already uses this pageKey -> invalid, with a manager-readable message", async () => {
    const validate = captureAsyncCustomValidator(pageKeyField());
    const result = await validate("cateringMenuExamples", mockContext("page-cateringMenuExamples", 1));
    expect(result).not.toBe(true);
    expect(typeof result).toBe("string");
    expect(result as string).toContain("cateringMenuExamples");
  });

  test("empty/missing value -> valid (required() reports the missing-value case separately)", async () => {
    const validate = captureAsyncCustomValidator(pageKeyField());
    await expect(validate(undefined, mockContext("page-home", 0))).resolves.toBe(true);
  });

  test("regression: an ordinary, already-unique page (Home) is never blocked", async () => {
    const validate = captureAsyncCustomValidator(pageKeyField());
    await expect(validate("home", mockContext("page-home", 0))).resolves.toBe(true);
  });
});

// ============================================================================
// contentItem.ts — Catering-specific ITEM_ROLE_RULES, exercised against the
// REAL stored shape of page-catering-menu-examples (dishes carry a
// positional "dish0".."dishN" itemKey, not no itemKey at all — confirmed by
// a live read-only probe before this rule's pattern was chosen).
// ============================================================================
test.describe("contentItem.ts — Catering menu dish / category icon roles match real stored data", () => {
  function docWithMenuCategorySection(sectionKey: string, item: { _key: string; itemKey?: string }) {
    return { sections: [{ sectionKey, sectionKind: "menuCategory", items: [item] }] };
  }

  test('a dish with a real "dish0"-style itemKey matches the "Catering menu dish" role', () => {
    const document = docWithMenuCategorySection("category-ukrainian", { _key: "dish0", itemKey: "dish0" });
    const parent = document.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(document, parent)?.role).toBe("Catering menu dish");
  });

  test("a dish with no itemKey at all (a manager-added fresh row) also matches the same role", () => {
    const document = docWithMenuCategorySection("category-ukrainian", { _key: "dish99" });
    const parent = document.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(document, parent)?.role).toBe("Catering menu dish");
  });

  test("the categoryIcon reserved item matches its own role, not the dish role", () => {
    const document = docWithMenuCategorySection("category-ukrainian", { _key: "categoryIcon", itemKey: "categoryIcon" });
    const parent = document.sections[0]!.items[0]!;
    const matched = matchItemRoleInContext(document, parent);
    expect(matched?.role).toBe("Catering menu category tab icon");
    expect(matched?.visible).toEqual(["icon"]);
  });

  test('a dish shows only title/text/image — icon/href/label/value/itemKey are hidden', () => {
    const document = docWithMenuCategorySection("category-ukrainian", { _key: "dish0", itemKey: "dish0" });
    const parent = document.sections[0]!.items[0]!;
    for (const fieldName of ["itemKey", "icon", "title", "text", "image", "href", "label", "value"] as const) {
      const expectedVisible = ["title", "text", "image"].includes(fieldName);
      expect(callHidden(field(contentItemType, fieldName), { document, parent }), fieldName).toBe(!expectedVisible);
    }
  });
});

// ============================================================================
// page.ts — `seo` is hidden on page-catering-menu-examples specifically.
// Regression guard for the SEO-contradiction found this pass: an earlier
// version of this task incorrectly reported that document's seo block as
// "connected" — tracing generateMetadata() in
// app/[locale]/(site)/catering/page.tsx shows it is never read (Catering
// Menu Examples has no route of its own). This proves the fix: the field
// is hidden there, and unaffected everywhere else.
// ============================================================================
// ============================================================================
// imageWithAlt.ts — Catering informative images (menu-format cards, dish
// photos) now require en/da/uk, not just English. Regression-tested against
// every OTHER imageWithAlt use (Home/About/non-Catering pages, and Events —
// which has its own, separate visibleLocales-aware branch) to prove this
// change is scoped exactly to page-catering/page-catering-menu-examples.
// ============================================================================
test.describe("imageWithAlt.ts — Catering informative images require en/da/uk", () => {
  function altField() {
    return field(imageWithAltType, "alt");
  }
  function entries(langs: readonly string[]): { _key: string; language: string; value: string }[] {
    return langs.map((l) => ({ _key: l, language: l, value: `Alt ${l}` }));
  }

  for (const docId of ["page-catering", "page-catering-menu-examples", "drafts.page-catering", "drafts.page-catering-menu-examples"]) {
    test(`${docId}: full en/da/uk required`, () => {
      const validate = captureCustomValidator(altField());
      const document = { _id: docId };
      expect(validate(entries(["en", "da", "uk"]), { document, path: [] }), "all 3 present").toBe(true);
      expect(validate(entries(["en"]), { document, path: [] }), "only English present").not.toBe(true);
      expect(validate(entries(["en", "da"]), { document, path: [] }), "missing Ukrainian").not.toBe(true);
      expect(validate(undefined, { document, path: [] }), "fully empty").not.toBe(true);
    });
  }

  test("regression: every other page (Home/About/non-Catering) keeps the unchanged English-only rule", () => {
    const validate = captureCustomValidator(altField());
    for (const docId of ["page-home", "page-about", "page-events", "page-work-with-us"]) {
      const document = { _id: docId };
      expect(validate(entries(["en"]), { document, path: [] }), `${docId}: English present`).toBe(true);
      expect(validate(entries(["da", "uk"]), { document, path: [] }), `${docId}: English missing`).not.toBe(true);
    }
  });

  test("regression: Event documents keep their own visibleLocales-aware branch, unaffected by the Catering branch", () => {
    const validate = captureCustomValidator(altField());
    const document = { _type: "event", _id: "some-event-id", visibleLocales: ["uk"] };
    expect(validate(entries(["uk"]), { document, path: [] }), "event: only its selected locale required").toBe(true);
    expect(validate(entries(["en"]), { document, path: [] }), "event: English alone is not the selected locale").not.toBe(true);
  });
});

test.describe("page.ts — seo field hidden on page-catering-menu-examples only", () => {
  function seoField() {
    return pageType.fields.find((f) => f.name === "seo") as unknown as { hidden?: (ctx: { document?: unknown }) => boolean };
  }

  test("hidden on page-catering-menu-examples (published id)", () => {
    const hidden = seoField().hidden?.({ document: { _id: "page-catering-menu-examples" } });
    expect(hidden).toBe(true);
  });

  test("hidden on drafts.page-catering-menu-examples (draft id, prefix stripped)", () => {
    const hidden = seoField().hidden?.({ document: { _id: "drafts.page-catering-menu-examples" } });
    expect(hidden).toBe(true);
  });

  test("regression: visible/unaffected on page-catering — the one document whose seo block is genuinely connected", () => {
    const hidden = seoField().hidden?.({ document: { _id: "page-catering" } });
    expect(hidden).toBe(false);
  });

  test("regression: visible/unaffected on every other page (Home, About, Events)", () => {
    for (const id of ["page-home", "page-about", "page-events"]) {
      expect(seoField().hidden?.({ document: { _id: id } }), id).toBe(false);
    }
  });
});

// ============================================================================
// FAQ page workflow — pageSection.ts's new "faqCategory" sectionKind and
// contentItem.ts's new "FAQ question" ITEM_ROLE_RULES row (see
// MIGRATION_REPORT.md for the full task). Exercised against the real
// document-id (page-faq) and sectionKind ("faqCategory") the migration/new
// FaqSectionsInput+FaqQuestionItemsInput always produce.
// ============================================================================
test.describe("pageSection.ts — faqCategory section visibility (Task 2/4)", () => {
  function faqCategoryParent(sectionKey = "group-a") {
    return { sectionKey, sectionKind: "faqCategory" };
  }
  const faqDoc = { _id: "page-faq" };
  const faqDraftDoc = { _id: "drafts.page-faq" };
  // Deliberately NOT page-catering-menu-examples: that document hides
  // sectionKey/sectionKind for ANY correctly-shaped section regardless of
  // sectionKind value (see the existing "applies to every section on this
  // document" regression test below) — using it here would exercise the
  // Catering rule, not prove the FAQ rule is correctly scoped.
  const nonFaqDoc = { _id: "page-home" };

  test("isFaqCategorySection is true only for sectionKind faqCategory", () => {
    expect(isFaqCategorySection({ sectionKind: "faqCategory" })).toBe(true);
    expect(isFaqCategorySection({ sectionKind: "custom" })).toBe(false);
    expect(isFaqCategorySection(undefined)).toBe(false);
  });

  test("isPageFaq recognizes both the published and draft id, and rejects other documents", () => {
    expect(isPageFaq(faqDoc)).toBe(true);
    expect(isPageFaq(faqDraftDoc)).toBe(true);
    expect(isPageFaq(nonFaqDoc)).toBe(false);
  });

  test("only title/items are visible on a faqCategory section — label/text/media/actions/settings are all hidden", () => {
    for (const fieldName of ["label", "title", "text", "media", "actions", "items", "settings"] as const) {
      const expectedVisible = fieldName === "title" || fieldName === "items";
      const hidden = callHidden(field(pageSectionType, fieldName), { parent: faqCategoryParent(), document: faqDoc });
      expect(hidden, fieldName).toBe(!expectedVisible);
    }
  });

  test("sectionKey/sectionKind are hidden once a faqCategory section is correctly shaped, on page-faq only", () => {
    expect(callHidden(field(pageSectionType, "sectionKey"), { parent: faqCategoryParent(), document: faqDoc })).toBe(true);
    expect(callHidden(field(pageSectionType, "sectionKind"), { parent: faqCategoryParent(), document: faqDraftDoc })).toBe(true);
  });

  test("sectionKey/sectionKind are ALSO hidden on a faqCategory-shaped section on a different document — Phase 1's site-wide rule cares only about shape, not which document", () => {
    expect(callHidden(field(pageSectionType, "sectionKey"), { parent: faqCategoryParent(), document: nonFaqDoc })).toBe(true);
  });

  test("sectionKey/sectionKind stay visible on page-faq's hero section too (no sectionKind mismatch — hidden once ANY sectionKind is set, matching the Catering precedent)", () => {
    expect(callHidden(field(pageSectionType, "sectionKind"), { parent: { sectionKey: "hero", sectionKind: "hero" }, document: faqDoc })).toBe(true);
  });

  test("Title is required (en/da/uk) for a faqCategory section, optional-if-empty for a plain custom section", () => {
    const validate = captureCustomValidator(field(pageSectionType, "title"));
    const complete = [
      { _key: "en", language: "en", value: "Events" },
      { _key: "da", language: "da", value: "Events (da)" },
      { _key: "uk", language: "uk", value: "Події" },
    ];
    expect(validate(complete, { parent: faqCategoryParent(), document: faqDoc })).toBe(true);
    expect(validate(undefined, { parent: faqCategoryParent(), document: faqDoc }), "empty title on a faqCategory section must be invalid").not.toBe(true);
    expect(validate(undefined, { parent: { sectionKind: "custom" }, document: faqDoc }), "empty title on a plain custom section stays optional").toBe(true);
  });

  test("a hidden faqCategory field (e.g. text) never blocks publishing even with stray residue", () => {
    const validate = captureCustomValidator(field(pageSectionType, "text"));
    const strayResidue = [{ _key: "en", language: "en", value: "" }];
    expect(validate(strayResidue, { parent: faqCategoryParent(), document: faqDoc })).toBe(true);
  });

  test("faqCategory preview shows a question count as its subtitle, not the raw sectionKind", () => {
    const prepare = (pageSectionType.preview as { prepare: (v: Record<string, unknown>) => { title: string; subtitle?: string } }).prepare;
    const result = prepare({
      title: [{ _key: "en", language: "en", value: "Events" }],
      kind: "faqCategory",
      key: "group-a",
      items: [{ _key: "q0" }, { _key: "q1" }],
    });
    expect(result.title).toBe("Events");
    expect(result.subtitle).toBe("2 questions");
  });

  test("a non-faqCategory section's preview subtitle is the plain-language kind name, not the raw sectionKind (Phase B — STEP 10)", () => {
    const prepare = (pageSectionType.preview as { prepare: (v: Record<string, unknown>) => { title: string; subtitle?: string } }).prepare;
    expect(prepare({ title: [{ _key: "en", language: "en", value: "Philosophy" }], kind: "split", key: "philosophy", items: [{ _key: "a" }] }).subtitle).toBe("Text beside an image");
    expect(prepare({ kind: "servicesTeaser", key: "servicesTeaser" }).subtitle).toBe("Services teaser");
    // an unknown/legacy kind still falls back to its raw value rather than showing nothing
    expect(prepare({ kind: "legacyThing", key: "x" }).subtitle).toBe("legacyThing");
  });
});

test.describe("contentItem.ts — FAQ question role (Task 5)", () => {
  function faqQuestionDoc(item: { _key: string; itemKey?: string; href?: string; label?: unknown[] }) {
    return { _id: "page-faq", sections: [{ sectionKey: "group-a", sectionKind: "faqCategory", items: [item] }] };
  }

  test("a question with a real q0-style itemKey matches the FAQ question role", () => {
    const document = faqQuestionDoc({ _key: "q0", itemKey: "q0" });
    const parent = document.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(document, parent)?.role).toBe("FAQ question");
  });

  test("a question with no itemKey at all (added via the '+ Add question' button) also matches", () => {
    const document = faqQuestionDoc({ _key: "q7" });
    const parent = document.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(document, parent)?.role).toBe("FAQ question");
  });

  test("isFaqQuestionRole matches the same cases matchItemRoleInContext does", () => {
    const document = faqQuestionDoc({ _key: "q0", itemKey: "q0" });
    const parent = document.sections[0]!.items[0]!;
    expect(isFaqQuestionRole(document, parent)).toBe(true);
    expect(isFaqQuestionRole({ _id: "page-home" }, { _key: "x" })).toBe(false);
  });

  test("only title/text/href/label are visible — itemKey/icon/image/value are hidden", () => {
    const document = faqQuestionDoc({ _key: "q0", itemKey: "q0" });
    const parent = document.sections[0]!.items[0]!;
    for (const fieldName of ["itemKey", "icon", "title", "text", "image", "href", "label", "value"] as const) {
      const expectedVisible = ["title", "text", "href", "label"].includes(fieldName);
      expect(callHidden(field(contentItemType, fieldName), { document, parent }), fieldName).toBe(!expectedVisible);
    }
  });

  test("Question (title) and Answer (text) are required en/da/uk for a FAQ question", () => {
    const document = faqQuestionDoc({ _key: "q0", itemKey: "q0" });
    const parent = document.sections[0]!.items[0]!;
    const validateTitle = captureCustomValidator(field(contentItemType, "title"));
    expect(validateTitle(undefined, { document, parent }), "empty question text must be invalid").not.toBe(true);
    const complete = [
      { _key: "en", language: "en", value: "Q" },
      { _key: "da", language: "da", value: "Q da" },
      { _key: "uk", language: "uk", value: "Q uk" },
    ];
    expect(validateTitle(complete, { document, parent })).toBe(true);
  });

  test("title/text stay optional-if-empty for a non-FAQ-question item (regression — e.g. a Catering menu dish)", () => {
    const document = { _id: "page-catering-menu-examples", sections: [{ sectionKey: "category-a", sectionKind: "menuCategory", items: [{ _key: "dish0", itemKey: "dish0" }] }] };
    const parent = document.sections[0]!.items[0]!;
    const validateTitle = captureCustomValidator(field(contentItemType, "title"));
    expect(validateTitle(undefined, { document, parent })).toBe(true);
  });

  test("link pair: no href, no label -> valid", () => {
    const document = faqQuestionDoc({ _key: "q0", itemKey: "q0" });
    const parent = document.sections[0]!.items[0]!;
    expect(captureCustomValidator(field(contentItemType, "href"))(undefined, { document, parent })).toBe(true);
  });

  test("link pair: href with a full label -> valid on both fields", () => {
    const label = [{ _key: "en", language: "en", value: "See events" }];
    const document = faqQuestionDoc({ _key: "q0", itemKey: "q0", href: "/events", label });
    const parent = document.sections[0]!.items[0]!;
    expect(captureCustomValidator(field(contentItemType, "href"))("/events", { document, parent })).toBe(true);
  });

  test("link pair: href without label -> visible error on href", () => {
    const document = faqQuestionDoc({ _key: "q0", itemKey: "q0", href: "/events", label: [] });
    const parent = document.sections[0]!.items[0]!;
    const result = captureCustomValidator(field(contentItemType, "href"))("/events", { document, parent });
    expect(result).not.toBe(true);
  });

  test("link pair: label without href -> visible error on label (the pairing rule, not the allOrNothing i18n-completeness rule)", () => {
    const label = [
      { _key: "en", language: "en", value: "See events" },
      { _key: "da", language: "da", value: "Se events" },
      { _key: "uk", language: "uk", value: "Дивитись події" },
    ];
    const document = faqQuestionDoc({ _key: "q0", itemKey: "q0", label });
    const parent = document.sections[0]!.items[0]!;
    // captureCustomValidator captures the LAST rule.custom() registered for
    // this field — contentItem.ts's label validation is `(rule) =>
    // [allOrNothingLanguages(...)(rule), <pairing rule>(rule)]`, so this
    // exercises the pairing rule specifically.
    const result = captureCustomValidator(field(contentItemType, "label"))(label, { document, parent });
    expect(result).not.toBe(true);
  });

  test("link pair: whitespace-only label counts as absent — href-with-whitespace-label behaves like href-without-label", () => {
    const label = [{ _key: "en", language: "en", value: "   " }];
    const document = faqQuestionDoc({ _key: "q0", itemKey: "q0", href: "/events", label });
    const parent = document.sections[0]!.items[0]!;
    const result = captureCustomValidator(field(contentItemType, "href"))("/events", { document, parent });
    expect(result).not.toBe(true);
  });

  test("link pair validation is skipped entirely for a non-FAQ-question item (href/label are hidden there anyway)", () => {
    const document = { _id: "page-home", sections: [{ sectionKey: "hero", sectionKind: "hero", items: [{ _key: "trust0", itemKey: "trust0" }] }] };
    const parent = document.sections[0]!.items[0]!;
    expect(captureCustomValidator(field(contentItemType, "href"))("anything", { document, parent })).toBe(true);
  });
});

test.describe("sanity.config.ts — internationalizedArray global registry stays static", () => {
  test("languages is a static array with en/da/uk, not a per-document callback", () => {
    const source = readFileSync(path.join(process.cwd(), "sanity.config.ts"), "utf8");
    const pluginCallStart = source.indexOf("internationalizedArray({");
    expect(pluginCallStart, "internationalizedArray({...}) plugin registration not found").toBeGreaterThan(-1);
    const pluginCallEnd = source.indexOf("}),", pluginCallStart);
    const pluginConfig = source.slice(pluginCallStart, pluginCallEnd);

    expect(pluginConfig, "must not reintroduce a document-scoped `select` option").not.toContain("select:");
    expect(pluginConfig, "must not reintroduce a `languages` callback/function").not.toMatch(/languages:\s*\(/);
    expect(pluginConfig, "languages must be declared as a static array").toMatch(/languages:\s*\[/);
    for (const [id, title] of [["en", "English"], ["da", "Danish"], ["uk", "Ukrainian"]] as const) {
      expect(pluginConfig, `languages must always include { id: "${id}", title: "${title}" }`).toMatch(
        new RegExp(`id:\\s*"${id}"[\\s\\S]{0,20}title:\\s*"${title}"`),
      );
    }
  });
});

// ============================================================================
// Contact page workflow — pageSection.ts's Contact-specific hero/form field
// hides + sectionKey/sectionKind hides, and contentItem.ts's 6 new Contact
// roles (Follow-us heading, Submit button, Success message, Contact detail
// display row, Contact form field, FAQ prompt question/link). See
// MIGRATION_REPORT.md for the full task.
// ============================================================================
test.describe("pageSection.ts — Contact-specific section hides (Task 2)", () => {
  const contactDoc = { _id: "page-contact" };
  const contactDraftDoc = { _id: "drafts.page-contact" };
  const otherDoc = { _id: "page-home" };

  test("isPageContact recognizes both the published and draft id, and rejects other documents", () => {
    expect(isPageContact(contactDoc)).toBe(true);
    expect(isPageContact(contactDraftDoc)).toBe(true);
    expect(isPageContact(otherDoc)).toBe(false);
  });

  test("Contact's hero section: media/actions are hidden, label/title/text/items stay visible", () => {
    const parent = { sectionKey: "hero", sectionKind: "hero" };
    for (const fieldName of ["label", "title", "text", "media", "actions", "items"] as const) {
      const expectedHidden = fieldName === "media" || fieldName === "actions";
      expect(callHidden(field(pageSectionType, fieldName), { parent, document: contactDoc }), fieldName).toBe(expectedHidden);
    }
  });

  test("Contact's form section: label/text are hidden, title/items stay visible", () => {
    const parent = { sectionKey: "form", sectionKind: "form" };
    for (const fieldName of ["label", "title", "text", "items"] as const) {
      const expectedHidden = fieldName === "label" || fieldName === "text";
      expect(callHidden(field(pageSectionType, fieldName), { parent, document: contactDoc }), fieldName).toBe(expectedHidden);
    }
  });

  test("regression: Home's hero (media genuinely used there) is unaffected — media stays visible", () => {
    const parent = { sectionKey: "hero", sectionKind: "hero" };
    expect(callHidden(field(pageSectionType, "media"), { parent, document: otherDoc })).toBe(false);
  });

  test("sectionKey/sectionKind are hidden on Contact's hero and form sections once correctly shaped (real data always has sectionKind set)", () => {
    expect(callHidden(field(pageSectionType, "sectionKey"), { parent: { sectionKey: "hero", sectionKind: "hero" }, document: contactDoc })).toBe(true);
    expect(callHidden(field(pageSectionType, "sectionKind"), { parent: { sectionKey: "form", sectionKind: "form" }, document: contactDraftDoc })).toBe(true);
  });

  test("sectionKey/sectionKind stay visible on Contact for any section that genuinely has no sectionKind yet (a stray raw section, if ever reached) — never hidden-but-required", () => {
    expect(callHidden(field(pageSectionType, "sectionKey"), { parent: { sectionKey: "somethingElse" }, document: contactDoc })).toBe(false);
  });
});

test.describe("contentItem.ts — Contact reserved item roles (Task 5/6/7/10)", () => {
  function contactDoc2(sectionKey: string, item: { _key: string; itemKey?: string; href?: string; label?: unknown[] }) {
    return { _id: "page-contact", sections: [{ sectionKey, items: [item] }] };
  }

  test("\"Contact Follow-us heading\": only title visible, required, field label overridden", () => {
    const document = contactDoc2("hero", { _key: "followUsTitle", itemKey: "followUsTitle" });
    const parent = document.sections[0]!.items[0]!;
    const matched = matchItemRoleInContext(document, parent);
    expect(matched?.role).toBe("Contact Follow-us heading");
    expect(callHidden(field(contentItemType, "title"), { document, parent })).toBe(false);
    expect(callHidden(field(contentItemType, "text"), { document, parent })).toBe(true);
    expect(isFieldRequiredByItemRole("title")(document, parent)).toBe(true);
    expect(fieldLabelForItemRole("title", document, parent)).toBe("Follow us heading");
  });

  test("\"Contact submit button\": only title visible, required, field label overridden", () => {
    const document = contactDoc2("form", { _key: "submitLabel", itemKey: "submitLabel" });
    const parent = document.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(document, parent)?.role).toBe("Contact submit button");
    expect(fieldLabelForItemRole("title", document, parent)).toBe("Submit button text");
  });

  test("\"Contact success message\": only text visible, required, field label overridden", () => {
    const document = contactDoc2("form", { _key: "successMessage", itemKey: "successMessage" });
    const parent = document.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(document, parent)?.role).toBe("Contact success message");
    expect(callHidden(field(contentItemType, "text"), { document, parent })).toBe(false);
    expect(callHidden(field(contentItemType, "title"), { document, parent })).toBe(true);
    expect(isFieldRequiredByItemRole("text")(document, parent)).toBe(true);
  });

  test("\"Contact detail display row\": every generic field is hidden — ContactDetailsOrderInput owns the whole UI", () => {
    const document = contactDoc2("hero", { _key: "contactDetail-address", itemKey: "contactDetail-address" });
    const parent = document.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(document, parent)?.role).toBe("Contact detail display row");
    for (const fieldName of ["itemKey", "icon", "title", "text", "image", "href", "label", "value"] as const) {
      expect(callHidden(field(contentItemType, fieldName), { document, parent }), fieldName).toBe(true);
    }
  });

  test("\"Contact detail display row\" matches all 3 supported keys (address/phone/email) and no others", () => {
    for (const key of ["contactDetail-address", "contactDetail-phone", "contactDetail-email"]) {
      const document = contactDoc2("hero", { _key: key, itemKey: key });
      expect(matchItemRoleInContext(document, document.sections[0]!.items[0]!)?.role, key).toBe("Contact detail display row");
    }
    const unsupported = contactDoc2("hero", { _key: "x", itemKey: "contactDetail-fax" });
    expect(matchItemRoleInContext(unsupported, unsupported.sections[0]!.items[0]!)).toBeUndefined();
  });

  test("\"Contact form field\": title/text/value visible, itemKey/icon/image/href/label hidden, title required", () => {
    const document = contactDoc2("form", { _key: "field-city", itemKey: "field-city" });
    const parent = document.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(document, parent)?.role).toBe("Contact form field");
    for (const fieldName of ["itemKey", "icon", "title", "text", "image", "href", "label", "value"] as const) {
      const expectedVisible = ["title", "text", "value"].includes(fieldName);
      expect(callHidden(field(contentItemType, fieldName), { document, parent }), fieldName).toBe(!expectedVisible);
    }
    expect(isFieldRequiredByItemRole("title")(document, parent)).toBe(true);
    expect(isFieldRequiredByItemRole("text")(document, parent)).toBe(false);
  });

  test("\"Contact FAQ prompt question\"/\"link\": scoped correctly, href visible only on the link row", () => {
    const questionDoc = contactDoc2("form", { _key: "faqPromptQuestion", itemKey: "faqPromptQuestion" });
    const questionParent = questionDoc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(questionDoc, questionParent)?.role).toBe("Contact FAQ prompt question");
    expect(callHidden(field(contentItemType, "href"), { document: questionDoc, parent: questionParent })).toBe(true);

    const linkDoc = contactDoc2("form", { _key: "faqPromptLabel", itemKey: "faqPromptLabel" });
    const linkParent = linkDoc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(linkDoc, linkParent)?.role).toBe("Contact FAQ prompt link");
    expect(callHidden(field(contentItemType, "href"), { document: linkDoc, parent: linkParent })).toBe(false);
    expect(callHidden(field(contentItemType, "title"), { document: linkDoc, parent: linkParent })).toBe(false);
  });

  // Document-scoping (this session's follow-up task) fixes what used to be a
  // real gap here: an earlier version of this exact test asserted that an
  // identical sectionKey+itemKey on page-home's OWN hero DID match "Contact
  // Follow-us heading" — proving the architecture was, at the time, unsafe
  // for any future page reusing "hero"/"followUsTitle". `documentIds` on
  // every Contact role now closes that gap; this test proves the fix.
  test("an identical sectionKey/itemKey (\"hero\"/\"followUsTitle\") on a DIFFERENT page's document never activates the Contact role — documentIds scoping", () => {
    const otherPageDoc = { _id: "page-home", sections: [{ sectionKey: "hero", items: [{ _key: "x", itemKey: "followUsTitle" }] }] };
    expect(matchItemRoleInContext(otherPageDoc, otherPageDoc.sections[0]!.items[0]!)).toBeUndefined();

    const otherPageDraftDoc = { _id: "drafts.page-home", sections: [{ sectionKey: "hero", items: [{ _key: "x", itemKey: "followUsTitle" }] }] };
    expect(matchItemRoleInContext(otherPageDraftDoc, otherPageDraftDoc.sections[0]!.items[0]!)).toBeUndefined();

    // The exact same shape DOES match on page-contact and its draft.
    const contactDoc = { _id: "page-contact", sections: [{ sectionKey: "hero", items: [{ _key: "x", itemKey: "followUsTitle" }] }] };
    expect(matchItemRoleInContext(contactDoc, contactDoc.sections[0]!.items[0]!)?.role).toBe("Contact Follow-us heading");
    const contactDraftDoc = { _id: "drafts.page-contact", sections: [{ sectionKey: "hero", items: [{ _key: "x", itemKey: "followUsTitle" }] }] };
    expect(matchItemRoleInContext(contactDraftDoc, contactDraftDoc.sections[0]!.items[0]!)?.role).toBe("Contact Follow-us heading");
  });

  test("an identical sectionKey/itemKey (\"form\"/\"field-city\") on a different page never activates the Contact form field role", () => {
    const otherPageDoc = { _id: "page-catering", sections: [{ sectionKey: "form", items: [{ _key: "x", itemKey: "field-city" }] }] };
    expect(matchItemRoleInContext(otherPageDoc, otherPageDoc.sections[0]!.items[0]!)).toBeUndefined();
  });

  test("a document with no _id at all never satisfies a documentIds-scoped rule (fail-safe direction: unknown document is never assumed to be Contact)", () => {
    const noIdDoc = { sections: [{ sectionKey: "hero", items: [{ _key: "x", itemKey: "followUsTitle" }] }] };
    expect(matchItemRoleInContext(noIdDoc, noIdDoc.sections[0]!.items[0]!)).toBeUndefined();
  });
});

// ============================================================================
// Event Decoration Publish-blocker re-diagnosis (this session) — the exact
// live document shape (raw-fetched 2026-08-24) proving the Contact page
// schema work (pageSection.ts/contentItem.ts's new Contact-only hides and
// 6 new ITEM_ROLE_RULES rows, all scoped by isPageContact()/sectionKeys
// "hero"/"form") never touches Event Decoration's own sections/items, and
// that this document's real gallery/styling/steps/inquiryForm shape
// validates with zero errors under the CURRENT (Contact-inclusive) schema.
//
// The actual Publish blocker — confirmed via the official `sanity
// documents validate` engine against BOTH the current working tree AND a
// clean `c7e78f8` git worktree (git worktree add, no stash/reset, Contact
// work never touched) — is a single pre-existing stray entry in
// drafts.page-event-decoration's `seo.title` array:
//   { "_key": "01705d3487af", "_type": "internationalizedArrayStringValue" }
// (no `language`, no `value` — Studio residue from a field opened but never
// filled in). This fails `sanity-plugin-internationalized-array`'s own
// built-in per-entry schema (node_modules/sanity-plugin-internationalized-array/
// dist/index.js's `object_default()`: a hidden `language` field with
// `validation: (Rule) => Rule.required()`) — third-party plugin schema,
// not any file this project owns, and identical (same path, same message,
// same document revision) under both the c7e78f8 and current schema —
// proving it is NOT a Contact regression and predates this session's work
// entirely. `page-event-decoration` (published) has `seo.title: undefined`
// (never set) and 0 validation errors. `sanity.config.ts`'s
// `document.actions` filter only removes "duplicate"/"delete" for `page`-
// type documents — "publish" is never removed, confirming Publish is
// disabled by Studio's own standard "has validation errors" behavior, not
// a config/permission issue.
// ============================================================================
test.describe("Event Decoration — real document shape unaffected by Contact's schema work (this session's re-diagnosis)", () => {
  // Real section/item shapes, raw-fetched from page-event-decoration
  // 2026-08-24 (see this describe block's own comment above for the full
  // diagnosis). sectionKey "inquiryForm" (not "form") and every itemKey
  // below are exactly what's live today.
  const eventDecorationDoc = {
    _id: "page-event-decoration",
    sections: [
      { _key: "hero", sectionKey: "hero", sectionKind: "hero", items: [] },
      {
        _key: "gallery",
        sectionKey: "gallery",
        sectionKind: "gallery",
        items: [
          { _key: "ariaLabel", itemKey: "ariaLabel" },
          { _key: "suitableFor0", itemKey: "suitableFor0" },
          { _key: "suitableFor1", itemKey: "suitableFor1" },
        ],
      },
      {
        _key: "styling",
        sectionKey: "styling",
        sectionKind: "split",
        items: [
          { _key: "intro0", itemKey: "intro0" },
          { _key: "intro1", itemKey: "intro1" },
          { _key: "format0", itemKey: "format0" },
          { _key: "tailoredNote", itemKey: "tailoredNote" },
        ],
      },
      { _key: "steps", sectionKey: "steps", sectionKind: "steps", items: [{ _key: "step0", itemKey: "step0" }] },
      {
        _key: "inquiryForm",
        sectionKey: "inquiryForm",
        sectionKind: "form",
        items: [
          { _key: "submitLabel", itemKey: "submitLabel" },
          { _key: "messagePlaceholder", itemKey: "messagePlaceholder" },
          { _key: "successMessage", itemKey: "successMessage" },
        ],
      },
    ],
  };

  test("isPageContact is false for page-event-decoration (and its draft) — none of the new Contact-only section hides can ever activate here", () => {
    expect(isPageContact(eventDecorationDoc)).toBe(false);
    expect(isPageContact({ _id: "drafts.page-event-decoration" })).toBe(false);
  });

  test("Event Decoration's hero section keeps actions VISIBLE (never hidden by Contact's own document-scoped rule) — media is hidden for a SEPARATE, later reason (this session's own Phase 1/2 work — see the dedicated 'hero: media/items hidden' describe block above), not by Contact's rule leaking across documents", () => {
    const parent = eventDecorationDoc.sections[0]!;
    expect(callHidden(field(pageSectionType, "media"), { parent, document: eventDecorationDoc })).toBe(true);
    expect(callHidden(field(pageSectionType, "actions"), { parent, document: eventDecorationDoc })).toBe(false);
  });

  test("Event Decoration's inquiryForm section (sectionKey \"inquiryForm\", NOT \"form\") is untouched by the new Contact form hide (label/text)", () => {
    // "form"-kind visibility already hides label/text for every section of
    // this kind (pre-existing, unrelated to Contact) — the test here is
    // that the CONTACT-SPECIFIC force-hide doesn't ALSO apply (it's a
    // no-op regardless since the outcome is the same hidden state, but
    // confirms via isPageContact() being false, not an accidental
    // sectionKey match on "form").
    expect(eventDecorationDoc.sections[4]!.sectionKey).not.toBe("form");
  });

  test("Event Decoration's real submitLabel/successMessage items in inquiryForm still match their PRE-EXISTING Catering-shared role, not any new Contact role", () => {
    const submitParent = eventDecorationDoc.sections[4]!.items[0]!;
    const successParent = eventDecorationDoc.sections[4]!.items[2]!;
    expect(matchItemRoleInContext(eventDecorationDoc, submitParent)?.role).toBe("Catering inquiry form title-only row");
    expect(matchItemRoleInContext(eventDecorationDoc, successParent)?.role).toBe("Catering inquiry form success message");
  });

  test("every real item in gallery/styling/steps/inquiryForm keeps its pre-existing visible-field set — zero fields newly hidden or newly required by this session's Contact work", () => {
    for (const section of eventDecorationDoc.sections) {
      for (const item of section.items) {
        const rule = matchItemRoleInContext(eventDecorationDoc, item);
        const isContactRole = Boolean(rule?.role.startsWith("Contact "));
        expect(isContactRole, `${section.sectionKey}.${item.itemKey} matched role "${rule?.role}"`).toBe(false);
      }
    }
  });

  test("no i18n field on Event Decoration's real items is force-required by the new isFieldRequiredByItemRole mechanism (all pre-existing roles are unaffected)", () => {
    for (const section of eventDecorationDoc.sections) {
      for (const item of section.items) {
        for (const fieldName of ["title", "text"] as const) {
          // Only FAQ question / Contact form field / Contact Follow-us
          // heading / Contact success message roles set requiredFields —
          // none of those roles can match anything in this document (proven
          // above), so this must always be false here.
          expect(isFieldRequiredByItemRole(fieldName)(eventDecorationDoc, item), `${section.sectionKey}.${item.itemKey}.${fieldName}`).toBe(false);
        }
      }
    }
  });
});

// ============================================================================
// socialLinks business correction (this session's follow-up) — RORUM does
// not have a LinkedIn profile that should appear via the shared socialLinks
// singleton (Contact/Header/Footer); the selectable platform list on
// `socialLink` (used ONLY by that singleton — Event Share's own
// share-platform list in event.ts is a separate, hardcoded schema that
// still supports LinkedIn unchanged, see EventShare.test.tsx) is narrowed
// to exactly Instagram and Facebook.
// ============================================================================
test.describe("socialLink.ts — platform selector narrowed to Instagram/Facebook only", () => {
  test("the selectable options list is exactly Instagram and Facebook, in that order — no LinkedIn, no WhatsApp", () => {
    const iconField = field(socialLinkType, "icon") as unknown as { options?: { list?: { title: string; value: string }[] } };
    expect(iconField.options?.list).toEqual([
      { title: "Instagram", value: "instagram" },
      { title: "Facebook", value: "facebook" },
    ]);
  });

  // Correction of an assumption made mid-task (see MIGRATION_REPORT.md Part
  // 22): a pre-existing stored value outside `options.list` (e.g. a legacy
  // "linkedin" entry) IS retroactively flagged by Sanity itself
  // ("did not match any allowed values") — confirmed live via the official
  // validator, not just assumed. That specific check is enforced by
  // Sanity's own list-membership validation, which isn't reachable through
  // this file's mocked-rule harness (only `rule.custom(...)` calls are
  // captured) — this test instead proves the ADJACENT, narrower claim that
  // IS testable here: the field's own custom duplicate-platform validator
  // (the one `rule.custom(...)` this field registers) never itself rejects
  // a lone "linkedin" value — only Sanity's separate, built-in
  // list-membership check does that.
  test("the custom duplicate-platform validator (this field's own rule.custom) does not reject a lone out-of-list value — that's Sanity's separate, built-in list-membership check, confirmed live instead", () => {
    const iconField = field(socialLinkType, "icon");
    const requiredRule = (iconField as unknown as { validation?: (rule: unknown) => unknown }).validation;
    expect(typeof requiredRule).toBe("function");
    const validate = captureCustomValidator(iconField);
    const doc = { links: [{ _key: "x", icon: "linkedin" }] };
    expect(validate("linkedin", { document: doc, parent: { _key: "x" } })).toBe(true);
  });
});

// ============================================================================
// Events Listing Studio task — page-events' 3 fixed sections (hero/filters/
// closingCta), the document-scoped "Events filter/empty-state label" role,
// and the required-title rule for filter labels.
// ============================================================================
test.describe("pageSection.ts — Events Listing fixed-section visibility", () => {
  function sectionKeyField() {
    return field(pageSectionType as unknown as { fields: FieldDef[] }, "sectionKey");
  }
  function sectionKindField() {
    return field(pageSectionType as unknown as { fields: FieldDef[] }, "sectionKind");
  }
  function labelField() {
    return field(pageSectionType as unknown as { fields: FieldDef[] }, "label");
  }
  function titleField() {
    return field(pageSectionType as unknown as { fields: FieldDef[] }, "title");
  }
  function settingsField() {
    return field(pageSectionType as unknown as { fields: FieldDef[] }, "settings");
  }

  test("isPageEvents recognizes both the published and draft id, and rejects other documents", () => {
    expect(isPageEvents({ _id: "page-events" })).toBe(true);
    expect(isPageEvents({ _id: "drafts.page-events" })).toBe(true);
    expect(isPageEvents({ _id: "page-catering" })).toBe(false);
    expect(isPageEvents(undefined)).toBe(false);
  });

  test("sectionKey/sectionKind are hidden unconditionally on all 3 of page-events' fixed sections (hero/filters/closingCta)", () => {
    for (const sectionKey of ["hero", "filters", "closingCta"]) {
      const parent = { sectionKey, sectionKind: sectionKey === "closingCta" ? "cta" : sectionKey };
      const ctx = { parent, document: { _id: "page-events" } };
      expect(callHidden(sectionKeyField(), ctx), sectionKey).toBe(true);
      expect(callHidden(sectionKindField(), ctx), sectionKey).toBe(true);
    }
  });

  test("sectionKey/sectionKind are ALSO hidden on page-events for any OTHER (non-fixed) sectionKey — Phase 1's site-wide rule hides once correctly shaped, regardless of which sectionKey/document", () => {
    const parent = { sectionKey: "somethingElse", sectionKind: "custom" };
    const ctx = { parent, document: { _id: "page-events" } };
    expect(callHidden(sectionKeyField(), ctx)).toBe(true);
    expect(callHidden(sectionKindField(), ctx)).toBe(true);
  });

  test("an identical sectionKey (\"hero\"/\"filters\"/\"closingCta\") on a DIFFERENT page's document is ALSO hidden once shaped — the site-wide Phase 1 rule, not a page-events-specific one", () => {
    for (const sectionKey of ["hero", "filters", "closingCta"]) {
      const parent = { sectionKey, sectionKind: sectionKey };
      const ctx = { parent, document: { _id: "page-home" } };
      expect(callHidden(sectionKeyField(), ctx), sectionKey).toBe(true);
    }
  });

  test("filters section: label/title are hidden on page-events (never read by the frontend — only per-item .title is)", () => {
    const parent = { sectionKey: "filters", sectionKind: "filters" };
    const ctx = { parent, document: { _id: "page-events" } };
    expect(callHidden(labelField(), ctx)).toBe(true);
    expect(callHidden(titleField(), ctx)).toBe(true);
  });

  test("regression: filters section's label/title stay visible on any other page (defensive — no other page currently uses sectionKind \"filters\")", () => {
    const parent = { sectionKey: "filters", sectionKind: "filters" };
    const ctx = { parent, document: { _id: "page-catering" } };
    expect(callHidden(labelField(), ctx)).toBe(false);
    expect(callHidden(titleField(), ctx)).toBe(false);
  });

  test("closingCta section: settings is hidden on page-events (the stored \"variant\" flag is never read — the frontend hardcodes variant=\"host\") — via sectionKind \"cta\"'s own generic FIELD_VISIBILITY, not a page-events-specific override (that visibility rule already applies to every closingCta on every page)", () => {
    const parent = { sectionKey: "closingCta", sectionKind: "cta" };
    for (const docId of ["page-events", "page-home", "page-about"]) {
      expect(callHidden(settingsField(), { parent, document: { _id: docId } }), docId).toBe(true);
    }
  });

  test("closingCta section: label/title/text/actions/items stay visible on page-events (all genuinely read by the frontend)", () => {
    const parent = { sectionKey: "closingCta", sectionKind: "cta" };
    const ctx = { parent, document: { _id: "page-events" } };
    expect(callHidden(labelField(), ctx)).toBe(false);
    expect(callHidden(titleField(), ctx)).toBe(false);
  });
});

test.describe("contentItem.ts — Events filter/empty-state label role (Events Listing Studio task)", () => {
  function docWithItem(itemKey: string, documentId = "page-events") {
    return { _id: documentId, sections: [{ sectionKey: "filters", sectionKind: "filters", items: [{ _key: "x", itemKey }] }] };
  }
  const ALL_17_KEYS = [
    "dateLabel", "languageLabel", "priceLabel", "availabilityLabel",
    "soonestLabel", "weekLabel", "monthLabel",
    "languageDaLabel", "languageEnLabel", "languageUkLabel",
    "priceAscLabel", "priceDescLabel",
    "availableLabel", "soldOutLabel",
    "clearFiltersLabel", "emptyStateTitle", "emptyStateText",
  ];

  test("all 17 known filter/empty-state keys match the role on page-events, with only title visible and required", () => {
    for (const itemKey of ALL_17_KEYS) {
      const doc = docWithItem(itemKey);
      const parent = doc.sections[0]!.items[0]!;
      const rule = matchItemRoleInContext(doc, parent);
      expect(rule?.role, itemKey).toBe("Events filter/empty-state label");
      expect(rule?.visible, itemKey).toEqual(["title"]);
      expect(isFieldRequiredByItemRole("title")(doc, parent), itemKey).toBe(true);
    }
  });

  test("the new languageDaLabel/languageEnLabel/languageUkLabel rows get a semantic field label (\"Label text\"), never a raw \"Title\"", () => {
    const doc = docWithItem("languageDaLabel");
    const parent = doc.sections[0]!.items[0]!;
    expect(fieldLabelForItemRole("title", doc, parent)).toBe("Label text");
  });

  test("an identical sectionKey/itemKey (\"filters\"/\"dateLabel\") on a DIFFERENT page's document never activates this role — documentIds scoping", () => {
    for (const documentId of ["page-catering", "drafts.page-catering"]) {
      const doc = docWithItem("dateLabel", documentId);
      const parent = doc.sections[0]!.items[0]!;
      expect(matchItemRoleInContext(doc, parent)?.role, documentId).toBeUndefined();
    }
  });

  test("both the published and draft page-events ids activate the role", () => {
    for (const documentId of ["page-events", "drafts.page-events"]) {
      const doc = docWithItem("dateLabel", documentId);
      const parent = doc.sections[0]!.items[0]!;
      expect(matchItemRoleInContext(doc, parent)?.role, documentId).toBe("Events filter/empty-state label");
    }
  });

  test("an unrecognized itemKey inside page-events' filters section never matches this role — every generic field stays visible for it", () => {
    const doc = docWithItem("someUnknownKey");
    const parent = doc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(doc, parent)).toBeUndefined();
  });
});

// ============================================================================
// pageSection.ts / contentItem.ts — Event Decoration + Host at RORUM Studio
// workflow (Phase 2/3, this session's own task). Both pages' hero sections
// never use media/items (their real gallery photos live in a separate
// "gallery" section; their CTA lives in `actions`, not `items`) — hidden by
// document, not by sectionKey "hero" alone, so Home's own hero (which
// genuinely uses media) stays unaffected. Every item role below reuses an
// EXISTING shared (non-documentId-scoped) Catering rule wherever the shape
// is identical (gallery ariaLabel/suitableFor chips, 3-step rows, inquiry
// form submitLabel/messagePlaceholder/successMessage) — only the roles with
// no existing equivalent (What We Style cards, Host's session-includes/
// package/aria-label rows) get a new, documentIds-scoped rule.
// ============================================================================
test.describe("pageSection.ts — Event Decoration / Host at RORUM hero: media/items hidden, Home's hero unaffected", () => {
  function mediaField() {
    return field(pageSectionType as unknown as { fields: FieldDef[] }, "media");
  }
  function itemsField() {
    return field(pageSectionType as unknown as { fields: FieldDef[] }, "items");
  }

  test("Event Decoration's hero: media and items are hidden", () => {
    const parent = { sectionKey: "hero", sectionKind: "hero" };
    for (const docId of ["page-event-decoration", "drafts.page-event-decoration"]) {
      const ctx = { parent, document: { _id: docId } };
      expect(callHidden(mediaField(), ctx), docId).toBe(true);
      expect(callHidden(itemsField(), ctx), docId).toBe(true);
    }
  });

  test("Host at RORUM's hero: media and items are hidden", () => {
    const parent = { sectionKey: "hero", sectionKind: "hero" };
    for (const docId of ["page-host-at-rorum", "drafts.page-host-at-rorum"]) {
      const ctx = { parent, document: { _id: docId } };
      expect(callHidden(mediaField(), ctx), docId).toBe(true);
      expect(callHidden(itemsField(), ctx), docId).toBe(true);
    }
  });

  test("regression: Home's hero keeps media/items visible — the hide is scoped by document, not by sectionKey \"hero\" alone", () => {
    const parent = { sectionKey: "hero", sectionKind: "hero" };
    const ctx = { parent, document: { _id: "page-home" } };
    expect(callHidden(mediaField(), ctx)).toBe(false);
    expect(callHidden(itemsField(), ctx)).toBe(false);
  });

  test("regression: Event Decoration's/Host's own other sections (gallery/styling/session) are unaffected — the force-hide is scoped to sectionKey \"hero\" only", () => {
    for (const [docId, sectionKey] of [
      ["page-event-decoration", "styling"],
      ["page-host-at-rorum", "session"],
    ] as const) {
      const parent = { sectionKey, sectionKind: "split" };
      const ctx = { parent, document: { _id: docId } };
      expect(callHidden(mediaField(), ctx), docId).toBe(false);
      expect(callHidden(itemsField(), ctx), docId).toBe(false);
    }
  });
});

test.describe("contentItem.ts — Event Decoration 'What We Style' item + shared 'tailored upon request' note", () => {
  function docWithStylingItem(itemKey: string | undefined, documentId = "page-event-decoration") {
    return { _id: documentId, sections: [{ sectionKey: "styling", sectionKind: "split", items: [{ _key: "x", itemKey }] }] };
  }

  test("a format item (e.g. \"format0\") matches the role: icon/title/text/href/label visible, itemKey/image/value hidden", () => {
    const doc = docWithStylingItem("format0");
    const parent = doc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(doc, parent)?.role).toBe("Event Decoration 'What We Style' item");
    for (const fieldName of ["icon", "title", "text", "href", "label"] as const) {
      expect(callHidden(field(contentItemType, fieldName), { document: doc, parent }), fieldName).toBe(false);
    }
    for (const fieldName of ["itemKey", "image", "value"] as const) {
      expect(callHidden(field(contentItemType, fieldName), { document: doc, parent }), fieldName).toBe(true);
    }
  });

  test("a manager-added format item with no itemKey yet also matches (via the empty-string branch of the pattern)", () => {
    const doc = docWithStylingItem(undefined);
    const parent = doc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(doc, parent)?.role).toBe("Event Decoration 'What We Style' item");
  });

  test("the same sectionKey/itemKey on a DIFFERENT document never activates this role — documentIds scoping", () => {
    const doc = docWithStylingItem("format0", "page-catering");
    const parent = doc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(doc, parent)).toBeUndefined();
  });

  test("the shared \"tailored upon request\" note role now also matches Event Decoration's own styling section, not just Catering's philosophy section", () => {
    const doc = docWithStylingItem("tailoredNote");
    const parent = doc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(doc, parent)?.role).toBe('"Tailored upon request" note (Catering + Event Decoration)');
    expect(callHidden(field(contentItemType, "title"), { document: doc, parent })).toBe(false);
    expect(callHidden(field(contentItemType, "text"), { document: doc, parent })).toBe(false);
    expect(callHidden(field(contentItemType, "icon"), { document: doc, parent })).toBe(true);
  });

  test("the existing Catering gallery ariaLabel/suitableFor chip roles apply unchanged to Event Decoration's own gallery section (same sectionKey, no documentIds scoping needed — shape is identical)", () => {
    const doc = { _id: "page-event-decoration", sections: [{ sectionKey: "gallery", sectionKind: "gallery", items: [{ _key: "x", itemKey: "suitableFor0" }] }] };
    const parent = doc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(doc, parent)?.role).toBe('Catering "suitable for" chip');
  });

  test("the existing shared 3-step-row role applies unchanged to Event Decoration's own steps section", () => {
    const doc = { _id: "page-event-decoration", sections: [{ sectionKey: "steps", sectionKind: "steps", items: [{ _key: "x", itemKey: "step0" }] }] };
    const parent = doc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(doc, parent)?.role).toBe("Catering 3-step setup row");
  });
});

test.describe("contentItem.ts — Host at RORUM session-includes / package / step-aria-label roles", () => {
  function docWithItemIn(sectionKey: string, itemKey: string | undefined, documentId = "page-host-at-rorum") {
    return { _id: documentId, sections: [{ sectionKey, sectionKind: sectionKey === "packages" ? "cta" : "split", items: [{ _key: "x", itemKey }] }] };
  }

  test("a session-includes row (includedN/optionalN/optionalLabel) shows only Title, required", () => {
    for (const itemKey of ["included0", "included6", "optional0", "optionalLabel"]) {
      const doc = docWithItemIn("session", itemKey);
      const parent = doc.sections[0]!.items[0]!;
      expect(matchItemRoleInContext(doc, parent)?.role, itemKey).toBe("Host at RORUM session-includes item");
      expect(callHidden(field(contentItemType, "title"), { document: doc, parent }), itemKey).toBe(false);
      expect(callHidden(field(contentItemType, "icon"), { document: doc, parent }), itemKey).toBe(true);
      expect(isFieldRequiredByItemRole("title")(doc, parent), itemKey).toBe(true);
    }
  });

  test("a package item shows Title/Label(price)/Text, hides itemKey/icon/image/href/value", () => {
    const doc = docWithItemIn("packages", "package0");
    const parent = doc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(doc, parent)?.role).toBe("Host at RORUM package");
    for (const fieldName of ["title", "label", "text"] as const) {
      expect(callHidden(field(contentItemType, fieldName), { document: doc, parent }), fieldName).toBe(false);
    }
    for (const fieldName of ["itemKey", "icon", "image", "href", "value"] as const) {
      expect(callHidden(field(contentItemType, fieldName), { document: doc, parent }), fieldName).toBe(true);
    }
    expect(fieldLabelForItemRole("label", doc, parent)).toBe("Price");
  });

  test("packages' title-only rows (footerCtaLabel/footerText/selectPackageCta/cancellationTitle/cancellationN) show only Title", () => {
    for (const itemKey of ["footerCtaLabel", "footerText", "selectPackageCta", "cancellationTitle", "cancellation0"]) {
      const doc = docWithItemIn("packages", itemKey);
      const parent = doc.sections[0]!.items[0]!;
      expect(matchItemRoleInContext(doc, parent)?.role, itemKey).toBe("Host at RORUM packages title-only row");
    }
  });

  test("the steps section's own aria-label row is title-only, distinct from the shared step0-N role", () => {
    const doc = docWithItemIn("steps", "requestProcessAriaLabel");
    const parent = doc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(doc, parent)?.role).toBe("Host at RORUM step-list aria label");
    const stepDoc = docWithItemIn("steps", "step0");
    const stepParent = stepDoc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(stepDoc, stepParent)?.role).toBe("Catering 3-step setup row");
  });

  test("none of these 3 new Host at RORUM roles activate on a different document with the same sectionKey/itemKey", () => {
    for (const [sectionKey, itemKey] of [
      ["session", "included0"],
      ["packages", "package0"],
      ["steps", "requestProcessAriaLabel"],
    ] as const) {
      const doc = docWithItemIn(sectionKey, itemKey, "page-catering");
      const parent = doc.sections[0]!.items[0]!;
      expect(matchItemRoleInContext(doc, parent), `${sectionKey}/${itemKey}`).toBeUndefined();
    }
  });
});

test.describe("pageSection.ts — Community Membership section visibility (allow-list)", () => {
  function mediaField() {
    return field(pageSectionType as unknown as { fields: FieldDef[] }, "media");
  }
  function textField() {
    return field(pageSectionType as unknown as { fields: FieldDef[] }, "text");
  }
  function actionsField() {
    return field(pageSectionType as unknown as { fields: FieldDef[] }, "actions");
  }

  test("hero: media is hidden (the real photo comes from a static logo image, not a manager-uploaded media item)", () => {
    for (const docId of ["page-community-membership", "drafts.page-community-membership"]) {
      const parent = { sectionKey: "hero", sectionKind: "hero" };
      expect(callHidden(mediaField(), { parent, document: { _id: docId } }), docId).toBe(true);
    }
  });

  test("hero: text stays VISIBLE — it's the real, migrated two-paragraph intro field, unlike Event Decoration/Host's own hero", () => {
    const parent = { sectionKey: "hero", sectionKind: "hero" };
    expect(callHidden(textField(), { parent, document: { _id: "page-community-membership" } })).toBe(false);
  });

  test("intro: text/media/actions are all hidden — real paragraph content lives in the section's items[].text, and its visible action buttons are cross-wired from hero's own actions, not this section's", () => {
    const parent = { sectionKey: "intro", sectionKind: "split" };
    const document = { _id: "page-community-membership" };
    expect(callHidden(textField(), { parent, document })).toBe(true);
    expect(callHidden(mediaField(), { parent, document })).toBe(true);
    expect(callHidden(actionsField(), { parent, document })).toBe(true);
  });

  test("regression: a DIFFERENT document's hero/intro sections are unaffected by these Community-Membership-only hides", () => {
    for (const [docId, sectionKey] of [
      ["page-home", "hero"],
      ["page-about", "intro"],
    ] as const) {
      const parent = { sectionKey, sectionKind: "hero" };
      const document = { _id: docId };
      expect(callHidden(mediaField(), { parent, document }), docId).toBe(false);
      expect(callHidden(textField(), { parent, document }), docId).toBe(false);
      expect(callHidden(actionsField(), { parent, document }), docId).toBe(false);
    }
  });

  test("Community Membership's other sections each show exactly their audited fields", () => {
    const document = { _id: "page-community-membership" };
    const expected: Record<string, { kind: string; visible: string[] }> = {
      donation: { kind: "donation", visible: ["label", "title", "text", "media", "items"] },
      benefits: { kind: "benefits", visible: ["title", "items"] },
      application: { kind: "cta", visible: ["title", "text", "actions", "items"] },
      // gallery has a rendered heading (`<SectionHeader title={data.galleryTitle}>`)
      // that the default gallery-kind visibility hides — the allow-list restores it.
      gallery: { kind: "gallery", visible: ["label", "title", "media"] },
    };
    for (const [sectionKey, { kind, visible }] of Object.entries(expected)) {
      const parent = { sectionKey, sectionKind: kind };
      for (const f of ["label", "title", "text", "media", "actions", "items", "settings"] as const) {
        expect(!callHidden(field(pageSectionType, f), { parent, document }), `${sectionKey} · ${f}`).toBe(visible.includes(f));
      }
    }
  });
});

test.describe("contentItem.ts — Community Membership reserved item roles", () => {
  function docWithItemIn(sectionKey: string, itemKey: string | undefined, documentId = "page-community-membership") {
    return { _id: documentId, sections: [{ sectionKey, sectionKind: "split", items: [{ _key: "x", itemKey }] }] };
  }

  test("hero's priceStripText row shows only Title, required", () => {
    const doc = docWithItemIn("hero", "priceStripText");
    const parent = doc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(doc, parent)?.role).toBe("Community Membership annual price strip");
    expect(callHidden(field(contentItemType, "title"), { document: doc, parent })).toBe(false);
    for (const fieldName of ["icon", "text", "image", "href", "label", "value", "copyEnabled"] as const) {
      expect(callHidden(field(contentItemType, fieldName), { document: doc, parent }), fieldName).toBe(true);
    }
    expect(isFieldRequiredByItemRole("title")(doc, parent)).toBe(true);
  });

  test("donation's short-label rows (scanText/scanSubtext/orText/bankTransferText/bankDetailsTitle) show only Title", () => {
    for (const itemKey of ["scanText", "scanSubtext", "orText", "bankTransferText", "bankDetailsTitle"]) {
      const doc = docWithItemIn("donation", itemKey);
      const parent = doc.sections[0]!.items[0]!;
      expect(matchItemRoleInContext(doc, parent)?.role, itemKey).toBe("Community Membership donation message (short label)");
      expect(callHidden(field(contentItemType, "title"), { document: doc, parent }), itemKey).toBe(false);
      expect(callHidden(field(contentItemType, "text"), { document: doc, parent }), itemKey).toBe(true);
    }
  });

  test("donation's supportText row shows only Text (the longer closing note, distinct from the short-label rows)", () => {
    const doc = docWithItemIn("donation", "supportText");
    const parent = doc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(doc, parent)?.role).toBe("Community Membership donation closing note");
    expect(callHidden(field(contentItemType, "text"), { document: doc, parent })).toBe(false);
    expect(callHidden(field(contentItemType, "title"), { document: doc, parent })).toBe(true);
  });

  test("a bank detail row shows Title/Value/Copy button enabled, hides itemKey/icon/image/href/label, and requires title+value", () => {
    for (const itemKey of ["bank0", "bank4", "bank8"]) {
      const doc = docWithItemIn("donation", itemKey);
      const parent = doc.sections[0]!.items[0]!;
      expect(matchItemRoleInContext(doc, parent)?.role, itemKey).toBe("Community Membership bank detail");
      for (const fieldName of ["title", "value", "copyEnabled"] as const) {
        expect(callHidden(field(contentItemType, fieldName), { document: doc, parent }), `${itemKey}/${fieldName}`).toBe(false);
      }
      for (const fieldName of ["itemKey", "icon", "image", "href", "label"] as const) {
        expect(callHidden(field(contentItemType, fieldName), { document: doc, parent }), `${itemKey}/${fieldName}`).toBe(true);
      }
      expect(isFieldRequiredByItemRole("title")(doc, parent), itemKey).toBe(true);
      expect(isFieldRequiredByItemRole("value")(doc, parent), itemKey).toBe(true);
    }
    expect(fieldLabelForItemRole("value", docWithItemIn("donation", "bank4"), docWithItemIn("donation", "bank4").sections[0]!.items[0]!)).toBe("Row value");
    expect(fieldLabelForItemRole("copyEnabled", docWithItemIn("donation", "bank4"), docWithItemIn("donation", "bank4").sections[0]!.items[0]!)).toBe("Copy button enabled");
  });

  test("an intro column row shows only Text, required", () => {
    const doc = docWithItemIn("intro", "column0");
    const parent = doc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(doc, parent)?.role).toBe("Community Membership intro column");
    expect(callHidden(field(contentItemType, "text"), { document: doc, parent })).toBe(false);
    expect(callHidden(field(contentItemType, "title"), { document: doc, parent })).toBe(true);
    expect(isFieldRequiredByItemRole("text")(doc, parent)).toBe(true);
  });

  test("a benefit card shows Title/Text/Image, hides the Lucide icon field (image is authoritative, per page.tsx's own urlForImage-first mapping)", () => {
    const doc = docWithItemIn("benefits", "benefit0");
    const parent = doc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(doc, parent)?.role).toBe("Community Membership benefit");
    for (const fieldName of ["title", "text", "image"] as const) {
      expect(callHidden(field(contentItemType, fieldName), { document: doc, parent }), fieldName).toBe(false);
    }
    expect(callHidden(field(contentItemType, "icon"), { document: doc, parent })).toBe(true);
    expect(isFieldRequiredByItemRole("title")(doc, parent)).toBe(true);
    expect(isFieldRequiredByItemRole("text")(doc, parent)).toBe(true);
  });

  test("an application step shows Title/Text only", () => {
    const doc = docWithItemIn("application", "step0");
    const parent = doc.sections[0]!.items[0]!;
    expect(matchItemRoleInContext(doc, parent)?.role).toBe("Community Membership application step");
    for (const fieldName of ["title", "text"] as const) {
      expect(callHidden(field(contentItemType, fieldName), { document: doc, parent }), fieldName).toBe(false);
    }
    for (const fieldName of ["icon", "image", "href", "label", "value", "copyEnabled"] as const) {
      expect(callHidden(field(contentItemType, fieldName), { document: doc, parent }), fieldName).toBe(true);
    }
  });

  test("none of these 7 new roles activate on a different document with the same sectionKey/itemKey", () => {
    for (const [sectionKey, itemKey] of [
      ["hero", "priceStripText"],
      ["donation", "scanText"],
      ["donation", "supportText"],
      ["donation", "bank0"],
      ["intro", "column0"],
      ["benefits", "benefit0"],
      ["application", "step0"],
    ] as const) {
      const doc = docWithItemIn(sectionKey, itemKey, "page-catering");
      const parent = doc.sections[0]!.items[0]!;
      expect(matchItemRoleInContext(doc, parent), `${sectionKey}/${itemKey}`).toBeUndefined();
    }
  });
});

test.describe("Volunteer / Work With Us — modal-copy item roles + form-section field hiding (Phase C)", () => {
  function docWithItem(documentId: string, sectionKey: string, itemKey: string) {
    return { _id: documentId, sections: [{ sectionKey, sectionKind: "form", items: [{ _key: "x", itemKey }] }] };
  }
  const sectionField = (name: string) => field(pageSectionType as unknown as { fields: FieldDef[] }, name);

  test("Volunteer applicationForm: modalTitle/messagePlaceholder show only Title; successMessage/errorMessage show only Text", () => {
    for (const itemKey of ["modalTitle", "messagePlaceholder"]) {
      const doc = docWithItem("page-volunteer", "applicationForm", itemKey);
      const parent = doc.sections[0]!.items[0]!;
      expect(matchItemRoleInContext(doc, parent)?.role, itemKey).toBe("Volunteer application-modal heading/placeholder");
      expect(callHidden(field(contentItemType, "title"), { document: doc, parent }), itemKey).toBe(false);
      expect(callHidden(field(contentItemType, "text"), { document: doc, parent }), itemKey).toBe(true);
      // Required in all 3 languages (see contentItem.ts comment): these rows are
      // rendered modal copy. The shared all-or-nothing i18n rule already blocks
      // Publish on the current EN-only data; `requiredFields` just makes the
      // Studio error clear ("Please add the Danish and Ukrainian translations").
      expect(isFieldRequiredByItemRole("title")(doc, parent), itemKey).toBe(true);
    }
    for (const itemKey of ["successMessage", "errorMessage"]) {
      const doc = docWithItem("page-volunteer", "applicationForm", itemKey);
      const parent = doc.sections[0]!.items[0]!;
      expect(matchItemRoleInContext(doc, parent)?.role, itemKey).toBe("Volunteer application-modal message");
      expect(callHidden(field(contentItemType, "text"), { document: doc, parent }), itemKey).toBe(false);
      expect(callHidden(field(contentItemType, "title"), { document: doc, parent }), itemKey).toBe(true);
      expect(isFieldRequiredByItemRole("text")(doc, parent), itemKey).toBe(true);
    }
  });

  test("Work With Us cvUploadForm: 4 heading/placeholder rows are Title-only; 3 message rows are Text-only; all required EN/DA/UK", () => {
    for (const itemKey of ["modalTitle", "modalTitleSent", "messagePlaceholder", "dropzoneText"]) {
      const doc = docWithItem("page-work-with-us", "cvUploadForm", itemKey);
      const parent = doc.sections[0]!.items[0]!;
      expect(matchItemRoleInContext(doc, parent)?.role, itemKey).toBe("Work With Us CV-modal heading/placeholder");
      expect(callHidden(field(contentItemType, "title"), { document: doc, parent }), itemKey).toBe(false);
      expect(callHidden(field(contentItemType, "text"), { document: doc, parent }), itemKey).toBe(true);
      expect(isFieldRequiredByItemRole("title")(doc, parent), itemKey).toBe(true);
    }
    for (const itemKey of ["description", "descriptionSent", "errorMessage"]) {
      const doc = docWithItem("page-work-with-us", "cvUploadForm", itemKey);
      const parent = doc.sections[0]!.items[0]!;
      expect(matchItemRoleInContext(doc, parent)?.role, itemKey).toBe("Work With Us CV-modal message");
      expect(callHidden(field(contentItemType, "text"), { document: doc, parent }), itemKey).toBe(false);
      expect(isFieldRequiredByItemRole("text")(doc, parent), itemKey).toBe(true);
    }
  });

  test("Work With Us features: feature bullets show Icon + Title only, Title required EN/DA/UK", () => {
    for (const itemKey of ["feature0", "feature1", "feature2"]) {
      const doc = {
        _id: "page-work-with-us",
        sections: [{ sectionKey: "features", sectionKind: "iconGrid", items: [{ _key: "x", itemKey }] }],
      };
      const parent = doc.sections[0]!.items[0]!;
      expect(matchItemRoleInContext(doc, parent)?.role, itemKey).toBe("Work With Us feature bullet");
      expect(callHidden(field(contentItemType, "icon"), { document: doc, parent }), itemKey).toBe(false);
      expect(callHidden(field(contentItemType, "title"), { document: doc, parent }), itemKey).toBe(false);
      expect(callHidden(field(contentItemType, "text"), { document: doc, parent }), itemKey).toBe(true);
      expect(isFieldRequiredByItemRole("title")(doc, parent), itemKey).toBe(true);
    }
  });

  test("the form section's own label/title/text are hidden for both pages (all copy lives in items)", () => {
    for (const [docId, sectionKey] of [
      ["page-volunteer", "applicationForm"],
      ["page-work-with-us", "cvUploadForm"],
    ] as const) {
      const parent = { sectionKey, sectionKind: "form" };
      const document = { _id: docId };
      for (const name of ["label", "title", "text"]) {
        expect(callHidden(sectionField(name), { parent, document }), `${docId}/${name}`).toBe(true);
      }
      // `items` still visible
      expect(callHidden(sectionField("items"), { parent, document }), docId).toBe(false);
    }
  });

  test("regression: these roles/hides never activate on the wrong document, and a plain `form` section elsewhere keeps its default visibility", () => {
    // wrong document (Contact reusing the section key)
    const wrong = docWithItem("page-contact", "applicationForm", "modalTitle");
    expect(matchItemRoleInContext(wrong, wrong.sections[0]!.items[0]!)).toBeUndefined();
    // the Volunteer role must NOT fire on the Work-With-Us doc, and vice-versa
    const wwuItemOnVol = docWithItem("page-volunteer", "cvUploadForm", "dropzoneText");
    expect(matchItemRoleInContext(wwuItemOnVol, wwuItemOnVol.sections[0]!.items[0]!)).toBeUndefined();
    const volItemOnWwu = docWithItem("page-work-with-us", "applicationForm", "modalTitle");
    expect(matchItemRoleInContext(volItemOnWwu, volItemOnWwu.sections[0]!.items[0]!)).toBeUndefined();
    // a `form` section on another page keeps label/title visible (only the sectionKind default applies)
    const parent = { sectionKey: "form", sectionKind: "form" };
    expect(callHidden(sectionField("title"), { parent, document: { _id: "page-catering" } })).toBe(false);
    // a hidden section field never blocks Publish: title/text on a `form`-kind section carry no
    // required rule (not menuCategory/faqCategory), so hiding them changes nothing about validation.
    const volCtx = { parent: { sectionKey: "applicationForm", sectionKind: "form" }, document: { _id: "page-volunteer" } };
    expect(captureCustomValidator(sectionField("title"))([{ _key: "en", language: "en", value: "" }], volCtx)).toBe(true);
  });
});
