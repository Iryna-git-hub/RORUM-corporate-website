import { defineArrayMember, defineField, defineType } from "sanity";

// Singleton. Contact details and social links are NOT duplicated here — the
// footer renders `contactInfo`/`socialLinks` directly (see
// `components/Footer.tsx`); this document only owns the 4 link columns, the
// legal-links row, and the copyright line.
const footerColumn = {
  type: "object" as const,
  name: "footerColumn",
  title: "Column",
  fields: [
    defineField({ name: "title", title: "Column title", type: "internationalizedArrayString" }),
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [defineArrayMember({ type: "navChild" })],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }: { title?: { _key: string; value?: string }[] }) {
      const en = title?.find((v) => v._key === "en");
      return { title: en?.value ?? "(untitled column)" };
    },
  },
};

export default defineType({
  name: "footer",
  title: "Footer",
  type: "document",
  fields: [
    defineField({
      name: "columns",
      title: "Link columns",
      type: "array",
      of: [defineArrayMember(footerColumn)],
      validation: (rule) => rule.max(6),
    }),
    defineField({
      name: "legalLinks",
      title: "Legal links",
      type: "array",
      of: [defineArrayMember({ type: "navChild" })],
      description: 'E.g. "Terms and conditions", "Privacy policy", "Cookie policy".',
    }),
    defineField({
      name: "copyrightText",
      title: "Copyright line",
      type: "internationalizedArrayString",
      description: 'E.g. "© 2026 RORUM. All rights reserved."',
    }),
  ],
  preview: {
    prepare() {
      return { title: "Footer" };
    },
  },
});
