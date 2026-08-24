import { describe, expect, it } from "vitest";
import {
  resolveContactDetailOrder,
  resolveContactFormFields,
  resolveFaqPrompt,
  resolvePrivacyConsentSettings,
  resolveSocialLinks,
} from "./sanityContact";
import { defaultFormMessages } from "./sanityForms";
import type { RawPageSection } from "./sanity-sections";

function i18n(en: string, da?: string, uk?: string) {
  const entries = [{ _key: "en", language: "en", value: en }];
  if (da !== undefined) entries.push({ _key: "da", language: "da", value: da });
  if (uk !== undefined) entries.push({ _key: "uk", language: "uk", value: uk });
  return entries;
}

describe("resolveContactDetailOrder — missing page vs. configured order (Task 4)", () => {
  it("heroSection undefined (page-contact missing): falls back to Address -> Phone -> Email", () => {
    expect(resolveContactDetailOrder(undefined)).toEqual(["address", "phone", "email"]);
  });

  it("heroSection exists with all 3 detail rows in a custom order: respects that order exactly", () => {
    const hero = {
      _key: "hero",
      items: [
        { _key: "followUsTitle", itemKey: "followUsTitle" },
        { _key: "contactDetail-email", itemKey: "contactDetail-email" },
        { _key: "contactDetail-address", itemKey: "contactDetail-address" },
      ],
    } as unknown as RawPageSection;
    expect(resolveContactDetailOrder(hero)).toEqual(["email", "address"]);
  });

  it("heroSection exists but has zero contactDetail-* rows: empty array, never resurrects the default 3", () => {
    const hero = { _key: "hero", items: [{ _key: "followUsTitle", itemKey: "followUsTitle" }] } as unknown as RawPageSection;
    expect(resolveContactDetailOrder(hero)).toEqual([]);
  });

  it("a malformed marker (contactDetail-fax, not one of address/phone/email) is omitted, not passed through as-is (Task 9)", () => {
    const hero = {
      _key: "hero",
      items: [
        { _key: "contactDetail-address", itemKey: "contactDetail-address" },
        { _key: "contactDetail-fax", itemKey: "contactDetail-fax" },
      ],
    } as unknown as RawPageSection;
    expect(resolveContactDetailOrder(hero)).toEqual(["address"]);
  });

  it("a duplicate marker for the same type is deduplicated — only the first occurrence is kept (Task 9)", () => {
    const hero = {
      _key: "hero",
      items: [
        { _key: "a", itemKey: "contactDetail-address" },
        { _key: "b", itemKey: "contactDetail-phone" },
        { _key: "c", itemKey: "contactDetail-address" },
      ],
    } as unknown as RawPageSection;
    expect(resolveContactDetailOrder(hero)).toEqual(["address", "phone"]);
  });
});

describe("resolvePrivacyConsentSettings — absent settings preserve current behavior", () => {
  it("no settings array at all: shown=true, required=true", () => {
    expect(resolvePrivacyConsentSettings(undefined)).toEqual({ shown: true, required: true });
  });

  it("settings explicitly set to false: respected", () => {
    const form = { _key: "form", settings: [{ key: "privacyConsentShown", value: "false" }, { key: "privacyConsentRequired", value: "false" }] } as unknown as RawPageSection;
    expect(resolvePrivacyConsentSettings(form)).toEqual({ shown: false, required: false });
  });

  it("settings explicitly set to true: respected (not just absence)", () => {
    const form = { _key: "form", settings: [{ key: "privacyConsentShown", value: "true" }] } as unknown as RawPageSection;
    expect(resolvePrivacyConsentSettings(form).shown).toBe(true);
  });
});

