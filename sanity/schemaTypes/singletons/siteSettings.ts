import { defineField, defineType } from "sanity";

// Singleton (one document, fixed id "siteSettings" — see structure.ts).
// Company/legal fields (CVR, registered name, canonical website) are not
// localized: they're facts, not editorial copy.
export default defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
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
    }),
    defineField({
      name: "cvr",
      title: "CVR number",
      type: "string",
      group: "org",
    }),
    defineField({
      name: "website",
      title: "Public website domain",
      type: "string",
      group: "org",
      description: 'E.g. "ro-rum.dk" — shown as text in the privacy policy, not a link.',
    }),
    defineField({
      name: "siteUrl",
      title: "Canonical site URL",
      type: "url",
      group: "org",
      description: "Used to build canonical/hreflang/Open Graph URLs and the sitemap.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "defaultSeo",
      title: "Default SEO",
      type: "seo",
      group: "seo",
      description: "Used as a fallback for any page/document without its own SEO fields filled in.",
    }),
    defineField({
      name: "announcementEnabled",
      title: "Show announcement banner",
      type: "boolean",
      group: "announcement",
      initialValue: false,
    }),
    defineField({
      name: "announcementText",
      title: "Announcement text",
      type: "internationalizedArrayString",
      group: "announcement",
      hidden: ({ document }) => !document?.announcementEnabled,
    }),
    defineField({
      name: "announcementLink",
      title: "Announcement link (optional)",
      type: "ctaLink",
      group: "announcement",
      hidden: ({ document }) => !document?.announcementEnabled,
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site settings" };
    },
  },
});
