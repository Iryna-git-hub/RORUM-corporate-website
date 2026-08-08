import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "volunteerPage",
  title: "Volunteer page",
  type: "document",
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "heroLabel", title: "Hero label", type: "internationalizedArrayString", group: "hero" }),
    defineField({ name: "heroTitle", title: "Hero title", type: "internationalizedArrayString", group: "hero" }),
    defineField({
      name: "heroParagraphs",
      title: "Hero paragraphs",
      type: "array",
      group: "hero",
      of: [defineArrayMember({ type: "internationalizedArrayText" })],
    }),
    defineField({
      name: "highlights",
      title: "Highlight statements",
      type: "array",
      group: "hero",
      of: [defineArrayMember({ type: "iconCard" })],
      description: 'E.g. "A place where people know each other." with an icon.',
    }),
    defineField({
      name: "closingParagraphs",
      title: "Closing paragraphs",
      type: "array",
      group: "hero",
      of: [defineArrayMember({ type: "internationalizedArrayText" })],
    }),
    defineField({ name: "applyCta", title: "\"Apply to volunteer\" button", type: "ctaLink", group: "hero" }),
    defineField({ name: "heroImage", title: "Hero image", type: "imageWithAlt", group: "hero" }),
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Volunteer page" };
    },
  },
});
