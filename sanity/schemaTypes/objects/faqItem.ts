import { defineField, defineType } from "sanity";

// Shared by `faqGroup` (legacy, kept temporarily for migration) and
// `faqPage.groups[].items` (the client-facing home for FAQ content going
// forward) — extracted so both stay in sync automatically.
export default defineType({
  name: "faqItem",
  title: "Question",
  type: "object",
  fields: [
    defineField({
      name: "question",
      title: "Question",
      type: "internationalizedArrayString",
      description: "The question text. / Текст запитання.",
    }),
    defineField({
      name: "answer",
      title: "Answer",
      type: "internationalizedArrayText",
      description: "The answer text. / Текст відповіді.",
    }),
  ],
  preview: {
    select: { question: "question" },
    prepare({ question }) {
      const en = (question as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? "(untitled question)" };
    },
  },
});
