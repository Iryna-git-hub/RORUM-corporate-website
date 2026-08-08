import { defineField, defineType } from "sanity";

// Singleton. Address/phone/email are facts shared across all three
// languages — not localized. `shortAddress` exists separately because the
// site uses a shorter form in some contexts (event practical details) and
// the full form in others (contact page); both are edited here so they stay
// in sync rather than being derived automatically from one string in a way
// that would be fragile for free-text addresses.
export default defineType({
  name: "contactInfo",
  title: "Contact information",
  type: "document",
  fields: [
    defineField({ name: "email", title: "Email", type: "string", validation: (r) => r.required().email() }),
    defineField({ name: "phone", title: "Phone (display)", type: "string" }),
    defineField({
      name: "phoneHref",
      title: "Phone (tel: link)",
      type: "string",
      description: 'E.g. "tel:+4591877152".',
    }),
    defineField({ name: "address", title: "Full address", type: "text", rows: 2 }),
    defineField({ name: "shortAddress", title: "Short address", type: "string" }),
    defineField({ name: "mapHref", title: "Map link (internal)", type: "string" }),
    defineField({
      name: "mapQueryAddress",
      title: "Map search query",
      type: "string",
      description: "The address text used to build the embedded Google Maps query.",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Contact information" };
    },
  },
});
