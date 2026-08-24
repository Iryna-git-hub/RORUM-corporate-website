// Deep validation-integration proof for the Catering Menu Examples
// category/dish workflow — not a shallow patch-shape assertion. Builds a
// representative page-catering-menu-examples document, applies the exact
// insert patches CateringMenuSectionsInput/CateringMenuDishItemsInput emit,
// then runs the REAL exported pageSection/contentItem validators (not
// reimplementations) plus a faithful replica of
// sanity-plugin-internationalized-array's own array-level validator (the
// same one node_modules/sanity-plugin-internationalized-array ships, and
// the same one the prior Publish-blocker diagnosis this session used to get
// definitive, non-guessed evidence) against the result.
import { describe, expect, it } from "vitest";
import pageSectionType from "./pageSection";
import contentItemType, { matchItemRoleInContext } from "./contentItem";
import imageWithAltType from "./imageWithAlt";

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

// Faithful replica of sanity-plugin-internationalized-array's own
// array-level validator (node_modules/sanity-plugin-internationalized-array/
// dist/index.js), run against this project's real static language registry
// (sanity.config.ts: en/da/uk) — a validation source independent of this
// project's own field-level rules.
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

function i18n(entries: Record<string, string>) {
  return Object.entries(entries).map(([language, value]) => ({ _key: language, _type: "internationalizedArrayStringValue", language, value }));
}

/** Runs this project's own field validator AND the plugin's own array validator for one field; returns all non-true results. */
function validateField(type: { fields: FieldDef[] }, fieldName: string, value: unknown, context: unknown): string[] {
  const errors: string[] = [];
  for (const validate of captureCustomValidators(field(type, fieldName))) {
    const result = validate(value, context);
    if (result !== true && result !== undefined) errors.push(String(result));
  }
  const pluginResult = pluginI18nValidate(value as I18nEntry[] | undefined);
  if (pluginResult !== true) errors.push(pluginResult);
  return errors;
}

