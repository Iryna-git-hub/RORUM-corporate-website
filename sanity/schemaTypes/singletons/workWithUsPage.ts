import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "workWithUsPage",
  title: "Work with us page",
  type: "document",
  description: "The Work With Us page. / Сторінка «Робота з нами».",
  // No `groups`/tabs: all fields render on one continuous page.
  fieldsets: [
    { name: "featureSection", title: "Feature strip", options: { collapsible: true, collapsed: false } },
    { name: "cvFormSection", title: "CV upload pop-up", options: { collapsible: true, collapsed: true } },
  ],
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
    defineField({
      name: "collaborationImages",
      title: "Collaboration photos",
      type: "array",
      of: [defineArrayMember({ type: "imageWithAlt" })],
      validation: (rule) => rule.max(2),
      description: "The 2 overlapping photos shown below the hero. / 2 перекриті фото під хіро-блоком.",
    }),
    defineField({
      name: "featureItems",
      title: "Feature strip",
      type: "array",
      fieldset: "featureSection",
      of: [defineArrayMember({ type: "iconCard" })],
      description: "The 3 short statements with icons near the bottom of the page. / 3 короткі твердження з іконками внизу сторінки.",
    }),
    defineField({
      name: "cvUploadForm",
      title: "CV upload pop-up",
      type: "object",
      fieldset: "cvFormSection",
      description: "Text shown in the \"Send your CV\" form. / Текст у формі «Надіслати резюме».",
      fields: [
        defineField({ name: "modalTitle", title: "Form title", type: "internationalizedArrayString", description: 'E.g. "Send your CV". / Напр. «Надіслати резюме».' }),
        defineField({ name: "modalTitleSent", title: "Form title (after sending)", type: "internationalizedArrayString", description: 'E.g. "Thank you — we received your CV". / Напр. «Дякуємо — ми отримали ваше резюме».' }),
        defineField({ name: "description", title: "Description", type: "internationalizedArrayText" }),
        defineField({ name: "descriptionSent", title: "Description (after sending)", type: "internationalizedArrayText" }),
        defineField({ name: "messagePlaceholder", title: "\"Short message\" field placeholder", type: "internationalizedArrayString" }),
        defineField({ name: "dropzoneText", title: "File upload prompt", type: "internationalizedArrayString", description: 'E.g. "Choose a PDF, DOC, or DOCX file". / Напр. «Оберіть файл PDF, DOC або DOCX».' }),
        defineField({ name: "errorMessage", title: "Error message", type: "internationalizedArrayText", description: "Shown if the CV fails to send. / Показується, якщо резюме не вдалося надіслати." }),
      ],
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Work with us page" };
    },
  },
});
