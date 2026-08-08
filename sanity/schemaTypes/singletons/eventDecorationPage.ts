import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "eventDecorationPage",
  title: "Event decoration page",
  type: "document",
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "styling", title: "What we style" },
    { name: "inquiry", title: "Inquiry section" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "hero", title: "Hero", type: "serviceHero", group: "hero" }),
    defineField({
      name: "stylingLabel",
      title: '"What we style" label',
      type: "internationalizedArrayString",
      group: "styling",
    }),
    defineField({
      name: "stylingTitle",
      title: '"What we style" title',
      type: "internationalizedArrayString",
      group: "styling",
    }),
    defineField({
      name: "stylingIntro",
      title: "Intro paragraphs",
      type: "array",
      group: "styling",
      of: [defineArrayMember({ type: "internationalizedArrayText" })],
    }),
    defineField({
      name: "formats",
      title: "Decoration format cards",
      type: "array",
      group: "styling",
      of: [defineArrayMember({ type: "iconCard" })],
    }),
    defineField({
      name: "stylingImage",
      title: "\"What we style\" image",
      type: "imageWithAlt",
      group: "styling",
    }),
    defineField({
      name: "suitableForLabel",
      title: '"Suitable for" label',
      type: "internationalizedArrayString",
      group: "styling",
    }),
    defineField({
      name: "suitableFor",
      title: "\"Suitable for\" chips",
      type: "array",
      group: "styling",
      of: [defineArrayMember({ type: "iconCard" })],
    }),
    defineField({
      name: "tailoredNote",
      title: "\"Tailored upon request\" note",
      type: "titledText",
      group: "styling",
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
      return { title: "Event decoration page" };
    },
  },
});
