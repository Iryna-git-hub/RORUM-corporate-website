import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "workWithUsPage",
  title: "Work with us page",
  type: "document",
  description: "The Work With Us page. / Сторінка «Робота з нами».",
  // No `groups`/tabs: all fields render on one continuous page.
  fields: [
    defineField({ name: "heroLabel", title: "Hero label", type: "internationalizedArrayString", description: "Small label above the title. / Невеликий напис над заголовком." }),
    defineField({ name: "heroTitle", title: "Hero title", type: "internationalizedArrayString", description: "Main page heading. / Основний заголовок сторінки." }),
    defineField({
      name: "heroParagraphs",
      title: "Hero paragraphs",
      type: "array",
      of: [defineArrayMember({ type: "bulletParagraph" })],
      description: "The paragraphs inviting people to send their CV. / Абзаци із запрошенням надіслати резюме.",
    }),
    defineField({ name: "cvUploadCta", title: "\"Send your CV\" button label", type: "internationalizedArrayString", description: 'E.g. "Send your CV". / Напр. «Надіслати резюме».' }),
    defineField({ name: "heroImage", title: "Hero image", type: "imageWithAlt", description: "Main image on the page. / Основне зображення на сторінці." }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Work with us page" };
    },
  },
});
