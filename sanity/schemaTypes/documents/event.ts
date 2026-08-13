import { defineArrayMember, defineField, defineType, type SanityDocument } from "sanity";

// Field names deliberately mirror `RorumEvent` in `lib/data.ts` so the
// import script's mapping is a near 1:1 transcription, not a redesign.
// `language`, `date`, `time`, `price`, `address` and the ticket/waitlist/
// calendar URLs are NOT localized — per the localization model, shared
// non-linguistic values (dates, prices, external URLs, a street address)
// live once, not duplicated per language.
//
// No `groups`/tabs: all fields render on one continuous page, in the same
// top-to-bottom order the corresponding sections appear on the individual
// event page — `fieldsets` group them visually (collapsible) without
// splitting the form into tabs.
//
// LEGACY FIELDS (`shortDescription`, `practicalDetails`, `ticketProvider`):
// superseded by `address`/`duration`/`arrival`/`ticketProviderInfo` below,
// but kept declared here (with `hidden: () => true`) rather than deleted —
// every pre-existing event document still has real, already-translated data
// in these fields, and lib/sanityEvents.ts reads them as a fallback for any
// document that hasn't been migrated to the new fields yet. See
// MIGRATION_REPORT.md for the one-time migration this project ran to move
// existing events' data into the new fields (after which these are only a
// safety net, not the primary source).
const SHARE_ACTION_TYPES = [
  { title: "Copy link", value: "copyLink" },
  { title: "WhatsApp", value: "whatsapp" },
  { title: "Email", value: "email" },
  { title: "LinkedIn", value: "linkedin" },
  { title: "Facebook", value: "facebook" },
  { title: "Instagram", value: "instagram" },
] as const;

function localizedStringValue(language: "en" | "da" | "uk", value: string) {
  return { _key: language, _type: "internationalizedArrayStringValue" as const, language, value };
}

function shareActionInitialValue(type: (typeof SHARE_ACTION_TYPES)[number]["value"], en: string, da: string, uk: string) {
  return {
    _key: type,
    _type: "shareAction",
    type,
    enabled: true,
    label: [localizedStringValue("en", en), localizedStringValue("da", da), localizedStringValue("uk", uk)],
  };
}

// The 5 bullet lines that were this project's hardcoded fallback
// (`fallbackExpectations` in the event detail page) whenever an event's own
// `whatToExpect` was empty — i.e. exactly what a brand-new event has
// effectively been showing site visitors already. Reused verbatim as the
// prepopulated default for new events, per this project's translation
// policy: only English exists for these lines (Danish/Ukrainian have not
// been approved for this exact text), so `da`/`uk` are intentionally left
// unset rather than invented — see MIGRATION_REPORT.md.
const WHAT_TO_EXPECT_DEFAULT_EN = [
  "A small and welcoming group format",
  "A calm, thoughtfully prepared room",
  "Practical inspiration and hands-on guidance",
  "Time for conversation and questions",
  "Tea, water or simple refreshments",
].join("\n");

