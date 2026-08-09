import { defineField, defineType } from "sanity";

// The events LISTING page's own heading + closing CTA content. The events
// themselves are separate `event` documents (see documents/event.ts).
export default defineType({
  name: "eventsPage",
  title: "Events (listing) page",
  type: "document",
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "closing", title: "Closing section" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "title", title: "Page title", type: "internationalizedArrayString", group: "hero" }),
    defineField({ name: "closingSection", title: "Closing section", type: "nextStepSection", group: "closing" }),
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Events (listing) page" };
    },
  },
});
