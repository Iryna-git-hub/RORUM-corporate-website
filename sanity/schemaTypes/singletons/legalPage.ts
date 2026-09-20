import { defineField, defineType } from "sanity";

// One schema TYPE, published as three separate singleton DOCUMENTS (terms,
// privacy-policy, cookie-policy — see structure.ts) since all three genuinely
// share the same shape: a title/subtitle hero and a body of rich text. This
// is the one case in the content model where reusing a single page schema
// across multiple documents is the right call instead of three near-
// identical bespoke schemas.
export default defineType({
  name: "legalPage",
  title: "Legal page",
  type: "document",
  description:
    "One legal page — Terms, Privacy Policy, or Cookie Policy — reusing the same title/subtitle/body shape. / Одна юридична сторінка — умови, політика конфіденційності або політика cookie — з однаковою структурою заголовок/підзаголовок/текст.",
  fields: [
    defineField({
      name: "pageKey",
      title: "Which page",
      type: "string",
      description: "Which legal page this document is (fixed, cannot be changed). / Яка це юридична сторінка (фіксовано, не змінюється).",
      options: { list: ["terms", "privacy-policy", "cookie-policy"] },
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({ name: "title", title: "Title", type: "internationalizedArrayString", description: "Page heading. / Заголовок сторінки." }),
    defineField({ name: "subtitle", title: "Subtitle", type: "internationalizedArrayText", description: "Short subtitle under the heading. / Короткий підзаголовок під заголовком." }),
    defineField({
      name: "lastUpdated",
      title: "Last updated",
      type: "date",
      description: "The date this policy was last revised. / Дата останнього оновлення цієї політики.",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "internationalizedArrayBodyPortableText",
      description: "The full legal text. / Повний юридичний текст.",
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    select: { pageKey: "pageKey", title: "title" },
    prepare({ pageKey, title }) {
      const en = (title as { language?: string; _key?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      const name =
        pageKey === "terms" ? "Terms" : pageKey === "privacy-policy" ? "Privacy Policy" : pageKey === "cookie-policy" ? "Cookie Policy" : "Legal page";
      return { title: en?.value?.trim() || name, subtitle: en?.value?.trim() ? name : undefined };
    },
  },
});
