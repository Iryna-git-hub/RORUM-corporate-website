import { defineField, defineType } from "sanity";

// Not localized: platform, URL and brand color are identical regardless of
// language. Only `label` (used as the link's accessible name) is localized.
export default defineType({
  name: "socialLink",
  title: "Social link",
  type: "object",
  fields: [
    defineField({
      name: "icon",
      title: "Platform",
      type: "string",
      options: {
        list: [
          { title: "Instagram", value: "instagram" },
          { title: "Facebook", value: "facebook" },
          { title: "LinkedIn", value: "linkedin" },
          { title: "WhatsApp", value: "whatsapp" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "href",
      title: "URL",
      type: "url",
      validation: (rule) => rule.required().uri({ scheme: ["http", "https", "whatsapp"] }),
    }),
    defineField({
      name: "label",
      title: "Accessible label",
      type: "internationalizedArrayString",
      description: 'E.g. "Instagram" — read by screen readers.',
    }),
    defineField({
      name: "brandColor",
      title: "Brand color (hex)",
      type: "string",
      description: "Used for the hover background on the contact page's social icons.",
      validation: (rule) => rule.regex(/^#[0-9a-fA-F]{6}$/, { name: "hex color" }),
    }),
  ],
  preview: {
    select: { title: "icon", subtitle: "href" },
  },
});
