import { defineArrayMember, defineField, defineType } from "sanity";

// Displayed on the site as an in-page overlay opened from the Catering page
// (see components/CateringMenuOverlay.tsx) — kept as an ordinary editable
// page here so the client never has to think about "popup"/"modal"
// implementation details; the frontend behavior itself is unchanged.
export default defineType({
  name: "cateringMenuExamplesPage",
  title: "Catering Menu Examples",
  type: "document",
  description:
    "Example catering menu shown from the Catering page. / Приклад меню кейтерингу, що показується зі сторінки «Кейтеринг».",
  fieldsets: [
    { name: "bannerSection", title: "Banner & intro", options: { collapsible: true, collapsed: false } },
    { name: "categoriesSection", title: "Menu categories", options: { collapsible: true, collapsed: false } },
    { name: "closingSection", title: "Closing section", options: { collapsible: true, collapsed: true } },
    { name: "seoSection", title: "SEO", options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: "bannerImage",
      title: "Banner image",
      type: "imageWithAlt",
      fieldset: "bannerSection",
      description: "Wide banner image at the top of the page. / Широке банерне зображення у верхній частині сторінки.",
    }),
    defineField({
      name: "title",
      title: "Page title",
      type: "internationalizedArrayString",
      fieldset: "bannerSection",
      description: 'E.g. "Catering menu". / Напр. «Меню кейтерингу».',
    }),
    defineField({
      name: "intro",
      title: "Intro paragraphs",
      type: "array",
      fieldset: "bannerSection",
      of: [defineArrayMember({ type: "bulletParagraph" })],
      description: "Intro paragraphs at the top of the page. / Вступні абзаци у верхній частині сторінки.",
    }),
    defineField({
      name: "requestCta",
      title: '"Request custom menu" button',
      type: "internationalizedArrayString",
      fieldset: "bannerSection",
      description: "Button text. / Текст кнопки.",
    }),
    defineField({
      name: "categories",
      title: "Menu categories",
      type: "array",
      fieldset: "categoriesSection",
      description:
        "Drag to reorder. Each category is a tab in the menu navigation. / Перетягуйте, щоб змінити порядок. Кожна категорія — це вкладка в меню навігації.",
      of: [
        defineArrayMember({
          type: "object",
          name: "menuCategory",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "internationalizedArrayString",
              description: 'E.g. "Traditional Ukrainian cuisine". / Напр. «Традиційна українська кухня».',
              validation: (rule) =>
                rule.custom((value) =>
                  (value as { _key: string; language?: string; value?: string }[] | undefined)?.find(
                    (v) => v.language === "en" || v._key === "en",
                  )?.value
                    ? true
                    : "English title is required.",
                ),
            }),
            defineField({
              name: "navLabel",
              title: "Short nav label",
              type: "internationalizedArrayString",
              description: 'Shown in the category menu, e.g. "Ukrainian cuisine". / Показується в меню категорій, напр. «Українська кухня».',
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "internationalizedArrayText",
              description: "Short description shown under the category heading. / Короткий опис під заголовком категорії.",
            }),
            defineField({
              name: "dishes",
              title: "Dishes",
              type: "array",
              description: "The dishes shown in this category. Drag to reorder. / Страви в цій категорії. Перетягуйте, щоб змінити порядок.",
              of: [defineArrayMember({ type: "cateringMenuItem" })],
            }),
          ],
          preview: {
            select: { title: "title", dishes: "dishes" },
            prepare({ title, dishes }) {
              const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
                (v) => v.language === "en" || v._key === "en",
              );
              return {
                title: en?.value ?? "(untitled category)",
                subtitle: `${(dishes as unknown[] | undefined)?.length ?? 0} dishes`,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "featuredDishesLabel",
      title: '"Featured Dishes" heading',
      type: "internationalizedArrayString",
      fieldset: "categoriesSection",
      description: "Heading above each category's featured dishes. / Заголовок над обраними стравами кожної категорії.",
    }),
    defineField({
      name: "disclaimerNote",
      title: '"Examples only" disclaimer note',
      type: "internationalizedArrayText",
      fieldset: "categoriesSection",
      description: "Note clarifying the dishes shown are examples. / Примітка про те, що показані страви є прикладами.",
    }),
    defineField({
      name: "customMenuTitle",
      title: '"Create your custom menu" title',
      type: "internationalizedArrayString",
      fieldset: "closingSection",
      description: "Heading of the closing section. / Заголовок завершального блоку.",
    }),
    defineField({
      name: "customMenuText",
      title: '"Create your custom menu" text',
      type: "internationalizedArrayText",
      fieldset: "closingSection",
      description: "Text of the closing section. / Текст завершального блоку.",
    }),
    defineField({
      name: "backToCateringCta",
      title: '"Back to Catering" button',
      type: "internationalizedArrayString",
      fieldset: "closingSection",
      description: "Button that returns to the Catering page. / Кнопка повернення на сторінку «Кейтеринг».",
    }),
    defineField({ name: "seo", title: "SEO", type: "seo", fieldset: "seoSection" }),
  ],
  preview: {
    prepare() {
      return { title: "Catering Menu Examples" };
    },
  },
});
