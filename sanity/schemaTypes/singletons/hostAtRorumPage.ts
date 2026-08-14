import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "hostAtRorumPage",
  title: "Host at RORUM page",
  type: "document",
  description: "The Host at RORUM page. / Сторінка «Проведення подій у RORUM».",
  // No `groups`/tabs: all fields render on one continuous page, in the same
  // top-to-bottom order the corresponding sections appear on the site.
  fieldsets: [
    { name: "heroSection", title: "Hero", options: { collapsible: true, collapsed: false } },
    { name: "sessionSection", title: "Session details", options: { collapsible: true, collapsed: false } },
    { name: "packagesSection", title: "Packages", options: { collapsible: true, collapsed: false } },
    { name: "inquirySection", title: "Inquiry section", options: { collapsible: true, collapsed: false } },
    { name: "seoSection", title: "SEO", options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    defineField({ name: "hero", title: "Hero", type: "serviceHero", fieldset: "heroSection" }),
    defineField({
      name: "gallery",
      title: "Gallery images",
      type: "array",
      fieldset: "heroSection",
      of: [defineArrayMember({ type: "imageWithAlt" })],
      description: "The photos shown in the hero gallery, in order. / Фото в галереї на початку сторінки, у порядку показу.",
    }),
    defineField({
      name: "sessionLabel",
      title: "Session details label",
      type: "internationalizedArrayString",
      fieldset: "sessionSection",
      description: 'E.g. "Session details". / Напр. «Деталі сесії».',
    }),
    defineField({
      name: "sessionTitle",
      title: '"Each session includes" title',
      type: "internationalizedArrayString",
      fieldset: "sessionSection",
      description: 'E.g. "Each session includes:". / Напр. «Кожна сесія включає:».',
    }),
    defineField({
      name: "sessionImage",
      title: "Session image",
      type: "imageWithAlt",
      fieldset: "sessionSection",
      description: "Image shown next to the session details. / Зображення поруч із деталями сесії.",
    }),
    defineField({
      name: "includedItems",
      title: "Included items",
      type: "array",
      fieldset: "sessionSection",
      of: [defineArrayMember({ type: "bulletText" })],
      description: "What's always included (space, coffee, support, etc). / Що завжди входить у вартість (простір, кава, підтримка тощо).",
    }),
    defineField({
      name: "optionalLabel",
      title: '"Optional" label',
      type: "internationalizedArrayString",
      fieldset: "sessionSection",
      description: 'E.g. "Optional". / Напр. «Додатково».',
    }),
    defineField({
      name: "optionalItems",
      title: "Optional items",
      type: "array",
      fieldset: "sessionSection",
      of: [defineArrayMember({ type: "bulletText" })],
      description: "Optional add-ons (catering, customized food). / Додаткові опції (кейтеринг, індивідуальне харчування).",
    }),
    defineField({
      name: "packagesLabel",
      title: "Packages section label",
      type: "internationalizedArrayString",
      fieldset: "packagesSection",
      description: 'E.g. "Packages". / Напр. «Пакети».',
    }),
    defineField({
      name: "packagesTitle",
      title: "Packages section title",
      type: "internationalizedArrayString",
      fieldset: "packagesSection",
      description: 'E.g. "Hosting Packages". / Напр. «Пакети для проведення подій».',
    }),
    defineField({
      name: "packagesIntro",
      title: "Packages intro text",
      type: "internationalizedArrayText",
      fieldset: "packagesSection",
      description: "Paragraph above the pricing packages. / Абзац над тарифними пакетами.",
    }),
    defineField({
      name: "packages",
      title: "Packages",
      type: "array",
      fieldset: "packagesSection",
      of: [defineArrayMember({ type: "packageTier" })],
      description: "The pricing tiers (morning/afternoon/full-day session). / Тарифні плани (ранкова/денна/повноденна сесія).",
    }),
    // packagesFooterCtaLabel, packagesFooterText, selectPackageCta and
    // requestProcessAriaLabel below are modeled as `labels` (an array of
    // {key, value} pairs, see objects/keyedString.ts) instead of 4 named
    // fields — this project is close to Sanity's Content Lake cap on total
    // distinct attribute paths a schema can register; consolidating several
    // small strings into one reusable array field costs far fewer paths
    // than one named field each.
    defineField({
      name: "cancellationTitle",
      title: "Cancellation policy title",
      type: "internationalizedArrayString",
      fieldset: "packagesSection",
      description: 'E.g. "Cancellation policy:". / Напр. «Політика скасування:».',
    }),
    defineField({
      name: "cancellationItems",
      title: "Cancellation policy bullets",
      type: "array",
      fieldset: "packagesSection",
      of: [defineArrayMember({ type: "bulletText" })],
      description: "The cancellation policy rules. / Правила політики скасування.",
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
      description: "The 3 numbered steps explaining how to book. / 3 пронумеровані кроки, що пояснюють, як забронювати.",
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
      description: 'E.g. "Apply to Host at RORUM". / Напр. «Подати заявку на проведення в RORUM».',
    }),
    defineField({
      name: "inquirySubmitLabel",
      title: "Inquiry form submit button",
      type: "internationalizedArrayString",
      fieldset: "inquirySection",
      description: 'E.g. "Submit Hosting Request". / Напр. «Надіслати запит на проведення».',
    }),
    defineField({
      name: "messagePlaceholder",
      title: "\"Comment\" field placeholder",
      type: "internationalizedArrayString",
      fieldset: "inquirySection",
      description: "Placeholder text shown inside the empty comment field. / Текст-підказка в порожньому полі коментаря.",
    }),
    defineField({
      name: "successMessage",
      title: "Success message",
      type: "internationalizedArrayText",
      fieldset: "inquirySection",
      description: "Shown after the form is submitted successfully. / Показується після успішної відправки форми.",
    }),
    defineField({
      name: "labels",
      title: "Additional labels",
      type: "array",
      of: [defineArrayMember({ type: "keyedString" })],
      description:
        "Small shared strings: the package-card button, the \"get in touch\" note under the intro (keys packagesFooterCtaLabel/packagesFooterText), and the numbered-steps accessible label (key requestProcessAriaLabel). / Невеликі спільні написи: кнопка картки пакета, примітка «зв'яжіться з нами» під вступним текстом (ключі packagesFooterCtaLabel/packagesFooterText) і напис для програм читання з екрана для пронумерованих кроків (ключ requestProcessAriaLabel).",
    }),
    defineField({ name: "seo", title: "SEO", type: "seo", fieldset: "seoSection" }),
  ],
  preview: {
    prepare() {
      return { title: "Host at RORUM page" };
    },
  },
});
