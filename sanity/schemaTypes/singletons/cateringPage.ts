import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "cateringPage",
  title: "Catering page",
  type: "document",
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "formats", title: "Formats" },
    { name: "offer", title: "What we offer" },
    { name: "inquiry", title: "Inquiry section" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "hero", title: "Hero", type: "serviceHero", group: "hero" }),
    defineField({
      name: "menuFormatsTitle",
      title: "Menu formats section title",
      type: "internationalizedArrayString",
      group: "formats",
    }),
    defineField({
      name: "menuFormats",
      title: "Menu format cards",
      type: "array",
      group: "formats",
      of: [
        defineArrayMember({
          type: "object",
          name: "menuFormatCard",
          fields: [
            defineField({ name: "title", title: "Title", type: "internationalizedArrayString" }),
            defineField({ name: "description", title: "Description", type: "internationalizedArrayText" }),
            defineField({ name: "image", title: "Image", type: "imageWithAlt" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "formats",
      title: "\"What we offer\" cards",
      type: "array",
      group: "offer",
      of: [defineArrayMember({ type: "iconCard" })],
    }),
    defineField({
      name: "suitableForLabel",
      title: '"Suitable for" label',
      type: "internationalizedArrayString",
      group: "offer",
    }),
    defineField({
      name: "suitableFor",
      title: "\"Suitable for\" chips",
      type: "array",
      group: "offer",
      of: [defineArrayMember({ type: "iconCard" })],
    }),
    defineField({
      name: "philosophyTitle",
      title: "Philosophy title",
      type: "internationalizedArrayString",
      group: "offer",
    }),
    defineField({
      name: "philosophyText",
      title: "Philosophy text",
      type: "internationalizedArrayText",
      group: "offer",
    }),
    defineField({
      name: "philosophyImage",
      title: "Philosophy image",
      type: "imageWithAlt",
      group: "offer",
    }),
    defineField({
      name: "tailoredNote",
      title: "\"Tailored upon request\" note",
      type: "titledText",
      group: "offer",
    }),
    defineField({
      name: "stepsTitle",
      title: "3-step setup title",
      type: "internationalizedArrayString",
      group: "inquiry",
    }),
    defineField({
      name: "steps",
      title: "3-step setup",
      type: "array",
      group: "inquiry",
      of: [defineArrayMember({ type: "titledText" })],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: "inquiryIntro",
      title: "Inquiry form intro text",
      type: "internationalizedArrayText",
      group: "inquiry",
    }),
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Catering page" };
    },
  },
});
