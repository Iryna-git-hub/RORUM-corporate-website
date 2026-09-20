import { defineField, defineType } from "sanity";

export default defineType({
  name: "practicalDetail",
  title: "Practical detail",
  type: "object",
  description:
    "One label/value pair in an event's practical details list. / Одна пара «назва/значення» у списку практичної інформації про подію.",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "internationalizedArrayString",
      description: 'E.g. "Address", "Duration", "Language". / Напр. «Адреса», «Тривалість», «Мова».',
    }),
    defineField({
      name: "value",
      title: "Value",
      type: "internationalizedArrayString",
      description: 'The corresponding value, e.g. "2 hours". / Відповідне значення, напр. «2 години».',
    }),
  ],
  preview: {
    select: { label: "label" },
    prepare({ label }) {
      const en = (label as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? "(untitled)" };
    },
  },
});
