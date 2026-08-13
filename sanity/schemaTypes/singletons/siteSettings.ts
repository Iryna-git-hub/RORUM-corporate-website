import { defineField, defineType } from "sanity";

// Singleton (one document, fixed id "siteSettings" — see structure.ts).
// Company/legal fields (CVR, registered name, canonical website) are not
// localized: they're facts, not editorial copy.
export default defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  description:
    "Site-wide settings: legal company details, default SEO fallback, and the optional announcement banner. / Загальні налаштування сайту: юридичні дані компанії, стандартні SEO-дані та необов'язковий банер оголошення.",
  groups: [
    { name: "org", title: "Organization", default: true },
    { name: "seo", title: "Default SEO" },
    { name: "announcement", title: "Announcement" },
  ],
  fields: [
    defineField({
      name: "companyName",
      title: "Legal company name",
      type: "string",
      group: "org",
      description: "The registered company name. / Офіційна зареєстрована назва компанії.",
    }),
    defineField({
      name: "cvr",
      title: "CVR number",
      type: "string",
      group: "org",
      description: "Danish company registration number. / Данський реєстраційний номер компанії (CVR).",
    }),
    defineField({
      name: "website",
      title: "Public website domain",
      type: "string",
      group: "org",
      description: 'E.g. "ro-rum.dk" — shown as text in the privacy policy, not a link. / Напр. «ro-rum.dk» — показується як текст у політиці конфіденційності, не є посиланням.',
    }),
    defineField({
      name: "siteUrl",
      title: "Canonical site URL",
      type: "url",
      group: "org",
      description: "Used to build canonical/hreflang/Open Graph URLs and the sitemap. / Використовується для формування canonical/hreflang/Open Graph URL-адрес та карти сайту.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "defaultSeo",
      title: "Default SEO",
      type: "seo",
      group: "seo",
      description: "Used as a fallback for any page/document without its own SEO fields filled in. / Використовується як запасний варіант для сторінок без власних заповнених SEO-полів.",
    }),
    defineField({
      name: "announcementEnabled",
      title: "Show announcement banner",
      type: "boolean",
      group: "announcement",
      initialValue: false,
      description: "Turn the site-wide announcement banner on or off. / Увімкнути або вимкнути банер оголошення на сайті.",
    }),
    defineField({
      name: "announcementText",
      title: "Announcement text",
      type: "internationalizedArrayString",
      group: "announcement",
      description: "The announcement banner's text. / Текст банера оголошення.",
      hidden: ({ document }) => !document?.announcementEnabled,
    }),
    defineField({
      name: "announcementLink",
      title: "Announcement link (optional)",
      type: "ctaLink",
      group: "announcement",
      description: "Optional button/link inside the announcement banner. / Необов'язкова кнопка/посилання в банері оголошення.",
      hidden: ({ document }) => !document?.announcementEnabled,
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site settings" };
    },
  },
});
