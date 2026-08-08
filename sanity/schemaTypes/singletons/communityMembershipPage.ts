import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "communityMembershipPage",
  title: "Community membership (WECODA) page",
  type: "document",
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "intro", title: "Intro & benefits" },
    { name: "gallery", title: "Gallery & price" },
    { name: "application", title: "Application steps" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "heroLabel", title: "Hero label", type: "internationalizedArrayString", group: "hero" }),
    defineField({ name: "heroTitle", title: "Hero title", type: "internationalizedArrayString", group: "hero" }),
    defineField({
      name: "heroIntro",
      title: "Hero intro paragraphs",
      type: "array",
      group: "hero",
      of: [defineArrayMember({ type: "internationalizedArrayText" })],
    }),
    defineField({ name: "logo", title: "WECODA logo", type: "imageWithAlt", group: "hero" }),
    defineField({ name: "supportCta", title: "\"Support WECODA\" button", type: "ctaLink", group: "hero" }),
    defineField({ name: "externalSiteCta", title: "\"WECODA website\" link", type: "ctaLink", group: "hero" }),
    defineField({
      name: "priceStripText",
      title: "Price strip text",
      type: "internationalizedArrayString",
      group: "gallery",
    }),
    defineField({
      name: "gallery",
      title: "Gallery images",
      type: "array",
      group: "gallery",
      of: [defineArrayMember({ type: "imageWithAlt" })],
    }),
    defineField({
      name: "introColumns",
      title: "Intro columns",
      type: "array",
      group: "intro",
      of: [defineArrayMember({ type: "titledText" })],
    }),
    defineField({
      name: "benefitsTitle",
      title: "Benefits section title",
      type: "internationalizedArrayString",
      group: "intro",
    }),
    defineField({
      name: "benefits",
      title: "Benefits",
      type: "array",
      group: "intro",
      of: [defineArrayMember({ type: "internationalizedArrayString" })],
    }),
    defineField({
      name: "audiencesTitle",
      title: "\"Who it's for\" title",
      type: "internationalizedArrayString",
      group: "intro",
    }),
    defineField({
      name: "audiences",
      title: "Audiences",
      type: "array",
      group: "intro",
      of: [defineArrayMember({ type: "internationalizedArrayString" })],
    }),
    defineField({
      name: "applicationTitle",
      title: "Application section title",
      type: "internationalizedArrayString",
      group: "application",
    }),
    defineField({
      name: "applicationSteps",
      title: "Application steps",
      type: "array",
      group: "application",
      of: [defineArrayMember({ type: "titledText" })],
    }),
    defineField({
      name: "applicationCta",
      title: "Application button",
      type: "ctaLink",
      group: "application",
    }),
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Community membership page" };
    },
  },
});
