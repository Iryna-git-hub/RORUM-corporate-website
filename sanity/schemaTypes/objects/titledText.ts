import { defineField, defineType } from "sanity";

// Generic title+text pair, reused for repeated small content blocks that
// share this exact shape across pages: About's values, community pillars,
// numbered "how it works" steps, etc. Kept as one shared object type rather
// than one bespoke type per page so an editor learns the pattern once.
export default defineType({
  name: "titledText",
  title: "Title + text",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "internationalizedArrayText",
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
