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
  description:
    "Text shared across every form on the site (field labels, validation messages, the FAQ prompt, the Privacy Policy popup's buttons). Each form's own title/success message lives on its own page instead. / Текст, спільний для всіх форм сайту (назви полів, повідомлення валідації, блок FAQ, кнопки спливного вікна політики конфіденційності). Заголовок і повідомлення про успіх кожної форми зберігаються на її власній сторінці.",
  fields: [
    defineField({
      name: "requiredFieldTemplate",
      title: "Required-field message",
      type: "internationalizedArrayString",
      description:
        'Use "{field}" as a placeholder for the field\'s label, e.g. "{field} is required." / Використовуйте "{field}" як заповнювач для назви поля, напр. «{field} є обов\'язковим полем».',
    }),
    defineField({
      name: "invalidEmailMessage",
      title: "Invalid email message",
      type: "internationalizedArrayString",
      description: "Shown when the email field doesn't look valid. / Показується, коли поле email заповнене некоректно.",
    }),
    defineField({
      name: "privacyConsentRequiredMessage",
      title: "Privacy consent required message",
      type: "internationalizedArrayString",
      description: "Shown when a form is submitted without checking the privacy consent box. / Показується, якщо форму надіслано без позначення згоди з політикою конфіденційності.",
    }),
    defineField({
      name: "privacyConsentPrefixText",
      title: "Privacy consent checkbox prefix text",
      type: "internationalizedArrayString",
      description:
        'The text before the "Privacy Policy" link/button, e.g. "I have read and agree to the" — the policy\'s own title (legalPage "privacy-policy") supplies the link text itself, so it isn\'t duplicated here. / Текст перед посиланням/кнопкою «Політика конфіденційності», напр. «Я прочитав(ла) і погоджуюсь із» — сам текст посилання береться із заголовка документа legalPage «privacy-policy» і тут не дублюється.',
    }),
    defineField({
      name: "faqQuestion",
      title: "FAQ inline prompt question",
      type: "internationalizedArrayString",
      description: 'E.g. "Have questions?" — used by the FAQ prompt on catering/decoration/host-at-rorum sections. / Напр. «Маєте запитання?» — використовується в блоці FAQ на сторінках кейтерингу/декору/проведення подій.',
    }),
    defineField({
      name: "faqLabel",
      title: "FAQ inline prompt link label",
      type: "internationalizedArrayString",
      description: 'E.g. "Read our FAQs". / Напр. «Переглянути поширені запитання».',
    }),
    defineField({
      name: "fullNameLabel",
      title: "\"Full Name\" field label",
      type: "internationalizedArrayString",
      description: 'E.g. "Full Name". / Напр. «Повне ім\'я».',
    }),
    defineField({
      name: "phoneLabel",
      title: "\"Phone number\" field label",
      type: "internationalizedArrayString",
      description: 'E.g. "Phone number". / Напр. «Номер телефону».',
    }),
    defineField({
      name: "emailLabel",
      title: "\"Email\" field label",
      type: "internationalizedArrayString",
      description: 'E.g. "Email". / Напр. «Електронна пошта».',
    }),
    defineField({
      name: "messageLabel",
      title: "\"Message\" field label",
      type: "internationalizedArrayString",
      description: 'E.g. "Message". / Напр. «Повідомлення».',
    }),
    defineField({
      name: "eventDateLabel",
      title: "\"Event date\" field label",
      type: "internationalizedArrayString",
      description: 'E.g. "Event date". / Напр. «Дата події».',
    }),
    defineField({
      name: "agreeButtonLabel",
      title: "Privacy Policy modal \"agree\" button",
      type: "internationalizedArrayString",
      description: 'E.g. "I Have Read and Agree". / Напр. «Я прочитав(ла) і погоджуюсь».',
    }),
    defineField({
      name: "closeLabel",
      title: "Generic \"Close\" label",
      type: "internationalizedArrayString",
      description: 'E.g. "Close" — used for close buttons across popups. / Напр. «Закрити» — використовується для кнопок закриття спливних вікон.',
    }),
    defineField({
      name: "copyLabel",
      title: "Generic \"Copy\" button label",
      type: "internationalizedArrayString",
      description: 'E.g. "Copy" — used to copy bank details. / Напр. «Копіювати» — використовується для копіювання банківських реквізитів.',
    }),
    defineField({
      name: "copiedLabel",
      title: "Generic \"Copied\" confirmation label",
      type: "internationalizedArrayString",
      description: 'E.g. "Copied" — shown briefly after copying. / Напр. «Скопійовано» — показується коротко після копіювання.',
    }),
    defineField({
      name: "packageLabel",
      title: "\"Package\" field label (booking form)",
      type: "internationalizedArrayString",
      description: 'E.g. "Package". / Напр. «Пакет».',
    }),
    defineField({
      name: "selectPackagePlaceholder",
      title: "\"Select package\" placeholder option (booking form)",
      type: "internationalizedArrayString",
      description: 'E.g. "Select package". / Напр. «Оберіть пакет».',
    }),
    defineField({
      name: "eventTimeLabel",
      title: "\"Event time\" field label (booking form)",
      type: "internationalizedArrayString",
      description: 'E.g. "Event time". / Напр. «Час події».',
    }),
    defineField({
      name: "numberOfPeopleLabel",
      title: "\"Number of people\" field label (booking form)",
      type: "internationalizedArrayString",
      description: 'E.g. "Number of people". / Напр. «Кількість осіб».',
    }),
    defineField({
      name: "guestsPlaceholder",
      title: "\"Approx. number\" placeholder (booking form)",
      type: "internationalizedArrayString",
      description: 'E.g. "Approx. number". / Напр. «Приблизна кількість».',
    }),
    defineField({
      name: "additionalServicesLabel",
      title: "\"Additional services\" fieldset legend (booking form)",
      type: "internationalizedArrayString",
      description: 'E.g. "Additional services". / Напр. «Додаткові послуги».',
    }),
    defineField({
      name: "commentLabel",
      title: "\"Comment\" field label (booking form)",
      type: "internationalizedArrayString",
      description: 'E.g. "Comment". / Напр. «Коментар».',
    }),
    defineField({
      name: "guestsRangeMessage",
      title: "Guest-count out-of-range validation message (booking form)",
      type: "internationalizedArrayString",
      description: 'E.g. "Please enter a whole number between 1 and 30." / Напр. «Будь ласка, введіть ціле число від 1 до 30».',
    }),
  ],
  preview: {
    prepare() {
      return { title: "Shared form messages" };
    },
  },
});
