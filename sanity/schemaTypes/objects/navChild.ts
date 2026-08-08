import { defineField, defineType } from "sanity";

export default defineType({
  name: "navChild",
  title: "Dropdown link",
  type: "object",
  fields: [
    defineField({ name: "href", title: "Path", type: "string", validation: (r) => r.required() }),
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
  ],
  preview: {
    select: { label: "label", href: "href" },
    prepare({ label, href }) {
      const en = (label as { _key: string; value?: string }[] | undefined)?.find(
        (v) => v._key === "en",
      );
      return { title: en?.value ?? href, subtitle: href };
    },
  },
});
