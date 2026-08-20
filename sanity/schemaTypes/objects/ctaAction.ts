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
      // Hidden site-wide: never read by the frontend — `LocaleLink` (every
      // caller's `Link`) infers internal-vs-external purely from the
      // destination's own shape (leading `/` = internal), which is strictly
      // safer than trusting this dropdown (a mistyped absolute URL under
      // "Internal page" still won't get a locale prefix wrongly stapled on).
      // Showing this field gave editors a false expectation that choosing
      // "External website" did something. Not removed: existing stored
      // values are preserved, and every other ctaAction field is unaffected.
      hidden: true,
    }),
    defineField({
      name: "href",
      title: "Destination",
      type: "string",
      description:
        "An internal path (e.g. /events), an in-page anchor (e.g. #request), or a full external URL. / Внутрішній шлях, якір на сторінці або повна зовнішня адреса.",
      // Only required while the button is actually shown on the site
      // (`enabled` !== false) — a disabled action renders nothing, so an
      // editor turning a button off shouldn't be blocked from publishing by
      // a destination they haven't gotten around to filling in yet.
      validation: (rule) =>
        rule.custom((href, context) => {
          if ((context.parent as { enabled?: boolean } | undefined)?.enabled === false) return true;
          return href ? true : "A destination is required.";
        }),
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
