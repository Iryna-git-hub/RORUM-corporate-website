import { defineField, defineType } from "sanity";

export default defineType({
  name: "eventCategory",
  title: "Event category",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      validation: (rule) =>
        rule.custom((value) =>
          (value as { _key: string; value?: string }[] | undefined)?.find((v) => v._key === "en")
            ?.value
            ? true
            : "English title is required.",
        ),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title.0.value" },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      const en = (title as { _key: string; value?: string }[] | undefined)?.find(
        (v) => v._key === "en",
      );
      return { title: en?.value ?? "(untitled)" };
    },
  },
});
