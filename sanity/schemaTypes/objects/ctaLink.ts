import { defineField, defineType } from "sanity";

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
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "internationalizedArrayString",
      validation: (rule) =>
        rule.custom((value) => {
          const en = (value as { _key: string; value?: string }[] | undefined)?.find(
            (v) => v._key === "en",
          );
          return en?.value ? true : "English label is required.";
        }),
    }),
    defineField({
      name: "href",
      title: "Destination",
      type: "string",
      description:
        "An internal path (e.g. /events), an in-page anchor (e.g. #request-private-meeting), or a full external URL.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "localizedHrefOverride",
      title: "Per-language destination override (rare)",
      type: "internationalizedArrayString",
      description:
        "Leave empty for every language unless that language must link somewhere other than the shared Destination above.",
    }),
  ],
  preview: {
    select: { label: "label", href: "href" },
    prepare({ href }) {
      return { title: href ?? "(no destination)" };
    },
  },
});
