import { defineField, defineType } from "sanity";

// SEO fields are localized (title/description differ per language) except
// the Open Graph image, which the content model intentionally shares across
// languages (same photo, no per-language asset duplication) unless a page
// genuinely needs a different one — see the localization-model note in
// MIGRATION_REPORT.md.
export default defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "SEO title",
      type: "internationalizedArrayString",
      description: "Shown in the browser tab and search results. Keep under ~60 characters.",
      validation: (rule) =>
        rule.custom((value) => {
          const en = (value as { _key: string; value?: string }[] | undefined)?.find(
            (v) => v._key === "en",
          );
          if (en?.value && en.value.length > 70) {
            return "English SEO title is longer than 70 characters — it may be truncated in search results.";
          }
          return true;
        }),
    }),
    defineField({
      name: "description",
      title: "SEO description",
      type: "internationalizedArrayText",
      description: "Shown under the title in search results. Keep under ~160 characters.",
      validation: (rule) =>
        rule.custom((value) => {
          const en = (value as { _key: string; value?: string }[] | undefined)?.find(
            (v) => v._key === "en",
          );
          if (en?.value && en.value.length > 180) {
            return "English SEO description is longer than 180 characters — it may be truncated in search results.";
          }
          return true;
        }),
    }),
    defineField({
      name: "ogImage",
      title: "Open Graph image",
      type: "image",
      description: "Shared across languages unless this page's translations show genuinely different imagery.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "internationalizedArrayString",
        }),
      ],
    }),
  ],
});
