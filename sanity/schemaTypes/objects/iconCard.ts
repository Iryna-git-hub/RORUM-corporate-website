import { defineField, defineType } from "sanity";

// Reused for the small icon+title+text cards that appear across several
// pages (catering formats, decoration formats, "suitable for" chips, etc.).
// `icon` is a controlled enum, not free text: it's a genuine editorial
// choice (which icon best represents this card) from the fixed, curated set
// the frontend already knows how to render — not raw implementation code.
export default defineType({
  name: "iconCard",
  title: "Icon card",
  type: "object",
  fields: [
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      options: {
        list: [
          "UtensilsCrossed",
          "Flower",
          "Balloon",
          "Flame",
          "BadgeCheck",
          "ChefHat",
          "HandPlatter",
          "ClipboardList",
          "CookingPot",
          "ConciergeBell",
          "CalendarCheck",
          "Gem",
          "PartyPopper",
          "Lightbulb",
          "Sparkles",
          "Flower2",
          "CircleEllipsis",
          "Presentation",
          "Handshake",
          "BriefcaseBusiness",
          "Cake",
          "Landmark",
          "Building2",
          "Users",
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "title", title: "Title", type: "internationalizedArrayString" }),
    defineField({ name: "text", title: "Text", type: "internationalizedArrayText" }),
  ],
  preview: {
    select: { title: "title", subtitle: "icon" },
    prepare({ title, subtitle }) {
      const en = (title as { _key: string; value?: string }[] | undefined)?.find(
        (v) => v._key === "en",
      );
      return { title: en?.value ?? "(untitled)", subtitle };
    },
  },
});
