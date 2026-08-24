import { defineField, defineType } from "sanity";
import { SOCIAL_LINK_ICONS } from "@/sanity/components/actionIcons";
import { requireAllLanguages } from "@/sanity/lib/i18nValidation";

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
      validation: (rule) => [
        rule.required(),
        // Nothing on the site (frontend or Studio) currently has a reason to
        // show the same platform twice — a duplicate is far more likely a
        // mistake (e.g. adding a link twice) than an intentional second
        // profile. A visible error catches it immediately instead of
        // silently rendering two identical icons.
        rule.custom((value: string | undefined, context) => {
          if (!value) return true;
          const doc = context.document as { links?: { _key?: string; icon?: string }[] } | undefined;
          const ownKey = (context.parent as { _key?: string } | undefined)?._key;
          const duplicate = doc?.links?.some((l) => l._key !== ownKey && l.icon === value);
          return duplicate ? `Another link already uses ${value} — each platform should only appear once.` : true;
        }),
      ],
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
      description: 'E.g. "Instagram" — read by screen readers. Required in English, Danish and Ukrainian. / Напр. «Instagram» — читається програмами читання з екрана. Обов\'язково англійською, данською та українською.',
      validation: requireAllLanguages(),
    }),
    defineField({
      name: "brandColor",
      title: "Brand color (hex) — no longer used",
      type: "string",
      description:
        "The hover background color is now derived automatically from the selected platform — this field is kept only for old data and has no effect. / Колір фону при наведенні тепер визначається автоматично за платформою — це поле збережено лише для старих даних і більше не впливає на сайт.",
      hidden: true,
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
