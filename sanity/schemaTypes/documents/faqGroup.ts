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
  fields: [
    defineField({
      name: "title",
      title: "Group title",
      type: "internationalizedArrayString",
      description: 'E.g. "Events", "Host at RORUM", "Services", "Volunteering".',
      validation: (rule) =>
        rule.custom((value) =>
          (value as { _key: string; value?: string }[] | undefined)?.find((v) => v._key === "en")
            ?.value
            ? true
            : "English group title is required.",
        ),
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Groups are shown lowest-to-highest.",
      initialValue: 0,
    }),
    defineField({
      name: "items",
      title: "Questions",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqItem",
          fields: [
            defineField({
              name: "question",
              title: "Question",
              type: "internationalizedArrayString",
            }),
            defineField({
              name: "answer",
              title: "Answer",
              type: "internationalizedArrayText",
            }),
          ],
          preview: {
            select: { question: "question" },
            prepare({ question }) {
              const en = (question as { _key: string; value?: string }[] | undefined)?.find(
                (v) => v._key === "en",
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
      const en = (title as { _key: string; value?: string }[] | undefined)?.find(
        (v) => v._key === "en",
      );
      return {
        title: en?.value ?? "(untitled group)",
        subtitle: `${(items as unknown[] | undefined)?.length ?? 0} questions`,
      };
    },
  },
});
