import { defineField, defineType } from "sanity";

// FAQ questions/answers themselves live in `faqGroup` documents — this
// singleton only owns this page's own heading content.
export default defineType({
  name: "faqPage",
  title: "FAQ page",
  type: "document",
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "heroLabel", title: "Hero label", type: "internationalizedArrayString", group: "hero" }),
    defineField({ name: "heroTitle", title: "Hero title", type: "internationalizedArrayString", group: "hero" }),
    defineField({ name: "heroText", title: "Hero text", type: "internationalizedArrayText", group: "hero" }),
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "FAQ page" };
    },
  },
});
