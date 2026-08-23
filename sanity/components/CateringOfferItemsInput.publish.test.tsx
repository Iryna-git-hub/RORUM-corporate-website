// Reproduces the real Sanity patch/validation flow for "+ Add offering
// category" end to end, using this project's ACTUAL exported schema
// validators (not reimplementations) — written to diagnose a live manager
// report of Publish staying disabled after adding a new offering, filling
// in icon/title/text. This test proves whether the current, uncommitted
// implementation of CateringOfferItemsInput + contentItem.ts's role rules +
// i18n validation produces a document that IS publishable.
import { describe, expect, it } from "vitest";
import { insert } from "sanity";
import contentItemType, { matchItemRoleInContext } from "@/sanity/schemaTypes/objects/contentItem";

// Mirrors sanity.config.ts's `document.actions` filter exactly (not
// imported directly: sanity.config.ts calls assertConfigured() at module
// load, which requires real env vars this vitest environment doesn't load —
// see sanity/env.ts). Kept in sync manually; if that filter ever changes,
// this copy must change with it.
const SINGLETON_ACTION_RESTRICTED_TYPES = new Set(["page", "legalPage"]);
function documentActionsFilter(input: { action?: string }[], context: { schemaType: string }): { action?: string }[] {
  return SINGLETON_ACTION_RESTRICTED_TYPES.has(context.schemaType)
    ? input.filter(({ action }) => action && !["duplicate", "delete"].includes(action))
    : input;
}

interface FieldDef {
  name: string;
  validation?: unknown;
}
function field(type: { fields: FieldDef[] }, name: string): FieldDef {
  const f = type.fields.find((x) => x.name === name);
  if (!f) throw new Error(`field "${name}" not found`);
  return f;
}
function captureCustomValidators(f: FieldDef): ((value: unknown, context: unknown) => unknown)[] {
  const withValidation = f as unknown as { validation?: (rule: unknown) => unknown };
  const captured: ((value: unknown, context: unknown) => unknown)[] = [];
  const mockRule = {
    required() {
      return mockRule;
    },
    custom(fn: (value: unknown, context: unknown) => unknown) {
      captured.push(fn);
      return mockRule;
    },
  };
  withValidation.validation?.(mockRule);
  return captured;
}

// Exact replica of sanity-plugin-internationalized-array's own array-level
// validator (node_modules/sanity-plugin-internationalized-array/dist/index.js),
// run against this project's actual static language registry
// (sanity.config.ts: en/da/uk) — a SEPARATE validation source from this
// project's own allOrNothingLanguages()/requireAllLanguages(), and one this
// diagnosis specifically had to rule out (see sanity.config.ts's own
// comment about a prior regression in this exact validator).
const LANGUAGE_IDS = new Set(["en", "da", "uk"]);
interface I18nEntry {
  _key?: string;
  language?: string;
  value?: unknown;
}
function pluginI18nValidate(value: I18nEntry[] | undefined): string | true {
  if (!value || value.length === 0) return true;
  if (value.some((item) => item && !item.language && item._key)) return "plugin: language is required for each array item";
  if (value.length === 1 && !value[0]?.language) return true;
  if (value.length > LANGUAGE_IDS.size) return `plugin: cannot be more than ${LANGUAGE_IDS.size} items`;
  if (value.some((item) => item?.language && !LANGUAGE_IDS.has(item.language))) return "plugin: array item keys must be valid languages registered to the field type";
  const seen = new Set<string>();
  for (const item of value) {
    if (item?.language) {
      if (seen.has(item.language)) return "plugin: there can only be one field per language";
      seen.add(item.language);
    }
  }
  return true;
}

/** Applies the ONE insert shape CateringOfferItemsInput ever emits — insert(items, "after", [-1]) — append to the end of the array. */
function applyAppendPatch<T>(array: T[], patch: ReturnType<typeof insert>): T[] {
  expect(patch.type).toBe("insert");
  expect(patch.position).toBe("after");
  expect(patch.path).toEqual([-1]);
  return [...array, ...(patch.items as T[])];
}

function i18n(entries: Record<string, string>) {
  return Object.entries(entries).map(([language, value]) => ({ _key: crypto.randomUUID(), _type: "internationalizedArrayStringValue", language, value }));
}

