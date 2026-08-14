import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "faqPage",
  title: "FAQ page",
  type: "document",
  description:
    "The FAQ page, including its questions and answers. / Сторінка поширених запитань, включно із запитаннями та відповідями.",
  fieldsets: [
    { name: "heroSection", title: "Hero", options: { collapsible: true, collapsed: false } },
    { name: "groupsSection", title: "FAQ groups", options: { collapsible: true, collapsed: false } },
    { name: "seoSection", title: "SEO", options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({
      name: "heroLabel",
      title: "Hero label",
      type: "internationalizedArrayString",
      fieldset: "heroSection",
      description: "Small label above the title. / Невеликий напис над заголовком.",
    }),
    defineField({
      name: "heroTitle",
      title: "Hero title",
      type: "internationalizedArrayString",
      fieldset: "heroSection",
      description: 'E.g. "Frequently asked questions". / Напр. «Поширені запитання».',
    }),
    defineField({
      name: "heroText",
      title: "Hero text",
      type: "internationalizedArrayText",
      fieldset: "heroSection",
      description: "Intro text under the page title. / Вступний текст під заголовком сторінки.",
    }),
    defineField({
      name: "groups",
      title: "FAQ groups",
      type: "array",
      fieldset: "groupsSection",
      description:
        "Drag to reorder groups (e.g. \"Events\", \"Host at RORUM\"). / Перетягуйте, щоб змінити порядок груп (напр. «Події», «Проведення подій у RORUM»).",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqPageGroup",
          fields: [
            defineField({
              name: "title",
              title: "Group title",
              type: "internationalizedArrayString",
              description: 'E.g. "Events", "Host at RORUM", "Services", "Volunteering". / Напр. «Події», «Проведення подій у RORUM», «Послуги», «Волонтерство».',
              validation: (rule) =>
                rule.custom((value) =>
                  (value as { _key: string; language?: string; value?: string }[] | undefined)?.find(
                    (v) => v.language === "en" || v._key === "en",
                  )?.value
                    ? true
                    : "English group title is required.",
                ),
            }),
            defineField({
              name: "items",
              title: "Questions",
              type: "array",
              description: "The questions and answers in this group. Drag to reorder. / Запитання та відповіді в цій групі. Перетягуйте, щоб змінити порядок.",
              of: [defineArrayMember({ type: "faqItem" })],
            }),
          ],
          preview: {
            select: { title: "title", items: "items" },
            prepare({ title, items }) {
              const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
                (v) => v.language === "en" || v._key === "en",
              );
              return {
                title: en?.value ?? "(untitled group)",
                subtitle: `${(items as unknown[] | undefined)?.length ?? 0} questions`,
              };
            },
          },
        }),
      ],
    }),
    defineField({ name: "seo", title: "SEO", type: "seo", fieldset: "seoSection" }),
  ],
  preview: {
    prepare() {
      return { title: "FAQ page" };
    },
  },
});
