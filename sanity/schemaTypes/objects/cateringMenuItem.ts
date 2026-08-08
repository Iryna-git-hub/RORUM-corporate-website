import { defineField, defineType } from "sanity";

// Modeled as a reusable OBJECT type (not a top-level document): every dish
// belongs to exactly one menu category and is never referenced from
// elsewhere, so a full document + reference would add editing friction
// (create the item, then link it) for no reuse benefit. The object schema
// itself is still fully reusable/shared — every category's items array uses
// this same type.
export default defineType({
  name: "cateringMenuItem",
  title: "Menu item",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Dish name",
      type: "internationalizedArrayString",
      validation: (rule) =>
        rule.custom((value) =>
          (value as { _key: string; value?: string }[] | undefined)?.find((v) => v._key === "en")
            ?.value
            ? true
            : "English dish name is required.",
        ),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "internationalizedArrayText",
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "imageWithAlt",
    }),
  ],
  preview: {
    select: { name: "name", media: "image" },
    prepare({ name, media }) {
      const en = (name as { _key: string; value?: string }[] | undefined)?.find(
        (v) => v._key === "en",
      );
      return { title: en?.value ?? "(untitled dish)", media };
    },
  },
});