describe("Catering Menu Examples — new category via CateringMenuSectionsInput's insert patch", () => {
  const newCategorySectionKey = "menuCategory-abc1234567";
  const blankCategory = {
    _key: newCategorySectionKey,
    _type: "pageSection",
    sectionKey: newCategorySectionKey,
    sectionKind: "menuCategory",
    items: [{ _key: "categoryIcon", _type: "contentItem", itemKey: "categoryIcon", icon: "UtensilsCrossed" }],
  };
  const document = { _id: "drafts.page-catering-menu-examples", sections: [blankCategory] };

  it("a brand-new, untouched category (label/title/text all unset) is INVALID — clearly required, not silently optional", () => {
    const parent = blankCategory;
    const labelErrors = validateField(pageSectionType, "label", undefined, { document, parent });
    const titleErrors = validateField(pageSectionType, "title", undefined, { document, parent });
    const textErrors = validateField(pageSectionType, "text", undefined, { document, parent });
    expect(labelErrors.length).toBeGreaterThan(0);
    expect(titleErrors.length).toBeGreaterThan(0);
    expect(textErrors.length).toBeGreaterThan(0);
    expect(labelErrors[0]).toMatch(/please add/i);
    expect(labelErrors[0]).toMatch(/English, Danish and Ukrainian/);
  });

  it("a category with the exact stray-residue shape found live (one EN entry, no value) is STILL invalid — required fields don't get the optional-field 'effectively empty' pass", () => {
    const strayTitle = [{ _key: "en", _type: "internationalizedArrayStringValue", language: "en" }];
    const errors = validateField(pageSectionType, "title", strayTitle, { document, parent: blankCategory });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("a category with partial real translations (EN only) blocks with a message naming the missing languages", () => {
    const partialTitle = i18n({ en: "New category" });
    const errors = validateField(pageSectionType, "title", partialTitle, { document, parent: blankCategory });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/Danish and Ukrainian/);
  });

  it("a fully completed category (label/title/text all EN/DA/UK) produces ZERO errors from either this project's validators or the plugin's own", () => {
    const completedCategory = {
      ...blankCategory,
      label: i18n({ en: "New category", da: "Ny kategori", uk: "Нова категорія" }),
      title: i18n({ en: "New category", da: "Ny kategori", uk: "Нова категорія" }),
      text: i18n({ en: "A description.", da: "En beskrivelse.", uk: "Опис." }),
    };
    const completedDocument = { _id: "drafts.page-catering-menu-examples", sections: [completedCategory] };

    const labelErrors = validateField(pageSectionType, "label", completedCategory.label, { document: completedDocument, parent: completedCategory });
    const titleErrors = validateField(pageSectionType, "title", completedCategory.title, { document: completedDocument, parent: completedCategory });
    const textErrors = validateField(pageSectionType, "text", completedCategory.text, { document: completedDocument, parent: completedCategory });
    expect(labelErrors).toEqual([]);
    expect(titleErrors).toEqual([]);
    expect(textErrors).toEqual([]);
  });

  it("clearing a field completely (back to a stray, valueless entry) removes its error — matches the site-wide 'effectively empty' fix, but the field is STILL required so the underlying requirement re-blocks with the plain 'missing' message, not a stuck 'partial' message", () => {
    // "Cleared" for a REQUIRED field can never mean "now valid" (unlike an
    // optional field) — it correctly re-surfaces as "please add", not as an
    // unfixable "some languages but not all" message. This proves clearing
    // never gets STUCK the way the original allOrNothingLanguages bug did.
    const clearedTitle = [
      { _key: "en", _type: "internationalizedArrayStringValue", language: "en", value: "" },
      { _key: "da", _type: "internationalizedArrayStringValue", language: "da", value: "" },
      { _key: "uk", _type: "internationalizedArrayStringValue", language: "uk", value: "" },
    ];
    const errors = validateField(pageSectionType, "title", clearedTitle, { document, parent: blankCategory });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/please add|please fill/i);
    expect(errors[0]).not.toMatch(/some languages but not all/);
  });
});

describe("Catering Menu Examples — other section kinds keep label/title/text genuinely OPTIONAL (not weakened into required)", () => {
  it("a Home hero section's label is still valid when completely unset", () => {
    const heroSection = { _key: "hero", sectionKey: "hero", sectionKind: "hero" };
    const document = { _id: "page-home", sections: [heroSection] };
    const errors = validateField(pageSectionType, "label", undefined, { document, parent: heroSection });
    expect(errors).toEqual([]);
  });

  it("a Catering Menu Examples banner section (not menuCategory) keeps label/title/text optional", () => {
    const bannerSection = { _key: "banner", sectionKey: "banner", sectionKind: "hero" };
    const document = { _id: "page-catering-menu-examples", sections: [bannerSection] };
    const errors = validateField(pageSectionType, "title", undefined, { document, parent: bannerSection });
    expect(errors).toEqual([]);
  });
});

