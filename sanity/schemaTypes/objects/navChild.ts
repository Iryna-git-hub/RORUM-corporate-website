import { defineField, defineType } from "sanity";

export default defineType({
  name: "navChild",
  title: "Dropdown link",
  type: "object",
  description:
    "One link inside a navigation dropdown. / Одне посилання всередині випадаючого меню навігації.",
  fields: [
    defineField({
      name: "href",
      title: "Path",
      type: "string",
      description: "Internal path, e.g. /events. / Внутрішній шлях, напр. /events.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "label",
      title: "Label",
      type: "internationalizedArrayString",
      description: "The link's visible text. / Видимий текст посилання.",
      validation: (r) =>
        r.custom((v) =>
          (v as { _key: string; language?: string; value?: string }[] | undefined)?.find((x) => x.language === "en" || x._key === "en")
            ?.value
            ? true
            : "English label is required.",
        ),
    }),
  ],
  preview: {
    select: { label: "label", href: "href" },
    prepare({ label, href }) {
      const en = (label as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? href, subtitle: href };
    },
  },
});
