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
    defineField({ name: "title", title: "Column title", type: "internationalizedArrayString", description: 'E.g. "Visit & host", "Services". / Напр. «Відвідати та проводити», «Послуги».' }),
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [defineArrayMember({ type: "navChild" })],
      description: "Links in this footer column. / Посилання в цій колонці підвалу.",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }: { title?: { _key: string; language?: string; value?: string }[] }) {
      const en = title?.find((v) => v.language === "en" || v._key === "en");
      return { title: en?.value ?? "(untitled column)" };
    },
  },
};

export default defineType({
  name: "footer",
  title: "Footer",
  type: "document",
  description:
    "The site footer: link columns, legal links row, and copyright line. Contact details come from the shared Contact information document. / Підвал сайту: колонки посилань, рядок юридичних посилань і копірайт. Контактні дані беруться з окремого документа «Контактна інформація».",
  fields: [
    defineField({
      name: "contactDetailsLabel",
      title: "\"Contact details\" heading",
      type: "internationalizedArrayString",
      description: 'E.g. "Contact details". / Напр. «Контактна інформація».',
    }),
    defineField({
      name: "columns",
      title: "Link columns",
      type: "array",
      of: [defineArrayMember(footerColumn)],
      validation: (rule) => rule.max(6),
      description: "Up to 6 footer link columns. / До 6 колонок посилань у підвалі.",
    }),
    defineField({
      name: "legalLinks",
      title: "Legal links",
      type: "array",
      of: [defineArrayMember({ type: "navChild" })],
      description: 'E.g. "Terms and conditions", "Privacy policy", "Cookie policy". / Напр. «Умови та положення», «Політика конфіденційності», «Політика cookie».',
    }),
    defineField({
      name: "copyrightText",
      title: "Copyright line",
      type: "internationalizedArrayString",
      description: 'E.g. "© 2026 RORUM. All rights reserved." / Напр. «© 2026 RORUM. Усі права захищено.»',
    }),
  ],
  preview: {
    prepare() {
      return { title: "Footer" };
    },
  },
});
