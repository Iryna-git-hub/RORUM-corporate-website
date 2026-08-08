import { defineField, defineType } from "sanity";

// One schema TYPE, published as three separate singleton DOCUMENTS (terms,
// privacy-policy, cookie-policy — see structure.ts) since all three genuinely
// share the same shape: a title/subtitle hero and a body of rich text. This
// is the one case in the content model where reusing a single page schema
// across multiple documents is the right call instead of three near-
// identical bespoke schemas.
export default defineType({
  name: "legalPage",
  title: "Legal page",
  type: "document",
  fields: [
    defineField({
      name: "pageKey",
      title: "Which page",
      type: "string",
      options: { list: ["terms", "privacy-policy", "cookie-policy"] },
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({ name: "title", title: "Title", type: "internationalizedArrayString" }),
    defineField({ name: "subtitle", title: "Subtitle", type: "internationalizedArrayText" }),
    defineField({
      name: "lastUpdated",
      title: "Last updated",
      type: "date",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "internationalizedArrayBodyPortableText",
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    select: { pageKey: "pageKey" },
    prepare({ pageKey }) {
      return { title: `Legal page — ${pageKey}` };
    },
  },
});
