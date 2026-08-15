import { defineField, defineType } from "sanity";
import { requireAllLanguages } from "@/sanity/lib/i18nValidation";

// The one button/link shape reused inside every page section's `actions[]`.
export default defineType({
  name: "ctaAction",
  title: "Button / link",
  type: "object",
  description: "A button or link. / Кнопка або посилання.",
  fields: [
    defineField({
      name: "actionKey",
      title: "Key (do not change)",
      type: "string",
      readOnly: ({ value }) => Boolean(value),
      description:
        "Only present (and locked) on a built-in required action, e.g. a page's main call to action. New buttons you add don't need one. / Присутній (і заблокований) лише для вбудованої обов'язкової дії. Новим кнопкам ключ не потрібен.",
    }),
    defineField({
      name: "label",
      title: "Button text",
      type: "internationalizedArrayString",
      validation: requireAllLanguages(),
    }),
    defineField({
      name: "linkType",
      title: "Link type",
      type: "string",
      options: {
        list: [
          { title: "Internal page", value: "internal" },
          { title: "External website", value: "external" },
          { title: "Anchor on this page", value: "anchor" },
        ],
        layout: "radio",
      },
      initialValue: "internal",
    }),
    defineField({
      name: "href",
      title: "Destination",
      type: "string",
      description:
        "An internal path (e.g. /events), an in-page anchor (e.g. #request), or a full external URL. / Внутрішній шлях, якір на сторінці або повна зовнішня адреса.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "openInNewTab",
      title: "Open in a new tab",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "enabled",
      title: "Shown on the site",
      type: "boolean",
      initialValue: true,
      description: "Turn off to hide this button without deleting it. / Вимкніть, щоб приховати кнопку, не видаляючи її.",
    }),
  ],
  preview: {
    select: { label: "label", href: "href", enabled: "enabled" },
    prepare({ label, href, enabled }) {
      const en = (label as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      const title = en?.value ?? "(no label)";
      return { title: enabled === false ? `${title} (hidden)` : title, subtitle: href as string | undefined };
    },
  },
});
