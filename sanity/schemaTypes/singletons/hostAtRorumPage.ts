import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "hostAtRorumPage",
  title: "Host at RORUM page",
  type: "document",
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "session", title: "Session details" },
    { name: "packages", title: "Packages" },
    { name: "inquiry", title: "Inquiry section" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "hero", title: "Hero", type: "serviceHero", group: "hero" }),
    defineField({
      name: "sessionLabel",
      title: "Session details label",
      type: "internationalizedArrayString",
      group: "session",
    }),
    defineField({
      name: "sessionTitle",
      title: '"Each session includes" title',
      type: "internationalizedArrayString",
      group: "session",
    }),
    defineField({
      name: "sessionImage",
      title: "Session image",
      type: "imageWithAlt",
      group: "session",
    }),
    defineField({
      name: "includedItems",
      title: "Included items",
      type: "array",
      group: "session",
      of: [defineArrayMember({ type: "internationalizedArrayString" })],
    }),
    defineField({
      name: "optionalLabel",
      title: '"Optional" label',
      type: "internationalizedArrayString",
      group: "session",
    }),
    defineField({
      name: "optionalItems",
      title: "Optional items",
      type: "array",
      group: "session",
      of: [defineArrayMember({ type: "internationalizedArrayString" })],
    }),
    defineField({
      name: "packagesLabel",
      title: "Packages section label",
      type: "internationalizedArrayString",
      group: "packages",
    }),
    defineField({
      name: "packagesTitle",
      title: "Packages section title",
      type: "internationalizedArrayString",
      group: "packages",
    }),
    defineField({
      name: "packagesIntro",
      title: "Packages intro text",
      type: "internationalizedArrayText",
      group: "packages",
    }),
    defineField({
      name: "packages",
      title: "Packages",
      type: "array",
      group: "packages",
      of: [defineArrayMember({ type: "packageTier" })],
    }),
    defineField({
      name: "cancellationTitle",
      title: "Cancellation policy title",
      type: "internationalizedArrayString",
      group: "packages",
    }),
    defineField({
      name: "cancellationItems",
      title: "Cancellation policy bullets",
      type: "array",
      group: "packages",
      of: [defineArrayMember({ type: "internationalizedArrayString" })],
    }),
    defineField({
      name: "stepsTitle",
      title: "3-step setup title",
      type: "internationalizedArrayString",
      group: "inquiry",
    }),
    defineField({
      name: "steps",
      title: "3-step setup",
      type: "array",
      group: "inquiry",
      of: [defineArrayMember({ type: "titledText" })],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: "inquiryIntro",
      title: "Inquiry form intro text",
      type: "internationalizedArrayText",
      group: "inquiry",
    }),
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Host at RORUM page" };
    },
  },
});
