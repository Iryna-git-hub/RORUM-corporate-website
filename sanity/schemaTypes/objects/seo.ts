import { defineField, defineType } from "sanity";
import { allOrNothingForSelectedEventLocales } from "@/sanity/lib/i18nValidation";
import { EventLocaleAwareInput } from "@/sanity/components/EventLocaleAwareInput";

// SEO fields are localized (title/description differ per language) except
// the Open Graph image, which the content model intentionally shares across
// languages (same photo, no per-language asset duplication) unless a page
// genuinely needs a different one — see the localization-model note in
// MIGRATION_REPORT.md.
export default defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  description:
    "Search-engine and social-sharing metadata for this page. / Метадані для пошукових систем і соцмереж для цієї сторінки.",
  fields: [
    defineField({
      name: "title",
      title: "Search Result Title",
      type: "internationalizedArrayString",
      description:
        "The page title shown in browser tabs and search engine results. Keep it clear and under approximately 60 characters. / Заголовок сторінки, що показується у вкладці браузера та в результатах пошуку. Зробіть його чітким і не довшим за ~60 символів.",
      // Scoped internally to `event` documents only — Home/About/etc. render
      // this exact same field completely unchanged, since seo is shared.
      components: { input: EventLocaleAwareInput },
      // Two independent rules: the existing English-length guidance
      // (unchanged, applies everywhere), plus — for `event` documents only —
      // a completeness check scoped to that event's own selected "Show on
      // website languages": still fully optional overall, but if this field
      // has been started for one selected locale it must be finished for
      // all of them, never requiring English specifically. Every other
      // document type (Home/About/etc.) is unaffected — `getEventVisibleLocales`
      // returns `undefined` for anything that isn't an `event`.
      validation: (rule) => [
        rule.custom((value) => {
          const en = (value as { _key: string; language?: string; value?: string }[] | undefined)?.find(
            (v) => v.language === "en" || v._key === "en",
          );
          if (en?.value && en.value.length > 70) {
            return "English SEO title is longer than 70 characters — it may be truncated in search results.";
          }
          return true;
        }),
        allOrNothingForSelectedEventLocales()(rule),
      ],
    }),
    defineField({
      name: "description",
      title: "Search Result Description",
      type: "internationalizedArrayText",
      description:
        "The page summary shown in search engine results. Keep it clear and under approximately 160 characters. / Опис сторінки, що показується в результатах пошуку. Зробіть його чітким і не довшим за ~160 символів.",
      components: { input: EventLocaleAwareInput },
      validation: (rule) => [
        rule.custom((value) => {
          const en = (value as { _key: string; language?: string; value?: string }[] | undefined)?.find(
            (v) => v.language === "en" || v._key === "en",
          );
          if (en?.value && en.value.length > 180) {
            return "English SEO description is longer than 180 characters — it may be truncated in search results.";
          }
          return true;
        }),
        allOrNothingForSelectedEventLocales()(rule),
      ],
    }),
    defineField({
      name: "ogImage",
      title: "Social Sharing Image",
      type: "image",
      description:
        "The preview image shown when this page is shared on Facebook, LinkedIn, messaging apps, and other services. / Зображення попереднього перегляду, що показується під час поширення цієї сторінки у Facebook, LinkedIn, месенджерах та інших сервісах.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "internationalizedArrayString",
          description: "Alt text for the Open Graph image. / Альтернативний текст для зображення Open Graph.",
          components: { input: EventLocaleAwareInput },
          validation: allOrNothingForSelectedEventLocales(),
        }),
      ],
    }),
  ],
});
