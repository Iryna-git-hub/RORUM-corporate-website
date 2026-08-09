import { defineField, defineType } from "sanity";

// Singleton. Only the strings genuinely shared across every form on the site
// (Contact, Catering inquiry, booking/decoration inquiry, Volunteer,
// application modal). Each form's own success/"thank you" copy is
// page-specific content and lives on that page's own document instead —
// see e.g. `contactPage.successMessage`.
export default defineType({
  name: "formMessages",
  title: "Shared form messages",
  type: "document",
  fields: [
    defineField({
      name: "requiredFieldTemplate",
      title: "Required-field message",
      type: "internationalizedArrayString",
      description: 'Use "{field}" as a placeholder for the field\'s label, e.g. "{field} is required."',
    }),
    defineField({
      name: "invalidEmailMessage",
      title: "Invalid email message",
      type: "internationalizedArrayString",
    }),
    defineField({
      name: "privacyConsentRequiredMessage",
      title: "Privacy consent required message",
      type: "internationalizedArrayString",
    }),
    defineField({
      name: "privacyConsentLabel",
      title: "Privacy consent checkbox label",
      type: "internationalizedArrayText",
      description: "The full label text next to the consent checkbox, including the link to the Privacy Policy.",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Shared form messages" };
    },
  },
});
