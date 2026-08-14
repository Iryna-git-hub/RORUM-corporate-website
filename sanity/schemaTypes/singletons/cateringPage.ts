import { defineArrayMember, defineField, defineType } from "sanity";

// One continuous page, in the same top-to-bottom order the corresponding
// sections appear on the site (hero -> gallery -> menu formats -> what we
// offer -> inquiry). The catering menu examples themselves live on the
// separate "Catering Menu Examples" page — this page only keeps the button
// that opens it (menuExamplesCta).
export default defineType({
  name: "cateringPage",
  title: "Catering page",
  type: "document",
  description: "The Catering page. / Сторінка «Кейтеринг».",
  fieldsets: [
    { name: "heroSection", title: "Hero", options: { collapsible: true, collapsed: false } },
    { name: "gallerySection", title: "Gallery & \"Suitable for\"", options: { collapsible: true, collapsed: false } },
    { name: "menuFormatsSection", title: "Menu formats", options: { collapsible: true, collapsed: false } },
    { name: "offerSection", title: "What we offer", options: { collapsible: true, collapsed: false } },
    { name: "inquirySection", title: "Inquiry section", options: { collapsible: true, collapsed: false } },
    { name: "seoSection", title: "SEO", options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({ name: "hero", title: "Hero", type: "serviceHero", fieldset: "heroSection" }),
    defineField({
      name: "menuExamplesCta",
      title: '"View Catering Menu Examples" button',
      type: "internationalizedArrayString",
      fieldset: "heroSection",
      description:
        "Button text that opens the Catering Menu Examples page. / Текст кнопки, що відкриває сторінку «Приклади меню кейтерингу».",
    }),
    defineField({
      name: "gallery",
      title: "Gallery images",
      type: "array",
      fieldset: "gallerySection",
      of: [defineArrayMember({ type: "imageWithAlt" })],
      description: "The photos shown in the catering gallery, in order. / Фото в галереї кейтерингу, у порядку показу.",
    }),
    defineField({
      name: "suitableForLabel",
      title: '"Suitable for" label',
      type: "internationalizedArrayString",
      fieldset: "gallerySection",
      description: 'E.g. "Suitable for:". / Напр. «Підходить для:».',
    }),
    defineField({
      name: "suitableFor",
      title: "\"Suitable for\" chips",
      type: "array",
      fieldset: "gallerySection",
      of: [defineArrayMember({ type: "iconCard" })],
      description: "Small chips listing occasions this service suits. / Невеликі мітки з переліком подій, для яких підходить ця послуга.",
    }),
    defineField({
      name: "suitableForAriaLabel",
      title: "\"Suitable for\" chips accessible label",
      type: "internationalizedArrayString",
      fieldset: "gallerySection",
      description: "Screen-reader label for the chip group (not visible). / Напис для програм читання з екрана для групи міток (не показується візуально).",
    }),
    defineField({
      name: "menuFormatsTitle",
      title: "Menu formats section title",
      type: "internationalizedArrayString",
      fieldset: "menuFormatsSection",
      description: "Heading above the 3 menu format cards. / Заголовок над 3 картками форматів меню.",
    }),
    defineField({
      name: "menuFormats",
      title: "Menu format cards",
      type: "array",
      fieldset: "menuFormatsSection",
      description: "The 3 menu format cards (private dinner / reception / business meeting). / 3 картки форматів меню (приватна вечеря / фуршет / бізнес-зустріч).",
      of: [
        defineArrayMember({
          type: "object",
          name: "menuFormatCard",
          fields: [
            defineField({ name: "title", title: "Title", type: "internationalizedArrayString", description: "Card heading. / Заголовок картки." }),
            defineField({ name: "description", title: "Description", type: "internationalizedArrayText", description: "Card text. / Текст картки." }),
            defineField({ name: "image", title: "Image", type: "imageWithAlt" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "formats",
      title: "\"What we offer\" cards",
      type: "array",
      fieldset: "offerSection",
      of: [defineArrayMember({ type: "iconCard" })],
      description: "The icon cards describing what's offered (cuisine, buffet, custom menu, etc). / Картки з іконками про те, що пропонується (кухня, фуршет, індивідуальне меню тощо).",
    }),
    defineField({
      name: "philosophyTitle",
      title: "Philosophy title",
      type: "internationalizedArrayString",
      fieldset: "offerSection",
      description: 'E.g. "What we offer". / Напр. «Що ми пропонуємо».',
    }),
    defineField({
      name: "philosophyText",
      title: "Philosophy text",
      type: "internationalizedArrayText",
      fieldset: "offerSection",
      description: "The main paragraph describing the catering approach. / Основний абзац про підхід до кейтерингу.",
    }),
    defineField({
      name: "philosophyImage",
      title: "Philosophy image",
      type: "imageWithAlt",
      fieldset: "offerSection",
      description: "Image shown next to the philosophy text. / Зображення поруч із текстом про підхід.",
    }),
    defineField({
      name: "tailoredNote",
      title: "\"Tailored upon request\" note",
      type: "titledText",
      fieldset: "offerSection",
      description: "Small note that every menu can be customised. / Невелика примітка про те, що кожне меню можна адаптувати.",
    }),
    defineField({
      name: "stepsTitle",
      title: "3-step setup title",
      type: "internationalizedArrayString",
      fieldset: "inquirySection",
      description: 'E.g. "3-step setup". / Напр. «3 кроки для замовлення».',
    }),
    defineField({
      name: "steps",
      title: "3-step setup",
      type: "array",
      fieldset: "inquirySection",
      of: [defineArrayMember({ type: "titledText" })],
      validation: (rule) => rule.max(3),
      description: "The 3 numbered steps explaining how to book. / 3 пронумеровані кроки, що пояснюють, як замовити.",
    }),
    defineField({
      name: "inquiryIntro",
      title: "Inquiry form intro text",
      type: "internationalizedArrayText",
      fieldset: "inquirySection",
      description: "Short text above the inquiry form. / Короткий текст над формою запиту.",
    }),
    defineField({
      name: "inquiryTitle",
      title: "Inquiry form title",
      type: "internationalizedArrayString",
      fieldset: "inquirySection",
      description: 'E.g. "Request catering". / Напр. «Замовити кейтеринг».',
    }),
    defineField({
      name: "inquirySubmitLabel",
      title: "Inquiry form submit button",
      type: "internationalizedArrayString",
      fieldset: "inquirySection",
      description: 'E.g. "Request Catering". / Напр. «Замовити кейтеринг».',
    }),
    defineField({
      name: "messagePlaceholder",
      title: "\"Message\" field placeholder",
      type: "internationalizedArrayString",
      fieldset: "inquirySection",
      description: "Placeholder text shown inside the empty message field. / Текст-підказка в порожньому полі повідомлення.",
    }),
    defineField({
      name: "successMessage",
      title: "Success message",
      type: "internationalizedArrayText",
      fieldset: "inquirySection",
      description: "Shown after the form is submitted successfully. / Показується після успішної відправки форми.",
    }),
    defineField({
      name: "footerNote",
      title: "Footer privacy note",
      type: "internationalizedArrayString",
      fieldset: "inquirySection",
      description:
        'E.g. "We\'ll only use your details to respond to your catering request." / Напр. «Ми використаємо ваші дані лише для відповіді на запит щодо кейтерингу».',
    }),
    defineField({ name: "seo", title: "SEO", type: "seo", fieldset: "seoSection" }),
  ],
  preview: {
    prepare() {
      return { title: "Catering page" };
    },
  },
});
