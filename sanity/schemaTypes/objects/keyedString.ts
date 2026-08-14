import { defineField, defineType } from "sanity";

// A generic {key, value} pair, reused across the "shared labels" singletons
// (`eventMessages`, `formMessages`'s newer additions) — deliberately generic
// instead of one named field per string. Sanity's Content Lake enforces a
// hard cap on the total number of distinct attribute paths a project's
// schema can register; a named field per label would each count separately
// toward that cap, while every array item here reuses the same two paths
// (`key`, `value`) regardless of how many labels exist. `key` is a plain
// stable identifier the frontend looks up by — not itself editorial content.
export default defineType({
  name: "keyedString",
  title: "Label",
  type: "object",
  description: "One shared label: an identifying key plus its trilingual text. / Один спільний напис: ідентифікатор і його текст трьома мовами.",
  fields: [
    defineField({
      name: "key",
      title: "Key (do not change)",
      type: "string",
      description: "Stable identifier the website looks this label up by — do not rename existing rows. / Стабільний ідентифікатор, за яким сайт знаходить цей напис — не перейменовуйте наявні рядки.",
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({
      name: "value",
      title: "Text",
      type: "internationalizedArrayString",
      description: "The label's text. / Текст напису.",
    }),
  ],
  preview: {
    select: { key: "key", value: "value" },
    prepare({ key, value }) {
      const en = (value as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? "(untitled)", subtitle: key as string | undefined };
    },
  },
});
