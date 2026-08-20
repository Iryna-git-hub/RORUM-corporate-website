import { expect, test } from "@playwright/test";
import pageSectionType from "@/sanity/schemaTypes/objects/pageSection";
import contentItemType, { ITEM_ROLE_RULES, matchItemRoleInContext } from "@/sanity/schemaTypes/objects/contentItem";
import mediaItemType from "@/sanity/schemaTypes/objects/mediaItem";
import ctaActionType from "@/sanity/schemaTypes/objects/ctaAction";
import imageWithAltType from "@/sanity/schemaTypes/objects/imageWithAlt";
import seoType from "@/sanity/schemaTypes/objects/seo";
import eventType from "@/sanity/schemaTypes/documents/event";

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
// pageSection.ts — fieldHidden() per sectionKind, including the Approved
// Fix 1/2/10 narrow overrides (About text force-visible, eventsStrip's
// unused fields, About hero actions).
// ============================================================================
test.describe("pageSection.ts — section-level field visibility (mocked contexts, no Studio runtime)", () => {
  const aboutDoc = { _id: "page-about" };
  const aboutDraftDoc = { _id: "drafts.page-about" };
  const homeDoc = { _id: "page-home" };
  const cateringDoc = { _id: "page-catering" };

  const cases: { document: unknown; sectionKind: string; sectionKey: string; expectVisible: Record<string, boolean> }[] = [
    { document: homeDoc, sectionKind: "hero", sectionKey: "hero", expectVisible: { label: true, title: true, text: true, media: true, actions: true, items: true, settings: false } },
    { document: homeDoc, sectionKind: "quickPaths", sectionKey: "quickPaths", expectVisible: { label: true, title: true, text: false, media: false, actions: false, items: true, settings: false } },
    { document: homeDoc, sectionKind: "custom", sectionKey: "eventsStrip", expectVisible: { label: true, title: true, text: false, media: false, actions: true, items: false, settings: false } },
    { document: homeDoc, sectionKind: "custom", sectionKey: "someOtherCustomSection", expectVisible: { label: true, title: true, text: true, media: true, actions: true, items: true, settings: true } },
    { document: homeDoc, sectionKind: "editorial", sectionKey: "editorialAttendEvents", expectVisible: { label: true, title: true, text: true, media: true, actions: true, items: true, settings: false } },
    { document: homeDoc, sectionKind: "servicesTeaser", sectionKey: "servicesTeaser", expectVisible: { label: true, title: true, text: false, media: false, actions: false, items: true, settings: false } },
    { document: homeDoc, sectionKind: "communityTeaser", sectionKey: "communityTeaser", expectVisible: { label: true, title: true, text: true, media: true, actions: false, items: true, settings: false } },
    { document: homeDoc, sectionKind: "cta", sectionKey: "closingCta", expectVisible: { label: true, title: true, text: true, media: false, actions: true, items: true, settings: false } },
    { document: aboutDoc, sectionKind: "hero", sectionKey: "hero", expectVisible: { label: true, title: true, text: true, media: true, actions: false, items: true, settings: false } },
    { document: aboutDoc, sectionKind: "iconGrid", sectionKey: "statement", expectVisible: { label: true, title: true, text: true, media: false, actions: false, items: true, settings: false } },
    { document: aboutDraftDoc, sectionKind: "iconGrid", sectionKey: "statement", expectVisible: { label: true, title: true, text: true, media: false, actions: false, items: true, settings: false } },
    { document: aboutDoc, sectionKind: "iconGrid", sectionKey: "community", expectVisible: { label: true, title: true, text: true, media: false, actions: false, items: true, settings: false } },
    { document: aboutDoc, sectionKind: "steps", sectionKey: "pillars", expectVisible: { label: true, title: true, text: true, media: false, actions: false, items: true, settings: false } },
    { document: aboutDoc, sectionKind: "cta", sectionKey: "closingCta", expectVisible: { label: true, title: true, text: true, media: false, actions: true, items: true, settings: false } },
    // Unrelated iconGrid/steps sections on OTHER pages must be unaffected — text stays hidden there.
    { document: cateringDoc, sectionKind: "iconGrid", sectionKey: "menuFormats", expectVisible: { label: true, title: true, text: false, media: false, actions: false, items: true, settings: false } },
    { document: cateringDoc, sectionKind: "steps", sectionKey: "steps", expectVisible: { label: true, title: true, text: false, media: false, actions: false, items: true, settings: false } },
    // Home's hero, despite sharing sectionKey "hero" with About, must keep its actions field.
  ];

  for (const c of cases) {
    const docId = (c.document as { _id: string })._id;
    test(`document="${docId}" sectionKind="${c.sectionKind}" sectionKey="${c.sectionKey}"`, () => {
      const parent = { sectionKind: c.sectionKind, sectionKey: c.sectionKey };
      for (const [fieldName, expected] of Object.entries(c.expectVisible)) {
        const actualVisible = !callHidden(field(pageSectionType, fieldName), { parent, document: c.document });
        expect(actualVisible, `${fieldName} visibility for ${docId}/${c.sectionKind}/${c.sectionKey}`).toBe(expected);
      }
    });
  }

  test("settings is hidden for eventsStrip specifically, regardless of a future kind change", () => {
    const hidden = callHidden(field(pageSectionType, "settings"), { parent: { sectionKind: "custom", sectionKey: "eventsStrip" }, document: homeDoc });
    expect(hidden).toBe(true);
  });

  test("About text force-visible does NOT leak to a different sectionKey on the same document", () => {
    // statement/community/pillars are force-visible; a hypothetical 4th
    // iconGrid section on page-about itself should NOT be force-visible.
    const hidden = callHidden(field(pageSectionType, "text"), {
      parent: { sectionKind: "iconGrid", sectionKey: "someOtherAboutSection" },
      document: aboutDoc,
    });
    expect(hidden).toBe(true);
  });

  test("Approved Fix 1 — About statement/community/pillars text visible, unrelated iconGrid/steps text stays hidden, draft/published identical", () => {
    for (const document of [aboutDoc, aboutDraftDoc]) {
      for (const sectionKey of ["statement", "community"]) {
        expect(callHidden(field(pageSectionType, "text"), { parent: { sectionKind: "iconGrid", sectionKey }, document })).toBe(false);
      }
      expect(callHidden(field(pageSectionType, "text"), { parent: { sectionKind: "steps", sectionKey: "pillars" }, document })).toBe(false);
    }
    // Other iconGrid/steps sections, any other page, remain hidden.
    for (const [sectionKind, sectionKey] of [["iconGrid", "menuFormats"], ["iconGrid", "features"], ["steps", "steps"]] as const) {
      expect(callHidden(field(pageSectionType, "text"), { parent: { sectionKind, sectionKey }, document: cateringDoc })).toBe(true);
    }
  });

  test("Approved Fix 10 — About hero actions hidden (page-about + drafts.page-about only), Home hero actions unaffected", () => {
    expect(callHidden(field(pageSectionType, "actions"), { parent: { sectionKind: "hero", sectionKey: "hero" }, document: aboutDoc })).toBe(true);
    expect(callHidden(field(pageSectionType, "actions"), { parent: { sectionKind: "hero", sectionKey: "hero" }, document: aboutDraftDoc })).toBe(true);
    expect(callHidden(field(pageSectionType, "actions"), { parent: { sectionKind: "hero", sectionKey: "hero" }, document: homeDoc })).toBe(false);
  });

  test("Approved Fix 2 — eventsStrip text/media/items hidden, label/title/actions still visible, published and draft identical", () => {
    for (const document of [homeDoc, { _id: "drafts.page-home" }]) {
      const parent = { sectionKind: "custom", sectionKey: "eventsStrip" };
      expect(callHidden(field(pageSectionType, "text"), { parent, document })).toBe(true);
      expect(callHidden(field(pageSectionType, "media"), { parent, document })).toBe(true);
      expect(callHidden(field(pageSectionType, "items"), { parent, document })).toBe(true);
      expect(callHidden(field(pageSectionType, "settings"), { parent, document })).toBe(true);
      expect(callHidden(field(pageSectionType, "label"), { parent, document })).toBe(false);
      expect(callHidden(field(pageSectionType, "title"), { parent, document })).toBe(false);
      expect(callHidden(field(pageSectionType, "actions"), { parent, document })).toBe(false);
    }
  });
});

