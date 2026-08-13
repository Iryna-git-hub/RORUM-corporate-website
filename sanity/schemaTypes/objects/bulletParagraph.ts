import { defineField, defineType } from "sanity";

// Same reasoning as `bulletText`, for list items that are a full paragraph
// rather than a short label (hero intro paragraphs, closing copy, etc.) —
// wraps `internationalizedArrayText` instead of `internationalizedArrayString`.
export default defineType({
  name: "bulletParagraph",
  title: "Paragraph",
  type: "object",
  description:
    "One paragraph in a list of paragraphs (e.g. intro paragraphs, closing copy). / Один абзац у списку абзаців (напр. вступні абзаци, завершальний текст).",
  fields: [
    defineField({
      name: "text",
      title: "Text",
      type: "internationalizedArrayText",
      description: "The paragraph's text. / Текст абзацу.",
    }),
  ],
  preview: {
    select: { text: "text" },
    prepare({ text }) {
      const en = (text as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ? `${en.value.slice(0, 60)}…` : "(untitled)" };
    },
  },
});
