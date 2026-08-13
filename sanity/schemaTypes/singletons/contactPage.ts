import { defineField, defineType } from "sanity";

// Contact details and social links are NOT duplicated here — this page
// renders the shared `contactInfo`/`socialLinks` singletons directly.
export default defineType({
  name: "contactPage",
  title: "Contact page",
  type: "document",
  description: "The Contact page. / Сторінка контактів.",
  // No `groups`/tabs: all fields render on one continuous page, in the same
  // top-to-bottom order the corresponding sections appear on the site.
  fieldsets: [
    { name: "heroSection", title: "Hero", options: { collapsible: true, collapsed: false } },
    { name: "formSection", title: "Form", options: { collapsible: true, collapsed: false } },
  ],
  fields: [
    defineField({ name: "heroLabel", title: "Hero label", type: "internationalizedArrayString", fieldset: "heroSection", description: "Small label above the title. / Невеликий напис над заголовком." }),
    defineField({
      name: "introTitle",
      title: '"We are here for you" title',
      type: "internationalizedArrayString",
      fieldset: "heroSection",
      description: 'E.g. "We are here for you". / Напр. «Ми тут для вас».',
    }),
    defineField({
      name: "introText",
      title: "Intro text",
      type: "internationalizedArrayText",
      fieldset: "heroSection",
      description: "Intro paragraph explaining what to contact RORUM about. / Вступний абзац про те, з яких питань можна звертатись до RORUM.",
    }),
    defineField({
      name: "followUsTitle",
      title: '"Follow us" title',
      type: "internationalizedArrayString",
      fieldset: "heroSection",
      description: 'E.g. "Follow us". / Напр. «Слідкуйте за нами».',
    }),
    defineField({
      name: "formTitle",
      title: "Form title",
      type: "internationalizedArrayString",
      fieldset: "formSection",
      description: "Heading above the contact form. / Заголовок над формою зв'язку.",
    }),
    defineField({
      name: "successMessage",
      title: "Success message",
      type: "internationalizedArrayText",
      fieldset: "formSection",
      description: "Shown after the form is submitted successfully. / Показується після успішної відправки форми.",
    }),
    defineField({
      name: "submitLabel",
      title: "Submit button",
      type: "internationalizedArrayString",
      fieldset: "formSection",
      description: 'E.g. "Send message". / Напр. «Надіслати повідомлення».',
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Contact page" };
    },
  },
});
