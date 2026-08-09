import { defineField, defineType } from "sanity";

// Contact details and social links are NOT duplicated here — this page
// renders the shared `contactInfo`/`socialLinks` singletons directly.
export default defineType({
  name: "contactPage",
  title: "Contact page",
  type: "document",
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "form", title: "Form" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "heroLabel", title: "Hero label", type: "internationalizedArrayString", group: "hero" }),
    defineField({
      name: "introTitle",
      title: '"We are here for you" title',
      type: "internationalizedArrayString",
      group: "hero",
    }),
    defineField({
      name: "introText",
      title: "Intro text",
      type: "internationalizedArrayText",
      group: "hero",
    }),
    defineField({
      name: "followUsTitle",
      title: '"Follow us" title',
      type: "internationalizedArrayString",
      group: "hero",
    }),
    defineField({
      name: "formTitle",
      title: "Form title",
      type: "internationalizedArrayString",
      group: "form",
    }),
    defineField({
      name: "successMessage",
      title: "Success message",
      type: "internationalizedArrayText",
      group: "form",
    }),
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Contact page" };
    },
  },
});
