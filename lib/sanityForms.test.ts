import { describe, expect, it } from "vitest";
import { defaultFormMessages, resolveFormMessages } from "./sanityForms";
import type { FormMessages } from "@/sanity.types";

// Proves the localization MECHANISM for the shared success-modal chrome
// fields (successTitle, doneLabel) and closeLabel — these are all
// first-class `internationalizedArrayString` fields on `formMessages`
// (sanity/schemaTypes/singletons/formMessages.ts), resolved the exact same
// way (`pickLocalizedOr`), NOT through the `extraLabels` keyed-string bag.
// `extraLabels`' `key` field is intentionally `readOnly` in Studio — a
// manager could never have created a `successTitle`/`doneLabel` row there
// herself, which is exactly why these two were promoted to explicit named
// fields instead of staying in that bag.

function i18n(field: "closeLabel" | "successTitle" | "doneLabel", values: { en?: string; da?: string; uk?: string }) {
  const entries = [
    ...(values.en !== undefined ? [{ _key: "en", _type: "internationalizedArrayStringValue" as const, language: "en" as const, value: values.en }] : []),
    ...(values.da !== undefined ? [{ _key: "da", _type: "internationalizedArrayStringValue" as const, language: "da" as const, value: values.da }] : []),
    ...(values.uk !== undefined ? [{ _key: "uk", _type: "internationalizedArrayStringValue" as const, language: "uk" as const, value: values.uk }] : []),
  ];
  return { [field]: entries };
}

function docWith(fields: Partial<Record<"closeLabel" | "successTitle" | "doneLabel", { en?: string; da?: string; uk?: string }>>): FormMessages {
  return Object.assign(
    {},
    ...Object.entries(fields).map(([field, values]) => i18n(field as "closeLabel" | "successTitle" | "doneLabel", values ?? {})),
  ) as unknown as FormMessages;
}

describe("resolveFormMessages — successTitle/doneLabel are first-class Sanity fields", () => {
  it("hardcoded code fallback exists for resilience only (Sanity unavailable / old content)", () => {
    expect(defaultFormMessages.successTitle).toBe("Thank you!");
    expect(defaultFormMessages.doneLabel).toBe("Done");
    expect(resolveFormMessages(null, "en").successTitle).toBe("Thank you!");
    expect(resolveFormMessages(undefined, "en").doneLabel).toBe("Done");
  });

  it("EN resolves from the doc's first-class successTitle/doneLabel fields", () => {
    const doc = docWith({
      successTitle: { en: "Thank you very much!" },
      doneLabel: { en: "Got it" },
    });
    const messages = resolveFormMessages(doc, "en");
    expect(messages.successTitle).toBe("Thank you very much!");
    expect(messages.doneLabel).toBe("Got it");
  });

  it("DA resolves the Danish translation, independent of the English value", () => {
    const doc = docWith({
      successTitle: { en: "Thank you!", da: "Tak!" },
      doneLabel: { en: "Done", da: "Færdig" },
    });
    const messages = resolveFormMessages(doc, "da");
    expect(messages.successTitle).toBe("Tak!");
    expect(messages.doneLabel).toBe("Færdig");
  });

  it("UK resolves the Ukrainian translation, independent of the English value", () => {
    const doc = docWith({
      successTitle: { en: "Thank you!", uk: "Дякуємо!" },
      doneLabel: { en: "Done", uk: "Готово" },
    });
    const messages = resolveFormMessages(doc, "uk");
    expect(messages.successTitle).toBe("Дякуємо!");
    expect(messages.doneLabel).toBe("Готово");
  });

  it("EN/DA/UK are fully independent — setting one locale never leaks into another", () => {
    const doc = docWith({
      successTitle: { en: "EN title", da: "DA title", uk: "UK title" },
      doneLabel: { en: "EN done", da: "DA done", uk: "UK done" },
    });
    expect(resolveFormMessages(doc, "en").successTitle).toBe("EN title");
    expect(resolveFormMessages(doc, "da").successTitle).toBe("DA title");
    expect(resolveFormMessages(doc, "uk").successTitle).toBe("UK title");
    expect(resolveFormMessages(doc, "en").doneLabel).toBe("EN done");
    expect(resolveFormMessages(doc, "da").doneLabel).toBe("DA done");
    expect(resolveFormMessages(doc, "uk").doneLabel).toBe("UK done");
  });

  it("DA/UK fall back to the English Sanity value only when that locale's own translation is genuinely missing from the doc", () => {
    const doc = docWith({
      successTitle: { en: "Thank you!" },
      doneLabel: { en: "Done" },
    });
    expect(resolveFormMessages(doc, "da").successTitle).toBe("Thank you!");
    expect(resolveFormMessages(doc, "uk").doneLabel).toBe("Done");
  });

  it("falls back to the hardcoded default only when the doc has no successTitle/doneLabel field content at all", () => {
    const doc = {} as unknown as FormMessages;
    const messages = resolveFormMessages(doc, "da");
    expect(messages.successTitle).toBe(defaultFormMessages.successTitle);
    expect(messages.doneLabel).toBe(defaultFormMessages.doneLabel);
  });

  it("does NOT read successTitle/doneLabel from extraLabels — a stray legacy row there is ignored", () => {
    const doc = {
      // No first-class successTitle/doneLabel content...
      extraLabels: [
        {
          _key: "successTitle",
          _type: "keyedString",
          key: "successTitle",
          value: [{ _key: "en", _type: "internationalizedArrayStringValue", language: "en", value: "STALE — should never appear" }],
        },
        {
          _key: "doneLabel",
          _type: "keyedString",
          key: "doneLabel",
          value: [{ _key: "en", _type: "internationalizedArrayStringValue", language: "en", value: "STALE — should never appear" }],
        },
      ],
    } as unknown as FormMessages;

    const messages = resolveFormMessages(doc, "en");
    // ...so resolution falls through to the hardcoded default, proving the
    // extraLabels row is never consulted for these two fields anymore.
    expect(messages.successTitle).toBe(defaultFormMessages.successTitle);
    expect(messages.doneLabel).toBe(defaultFormMessages.doneLabel);
    expect(messages.successTitle).not.toBe("STALE — should never appear");
    expect(messages.doneLabel).not.toBe("STALE — should never appear");
  });

  it("closeLabel behavior is unchanged: still a first-class field, still independent of successTitle/doneLabel", () => {
    const doc = docWith({
      closeLabel: { en: "Close", da: "Luk", uk: "Закрити" },
      successTitle: { en: "Thank you!" },
      doneLabel: { en: "Done" },
    });
    expect(resolveFormMessages(doc, "en").closeLabel).toBe("Close");
    expect(resolveFormMessages(doc, "da").closeLabel).toBe("Luk");
    expect(resolveFormMessages(doc, "uk").closeLabel).toBe("Закрити");
  });

  it("doneLabel is resolved independently from closeLabel — never the same field, never the same value by construction", () => {
    const doc = docWith({ doneLabel: { en: "Done" } });
    const messages = resolveFormMessages(doc, "en");
    expect(messages.doneLabel).toBe("Done");
    expect(messages.closeLabel).toBe(defaultFormMessages.closeLabel);
    expect(messages.doneLabel).not.toBe(messages.closeLabel);
  });
});
