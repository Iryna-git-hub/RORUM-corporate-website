import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "packageTier",
  title: "Package",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Title", type: "internationalizedArrayString" }),
    defineField({ name: "price", title: "Price line", type: "internationalizedArrayString" }),
    defineField({
      name: "items",
      title: "Details",
      type: "array",
      of: [defineArrayMember({ type: "internationalizedArrayString" })],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      const en = (title as { _key: string; value?: string }[] | undefined)?.find(
        (v) => v._key === "en",
      );
      return { title: en?.value ?? "(untitled package)" };
    },
  },
});
