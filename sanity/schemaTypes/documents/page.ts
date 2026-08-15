import { defineArrayMember, defineField, defineType } from "sanity";

// The compact replacement for the old one-singleton-per-page model. Each
// page is one `page` document with a fixed id (`page.<pageKey>`, see
// sanity/structure.ts) holding an ordered `sections[]` array built from the
// shared `pageSection` shape — sections render on the site in this exact
// array order, and Studio's native array drag-to-reorder is how an editor
// changes page order, so the editing surface and the frontend are
// guaranteed to match. See MIGRATION_REPORT.md for why this replaces the
// old per-page singletons (Sanity's free-plan attribute cap).
export default defineType({
  name: "page",
  title: "Page",
  type: "document",
  description: "A website page, built from an ordered list of sections. / Сторінка сайту, побудована з упорядкованого списку розділів.",
  fields: [
    defineField({
      name: "pageKey",
      title: "Page (do not change)",
      type: "string",
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [defineArrayMember({ type: "pageSection" })],
      description: "Drag to reorder — sections appear on the site in this exact order. / Перетягуйте, щоб змінити порядок — розділи показуються на сайті саме в цьому порядку.",
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    select: { pageKey: "pageKey", sections: "sections" },
    prepare({ pageKey, sections }) {
      return {
        title: (pageKey as string | undefined) ?? "(untitled page)",
        subtitle: `${(sections as unknown[] | undefined)?.length ?? 0} sections`,
      };
    },
  },
});