export default defineType({
  name: "event",
  title: "Event",
  type: "document",
  description: "One event shown on the Attend Events page. / Одна подія, що показується на сторінці «Відвідати події».",
  fieldsets: [
    { name: "basicSection", title: "Basic event information", options: { collapsible: true, collapsed: false } },
    { name: "factsSection", title: "Date, time, price & address", options: { collapsible: true, collapsed: false } },
    { name: "practicalSection", title: "Practical details", options: { collapsible: true, collapsed: false } },
    { name: "ticketSection", title: "Ticket link & button", options: { collapsible: true, collapsed: false } },
  ],
  fields: [
    // --- 1. Title ---------------------------------------------------------
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
    // --- 2. Slug -----------------------------------------------------------
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
        // editor happened to fill in first.
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

    // --- 3. Event image & alt text ------------------------------------------
    defineField({
      name: "image",
      title: "Banner image",
      type: "imageWithAlt",
      description:
        "Used everywhere this event appears: listing card, homepage, detail hero, Open Graph. Alt text is edited inside this field. / Використовується всюди, де показується подія: картка в списку, головна сторінка, сторінка події, Open Graph. Альтернативний текст редагується всередині цього поля.",
      validation: (rule) => rule.required(),
    }),

    // --- 4-7. Date, time, price, address --------------------------------
    defineField({
      name: "date",
      title: "Date",
      type: "date",
      fieldset: "factsSection",
      description: "The event's date. / Дата події.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "time",
      title: "Time range",
      type: "string",
      fieldset: "factsSection",
      description: 'E.g. "18:30-21:30". / Напр. «18:30-21:30».',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      fieldset: "factsSection",
      description: 'E.g. "295 kr." or "Free". / Напр. «295 крон» або «Безкоштовно».',
    }),
    defineField({
      name: "address",
      title: "Address",
      type: "string",
      fieldset: "factsSection",
      description:
        "Defaults to the site's contact address for new events — override if this specific event is held somewhere else. / За замовчуванням береться контактна адреса сайту для нових подій — змініть, якщо ця подія проходить в іншому місці.",
      initialValue: async (_value, context) => {
        const client = context.getClient({ apiVersion: "2025-02-19" });
        const contactInfo = await client.fetch<{ shortAddress?: string } | null>(
          `*[_id == "contactInfo"][0]{shortAddress}`,
        );
        return contactInfo?.shortAddress ?? "";
      },
    }),

    // --- 8. Event Overview ------------------------------------------------
    defineField({
      name: "longDescription",
      title: "Event Overview",
      type: "internationalizedArrayText",
      description: "The full description shown on the event detail page. / Повний опис на сторінці конкретної події.",
    }),

    // --- 9. What to Expect --------------------------------------------------
    defineField({
      name: "whatToExpect",
      title: "What to Expect",
      type: "internationalizedArrayText",
      description:
        "One line per bullet — press Enter to start a new bullet, blank lines are ignored. Add, remove, edit or reorder bullets by editing the lines. / Один рядок на пункт — натисніть Enter, щоб почати новий пункт, порожні рядки ігноруються. Додавайте, видаляйте, редагуйте чи змінюйте порядок пунктів, редагуючи рядки.",
      initialValue: [{ _key: "en", _type: "internationalizedArrayTextValue", language: "en", value: WHAT_TO_EXPECT_DEFAULT_EN }],
    }),
    defineField({
      name: "included",
      title: "What's included",
      type: "array",
      of: [defineArrayMember({ type: "bulletText" })],
      description: "Optional bullet list of what's included in the event (not currently shown on the site). / Необов'язковий список того, що входить у подію (наразі не показується на сайті).",
    }),

    // --- 10. Practical Details (Language, Duration, Arrival, Ticket provider) ---
    defineField({
      name: "language",
      title: "Event language",
      type: "string",
      fieldset: "practicalSection",
      description: "The language the event is held in. / Мова, якою проводиться подія.",
      options: { list: ["English", "Danish", "Ukrainian"] },
    }),
    defineField({
      name: "duration",
      title: "Duration",
      type: "object",
      fieldset: "practicalSection",
      description: "How long the event runs. / Тривалість події.",
      fields: [
        defineField({
          name: "value",
          title: "Number",
          type: "number",
          validation: (rule) => rule.required().greaterThan(0),
        }),
        defineField({
          name: "unit",
          title: "Unit",
          type: "string",
          options: {
            list: [
              { title: "Minutes", value: "minutes" },
              { title: "Hours", value: "hours" },
            ],
            layout: "radio",
          },
          initialValue: "hours",
          validation: (rule) => rule.required(),
        }),
      ],
      preview: {
        select: { value: "value", unit: "unit" },
        prepare({ value, unit }) {
          return { title: typeof value === "number" ? `${value} ${unit ?? ""}`.trim() : "(not set)" };
        },
      },
    }),
    defineField({
      name: "arrival",
      title: "Arrival note",
      type: "internationalizedArrayString",
      fieldset: "practicalSection",
      description: "Short note about when to arrive. / Короткий напис про час прибуття.",
      initialValue: [
        localizedStringValue("en", "Please arrive 5-10 minutes before the event begins."),
        localizedStringValue("da", "Ankom venligst 5-10 minutter, før arrangementet begynder."),
        localizedStringValue("uk", "Будь ласка, прийдіть за 5-10 хвилин до початку події."),
      ],
    }),
    defineField({
      name: "ticketProviderInfo",
      title: "Ticket provider",
      type: "object",
      fieldset: "practicalSection",
      description:
        "Display-only info about who provides tickets — editable per event, does not change the actual ticket link below. / Інформація для показу про постачальника квитків — редагується для кожної події, не змінює саме посилання на квитки нижче.",
      fields: [
        defineField({
          name: "label",
          title: "Label",
          type: "internationalizedArrayString",
          description: 'What this field is called, e.g. "Ticket provider". / Як називається це поле, напр. «Постачальник квитків».',
          initialValue: [localizedStringValue("en", "Ticket provider")],
        }),
        defineField({
          name: "value",
          title: "Value",
          type: "internationalizedArrayString",
          description: 'The displayed text, e.g. "Billetto". / Текст, що показується, напр. «Billetto».',
          initialValue: [localizedStringValue("en", "Billetto"), localizedStringValue("da", "Billetto"), localizedStringValue("uk", "Billetto")],
        }),
      ],
    }),

    // --- 11. Share with Friends -----------------------------------------------
    defineField({
      name: "shareSettings",
      title: "Share with Friends",
      type: "array",
      description:
        "Which sharing actions appear on this event's page, and in what order. Drag to reorder; toggle Enabled to show/hide an action. / Які дії поширення показуються на сторінці події та в якому порядку. Перетягуйте, щоб змінити порядок; вмикайте/вимикайте перемикачем Enabled.",
      of: [
        defineArrayMember({
          type: "object",
          name: "shareAction",
          fields: [
            defineField({
              name: "type",
              title: "Action",
              type: "string",
              options: { list: SHARE_ACTION_TYPES.map(({ title, value }) => ({ title, value })) },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "label",
              title: "Display label",
              type: "internationalizedArrayString",
              description:
                "Shown to editors here, and used as this action's accessible (screen-reader) name on the site. / Показується редакторам тут і використовується як назва цієї дії для програм читання з екрана на сайті.",
            }),
            defineField({
              name: "enabled",
              title: "Enabled",
              type: "boolean",
              initialValue: true,
              description: "Uncheck to hide this action on this event without removing it. / Зніміть позначку, щоб приховати цю дію для цієї події без видалення.",
            }),
          ],
          preview: {
            select: { type: "type", enabled: "enabled", label: "label" },
            prepare({ type, enabled, label }) {
              const en = (label as { _key: string; language?: string; value?: string }[] | undefined)?.find(
                (v) => v.language === "en" || v._key === "en",
              );
              const typeTitle = SHARE_ACTION_TYPES.find((t) => t.value === type)?.title ?? (type as string) ?? "(untitled)";
              return { title: en?.value ?? typeTitle, subtitle: `${typeTitle} — ${enabled ? "Enabled" : "Disabled"}` };
            },
          },
        }),
      ],
      validation: (rule) =>
        rule.custom((items) => {
          const types = (items as { type?: string }[] | undefined)?.map((i) => i.type).filter(Boolean) ?? [];
          return new Set(types).size === types.length ? true : "Each share action can only be used once per event.";
        }),
      initialValue: [
        shareActionInitialValue("copyLink", "Copy link", "Kopiér link", "Копіювати посилання"),
        shareActionInitialValue("whatsapp", "WhatsApp", "WhatsApp", "WhatsApp"),
        shareActionInitialValue("email", "Email", "E-mail", "Електронна пошта"),
        shareActionInitialValue("linkedin", "LinkedIn", "LinkedIn", "LinkedIn"),
        shareActionInitialValue("facebook", "Facebook", "Facebook", "Facebook"),
        shareActionInitialValue("instagram", "Instagram", "Instagram", "Instagram"),
      ],
    }),

    // --- 12. Ticket link & button --------------------------------------------
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

    // --- 13. SEO ----------------------------------------------------------------
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),

    // --- Legacy fields (hidden from Studio, kept for existing-document compat) --
    defineField({
      name: "shortDescription",
      title: "Short description (legacy)",
      type: "internationalizedArrayText",
      hidden: () => true,
      description: "Superseded by Event Overview. Hidden from Studio; kept only so already-published events' SEO/share text keeps working until migrated. / Замінено полем «Event Overview». Приховано в Studio; збережено лише для сумісності з уже опублікованими подіями.",
    }),
    defineField({
      name: "practicalDetails",
      title: "Practical details (legacy)",
      type: "array",
      hidden: () => true,
      of: [defineArrayMember({ type: "practicalDetail" })],
      description: "Superseded by the dedicated Address/Duration/Arrival/Ticket provider fields above. Hidden from Studio. / Замінено окремими полями «Адреса»/«Тривалість»/«Прибуття»/«Постачальник квитків» вище. Приховано в Studio.",
    }),
    defineField({
      name: "ticketProvider",
      title: "Ticket provider name (legacy)",
      type: "string",
      hidden: () => true,
      description: "Superseded by the localized Ticket provider field above. Hidden from Studio. / Замінено локалізованим полем «Постачальник квитків» вище. Приховано в Studio.",
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
