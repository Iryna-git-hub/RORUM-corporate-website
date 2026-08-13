import { defineField, defineType } from "sanity";

// A single short, independently-localized list item — for plain bulleted
// lists like an event's "what's included" / "what to expect", or a
// package's line items. Wraps one `internationalizedArrayString` field in a
// real object (matching the pattern every other localized array item in
// this schema uses — `practicalDetail`, `cateringMenuItem`, `faqItem`,
// `titledText`) rather than nesting `internationalizedArrayString` directly
// inside a plain array, which isn't how this plugin's array items are meant
// to carry their own `_key` (the array-item `_key` and the language `_key`
// would otherwise collide — see MIGRATION_REPORT.md's Sanity section for
// the real import bug this was fixed after).
export default defineType({
  name: "bulletText",
  title: "List item",
  type: "object",
  description:
    "One short list item (e.g. \"what's included\", \"what to expect\"). / Один короткий пункт списку (напр. «що включено», «чого очікувати»).",
  fields: [
    defineField({
      name: "text",
      title: "Text",
      type: "internationalizedArrayString",
      description: "The item's text. / Текст пункту.",
    }),
  ],
  preview: {
    select: { text: "text" },
    prepare({ text }) {
      const en = (text as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? "(untitled)" };
    },
  },
});
