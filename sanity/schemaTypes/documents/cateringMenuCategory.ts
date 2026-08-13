import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "cateringMenuCategory",
  title: "Catering menu category",
  type: "document",
  description:
    "One category in the catering menu examples popup (e.g. Ukrainian cuisine, Danish cuisine). / Одна категорія у спливному вікні прикладів меню кейтерингу (напр. українська кухня, данська кухня).",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      description:
        'E.g. "Traditional Ukrainian cuisine". / Напр. «Традиційна українська кухня».',
      validation: (rule) =>
        rule.custom((value) =>
          (value as { _key: string; language?: string; value?: string }[] | undefined)?.find((v) => v.language === "en" || v._key === "en")
            ?.value
            ? true
            : "English title is required.",
        ),
    }),
    defineField({
      name: "navLabel",
      title: "Short nav label",
      type: "internationalizedArrayString",
      description:
        'Shown in the sticky category nav, e.g. "Ukrainian cuisine". / Показується в меню категорій, напр. «Українська кухня».',
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description:
        "Used as the in-page anchor id — preserve the existing value. / Використовується як ідентифікатор-якір на сторінці — не змінюйте наявне значення.",
      options: { source: "title.0.value" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "internationalizedArrayText",
      description: "Short description shown under the category heading. / Короткий опис під заголовком категорії.",
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      initialValue: 0,
      description: "Lower numbers show first. / Менші числа показуються першими.",
    }),
    defineField({
      name: "featuredItems",
      title: "Menu items",
      type: "array",
      of: [defineArrayMember({ type: "cateringMenuItem" })],
      description: "The dishes shown in this category. / Страви, що показуються в цій категорії.",
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
      const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return {
        title: en?.value ?? "(untitled category)",
        subtitle: `${(items as unknown[] | undefined)?.length ?? 0} items`,
      };
    },
  },
});