// ============================================================================
// contentItem.ts — the full Approved Fix 4 item-role visibility matrix,
// driven directly by the schema's own exported ITEM_ROLE_RULES (the
// "machine-readable matrix" itself) so this can never silently drift from
// the rules the schema actually applies.
// ============================================================================
test.describe("contentItem.ts — ITEM_ROLE_RULES matrix (mocked document+parent contexts)", () => {
  function docWithItem(sectionKey: string, itemKey: string, itemObjectKey = "the-item") {
    return { sections: [{ sectionKey, items: [{ _key: itemObjectKey, itemKey }] }] };
  }

  for (const rule of ITEM_ROLE_RULES) {
    // Patterns here are all literal-alternation or prefix+digit shaped; probe a few plausible candidates instead of guessing blindly.
    const candidates = [
      ...rule.sectionKeys.flatMap((k) => [k, `${k}0`, `${k}1`]),
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
    ];
    const itemKey = candidates.find((c) => rule.itemKeyPattern.test(c));
    if (!itemKey) throw new Error(`no test candidate matches rule "${rule.role}"'s pattern — fix the test fixture list`);

    test(`role="${rule.role}" (sectionKey in [${rule.sectionKeys.join(",")}], itemKey="${itemKey}")`, () => {
      const sectionKey = rule.sectionKeys[0]!;
      const document = docWithItem(sectionKey, itemKey);
      const parent = document.sections[0]!.items[0]!;

      const matched = matchItemRoleInContext(document, parent);
      expect(matched?.role, `expected itemKey "${itemKey}" in sectionKey "${sectionKey}" to match role "${rule.role}"`).toBe(rule.role);

      for (const fieldName of ["itemKey", "icon", "title", "text", "image", "href", "label", "value"] as const) {
        const expectedVisible = rule.visible.includes(fieldName);
        const actualVisible = !callHidden(field(contentItemType, fieldName), { document, parent });
        expect(actualVisible, `${fieldName} visibility for role "${rule.role}"`).toBe(expectedVisible);
      }
    });
  }

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

/** Captures the function passed to `rule.custom(...)` so it can be invoked directly with a mocked (value, context) pair. */
function captureCustomValidator(f: FieldDef): (value: unknown, context: unknown) => unknown {
  const withValidation = f as unknown as { validation?: (rule: unknown) => unknown };
  let captured: ((value: unknown, context: unknown) => unknown) | undefined;
  const mockRule = {
    custom(fn: (value: unknown, context: unknown) => unknown) {
      captured = fn;
      return mockRule;
    },
  };
  withValidation.validation?.(mockRule);
  if (!captured) throw new Error(`expected field "${f.name}" to call rule.custom(...)`);
  return captured;
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

  test("closingCta link item's label and About hero intro-link's label are genuinely VISIBLE (both roles use it) and still enforce allOrNothingLanguages normally", () => {
    for (const [sectionKey, itemKey] of [["closingCta", "link0"], ["hero", "intro0"]] as const) {
      const document = docWithItem(sectionKey, itemKey);
      const parent = document.sections[0]!.items[0]!;
      const context = { document, parent };
      expect(callHidden(field(contentItemType, "label"), context)).toBe(false);
      expect(captureCustomValidator(field(contentItemType, "label"))(strayPartial, context)).not.toBe(true);
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
      expect(captureCustomValidator(field(contentItemType, fieldName))(strayPartial, context)).not.toBe(true);
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
    expect(captureCustomValidator(field(pageSectionType, "text"))(strayPartial, context)).not.toBe(true);
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

  test("the SEO block's own title is unchanged", () => {
    expect((seoType as unknown as { title?: string }).title).toBe("SEO");
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
    expect(captureCustomValidator(field(contentItemType, "title"))(strayPartial, context)).not.toBe(true);
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
