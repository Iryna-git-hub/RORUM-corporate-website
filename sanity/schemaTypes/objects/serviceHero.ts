import { defineField, defineType } from "sanity";

// Shared hero shape for the catering / event-decoration / host-at-rorum
// pages: a label, a title, one paragraph, and up to two buttons — the same
// pattern each of those pages' hero section already uses.
export default defineType({
  name: "serviceHero",
  title: "Hero",
  type: "object",
  description:
    "Hero section shared by the Catering / Event Decoration / Host at RORUM pages. / Хіро-секція, спільна для сторінок Кейтеринг / Декор подій / Проведення подій у RORUM.",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "internationalizedArrayString",
      description: "Small label above the title. / Невеликий напис над заголовком.",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      description: "Hero heading. / Заголовок хіро-секції.",
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "internationalizedArrayText",
      description: "Intro paragraph. / Вступний абзац.",
    }),
    defineField({
      name: "primaryCta",
      title: "Primary button",
      type: "ctaLink",
      description: "Main button. / Основна кнопка.",
    }),
    defineField({
      name: "secondaryCta",
      title: "Secondary button (optional)",
      type: "ctaLink",
      description: "Optional second button. / Необов'язкова друга кнопка.",
    }),
  ],
});
