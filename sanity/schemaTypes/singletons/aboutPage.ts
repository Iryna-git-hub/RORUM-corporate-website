import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "values", title: "Values" },
    { name: "location", title: "Location" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "heroLabel", title: "Hero label", type: "internationalizedArrayString", group: "hero" }),
    defineField({ name: "heroTitle", title: "Hero title", type: "internationalizedArrayString", group: "hero" }),
    defineField({ name: "heroLead", title: "Hero lead paragraph", type: "internationalizedArrayText", group: "hero" }),
    defineField({ name: "statementTitle", title: "Statement title", type: "internationalizedArrayString", group: "hero" }),
    defineField({ name: "statementText", title: "Statement text", type: "internationalizedArrayText", group: "hero" }),
    defineField({
      name: "values",
      title: "Values",
      type: "array",
      group: "values",
      of: [defineArrayMember({ type: "titledText" })],
    }),
    defineField({
      name: "pillarsLabel",
      title: "Pillars section label",
      type: "internationalizedArrayString",
      group: "values",
    }),
    defineField({
      name: "pillars",
      title: "Pillars (Connect / Create / Grow)",
      type: "array",
      group: "values",
      of: [defineArrayMember({ type: "titledText" })],
    }),
    defineField({ name: "locationTitle", title: "Location title", type: "internationalizedArrayString", group: "location" }),
    defineField({ name: "locationText", title: "Location text", type: "internationalizedArrayText", group: "location" }),
    defineField({ name: "locationImage", title: "Location image", type: "imageWithAlt", group: "location" }),
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "About page" };
    },
  },
});