describe("resolveFaqPrompt — Contact-specific override falls back to shared formMessages (Task 10)", () => {
  it("no Contact-specific rows configured: question/label are undefined (caller falls back to formMessages), href defaults to /faq, shown defaults to true", () => {
    const form = { _key: "form", items: [] } as unknown as RawPageSection;
    const result = resolveFaqPrompt(form, "en");
    expect(result).toEqual({ shown: true, question: undefined, label: undefined, href: "/faq" });
  });

  it("Contact-specific question/label configured: used instead of the shared default", () => {
    const form = {
      _key: "form",
      items: [
        { _key: "q", itemKey: "faqPromptQuestion", title: i18n("Questions about Contact?") },
        { _key: "l", itemKey: "faqPromptLabel", title: i18n("See Contact FAQs"), href: "/faq#contact" },
      ],
    } as unknown as RawPageSection;
    const result = resolveFaqPrompt(form, "en");
    expect(result).toEqual({ shown: true, question: "Questions about Contact?", label: "See Contact FAQs", href: "/faq#contact" });
  });

  it("faqPromptShown=false: shown is false even with configured text", () => {
    const form = { _key: "form", settings: [{ key: "faqPromptShown", value: "false" }], items: [] } as unknown as RawPageSection;
    expect(resolveFaqPrompt(form, "en").shown).toBe(false);
  });
});

describe("resolveContactFormFields — missing page vs. configured fields (Task 7)", () => {
  it("formSection undefined: falls back to the 4 original hardcoded fields, in order", () => {
    const result = resolveContactFormFields(undefined, defaultFormMessages, "en");
    expect(result.map((f) => f.name)).toEqual(["name", "phone", "email", "message"]);
    expect(result[0]).toEqual({ name: "name", type: "text", label: defaultFormMessages.fullNameLabel, placeholder: defaultFormMessages.fullNameLabel });
  });

  it("formSection exists with configured field-* rows: reads type/label/placeholder from them, in stored order", () => {
    const form = {
      _key: "form",
      items: [
        { _key: "field-city", itemKey: "field-city", value: "text", title: i18n("City"), text: i18n("Copenhagen") },
        { _key: "field-email", itemKey: "field-email", value: "email", title: i18n("Email"), text: [] },
      ],
    } as unknown as RawPageSection;
    const result = resolveContactFormFields(form, defaultFormMessages, "en");
    expect(result).toEqual([
      { name: "city", type: "text", label: "City", placeholder: "Copenhagen" },
      { name: "email", type: "email", label: "Email", placeholder: "" },
    ]);
  });

  it("formSection exists but has zero field-* rows: empty array, never resurrects the 4 defaults", () => {
    const form = { _key: "form", items: [{ _key: "submitLabel", itemKey: "submitLabel" }] } as unknown as RawPageSection;
    expect(resolveContactFormFields(form, defaultFormMessages, "en")).toEqual([]);
  });

  it("a field with no recognized type value falls back to \"text\"", () => {
    const form = { _key: "form", items: [{ _key: "field-x", itemKey: "field-x", title: i18n("X") }] } as unknown as RawPageSection;
    expect(resolveContactFormFields(form, defaultFormMessages, "en")[0]!.type).toBe("text");
  });

  it("a stray/unsupported type value (not one of text/email/phone/multiline) also falls back to \"text\", not passed through as-is (Task 9)", () => {
    const form = { _key: "form", items: [{ _key: "field-x", itemKey: "field-x", value: "url", title: i18n("X") }] } as unknown as RawPageSection;
    expect(resolveContactFormFields(form, defaultFormMessages, "en")[0]!.type).toBe("text");
  });

  it("two items whose itemKey slices to the same name (e.g. malformed duplicate \"field-city\") never produce two fields sharing one HTML id/name — only the first is kept (Task 9)", () => {
    const form = {
      _key: "form",
      items: [
        { _key: "a", itemKey: "field-city", title: i18n("City") },
        { _key: "b", itemKey: "field-city", title: i18n("City (duplicate)") },
      ],
    } as unknown as RawPageSection;
    const result = resolveContactFormFields(form, defaultFormMessages, "en");
    expect(result).toHaveLength(1);
    expect(result[0]!.label).toBe("City");
  });

  it("an itemKey of exactly \"field-\" (empty name) is omitted, never producing a field with a blank HTML id/name (Task 9)", () => {
    const form = { _key: "form", items: [{ _key: "a", itemKey: "field-", title: i18n("Blank") }] } as unknown as RawPageSection;
    expect(resolveContactFormFields(form, defaultFormMessages, "en")).toEqual([]);
  });
});