describe("Catering Menu Examples — new dish via CateringMenuDishItemsInput's insert patch", () => {
  const category = {
    _key: "category-a",
    sectionKey: "category-a",
    sectionKind: "menuCategory",
    items: [
      { _key: "categoryIcon", _type: "contentItem", itemKey: "categoryIcon", icon: "Sandwich" },
      { _key: "dish4200000001", _type: "contentItem", itemKey: "dish4200000001" },
    ],
  };
  const document = { _id: "drafts.page-catering-menu-examples", sections: [category] };
  const dish = category.items[1]!;

  it("role-matches as 'Catering menu dish' — only title/text/image are visible, icon/link/value/itemKey stay hidden", () => {
    const matched = matchItemRoleInContext(document, dish);
    expect(matched?.role).toBe("Catering menu dish");
  });

  it("a brand-new, untouched dish (title/text unset) is VALID — dish title/text stay optional-but-complete-if-started, unchanged from before this pass", () => {
    const errors = validateField(contentItemType, "title", undefined, { document, parent: dish });
    expect(errors).toEqual([]);
  });

  it("a dish with a partial real title (EN only) blocks with a clear message", () => {
    const partial = i18n({ en: "New dish" });
    const errors = validateField(contentItemType, "title", partial, { document, parent: dish });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/Danish and Ukrainian/);
  });

  it("a fully completed dish (title/text EN/DA/UK + image alt EN/DA/UK) produces zero errors across contentItem AND imageWithAlt validators", () => {
    const completedDish = {
      ...dish,
      title: i18n({ en: "Bruschetta", da: "Bruschetta", uk: "Брускета" }),
      text: i18n({ en: "Toasted bread with fresh toppings.", da: "Ristet brød med friske toppings.", uk: "Тости зі свіжими начинками." }),
      image: {
        _type: "imageWithAlt",
        asset: { _type: "reference", _ref: "image-abc-800x600-jpg" },
        alt: i18n({ en: "Bruschetta", da: "Bruschetta", uk: "Брускета" }),
      },
    };
    const completedCategory = { ...category, items: [category.items[0]!, completedDish] };
    const completedDocument = { _id: "drafts.page-catering-menu-examples", sections: [completedCategory] };

    const titleErrors = validateField(contentItemType, "title", completedDish.title, { document: completedDocument, parent: completedDish });
    const textErrors = validateField(contentItemType, "text", completedDish.text, { document: completedDocument, parent: completedDish });
    expect(titleErrors).toEqual([]);
    expect(textErrors).toEqual([]);

    // imageWithAlt.alt for a Catering informative image requires en/da/uk
    // (isCateringInformativeImage) — proven complete here, not weakened.
    const altErrors: string[] = [];
    for (const validate of captureCustomValidators(field(imageWithAltType, "alt"))) {
      const result = validate(completedDish.image.alt, { document: completedDocument, path: ["sections", { _key: "category-a" }, "items", { _key: dish._key }, "image", "alt"] });
      if (result !== true) altErrors.push(String(result));
    }
    expect(altErrors).toEqual([]);
  });
});

describe("Catering Menu Examples — existing categories/dishes remain unaffected by the new required-label/title/text rule", () => {
  // Representative sample of REAL live data (category-vegetarian + one real
  // dish), captured during this task's own read-only audit — proves the
  // new requiredWhen() rule doesn't retroactively break already-complete
  // production content.
  const realCategory = {
    _key: "category-vegetarian",
    sectionKey: "category-vegetarian",
    sectionKind: "menuCategory",
    label: i18n({ en: "Vegetarian menu", da: "Vegetarmenu", uk: "Вегетаріанське меню" }),
    title: i18n({ en: "Vegetarian menu", da: "Vegetarmenu", uk: "Вегетаріанське меню" }),
    text: i18n({
      en: "Seasonal vegetarian dishes with warm flavors, fresh ingredients, and thoughtful presentation.",
      da: "Sæsonbaserede vegetarretter med varme smage, friske råvarer og gennemtænkt anretning.",
      uk: "Сезонні вегетаріанські страви з теплими смаками, свіжими інгредієнтами та продуманою подачею.",
    }),
    items: [{ _key: "categoryIcon", _type: "contentItem", itemKey: "categoryIcon", icon: "Leaf" }],
  };
  const document = { _id: "page-catering-menu-examples", sections: [realCategory] };

  it("label/title/text all pass with zero errors", () => {
    expect(validateField(pageSectionType, "label", realCategory.label, { document, parent: realCategory })).toEqual([]);
    expect(validateField(pageSectionType, "title", realCategory.title, { document, parent: realCategory })).toEqual([]);
    expect(validateField(pageSectionType, "text", realCategory.text, { document, parent: realCategory })).toEqual([]);
  });
});
