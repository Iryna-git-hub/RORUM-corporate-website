import { defineField, defineType } from "sanity";
import { SOCIAL_LINK_ICONS } from "@/sanity/components/actionIcons";

const PLATFORM_TITLES: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
};

// Not localized: platform, URL and brand color are identical regardless of
// language. Only `label` (used as the link's accessible name) is localized.
export default defineType({
  name: "socialLink",
  title: "Social link",
  type: "object",
  description:
    "One social media link shown on the contact page. / Одне посилання на соцмережу, що показується на сторінці контактів.",
  fields: [
    defineField({
      name: "icon",
      title: "Platform",
      type: "string",
      description: "Which platform this link is for. / Для якої платформи це посилання.",
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
      description: "Full profile URL. / Повна URL-адреса профілю.",
      validation: (rule) => rule.required().uri({ scheme: ["http", "https", "whatsapp"] }),
    }),
    defineField({
      name: "label",
      title: "Accessible label",
      type: "internationalizedArrayString",
      description: 'E.g. "Instagram" — read by screen readers. / Напр. «Instagram» — читається програмами читання з екрана.',
    }),
    defineField({
      name: "brandColor",
      title: "Brand color (hex)",
      type: "string",
      description:
        "Used for the hover background on the contact page's social icons. / Використовується для фону іконки при наведенні на сторінці контактів.",
      validation: (rule) => rule.regex(/^#[0-9a-fA-F]{6}$/, { name: "hex color" }),
    }),
  ],
  preview: {
    select: { icon: "icon", href: "href" },
    prepare({ icon, href }) {
      return {
        title: (typeof icon === "string" && PLATFORM_TITLES[icon]) || "(no platform selected)",
        subtitle: href,
        media: typeof icon === "string" ? SOCIAL_LINK_ICONS[icon] : undefined,
      };
    },
  },
});
