import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "editorialFeature",
  title: "Editorial feature block",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow label", type: "internationalizedArrayString" }),
    defineField({ name: "title", title: "Title", type: "internationalizedArrayString" }),
    defineField({ name: "intro", title: "Intro", type: "internationalizedArrayText" }),
    defineField({ name: "description", title: "Description", type: "internationalizedArrayText" }),
    defineField({
      name: "features",
      title: "Feature bullets",
      type: "array",
      of: [defineArrayMember({ type: "internationalizedArrayString" })],
      validation: (rule) => rule.max(4),
    }),
    defineField({ name: "cta", title: "Call to action", type: "ctaLink" }),
    defineField({ name: "image", title: "Image", type: "imageWithAlt" }),
    defineField({
      name: "reversed",
      title: "Image on the left",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
