import { defineArrayMember, defineField, defineType } from "sanity";

// FAQ entries are inline objects within a group, not their own top-level
// documents: they're always displayed as part of exactly one group's
// accordion, in a fixed order, and never reused or referenced elsewhere —
// matching the existing `Record<groupName, [question, answer][]>` shape in
// `lib/data.ts`.
export default defineType({
  name: "faqGroup",
  title: "FAQ group",
  type: "document",
  description:
    "One group of questions shown on the FAQ page (e.g. \"Events\", \"Host at RORUM\"). / Одна група запитань на сторінці поширених запитань (напр. «Події», «Проведення подій у RORUM»).",
  fields: [
    defineField({
      name: "title",
      title: "Group title",
      type: "internationalizedArrayString",
      description:
        'E.g. "Events", "Host at RORUM", "Services", "Volunteering". / Напр. «Події», «Проведення подій у RORUM», «Послуги», «Волонтерство».',
      validation: (rule) =>
        rule.custom((value) =>
          (value as { _key: string; language?: string; value?: string }[] | undefined)?.find((v) => v.language === "en" || v._key === "en")
            ?.value
            ? true
            : "English group title is required.",
        ),
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Groups are shown lowest-to-highest. / Групи показуються від меншого числа до більшого.",
      initialValue: 0,
    }),
    defineField({
      name: "items",
      title: "Questions",
      type: "array",
      description: "The questions and answers in this group. / Запитання та відповіді в цій групі.",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqItem",
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
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", items: "items" },
    prepare({ title, items }) {
      const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return {
        title: en?.value ?? "(untitled group)",
        subtitle: `${(items as unknown[] | undefined)?.length ?? 0} questions`,
      };
    },
  },
});
