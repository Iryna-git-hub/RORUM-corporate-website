import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "nextStepSection",
  title: "Closing call-to-action section",
  type: "object",
  description:
    "The closing \"what's next\" section at the bottom of a page, with a CTA button and optional FAQ prompt/links. / Завершальна секція «що далі» внизу сторінки з кнопкою заклику до дії та необов'язковим блоком FAQ/посиланнями.",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow label",
      type: "internationalizedArrayString",
      description: "Small label above the title. / Невеликий напис над заголовком.",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      description: "Section heading. / Заголовок секції.",
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "internationalizedArrayText",
      description: "Main paragraph. / Основний абзац.",
    }),
    defineField({
      name: "cta",
      title: "Primary call to action",
      type: "ctaLink",
      description: 'Main button, e.g. "Let\'s talk". / Основна кнопка, напр. «Поговорімо».',
    }),
    defineField({
      name: "faqQuestion",
      title: "FAQ prompt question",
      type: "internationalizedArrayString",
      description: 'E.g. "Have questions?" / Напр. «Маєте запитання?»',
    }),
    defineField({
      name: "faqLabel",
      title: "FAQ prompt link label",
      type: "internationalizedArrayString",
      description: 'E.g. "Read our FAQs" / Напр. «Переглянути поширені запитання»',
    }),
    defineField({
      name: "links",
      title: "Secondary links",
      type: "array",
      of: [defineArrayMember({ type: "navChild" })],
      description: "Extra links shown alongside the button. / Додаткові посилання поруч із кнопкою.",
    }),
  ],
});
