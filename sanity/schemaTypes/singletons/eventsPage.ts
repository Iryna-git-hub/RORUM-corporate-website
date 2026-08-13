import { defineField, defineType } from "sanity";

// The events LISTING page's own heading + closing CTA content. The events
// themselves are separate `event` documents (see documents/event.ts).
export default defineType({
  name: "eventsPage",
  title: "Events (listing) page",
  type: "document",
  description:
    "The Attend Events listing page's own heading and closing section — individual events are separate documents. / Заголовок і завершальна секція сторінки «Відвідати події» — самі події є окремими документами.",
  // No `groups`/tabs: all fields render on one continuous page, in the same
  // top-to-bottom order the corresponding sections appear on the site.
  fields: [
    defineField({
      name: "title",
      title: "Page title",
      type: "internationalizedArrayString",
      description: 'E.g. "Upcoming events at RORUM". / Напр. «Найближчі події в RORUM».',
    }),
    defineField({
      name: "filters",
      title: "Event filter labels",
      type: "object",
      description:
        "Every label in the date/price/availability filter controls above the event list. / Усі написи в фільтрах за датою/ціною/доступністю над списком подій.",
      fields: [
        defineField({ name: "dateLabel", title: "\"Date\" filter label", type: "internationalizedArrayString", description: 'E.g. "Date". / Напр. «Дата».' }),
        defineField({ name: "languageLabel", title: "\"Languages\" filter label", type: "internationalizedArrayString", description: 'E.g. "Languages". / Напр. «Мови».' }),
        defineField({ name: "priceLabel", title: "\"Price\" filter label", type: "internationalizedArrayString", description: 'E.g. "Price". / Напр. «Ціна».' }),
        defineField({
          name: "availabilityLabel",
          title: "\"Availability\" filter label",
          type: "internationalizedArrayString",
          description: 'E.g. "Availability". / Напр. «Доступність».',
        }),
        defineField({ name: "soonestLabel", title: "\"Soonest first\"", type: "internationalizedArrayString", description: "Date filter option. / Варіант фільтра за датою." }),
        defineField({ name: "weekLabel", title: "\"This week\"", type: "internationalizedArrayString", description: "Date filter option. / Варіант фільтра за датою." }),
        defineField({ name: "monthLabel", title: "\"This month\"", type: "internationalizedArrayString", description: "Date filter option. / Варіант фільтра за датою." }),
        defineField({ name: "priceAscLabel", title: "\"From low to high\"", type: "internationalizedArrayString", description: "Price filter option. / Варіант фільтра за ціною." }),
        defineField({ name: "priceDescLabel", title: "\"From high to low\"", type: "internationalizedArrayString", description: "Price filter option. / Варіант фільтра за ціною." }),
        defineField({ name: "availableLabel", title: "\"Available\"", type: "internationalizedArrayString", description: "Availability filter option. / Варіант фільтра за доступністю." }),
        defineField({ name: "soldOutLabel", title: "\"Sold out\"", type: "internationalizedArrayString", description: "Availability filter option. / Варіант фільтра за доступністю." }),
        defineField({
          name: "clearFiltersLabel",
          title: "\"Clear filters\" link",
          type: "internationalizedArrayString",
          description: "Link that resets all filters. / Посилання, що скидає всі фільтри.",
        }),
      ],
    }),
    defineField({ name: "closingSection", title: "Closing section", type: "nextStepSection" }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Events (listing) page" };
    },
  },
});
