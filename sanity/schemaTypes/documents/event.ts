import { defineArrayMember, defineField, defineType, type SanityDocument } from "sanity";

// Field names deliberately mirror `RorumEvent` in `lib/data.ts` so the
// import script's mapping is a near 1:1 transcription, not a redesign.
// `language`, `date`, `time`, `price`, `ticketProvider` and the
// ticket/waitlist/calendar URLs are NOT localized — per the localization
// model, shared non-linguistic values (dates, prices, external URLs
// identical across languages) live once, not duplicated per language.
//
// No `groups`/tabs: all fields render on one continuous page, in the same
// top-to-bottom order the corresponding sections appear on the individual
// event page (Basic info → Event image → Event Overview → What to Expect →
// Practical Details → Ticket information → SEO) — `fieldsets` group them
// visually (collapsible) without splitting the form into tabs.
export default defineType({
  name: "event",
  title: "Event",
  type: "document",
  description: "One event shown on the Attend Events page. / Одна подія, що показується на сторінці «Відвідати події».",
  fieldsets: [
    { name: "basicSection", title: "Basic event information", options: { collapsible: true, collapsed: false } },
    { name: "practicalSection", title: "Practical details", options: { collapsible: true, collapsed: false } },
    { name: "ticketSection", title: "Ticket information", options: { collapsible: true, collapsed: false } },
  ],
  fields: [
    // --- 1. Basic event information -----------------------------------------
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      fieldset: "basicSection",
      description: "Event name (English required). / Назва події (обов'язково англійською).",
      validation: (rule) =>
        rule.custom((value) =>
          (value as { _key: string; language?: string; value?: string }[] | undefined)?.find((v) => v.language === "en" || v._key === "en")
            ?.value
            ? true
            : "English title is required.",
        ),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      fieldset: "basicSection",
      description:
        "The event's public URL segment. Click \"Generate\" to build it from the English title, or preserve an existing slug exactly if this event already has one. / Частина публічної URL-адреси події. Натисніть «Generate», щоб створити її з англійської назви, або збережіть наявний слаг без змін, якщо подія вже має URL.",
      options: {
        // Reads the `en`-language title entry specifically (not array index
        // 0) so slug generation is correct regardless of which language an
        // editor happened to fill in first — the previous `"title.0.value"`
        // source silently generated a Danish/Ukrainian (or empty) slug
        // whenever English wasn't the first entry in the array.
        source: (doc: SanityDocument) => {
          const title = doc.title as { language?: string; value?: string }[] | undefined;
          return title?.find((t) => t.language === "en")?.value ?? title?.[0]?.value ?? "";
        },
        slugify: (input: string) =>
          input
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 96),
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "shortDescription",
      title: "Short description",
      type: "internationalizedArrayText",
      fieldset: "basicSection",
      description: "Excerpt used on listing cards. / Короткий опис для карток у списку подій.",
    }),
    // --- 2. Event image -------------------------------------------------------
    defineField({
      name: "image",
      title: "Banner image",
      type: "imageWithAlt",
      description:
        "Used everywhere this event appears: listing card, homepage, detail hero, Open Graph. / Використовується всюди, де показується подія: картка в списку, головна сторінка, сторінка події, Open Graph.",
      validation: (rule) => rule.required(),
    }),

    // --- 3. Event Overview ------------------------------------------------
    defineField({
      name: "longDescription",
      title: "Event Overview",
      type: "internationalizedArrayText",
      description: "The full description shown on the event detail page. / Повний опис на сторінці конкретної події.",
    }),

    // --- 4. What to Expect --------------------------------------------------
    defineField({
      name: "whatToExpect",
      title: "What to Expect",
      type: "array",
      of: [defineArrayMember({ type: "bulletText" })],
      description: "Bullet list of what to expect, shown on the event detail page. / Список того, чого очікувати від події — показується на сторінці події.",
    }),
    defineField({
      name: "included",
      title: "What's included",
      type: "array",
      of: [defineArrayMember({ type: "bulletText" })],
      description: "Optional bullet list of what's included in the event (not currently shown on the site). / Необов'язковий список того, що входить у подію (наразі не показується на сайті).",
    }),

    // --- 5. Practical Details ------------------------------------------------
    defineField({
      name: "date",
      title: "Date",
      type: "date",
      fieldset: "practicalSection",
      description: "The event's date. / Дата події.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "time",
      title: "Time range",
      type: "string",
      fieldset: "practicalSection",
      description: 'E.g. "18:30-21:30". / Напр. «18:30-21:30».',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      fieldset: "practicalSection",
      description: 'E.g. "295 kr." or "Free". / Напр. «295 крон» або «Безкоштовно».',
    }),
    defineField({
      name: "language",
      title: "Event language",
      type: "string",
      fieldset: "practicalSection",
      description: "The language the event is held in. / Мова, якою проводиться подія.",
      options: { list: ["English", "Danish", "Ukrainian"] },
    }),
    defineField({
      name: "practicalDetails",
      title: "Practical details (Address, Duration, Arrival, etc.)",
      type: "array",
      fieldset: "practicalSection",
      of: [defineArrayMember({ type: "practicalDetail" })],
      description:
        'Extra label/value rows shown under "Practical Details" on the event page — e.g. Address, Duration, Arrival. / Додаткові пари «назва/значення» в блоці «Практична інформація» на сторінці події — напр. адреса, тривалість, час прибуття.',
    }),
    defineField({
      name: "ticketProvider",
      title: "Ticket provider name",
      type: "string",
      fieldset: "practicalSection",
      description: 'E.g. "Billetto". / Напр. «Billetto».',
    }),

    // --- 6. Ticket information -----------------------------------------------
    defineField({
      name: "ticketUrl",
      title: "Ticket purchase URL",
      type: "url",
      fieldset: "ticketSection",
      description: "Where guests buy tickets. / Куди веде посилання для купівлі квитків.",
    }),
    defineField({
      name: "ticketButtonLabel",
      title: "Ticket button text",
      type: "internationalizedArrayString",
      fieldset: "ticketSection",
      description: 'Optional override for the ticket button\'s text — defaults to "Buy Ticket" when empty. / Необов\'язковий текст кнопки квитків — за замовчуванням «Buy Ticket», якщо не заповнено.',
    }),
    defineField({
      name: "calendarUrl",
      title: "Add-to-calendar URL",
      type: "url",
      fieldset: "ticketSection",
      description: "Link that adds the event to a calendar. / Посилання, що додає подію в календар.",
    }),
    defineField({
      name: "waitlistUrl",
      title: "Waitlist URL",
      type: "string",
      fieldset: "ticketSection",
      description:
        "Usually a mailto: link with a prefilled subject. / Зазвичай посилання mailto: із заздалегідь заповненою темою листа.",
    }),
    defineField({
      name: "ticketsLeft",
      title: "Tickets left",
      type: "number",
      fieldset: "ticketSection",
      description: "Number of tickets remaining, if shown. / Кількість квитків, що залишилися (якщо показується).",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "isSoldOut",
      title: "Sold out",
      type: "boolean",
      fieldset: "ticketSection",
      initialValue: false,
      description: "Mark the event as sold out. / Позначити подію як розпродану.",
    }),

    // --- 7. SEO ----------------------------------------------------------------
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  preview: {
    select: { title: "title", date: "date", media: "image" },
    prepare({ title, date, media }) {
      const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? "(untitled event)", subtitle: date, media };
    },
  },
});
