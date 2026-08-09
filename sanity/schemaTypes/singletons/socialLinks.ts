import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "socialLinks",
  title: "Social links",
  type: "document",
  fields: [
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [defineArrayMember({ type: "socialLink" })],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Social links" };
    },
  },
});
