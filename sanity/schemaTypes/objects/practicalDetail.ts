import { defineField, defineType } from "sanity";

export default defineType({
  name: "practicalDetail",
  title: "Practical detail",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "internationalizedArrayString",
      description: 'E.g. "Address", "Duration", "Language".',
    }),
    defineField({
      name: "value",
      title: "Value",
      type: "internationalizedArrayString",
    }),
  ],
  preview: {
    select: { label: "label" },
    prepare({ label }) {
      const en = (label as { _key: string; value?: string }[] | undefined)?.find(
        (v) => v._key === "en",
      );
      return { title: en?.value ?? "(untitled)" };
    },
  },
});
