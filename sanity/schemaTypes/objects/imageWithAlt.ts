import { defineField, defineType } from "sanity";

export default defineType({
  name: "imageWithAlt",
  title: "Image",
  type: "image",
  description:
    "An image with required alt text for accessibility. / Зображення з обов'язковим альтернативним текстом для доступності.",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Alt text",
      type: "internationalizedArrayString",
      description:
        "Describes the image for screen readers and search engines. Required. / Опис зображення для програм читання з екрана та пошукових систем. Обов'язково.",
      validation: (rule) =>
        rule.custom((value) => {
          const en = (value as { _key: string; language?: string; value?: string }[] | undefined)?.find(
            (v) => v.language === "en" || v._key === "en",
          );
          return en?.value ? true : "English alt text is required.";
        }),
    }),
  ],
});
