import { defineArrayMember, defineField, defineType } from "sanity";

// Field names deliberately mirror `RorumEvent` in `lib/data.ts` so the
// import script's mapping is a near 1:1 transcription, not a redesign.
// `language`, `date`, `time`, `price`, `host`, `ticketProvider` and the
// ticket/waitlist/calendar URLs are NOT localized — per the localization
// model, shared non-linguistic values (dates, prices, external URLs
// identical across languages) live once, not duplicated per language.
export default defineType({
  name: "event",
  title: "Event",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "details", title: "Practical details" },
    { name: "tickets", title: "Tickets & links" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      group: "content",
      validation: (rule) =>
        rule.custom((value) =>
          (value as { _key: string; value?: string }[] | undefined)?.find((v) => v._key === "en")
            ?.value
            ? true
            : "English title is required.",
        ),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      description: "Preserve the existing slug exactly — it is the event's public URL.",
      options: { source: "title.0.value" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "image",
      title: "Banner image",
      type: "imageWithAlt",
      group: "content",
      description: "Used everywhere this event appears: listing card, homepage, detail hero, Open Graph.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "eventCategory" }],
      group: "content",
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "date",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "time",
      title: "Time range",
      type: "string",
      group: "content",
      description: 'E.g. "18:30-21:30".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      group: "content",
      description: 'E.g. "295 kr." or "Free".',
    }),
    defineField({
      name: "language",
      title: "Event language",
      type: "string",
      group: "content",
      options: { list: ["English", "Danish", "Ukrainian"] },
    }),
    defineField({
      name: "host",
      title: "Host",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "isSoldOut",
      title: "Sold out",
      type: "boolean",
      group: "content",
      initialValue: false,
    }),
    defineField({
      name: "shortDescription",
      title: "Short description",
      type: "internationalizedArrayText",
      group: "content",
      description: "Used on listing cards.",
    }),
    defineField({
      name: "longDescription",
      title: "Long description",
      type: "internationalizedArrayText",
      group: "content",
      description: "Used on the event detail page.",
    }),
    defineField({
      name: "included",
      title: "What's included",
      type: "array",
      group: "details",
      of: [defineArrayMember({ type: "internationalizedArrayString" })],
    }),
    defineField({
      name: "whatToExpect",
      title: "What to expect",
      type: "array",
      group: "details",
      of: [defineArrayMember({ type: "internationalizedArrayString" })],
    }),
    defineField({
      name: "practicalDetails",
      title: "Practical details",
      type: "array",
      group: "details",
      of: [defineArrayMember({ type: "practicalDetail" })],
    }),
    defineField({
      name: "ticketProvider",
      title: "Ticket provider name",
      type: "string",
      group: "tickets",
    }),
    defineField({
      name: "ticketUrl",
      title: "Ticket purchase URL",
      type: "url",
      group: "tickets",
    }),
    defineField({
      name: "calendarUrl",
      title: "Add-to-calendar URL",
      type: "url",
      group: "tickets",
    }),
    defineField({
      name: "waitlistUrl",
      title: "Waitlist URL",
      type: "string",
      group: "tickets",
      description: "Usually a mailto: link with a prefilled subject.",
    }),
    defineField({
      name: "ticketsLeft",
      title: "Tickets left",
      type: "number",
      group: "tickets",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "relatedEvents",
      title: "Related events",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "reference", to: [{ type: "event" }] })],
      validation: (rule) => rule.max(4),
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      group: "seo",
    }),
  ],
  preview: {
    select: { title: "title", date: "date", media: "image" },
    prepare({ title, date, media }) {
      const en = (title as { _key: string; value?: string }[] | undefined)?.find(
        (v) => v._key === "en",
      );
      return { title: en?.value ?? "(untitled event)", subtitle: date, media };
    },
  },
});
