import { defineField, defineType } from "sanity";

export default defineType({
  name: "imageWithAlt",
  title: "Image",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Alt text",
      type: "internationalizedArrayString",
      description: "Describes the image for screen readers and search engines. Required.",
      validation: (rule) =>
        rule.custom((value) => {
          const en = (value as { _key: string; value?: string }[] | undefined)?.find(
            (v) => v._key === "en",
          );
          return en?.value ? true : "English alt text is required.";
        }),
    }),
  ],
});
