import { defineField, defineType } from "sanity";

// Shared hero shape for the catering / event-decoration / host-at-rorum
// pages: a label, a title, one paragraph, and up to two buttons — the same
// pattern each of those pages' hero section already uses.
export default defineType({
  name: "serviceHero",
  title: "Hero",
  type: "object",
  fields: [
    defineField({ name: "label", title: "Label", type: "internationalizedArrayString" }),
    defineField({ name: "title", title: "Title", type: "internationalizedArrayString" }),
    defineField({ name: "text", title: "Text", type: "internationalizedArrayText" }),
    defineField({ name: "primaryCta", title: "Primary button", type: "ctaLink" }),
    defineField({ name: "secondaryCta", title: "Secondary button (optional)", type: "ctaLink" }),
  ],
});
