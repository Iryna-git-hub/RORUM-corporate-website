import { defineField, defineType } from "sanity";
import { IconPickerInput } from "@/sanity/components/IconPickerInput";

// Reused for the small icon+title+text cards that appear across several
// pages (catering formats, decoration formats, "suitable for" chips, etc.).
// `icon` stores a Lucide icon's exact PascalCase component name (e.g.
// "UtensilsCrossed") — editors pick it visually via `IconPickerInput`
// (searches and renders all of Lucide's ~1700 icons, not a fixed curated
// subset), and the frontend resolves the same name back to a component in
// lib/iconCardIcons.ts. Kept as a plain `type: "string"` (not a real enum)
// specifically so the picker isn't limited to a hand-maintained list.
export default defineType({
  name: "iconCard",
  title: "Icon card",
  type: "object",
  description:
    "A small card with an icon, title and optional text — used for service/format cards and \"suitable for\" chips. / Невелика картка з іконкою, заголовком і необов'язковим текстом — для карток послуг/форматів і міток «підходить для».",
  fields: [
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      description:
        "Pick the icon that best represents this card — search by name. / Оберіть іконку, яка найкраще відповідає цій картці — пошук за назвою.",
      components: { input: IconPickerInput },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      description: "Card heading. / Заголовок картки.",
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "internationalizedArrayText",
      description: "Optional short text. / Необов'язковий короткий текст.",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "icon" },
    prepare({ title, subtitle }) {
      const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? "(untitled)", subtitle };
    },
  },
});
