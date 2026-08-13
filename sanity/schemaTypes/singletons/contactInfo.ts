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
  description:
    "RORUM's contact facts (email, phone, address). Shown on the Contact page and in the footer — not localized, since these are facts, not editorial copy. / Контактні дані RORUM (email, телефон, адреса). Показуються на сторінці контактів і в підвалі сайту — не перекладаються, оскільки це факти, а не редакційний текст.",
  fields: [
    defineField({ name: "email", title: "Email", type: "string", description: "Contact email address. / Контактна електронна адреса.", validation: (r) => r.required().email() }),
    defineField({ name: "phone", title: "Phone (display)", type: "string", description: "Phone number as shown on the site. / Номер телефону, як він показується на сайті." }),
    defineField({
      name: "phoneHref",
      title: "Phone (tel: link)",
      type: "string",
      description: 'E.g. "tel:+4591877152". / Напр. «tel:+4591877152».',
    }),
    defineField({ name: "address", title: "Full address", type: "text", rows: 2, description: "Full postal address. / Повна поштова адреса." }),
    defineField({ name: "shortAddress", title: "Short address", type: "string", description: "Shorter address used in event practical details. / Коротша адреса, що використовується в практичній інформації про події." }),
    defineField({ name: "mapHref", title: "Map link (internal)", type: "string", description: "In-page anchor linking to the embedded map. / Якір на сторінці, що веде до вбудованої карти." }),
    defineField({
      name: "mapQueryAddress",
      title: "Map search query",
      type: "string",
      description: "The address text used to build the embedded Google Maps query. / Текст адреси, що використовується для запиту в Google Maps.",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Contact information" };
    },
  },
});
