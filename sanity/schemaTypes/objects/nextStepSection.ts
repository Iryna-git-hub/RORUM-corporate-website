import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "nextStepSection",
  title: "Closing call-to-action section",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow label", type: "internationalizedArrayString" }),
    defineField({ name: "title", title: "Title", type: "internationalizedArrayString" }),
    defineField({ name: "text", title: "Text", type: "internationalizedArrayText" }),
    defineField({ name: "cta", title: "Primary call to action", type: "ctaLink" }),
    defineField({
      name: "faqQuestion",
      title: "FAQ prompt question",
      type: "internationalizedArrayString",
    }),
    defineField({
      name: "faqLabel",
      title: "FAQ prompt link label",
      type: "internationalizedArrayString",
    }),
    defineField({
      name: "links",
      title: "Secondary links",
      type: "array",
      of: [defineArrayMember({ type: "navChild" })],
    }),
  ],
});