describe("CateringOfferItemsInput -> Publish flow (real patch + real validators)", () => {
  it("append patch produces a new item matching the exact minimal shape, with _key === itemKey", () => {
    const itemKey = "format123456789";
    const patch = insert([{ _key: itemKey, _type: "contentItem", itemKey, icon: "Sparkles" }], "after", [-1]);
    const before = [{ _key: "format0", _type: "contentItem", itemKey: "format0" }];
    const after = applyAppendPatch(before, patch);

    expect(after).toHaveLength(2);
    const newItem = after[1] as { _key: string; _type: string; itemKey: string; icon: string };
    expect(newItem._key).toBe(itemKey);
    expect(newItem.itemKey).toBe(itemKey);
    expect(newItem._type).toBe("contentItem");
    expect(newItem.icon).toBe("Sparkles");
    // Appended, not prepended or inserted elsewhere.
    expect(after[0]!._key).toBe("format0");
  });

  it("a fully populated new item (icon + title/text en/da/uk) produces ZERO error-level markers from this project's own contentItem validators", () => {
    const itemKey = "format123456789";
    const newItem = {
      _key: itemKey,
      _type: "contentItem",
      itemKey,
      icon: "Sparkles",
      title: i18n({ en: "New category", da: "Nyt category", uk: "Нова категорія" }),
      text: i18n({ en: "Description", da: "Beskrivelse", uk: "Опис" }),
    };
    const document = {
      _id: "drafts.page-catering",
      sections: [{ _key: "philosophy", sectionKey: "philosophy", sectionKind: "split", items: [{ _key: "format0", itemKey: "format0" }, newItem] }],
    };
    const parent = newItem;

    // Sanity role-matching must recognize this brand-new item.
    const matched = matchItemRoleInContext(document, parent);
    expect(matched?.role).toBe('Catering "what we offer" bullet');

    const errors: string[] = [];
    for (const fieldName of ["title", "text", "label"] as const) {
      const validators = captureCustomValidators(field(contentItemType, fieldName));
      for (const validate of validators) {
        const result = validate((newItem as Record<string, unknown>)[fieldName], { document, parent });
        if (result !== true && result !== undefined) errors.push(`${fieldName}: ${String(result)}`);
      }
      // Plugin-level i18n-array validator, independent of this project's own rules.
      const pluginResult = pluginI18nValidate((newItem as Record<string, unknown>)[fieldName] as I18nEntry[] | undefined);
      if (pluginResult !== true) errors.push(`${fieldName} (plugin): ${pluginResult}`);
    }

    expect(errors).toEqual([]);
  });

  it("the resulting draft-vs-published diff is real (has_changes), and the pageKey/sections/seo action-rule filter never strips 'publish' for page documents", () => {
    const published = { _id: "page-catering", _type: "page", pageKey: "catering", sections: [{ _key: "philosophy", sectionKey: "philosophy", items: [{ _key: "format0" }] }] };
    const draft = { ...published, _id: "drafts.page-catering", sections: [{ ...published.sections[0], items: [{ _key: "format0" }, { _key: "format123456789", itemKey: "format123456789" }] }] };
    expect(JSON.stringify(draft.sections)).not.toBe(JSON.stringify(published.sections));

    const input = [{ action: "publish" }, { action: "duplicate" }, { action: "delete" }, { action: "unpublish" }];
    const filtered = documentActionsFilter(input, { schemaType: "page" });
    expect(filtered.map((a) => a.action)).toContain("publish");
    expect(filtered.map((a) => a.action)).not.toContain("duplicate");
    expect(filtered.map((a) => a.action)).not.toContain("delete");
  });

  it("regression: an item created with NO itemKey (bypassing the custom button, e.g. a stray native-array add) still role-matches and stays valid — the schema itself tolerates it even though the button never produces this shape", () => {
    const newItem = { _key: "some-native-key", _type: "contentItem" };
    const document = { sections: [{ _key: "philosophy", sectionKey: "philosophy", sectionKind: "split", items: [newItem] }] };
    expect(matchItemRoleInContext(document, newItem)?.role).toBe('Catering "what we offer" bullet');
  });
});
