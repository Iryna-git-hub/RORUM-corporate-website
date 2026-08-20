import { defineArrayMember, defineField, defineType, type SanityDocument } from "sanity";
import { ACTION_ICONS } from "@/sanity/components/actionIcons";
import { allOrNothingForSelectedEventLocales, requireSelectedEventLocales } from "@/sanity/lib/i18nValidation";
import { EventLocalizedFieldNotice } from "@/sanity/components/EventLocalizedFieldNotice";
import { EventLocaleAwareInput } from "@/sanity/components/EventLocaleAwareInput";

const WEBSITE_LOCALE_OPTIONS = [
  { title: "English", value: "en" },
  { title: "Danish", value: "da" },
  { title: "Ukrainian", value: "uk" },
] as const;

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
  { title: "Share", value: "share" },
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
    // --- 0. Show on website languages ---------------------------------------
    // The single source of truth for which localized website versions this
    // event is shown on — deliberately placed first, above title/slug/image,
    // so a manager decides "who is this for?" before touching any content.
    // Distinct from `language` below (which language the physical event is
    // conducted in) — see that field's own description for the same
    // clarifying cross-reference in the other direction.
    //
    // Renders as checkboxes: Sanity's default input for `array of string`
    // with a predefined `options.list` (no `layout` override) is a checkbox
    // group — an immediately visible multi-select, not a technical
    // free-text array or a searchable tag/reference picker.
    defineField({
      name: "visibleLocales",
      title: "Show on website languages",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { list: [...WEBSITE_LOCALE_OPTIONS] },
      description:
        "Which localized versions of the website show this event — controls the Home/Events listing feeds, which " +
        "/[locale]/events/[slug] routes exist (any other locale 404s), which translations are required below, and " +
        "which URLs appear in the sitemap. At least one language must stay selected. This is separate from " +
        '"Event language" further down, which describes the language spoken AT the event itself. / ' +
        "Якими мовами показується ця подія на сайті — впливає на стрічку подій на головній і в переліку подій, на " +
        "те, які маршрути /[locale]/events/[slug] існують (інші мови повертають 404), які переклади обов'язкові " +
        "нижче, і які URL-адреси потрапляють у sitemap. Має бути обрана хоча б одна мова. Це не те саме, що «Мова " +
        "події» нижче — там йдеться про мову, якою проводиться сама подія.",
      initialValue: ["en", "da", "uk"],
      validation: (rule) => rule.required().min(1).error("Select at least one website language for this event."),
    }),

    // --- 1. Title ---------------------------------------------------------
    // First localized field — carries the "shown in: ..." notice (Task 7:
    // near the top of the localized content area, not buried further down).
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      fieldset: "basicSection",
      description:
        "Event name. Required for every language selected in \"Show on website languages\" above. / " +
        "Назва події. Обов'язково для кожної мови, обраної вище в полі «Show on website languages».",
      components: { field: EventLocalizedFieldNotice, input: EventLocaleAwareInput },
      validation: requireSelectedEventLocales(),
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
      description:
        "The full description shown on the event detail page. Required for every language selected in \"Show on " +
        "website languages\" above. / Повний опис на сторінці конкретної події. Обов'язково для кожної мови, " +
        "обраної вище в полі «Show on website languages».",
      components: { input: EventLocaleAwareInput },
      validation: requireSelectedEventLocales(),
    }),

    // --- 9. What to Expect --------------------------------------------------
    defineField({
      name: "whatToExpect",
      title: "What to Expect",
      type: "internationalizedArrayText",
      description:
        "One line per bullet — press Enter to start a new bullet, blank lines are ignored. Add, remove, edit or " +
        "reorder bullets by editing the lines. Required for every language selected in \"Show on website " +
        "languages\" above. / Один рядок на пункт — натисніть Enter, щоб почати новий пункт, порожні рядки " +
        "ігноруються. Додавайте, видаляйте, редагуйте чи змінюйте порядок пунктів, редагуючи рядки. Обов'язково для " +
        "кожної мови, обраної вище в полі «Show on website languages».",
      initialValue: [{ _key: "en", _type: "internationalizedArrayTextValue", language: "en", value: WHAT_TO_EXPECT_DEFAULT_EN }],
      components: { input: EventLocaleAwareInput },
      validation: requireSelectedEventLocales(),
    }),
    defineField({
      name: "included",
      title: "What's included (currently unused)",
      type: "array",
      of: [defineArrayMember({ type: "bulletText" })],
      hidden: () => true,
      description: "Hidden — no page currently renders this list. Data (if any) is preserved. / Приховано — жодна сторінка наразі не показує цей список. Дані (якщо є) збережено.",
    }),

    // --- 10. Practical Details (Language, Duration, Arrival, Ticket provider) ---
    defineField({
      name: "language",
      title: "Event language",
      type: "string",
      fieldset: "practicalSection",
      description:
        'The language the event is CONDUCTED in (e.g. a workshop run in Danish). This is NOT the same as "Show on ' +
        'website languages" above, which controls which website versions display this event — an event conducted ' +
        "in English can still be shown only on the Ukrainian website, for example. / Мова, якою ПРОВОДИТЬСЯ сама " +
        'подія (напр. воркшоп данською). Це НЕ те саме, що «Show on website languages» вище — те поле визначає, ' +
        "якими мовами сайту показується подія; подія англійською мовою може показуватися лише на українській версії сайту.",
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
      description:
        "Short note about when to arrive. Required for every language selected in \"Show on website languages\" " +
        "above. / Короткий напис про час прибуття. Обов'язково для кожної мови, обраної вище в полі «Show on " +
        "website languages».",
      initialValue: [
        localizedStringValue("en", "Please arrive 5-10 minutes before the event begins."),
        localizedStringValue("da", "Ankom venligst 5-10 minutter, før arrangementet begynder."),
        localizedStringValue("uk", "Будь ласка, прийдіть за 5-10 хвилин до початку події."),
      ],
      components: { input: EventLocaleAwareInput },
      validation: requireSelectedEventLocales(),
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
          title: "Ticket provider label",
          type: "internationalizedArrayString",
          description:
            'The label shown before the ticket provider name. Editable separately for this event in English, Danish and Ukrainian — leave a language blank to use the site-wide default label for that language instead. / Напис перед назвою постачальника квитків. Редагується окремо для цієї події англійською, данською та українською — залиште мову порожньою, щоб використати спільний напис за замовчуванням для цієї мови.',
          initialValue: [
            localizedStringValue("en", "Ticket provider"),
            localizedStringValue("da", "Billetudbyder"),
            localizedStringValue("uk", "Квитковий оператор"),
          ],
          // Optional override (empty is always fine — falls back to the
          // shared label, see resolveTicketProviderLabel) but if used at all,
          // must be complete for every SELECTED website language — a locale
          // this event isn't even shown in is never required here, even if
          // this specific field happens to hold stray data for it.
          components: { input: EventLocaleAwareInput },
          validation: allOrNothingForSelectedEventLocales(),
        }),
        defineField({
          name: "value",
          title: "Ticket provider name",
          type: "internationalizedArrayString",
          description: 'The actual ticketing service name, for example "Billetto". / Фактична назва сервісу продажу квитків, наприклад «Billetto».',
          initialValue: [localizedStringValue("en", "Billetto"), localizedStringValue("da", "Billetto"), localizedStringValue("uk", "Billetto")],
          components: { input: EventLocaleAwareInput },
          validation: allOrNothingForSelectedEventLocales(),
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
              return {
                title: en?.value ?? typeTitle,
                subtitle: `${typeTitle} — ${enabled ? "Enabled" : "Disabled"}`,
                media: typeof type === "string" ? ACTION_ICONS[type] : undefined,
              };
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
        shareActionInitialValue("share", "Share", "Del", "Поділитися"),
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
      description: 'Optional override for the ticket button\'s text — defaults to "Buy Ticket" when empty. If used, must be filled in for every selected website language. / Необов\'язковий текст кнопки квитків — за замовчуванням «Buy Ticket», якщо не заповнено. Якщо заповнено, має бути заповнено для кожної обраної мови сайту.',
      components: { input: EventLocaleAwareInput },
      validation: allOrNothingForSelectedEventLocales(),
    }),
    defineField({
      name: "calendarUrl",
      title: "Add-to-calendar URL (currently unused)",
      type: "url",
      fieldset: "ticketSection",
      hidden: () => true,
      description: "Hidden — no add-to-calendar control currently exists on the site. Data (if any) is preserved. / Приховано — на сайті наразі немає елемента «додати в календар». Дані (якщо є) збережено.",
    }),
    defineField({
      name: "waitlistUrl",
      title: "Waitlist URL (currently unused)",
      type: "string",
      fieldset: "ticketSection",
      hidden: () => true,
      description:
        "Hidden — no waitlist control currently exists on the site. Data (if any) is preserved. / Приховано — на сайті наразі немає елемента списку очікування. Дані (якщо є) збережено.",
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