describe("resolveSocialLinks — missing vs. intentionally-empty, and derived brand color (Task 5)", () => {
  it("doc is null (Sanity unavailable): falls back to the hardcoded starter list", () => {
    const result = resolveSocialLinks(null, "en");
    expect(result.length).toBeGreaterThan(0);
  });

  it("doc exists with an empty links array: returns [], never resurrects the hardcoded list", () => {
    expect(resolveSocialLinks({ _id: "socialLinks", links: [] } as never, "en")).toEqual([]);
  });

  it("brand color is derived from platform, not read from a stored (possibly wrong) value", () => {
    const doc = { _id: "socialLinks", links: [{ _key: "x", icon: "linkedin", href: "https://linkedin.com/company/rorum", brandColor: "#000000", label: i18n("LinkedIn", "LinkedIn", "LinkedIn") }] } as never;
    const result = resolveSocialLinks(doc, "en");
    expect(result[0]!.brandColor).toBe("#0A66C2");
  });

  it("a link with no localized label falls back to the platform's own display name, not a raw href", () => {
    const doc = { _id: "socialLinks", links: [{ _key: "x", icon: "facebook", href: "https://facebook.com/rorum", label: [] }] } as never;
    expect(resolveSocialLinks(doc, "en")[0]!.label).toBe("Facebook");
  });

  it("preserves the Sanity _key as a stable id, for use as the React list key instead of the (possibly duplicate) localized label (Task 6/9)", () => {
    const doc = {
      _id: "socialLinks",
      links: [
        { _key: "abc123", icon: "instagram", href: "https://instagram.com/rorum", label: i18n("Instagram") },
        { _key: "def456", icon: "facebook", href: "https://facebook.com/rorum", label: i18n("Instagram") },
      ],
    } as never;
    const result = resolveSocialLinks(doc, "en");
    expect(result.map((l) => l.id)).toEqual(["abc123", "def456"]);
  });

  it("the hardcoded fallback list also has a stable, unique id per entry", () => {
    const result = resolveSocialLinks(null, "en");
    const ids = result.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => Boolean(id))).toBe(true);
  });
});

describe("intentionally-empty vs. compatibility-fallback — explicit proofs (verification round)", () => {
  it("removing ONLY Email from a full 4-field config leaves Name/Phone/Message untouched, in their original relative order", () => {
    const form = {
      _key: "form",
      items: [
        { _key: "field-name", itemKey: "field-name", value: "text", title: i18n("Full Name") },
        { _key: "field-phone", itemKey: "field-phone", value: "phone", title: i18n("Phone number") },
        { _key: "field-message", itemKey: "field-message", value: "multiline", title: i18n("Message") },
      ],
    } as unknown as RawPageSection;
    const result = resolveContactFormFields(form, defaultFormMessages, "en");
    expect(result.map((f) => f.name)).toEqual(["name", "phone", "message"]);
    expect(result.find((f) => f.name === "email")).toBeUndefined();
  });

  it("resolveContactFormFields never falls back to hardcoded defaults once page-contact exists, even with only 1 configured field remaining", () => {
    const form = { _key: "form", items: [{ _key: "field-email", itemKey: "field-email", value: "email", title: i18n("Email") }] } as unknown as RawPageSection;
    const result = resolveContactFormFields(form, defaultFormMessages, "en");
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("email");
  });

  it("resolveContactDetailOrder: removing ONLY Phone from a full 3-detail config leaves Address/Email, in original order", () => {
    const hero = {
      _key: "hero",
      items: [
        { _key: "contactDetail-address", itemKey: "contactDetail-address" },
        { _key: "contactDetail-email", itemKey: "contactDetail-email" },
      ],
    } as unknown as RawPageSection;
    expect(resolveContactDetailOrder(hero)).toEqual(["address", "email"]);
  });

  it("missing page-contact (undefined section) uses the documented compatibility fallback for every resolver, not an empty/broken state", () => {
    expect(resolveContactDetailOrder(undefined)).toEqual(["address", "phone", "email"]);
    expect(resolveContactFormFields(undefined, defaultFormMessages, "en").map((f) => f.name)).toEqual(["name", "phone", "email", "message"]);
    expect(resolvePrivacyConsentSettings(undefined)).toEqual({ shown: true, required: true });
    expect(resolveFaqPrompt(undefined, "en")).toEqual({ shown: true, question: undefined, label: undefined, href: "/faq" });
    expect(resolveSocialLinks(null, "en").length).toBeGreaterThan(0);
  });
});
