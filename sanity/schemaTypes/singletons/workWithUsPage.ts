import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "workWithUsPage",
  title: "Work with us page",
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
    defineField({ name: "cvUploadCta", title: "\"Send your CV\" button label", type: "internationalizedArrayString", group: "hero" }),
    defineField({ name: "heroImage", title: "Hero image", type: "imageWithAlt", group: "hero" }),
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Work with us page" };
    },
  },
});
