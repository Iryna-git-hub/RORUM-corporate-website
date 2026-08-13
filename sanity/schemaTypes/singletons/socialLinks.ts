import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "socialLinks",
  title: "Social links",
  type: "document",
  description: "The social media links shown on the Contact page. / Посилання на соцмережі, що показуються на сторінці контактів.",
  fields: [
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [defineArrayMember({ type: "socialLink" })],
      description: "One entry per social platform (Instagram, Facebook, etc). / Один запис на кожну соцмережу (Instagram, Facebook тощо).",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Social links" };
    },
  },
});
