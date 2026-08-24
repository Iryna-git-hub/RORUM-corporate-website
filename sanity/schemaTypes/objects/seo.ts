import { defineField, defineType } from "sanity";
import { allOrNothingForSelectedEventLocales } from "@/sanity/lib/i18nValidation";
import { SeoAllLanguagesInput } from "@/sanity/components/SeoAllLanguagesInput";
import { SeoObjectInput } from "@/sanity/components/SeoObjectInput";

// SEO fields are localized (title/description differ per language) except
// the Open Graph image, which the content model intentionally shares across
// languages (same photo, no per-language asset duplication) unless a page
// genuinely needs a different one — see the localization-model note in
// MIGRATION_REPORT.md.
export default defineType({
  name: "seo",
  title: "Search engine & social sharing",
  type: "object",
  description:
    "Search-engine and social-sharing metadata for this page. / Метадані для пошукових систем і соцмереж для цієї сторінки.",
  components: { input: SeoObjectInput },
  fields: [
    defineField({
      name: "title",
      title: "Search Result Title",
      type: "internationalizedArrayString",
      description:
        'Title shown in search results and browser tabs. Write a concise, specific title for each language (approximately 30–60 characters). / Заголовок у результатах пошуку та вкладці браузера. Напишіть короткий і точний заголовок для кожної мови (приблизно 30–60 символів).',
      // SeoAllLanguagesInput delegates to EventLocaleAwareInput for `event`
      // documents (preserving visibleLocales-gated behavior unchanged) and
      // otherwise always shows EN/DA/UK immediately — see that file's own
      // doc comment. Home/About/etc. render the same field, just via the
      // non-event branch.
      components: { input: SeoAllLanguagesInput },
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
        "Short summary that may appear below the title in search results. Describe this specific page clearly (approximately 120–160 characters). / Короткий опис, який може відображатися під заголовком у пошуку. Чітко опишіть саме цю сторінку (приблизно 120–160 символів).",
      components: { input: SeoAllLanguagesInput },
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
        "Image used when this page is shared on social networks and messaging apps. / Зображення, яке використовується під час поширення сторінки в соцмережах і месенджерах.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Social Sharing Image Alt",
          type: "internationalizedArrayString",
          description:
            "Briefly describe the image for people using screen readers. Do not add search keywords that are not visible in the image. / Коротко опишіть зображення для людей, які користуються програмами читання з екрана. Не додавайте пошукові слова, яких немає на зображенні.",
          components: { input: SeoAllLanguagesInput },
          validation: allOrNothingForSelectedEventLocales(),
        }),
      ],
    }),
  ],
});
