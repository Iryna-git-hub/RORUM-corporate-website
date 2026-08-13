import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "volunteerPage",
  title: "Volunteer page",
  type: "document",
  description: "The Volunteer With Us page. / Сторінка «Волонтерство».",
  // No `groups`/tabs: all fields render on one continuous page.
  fields: [
    defineField({ name: "heroLabel", title: "Hero label", type: "internationalizedArrayString", description: "Small label above the title. / Невеликий напис над заголовком." }),
    defineField({ name: "heroTitle", title: "Hero title", type: "internationalizedArrayString", description: "Main page heading. / Основний заголовок сторінки." }),
    defineField({
      name: "heroParagraphs",
      title: "Hero paragraphs",
      type: "array",
      of: [defineArrayMember({ type: "bulletParagraph" })],
      description: "The intro paragraphs explaining what volunteering at RORUM means. / Вступні абзаци про те, що означає волонтерство в RORUM.",
    }),
    defineField({
      name: "highlights",
      title: "Highlight statements",
      type: "array",
      of: [defineArrayMember({ type: "iconCard" })],
      description: 'E.g. "A place where people know each other." with an icon. / Напр. «Місце, де люди знають одне одного» з іконкою.',
    }),
    defineField({
      name: "closingParagraphs",
      title: "Closing paragraphs",
      type: "array",
      of: [defineArrayMember({ type: "bulletParagraph" })],
      description: "The closing paragraphs before the apply button. / Завершальні абзаци перед кнопкою подачі заявки.",
    }),
    defineField({ name: "applyCta", title: "\"Apply to volunteer\" button", type: "ctaLink" }),
    defineField({ name: "heroImage", title: "Hero image", type: "imageWithAlt", description: "Main image on the page. / Основне зображення на сторінці." }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Volunteer page" };
    },
  },
});
