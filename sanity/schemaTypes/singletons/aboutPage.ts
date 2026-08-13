import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  // No `groups`/tabs: all fields render on one continuous page, in the same
  // top-to-bottom order the corresponding sections appear on the site.
  // `fieldsets` are used purely for visual (collapsible) grouping — they
  // don't split the form into tabs.
  fieldsets: [
    { name: "heroSection", title: "Hero", options: { collapsible: true, collapsed: false } },
    { name: "valuesSection", title: "Values", options: { collapsible: true, collapsed: false } },
    { name: "locationSection", title: "Location", options: { collapsible: true, collapsed: false } },
  ],
  fields: [
    defineField({
      name: "heroLabel",
      title: "Hero label",
      type: "internationalizedArrayString",
      fieldset: "heroSection",
      description: 'Small label above the hero title, e.g. "About". / Невеликий напис над заголовком, напр. «Про нас».',
    }),
    defineField({
      name: "heroTitle",
      title: "Hero title",
      type: "internationalizedArrayString",
      fieldset: "heroSection",
      description: 'Main hero heading, e.g. "About RORUM". / Основний заголовок хіро-блоку, напр. «Про RORUM».',
    }),
    defineField({
      name: "heroLead",
      title: "Hero lead paragraph",
      type: "internationalizedArrayText",
      fieldset: "heroSection",
      description: "Intro paragraph shown under the hero title. / Вступний абзац під заголовком хіро-блоку.",
    }),
    defineField({
      name: "statementTitle",
      title: "Statement title",
      type: "internationalizedArrayString",
      fieldset: "heroSection",
      description: 'Small heading above the services statement, e.g. "Services". / Заголовок над коротким описом послуг, напр. «Послуги».',
    }),
    defineField({
      name: "statementText",
      title: "Statement text",
      type: "internationalizedArrayText",
      fieldset: "heroSection",
      description: "Short text about off-site catering/decoration services. / Короткий текст про кейтеринг і декор поза RORUM.",
    }),
    defineField({
      name: "values",
      title: "Values",
      type: "array",
      fieldset: "valuesSection",
      of: [defineArrayMember({ type: "titledText" })],
      description: "Community paragraph shown near the hero section. / Блок про спільноту, що показується біля хіро-секції.",
    }),
    defineField({
      name: "pillarsLabel",
      title: "Pillars section label",
      type: "internationalizedArrayString",
      fieldset: "valuesSection",
      description: 'Label above the 4 principle cards, e.g. "Experience principles". / Напис над блоком із 4 картками принципів, напр. «Принципи досвіду».',
    }),
    defineField({
      name: "pillars",
      title: "Pillars (Connect / Create / Grow)",
      type: "array",
      fieldset: "valuesSection",
      of: [defineArrayMember({ type: "titledText" })],
      description: "The 4 principle cards, each with its own title and text. / 4 картки принципів, кожна зі своїм заголовком і текстом.",
    }),
    defineField({
      name: "locationTitle",
      title: "Location title",
      type: "internationalizedArrayString",
      fieldset: "locationSection",
      description: "Heading for the location section. / Заголовок секції про локацію.",
    }),
    defineField({
      name: "locationText",
      title: "Location text",
      type: "internationalizedArrayText",
      fieldset: "locationSection",
      description: "Text for the location section. / Текст секції про локацію.",
    }),
    defineField({
      name: "locationImage",
      title: "Location image",
      type: "imageWithAlt",
      fieldset: "locationSection",
      description: "Photo shown next to the location text. / Фото, що показується поруч із текстом локації.",
    }),
    defineField({
      name: "closingSection",
      title: "Closing section",
      type: "nextStepSection",
      description: "Closing call-to-action block at the bottom of the page. / Завершальний блок із закликом до дії внизу сторінки.",
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      description: "Title/description used by search engines and social sharing. / Заголовок і опис для пошукових систем та соцмереж.",
    }),
  ],
  preview: {
    prepare() {
      return { title: "About page" };
    },
  },
});
