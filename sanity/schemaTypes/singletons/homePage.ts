import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  description: "The site's home page. / Головна сторінка сайту.",
  // No `groups`/tabs: all fields render on one continuous page, in the same
  // top-to-bottom order the corresponding sections appear on the site.
  // `fieldsets` are used purely for visual (collapsible) grouping — they
  // don't split the form into tabs.
  fieldsets: [
    { name: "heroSection", title: "Hero", options: { collapsible: true, collapsed: false } },
    { name: "quickPathsSection", title: "Quick paths", options: { collapsible: true, collapsed: false } },
    { name: "editorialSection", title: "Editorial sections", options: { collapsible: true, collapsed: false } },
    { name: "servicesSection", title: "Services teaser", options: { collapsible: true, collapsed: false } },
    { name: "communitySection", title: "Community teaser", options: { collapsible: true, collapsed: false } },
  ],
  fields: [
    defineField({ name: "heroLabel", title: "Hero label", type: "internationalizedArrayString", fieldset: "heroSection", description: "Small label above the hero title. / Невеликий напис над заголовком." }),
    defineField({ name: "heroTitle", title: "Hero title", type: "internationalizedArrayString", fieldset: "heroSection", description: "Main hero heading. / Основний заголовок хіро-блоку." }),
    defineField({ name: "heroText", title: "Hero text", type: "internationalizedArrayText", fieldset: "heroSection", description: "Intro paragraph under the hero title. / Вступний абзац під заголовком хіро-блоку." }),
    defineField({
      name: "heroTrustItems",
      title: "Hero trust badges",
      type: "array",
      fieldset: "heroSection",
      of: [defineArrayMember({ type: "bulletText" })],
      description: 'E.g. "Up to 12 guests", "Central Copenhagen" — the 4 facts shown at the bottom of the hero image. / Напр. «До 12 гостей», «У центрі Копенгагена» — 4 факти внизу зображення хіро-блоку.',
    }),
    defineField({ name: "heroImage", title: "Hero fallback image", type: "imageWithAlt", fieldset: "heroSection", description: "Shown if the hero video doesn't load/isn't set. / Показується, якщо відео хіро-блоку не завантажується/не задане." }),
    defineField({
      name: "heroVideoUrl",
      title: "Hero video URL",
      type: "string",
      fieldset: "heroSection",
      description: "Autoplaying background video (muted, looped). Leave empty to use the fallback image only. / Фонове відео з автовідтворенням (без звуку, у циклі). Залиште порожнім, щоб використовувати лише резервне зображення.",
    }),
    defineField({ name: "heroPrimaryCta", title: "Hero primary button", type: "ctaLink", fieldset: "heroSection" }),
    defineField({ name: "heroSecondaryCta", title: "Hero secondary button", type: "ctaLink", fieldset: "heroSection" }),
    defineField({
      name: "quickPathsLabel",
      title: "Quick paths section label",
      type: "internationalizedArrayString",
      fieldset: "quickPathsSection",
      description: 'E.g. "Quick paths". / Напр. «Швидкі шляхи».',
    }),
    defineField({
      name: "quickPathsTitle",
      title: "Quick paths section title",
      type: "internationalizedArrayString",
      fieldset: "quickPathsSection",
      description: 'E.g. "Start with what you need." / Напр. «Почніть з того, що вам потрібно».',
    }),
    defineField({
      name: "quickPaths",
      title: "Quick paths",
      type: "array",
      fieldset: "quickPathsSection",
      description: "The 4 cards linking to Events / Host at RORUM / Catering / Event decoration. / 4 картки з посиланнями на Події / Проведення подій у RORUM / Кейтеринг / Декор подій.",
      of: [
        defineArrayMember({
          type: "object",
          name: "quickPath",
          fields: [
            defineField({ name: "title", title: "Title", type: "internationalizedArrayString", description: "Card heading. / Заголовок картки." }),
            defineField({ name: "text", title: "Text", type: "internationalizedArrayText", description: "Card text. / Текст картки." }),
            defineField({ name: "href", title: "Link", type: "string", description: "Internal path, e.g. /events. / Внутрішній шлях, напр. /events." }),
            defineField({ name: "cta", title: "Link label", type: "internationalizedArrayString", description: 'E.g. "Explore events". / Напр. «Дізнатися про події».' }),
            defineField({ name: "image", title: "Image", type: "imageWithAlt" }),
          ],
          preview: {
            select: { title: "title" },
            prepare({ title }) {
              const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
                (v) => v.language === "en" || v._key === "en",
              );
              return { title: en?.value ?? "(untitled)" };
            },
          },
        }),
      ],
      validation: (rule) => rule.max(4),
    }),
    defineField({
      name: "eventsLabel",
      title: '"What\'s on" section label',
      type: "internationalizedArrayString",
      fieldset: "editorialSection",
      description: 'E.g. "What\'s on". / Напр. «Що відбувається».',
    }),
    defineField({
      name: "eventsTitle",
      title: '"What\'s on" section title',
      type: "internationalizedArrayString",
      fieldset: "editorialSection",
      description: 'E.g. "Upcoming events at RORUM". / Напр. «Найближчі події в RORUM».',
    }),
    defineField({
      name: "eventsViewAllLabel",
      title: '"View all events" button',
      type: "internationalizedArrayString",
      fieldset: "editorialSection",
      description: 'E.g. "View all events". / Напр. «Переглянути всі події».',
    }),
    defineField({
      name: "attendEventsFeature",
      title: "Attend Events feature block",
      type: "editorialFeature",
      fieldset: "editorialSection",
      description: "The large \"Attend Events\" section. / Великий блок «Відвідати події».",
    }),
    defineField({
      name: "hostAtRorumFeature",
      title: "Host at RORUM feature block",
      type: "editorialFeature",
      fieldset: "editorialSection",
      description: "The large \"Host at RORUM\" section. / Великий блок «Проведення подій у RORUM».",
    }),
    defineField({
      name: "servicesLabel",
      title: "Services section label",
      type: "internationalizedArrayString",
      fieldset: "servicesSection",
      description: 'E.g. "Services". / Напр. «Послуги».',
    }),
    defineField({
      name: "servicesTitle",
      title: "Services section title",
      type: "internationalizedArrayString",
      fieldset: "servicesSection",
      description: 'E.g. "Services for thoughtful gatherings". / Напр. «Послуги для продуманих подій».',
    }),
    defineField({
      name: "services",
      title: "Service teaser cards",
      type: "array",
      fieldset: "servicesSection",
      description: "The 2 cards linking to Catering / Event decoration. / 2 картки з посиланнями на Кейтеринг / Декор подій.",
      of: [
        defineArrayMember({
          type: "object",
          name: "serviceTeaser",
          fields: [
            defineField({ name: "title", title: "Title", type: "internationalizedArrayString", description: "Card heading. / Заголовок картки." }),
            defineField({ name: "text", title: "Text", type: "internationalizedArrayText", description: "Card text. / Текст картки." }),
            defineField({ name: "cta", title: "Link label", type: "internationalizedArrayString", description: 'E.g. "Explore catering". / Напр. «Дізнатися про кейтеринг».' }),
            defineField({ name: "href", title: "Link", type: "string", description: "Internal path, e.g. /catering. / Внутрішній шлях, напр. /catering." }),
            defineField({ name: "image", title: "Image", type: "imageWithAlt" }),
          ],
          preview: {
            select: { title: "title" },
            prepare({ title }) {
              const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
                (v) => v.language === "en" || v._key === "en",
              );
              return { title: en?.value ?? "(untitled)" };
            },
          },
        }),
      ],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: "communityLabel",
      title: "Community teaser label",
      type: "internationalizedArrayString",
      fieldset: "communitySection",
      description: 'E.g. "Community". / Напр. «Спільнота».',
    }),
    defineField({
      name: "communityTitle",
      title: "Community teaser title",
      type: "internationalizedArrayString",
      fieldset: "communitySection",
      description: 'E.g. "More than a space". / Напр. «Більше, ніж простір».',
    }),
    defineField({
      name: "communityText",
      title: "Community teaser text",
      type: "internationalizedArrayText",
      fieldset: "communitySection",
      description: "Paragraph inviting visitors to join the community. / Абзац із запрошенням приєднатися до спільноти.",
    }),
    defineField({
      name: "communityImage",
      title: "Community teaser background image",
      type: "imageWithAlt",
      fieldset: "communitySection",
      description: "Background photo behind the community teaser section. / Фонове фото за секцією про спільноту.",
    }),
    defineField({
      name: "communityLinks",
      title: "Community teaser links",
      type: "array",
      fieldset: "communitySection",
      description: "The 3 pill links (WECODA membership / Work with us / Volunteer with us). / 3 посилання-кнопки (членство WECODA / Робота з нами / Волонтерство).",
      of: [
        defineArrayMember({
          type: "object",
          name: "communityLink",
          fields: [
            defineField({ name: "label", title: "Label", type: "internationalizedArrayString", description: "Link text. / Текст посилання." }),
            defineField({ name: "href", title: "Link", type: "string", description: "Internal path. / Внутрішній шлях." }),
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
      validation: (rule) => rule.max(3),
    }),
    defineField({ name: "closingSection", title: "Closing section", type: "nextStepSection" }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Home page" };
    },
  },
});
