import { expect, test } from "@playwright/test";
import pageSectionType from "@/sanity/schemaTypes/objects/pageSection";
import contentItemType, { ITEM_ROLE_RULES, matchItemRoleInContext } from "@/sanity/schemaTypes/objects/contentItem";
import mediaItemType from "@/sanity/schemaTypes/objects/mediaItem";
import ctaActionType from "@/sanity/schemaTypes/objects/ctaAction";

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
