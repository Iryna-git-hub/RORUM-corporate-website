import { defineArrayMember, defineField, defineType } from "sanity";

// Registered as a `fieldTypes` entry for the internationalized-array plugin
// (see sanity.config.ts), which generates `internationalizedArrayBodyPortableText`
// automatically — used for the legal pages' long-form body content and any
// other genuinely rich (multi-paragraph, lists, links) editorial copy.
export default defineType({
  name: "bodyPortableText",
  title: "Body content",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Heading", value: "h2" },
      ],
      lists: [{ title: "Bullet", value: "bullet" }],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
        ],
        annotations: [
          defineField({
            name: "link",
            title: "Link",
            type: "object",
            fields: [
              defineField({
                name: "href",
                title: "URL",
                type: "string",
                validation: (rule) => rule.required(),
              }),
            ],
          }),
        ],
      },
    }),
  ],
});
