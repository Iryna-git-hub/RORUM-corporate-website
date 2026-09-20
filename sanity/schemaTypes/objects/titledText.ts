import { defineField, defineType } from "sanity";

// Generic title+text pair, reused for repeated small content blocks that
// share this exact shape across pages: About's values, community pillars,
// numbered "how it works" steps, etc. Kept as one shared object type rather
// than one bespoke type per page so an editor learns the pattern once.
export default defineType({
  name: "titledText",
  title: "Title + text",
  type: "object",
  description:
    "A reusable title + text pair (About's values, community pillars, numbered steps, etc). / Багаторазова пара «заголовок + текст» (цінності на сторінці «Про нас», принципи спільноти, пронумеровані кроки тощо).",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      description: "Heading. / Заголовок.",
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "internationalizedArrayText",
      description: "Body text. / Текст.",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? "(untitled)" };
    },
  },
});
