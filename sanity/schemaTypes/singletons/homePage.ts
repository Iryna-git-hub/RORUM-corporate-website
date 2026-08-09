import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "quickPaths", title: "Quick paths" },
    { name: "editorial", title: "Editorial sections" },
    { name: "closing", title: "Closing section" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "heroLabel", title: "Hero label", type: "internationalizedArrayString", group: "hero" }),
    defineField({ name: "heroTitle", title: "Hero title", type: "internationalizedArrayString", group: "hero" }),
    defineField({ name: "heroText", title: "Hero text", type: "internationalizedArrayText", group: "hero" }),
    defineField({
      name: "heroTrustItems",
      title: "Hero trust badges",
      type: "array",
      group: "hero",
      of: [defineArrayMember({ type: "internationalizedArrayString" })],
      description: 'E.g. "Up to 12 guests", "Central Copenhagen".',
    }),
    defineField({ name: "heroImage", title: "Hero fallback image", type: "imageWithAlt", group: "hero" }),
    defineField({
      name: "heroVideoUrl",
      title: "Hero video URL",
      type: "string",
      group: "hero",
      description: "Autoplaying background video (muted, looped). Leave empty to use the fallback image only.",
    }),
    defineField({ name: "heroPrimaryCta", title: "Hero primary button", type: "ctaLink", group: "hero" }),
    defineField({ name: "heroSecondaryCta", title: "Hero secondary button", type: "ctaLink", group: "hero" }),
    defineField({
      name: "quickPaths",
      title: "Quick paths",
      type: "array",
      group: "quickPaths",
      description: "The 4 cards linking to Events / Host at RORUM / Catering / Event decoration.",
      of: [
        defineArrayMember({
          type: "object",
          name: "quickPath",
          fields: [
            defineField({ name: "title", title: "Title", type: "internationalizedArrayString" }),
            defineField({ name: "text", title: "Text", type: "internationalizedArrayText" }),
            defineField({ name: "href", title: "Link", type: "string" }),
            defineField({ name: "image", title: "Image", type: "imageWithAlt" }),
          ],
          preview: {
            select: { title: "title" },
            prepare({ title }) {
              const en = (title as { _key: string; value?: string }[] | undefined)?.find(
                (v) => v._key === "en",
              );
              return { title: en?.value ?? "(untitled)" };
            },
          },
        }),
      ],
      validation: (rule) => rule.max(4),
    }),
    defineField({
      name: "eventsLabel",
      title: '"What\'s on" section label',
      type: "internationalizedArrayString",
      group: "editorial",
    }),
    defineField({
      name: "eventsTitle",
      title: '"What\'s on" section title',
      type: "internationalizedArrayString",
      group: "editorial",
    }),
    defineField({
      name: "attendEventsFeature",
      title: "Attend Events feature block",
      type: "editorialFeature",
      group: "editorial",
    }),
    defineField({
      name: "hostAtRorumFeature",
      title: "Host at RORUM feature block",
      type: "editorialFeature",
      group: "editorial",
    }),
    defineField({ name: "closingSection", title: "Closing section", type: "nextStepSection", group: "closing" }),
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Home page" };
    },
  },
});
