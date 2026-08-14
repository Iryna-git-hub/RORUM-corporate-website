import { defineArrayMember, defineField, defineType } from "sanity";
import { IconPickerInput } from "@/sanity/components/IconPickerInput";

// One row of the small icon-link chips grouped under the hero (e.g. "Host at
// RORUM", "Catering") — three separate arrays (intro/service/community) so
// the client can edit each group in place, matching the 3 visual rows on
// the live page.
function iconLinksField(name: string, title: string, description: string) {
  return defineField({
    name,
    title,
    type: "array",
    fieldset: "linksSection",
    description,
    of: [
      defineArrayMember({
        type: "object",
        name: "iconLink",
        fields: [
          defineField({ name: "label", title: "Label", type: "internationalizedArrayString", description: "Link text. / Текст посилання." }),
          defineField({ name: "href", title: "Link", type: "string", description: "Internal path, e.g. /catering. / Внутрішній шлях, напр. /catering." }),
          defineField({ name: "icon", title: "Icon", type: "string", components: { input: IconPickerInput } }),
        ],
        preview: {
          select: { title: "label" },
          prepare({ title }) {
            const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
              (v) => v.language === "en" || v._key === "en",
            );
            return { title: en?.value ?? "(untitled)" };
          },
        },
      }),
    ],
  });
}

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
    { name: "linksSection", title: "Quick links", options: { collapsible: true, collapsed: false } },
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
      name: "atmosphereImages",
      title: "Atmosphere photos",
      type: "array",
      fieldset: "heroSection",
      of: [defineArrayMember({ type: "imageWithAlt" })],
      validation: (rule) => rule.max(3),
      description: "The 3 photos shown alongside the hero. / 3 фото поруч із хіро-блоком.",
    }),
    iconLinksField(
      "introLinks",
      "Intro links (Host at RORUM / Attend Events)",
      "The 2 link chips shown under the hero intro. / 2 посилання-кнопки під вступним текстом хіро-блоку.",
    ),
    iconLinksField(
      "serviceLinks",
      "Service links (Catering / Event Decoration)",
      "The 2 link chips shown under the services statement. / 2 посилання-кнопки під описом послуг.",
    ),
    defineField({
      name: "communityTitle",
      title: "Community heading",
      type: "internationalizedArrayString",
      fieldset: "linksSection",
      description: 'Small heading above the community links, e.g. "Community". / Заголовок над посиланнями спільноти, напр. «Спільнота».',
    }),
    defineField({
      name: "communityText",
      title: "Community text",
      type: "internationalizedArrayText",
      fieldset: "linksSection",
      description: "Short text above the community links. / Короткий текст над посиланнями спільноти.",
    }),
    iconLinksField(
      "communityLinks",
      "Community links (WECODA / Work with us / Volunteer)",
      "The 3 link chips shown under the community text. / 3 посилання-кнопки під текстом про спільноту.",
    ),
    defineField({
      name: "values",
      title: "Values",
      type: "array",
      fieldset: "valuesSection",
      of: [defineArrayMember({ type: "titledText" })],
      description: "Legacy field, no longer read by the site (replaced by communityTitle/communityText above) — kept only so no historical content is lost. / Застаріле поле, сайт більше його не використовує (замінено на communityTitle/communityText вище) — залишено лише для збереження попереднього вмісту.",
      hidden: true,
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
