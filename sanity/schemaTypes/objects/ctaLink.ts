import { defineField, defineType, type ValidationContext } from "sanity";

// The ONE place a `ctaLink` is genuinely optional as a whole: `siteSettings`'s
// `announcementLink`. That field is `hidden` unless `announcementEnabled` is
// on (see siteSettings.ts) — but a hidden field's own nested `required()`
// rules still fire, which used to make `drafts.siteSettings` un-publishable
// forever the moment Studio auto-scaffolded an empty announcement link and
// the manager turned the banner back off. It's also legitimate to run an
// announcement banner with no button at all. So: an ENTIRELY empty
// announcementLink is valid; a partially-filled one must still be completed.
// Scoped to `siteSettings` by document type, so every other ctaLink user
// (serviceHero, editorialFeature, nextStepSection) is completely unaffected —
// and siteSettings itself still validates a link the manager has actually
// started filling in.
function isEmptyAnnouncementLink(context: ValidationContext): boolean {
  const doc = context.document as
    | { _type?: string; announcementLink?: { href?: string; label?: { value?: unknown }[] } }
    | undefined;
  if (doc?._type !== "siteSettings") return false;
  // Only the `announcementLink` field itself opts out — not some future second
  // ctaLink field on siteSettings (there is none today; this keeps it that way
  // safely). `context.path` is e.g. ["announcementLink", "href"].
  if (context.path?.[0] !== "announcementLink") return false;
  const link = doc.announcementLink;
  const hasHref = typeof link?.href === "string" && link.href.trim() !== "";
  const hasLabel = (link?.label ?? []).some((e) => typeof e?.value === "string" && e.value.trim() !== "");
  return !hasHref && !hasLabel;
}

// `href` is a plain (non-localized) string on purpose: internal routes are
// automatically locale-prefixed by the frontend's link helper, and external
// URLs / anchors / mailto: links are almost always identical regardless of
// language. `localizedHrefOverride` exists only for the rare case where a
// specific language must point somewhere genuinely different (e.g. an
// external partner page that only has a Danish version) — leave it empty
// otherwise; see the localization-model note in MIGRATION_REPORT.md.
export default defineType({
  name: "ctaLink",
  title: "Button / link",
  type: "object",
  description:
    "A button or link with a label and destination. / Кнопка або посилання із написом та адресою призначення.",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "internationalizedArrayString",
      description: "The button/link's visible text. / Видимий текст кнопки/посилання.",
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isEmptyAnnouncementLink(context)) return true;
          const en = (value as { _key: string; language?: string; value?: string }[] | undefined)?.find(
            (v) => v.language === "en" || v._key === "en",
          );
          return en?.value ? true : "English label is required.";
        }),
    }),
    defineField({
      name: "href",
      title: "Destination",
      type: "string",
      description:
        "An internal path (e.g. /events), an in-page anchor (e.g. #request-private-meeting), or a full external URL. / Внутрішній шлях (напр. /events), якір на сторінці (напр. #request-private-meeting) або повна зовнішня URL-адреса.",
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isEmptyAnnouncementLink(context)) return true;
          return value ? true : "A destination is required.";
        }),
    }),
    defineField({
      name: "localizedHrefOverride",
      title: "Per-language destination override (rare)",
      type: "internationalizedArrayString",
      description:
        "Leave empty for every language unless that language must link somewhere other than the shared Destination above. / Залиште порожнім для всіх мов, окрім випадку, коли для конкретної мови посилання має вести на іншу адресу.",
    }),
  ],
  preview: {
    select: { label: "label", href: "href" },
    prepare({ href }) {
      return { title: href ?? "(no destination)" };
    },
  },
});
