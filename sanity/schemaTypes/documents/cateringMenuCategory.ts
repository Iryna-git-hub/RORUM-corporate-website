import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "cateringMenuCategory",
  title: "Catering menu category",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      description: 'E.g. "Traditional Ukrainian cuisine".',
      validation: (rule) =>
        rule.custom((value) =>
          (value as { _key: string; value?: string }[] | undefined)?.find((v) => v._key === "en")
            ?.value
            ? true
            : "English title is required.",
        ),
    }),
    defineField({
      name: "navLabel",
      title: "Short nav label",
      type: "internationalizedArrayString",
      description: 'Shown in the sticky category nav, e.g. "Ukrainian cuisine".',
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "Used as the in-page anchor id — preserve the existing value.",
      options: { source: "title.0.value" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "internationalizedArrayText",
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "featuredItems",
      title: "Menu items",
      type: "array",
      of: [defineArrayMember({ type: "cateringMenuItem" })],
    }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", items: "featuredItems" },
    prepare({ title, items }) {
      const en = (title as { _key: string; value?: string }[] | undefined)?.find(
        (v) => v._key === "en",
      );
      return {
        title: en?.value ?? "(untitled category)",
        subtitle: `${(items as unknown[] | undefined)?.length ?? 0} items`,
      };
    },
  },
});
