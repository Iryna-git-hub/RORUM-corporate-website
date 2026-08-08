import { defineArrayMember, defineField, defineType } from "sanity";

// A top-level nav entry is either a direct link (`href` set, no children) or
// a dropdown (`href` empty, `children` populated) — mirrors the existing
// `NavItem` discriminated union in `lib/data.ts`. Both shapes coexist in one
// object type (rather than two array-member types) because Studio's
// same-array-different-shape UX is harder for a non-technical editor than
// "leave Dropdown links empty for a plain link."
export default defineType({
  name: "navItem",
  title: "Navigation item",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "internationalizedArrayString",
      validation: (r) =>
        r.custom((v) =>
          (v as { _key: string; value?: string }[] | undefined)?.find((x) => x._key === "en")
            ?.value
            ? true
            : "English label is required.",
        ),
    }),
    defineField({
      name: "href",
      title: "Path (leave empty for a dropdown)",
      type: "string",
    }),
    defineField({
      name: "children",
      title: "Dropdown links (leave empty for a direct link)",
      type: "array",
      of: [defineArrayMember({ type: "navChild" })],
    }),
  ],
  preview: {
    select: { label: "label", href: "href", children: "children" },
    prepare({ label, href, children }) {
      const en = (label as { _key: string; value?: string }[] | undefined)?.find(
        (v) => v._key === "en",
      );
      const kind = href
        ? href
        : `dropdown, ${(children as unknown[] | undefined)?.length ?? 0} links`;
      return { title: en?.value ?? "(untitled)", subtitle: kind };
    },
  },
});
