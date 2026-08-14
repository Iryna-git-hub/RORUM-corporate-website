import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "communityMembershipPage",
  title: "Community membership (WECODA) page",
  type: "document",
  description: "The WECODA community membership page. / Сторінка членства у спільноті WECODA.",
  // No `groups`/tabs: all fields render on one continuous page, in the same
  // top-to-bottom order the corresponding sections appear on the site.
  // `fieldsets` are used purely for visual (collapsible) grouping — they
  // don't split the form into tabs.
  fieldsets: [
    { name: "heroSection", title: "Hero", options: { collapsible: true, collapsed: false } },
    { name: "introSection", title: "Intro & benefits", options: { collapsible: true, collapsed: false } },
    { name: "gallerySection", title: "Gallery & price", options: { collapsible: true, collapsed: false } },
    { name: "applicationSection", title: "Application steps", options: { collapsible: true, collapsed: false } },
  ],
  fields: [
    defineField({ name: "heroLabel", title: "Hero label", type: "internationalizedArrayString", fieldset: "heroSection", description: "Small label above the hero title. / Невеликий напис над заголовком." }),
    defineField({ name: "heroTitle", title: "Hero title", type: "internationalizedArrayString", fieldset: "heroSection", description: "Main hero heading. / Основний заголовок хіро-блоку." }),
    defineField({
      name: "heroIntro",
      title: "Hero intro paragraphs",
      type: "array",
      fieldset: "heroSection",
      of: [defineArrayMember({ type: "bulletParagraph" })],
      description: "Intro paragraphs under the hero title. / Вступні абзаци під заголовком хіро-блоку.",
    }),
    defineField({ name: "logo", title: "WECODA logo", type: "imageWithAlt", fieldset: "heroSection", description: "The WECODA logo image. / Логотип WECODA." }),
    defineField({
      name: "membershipFormCta",
      title: "\"Become a Member\" button (external application form)",
      type: "ctaLink",
      fieldset: "heroSection",
      description: "Links to the external membership application form (e.g. a Google Form). / Посилання на зовнішню форму заявки на членство (напр. Google Форму).",
    }),
    defineField({ name: "supportCta", title: "\"Support WECODA\" button", type: "ctaLink", fieldset: "heroSection" }),
    defineField({ name: "externalSiteCta", title: "\"WECODA website\" link", type: "ctaLink", fieldset: "heroSection" }),
    defineField({
      name: "donation",
      title: "Donation section",
      type: "object",
      fields: [
        defineField({ name: "label", title: "Section label", type: "internationalizedArrayString", description: 'E.g. "Donation". / Напр. «Пожертва».' }),
        defineField({ name: "title", title: "Section title", type: "internationalizedArrayString", description: 'E.g. "Support the WECODA Community". / Напр. «Підтримайте спільноту WECODA».' }),
        defineField({ name: "text", title: "Intro text", type: "internationalizedArrayText", description: "Paragraph explaining what the donation supports. / Абзац про те, на що йде пожертва." }),
        defineField({ name: "qrImage", title: "Donation QR code", type: "imageWithAlt", description: "QR code image linking to the donation payment. / Зображення QR-коду для оплати пожертви." }),
        defineField({ name: "scanText", title: "\"Scan to donate\"", type: "internationalizedArrayString", description: 'E.g. "Scan to donate". / Напр. «Скануйте, щоб зробити пожертву».' }),
        defineField({ name: "scanSubtext", title: "\"Fast, secure and easy.\"", type: "internationalizedArrayString", description: 'E.g. "Fast, secure and easy." / Напр. «Швидко, безпечно та просто».' }),
        defineField({ name: "orText", title: "\"OR\" separator", type: "internationalizedArrayString", description: 'The word "OR" between QR code and bank transfer. / Слово «АБО» між QR-кодом і банківським переказом.' }),
        defineField({
          name: "bankTransferText",
          title: "\"Prefer bank transfer?\" line",
          type: "internationalizedArrayString",
          description: 'E.g. "Prefer bank transfer? See our bank details on the right." / Напр. «Надаєте перевагу банківському переказу? Реквізити наведено праворуч».',
        }),
        defineField({ name: "bankDetailsTitle", title: "\"Bank Details\" heading", type: "internationalizedArrayString", description: 'E.g. "Bank Details". / Напр. «Банківські реквізити».' }),
        defineField({
          name: "bankFields",
          title: "Bank details",
          type: "array",
          description:
            "Each row shown in the bank-details list (Beneficiary, CVR, IBAN, etc). Drag to reorder. Values are facts, not translated. / Кожен рядок банківських реквізитів (отримувач, CVR, IBAN тощо). Перетягуйте, щоб змінити порядок. Значення — це факти, не перекладаються.",
          of: [
            defineArrayMember({
              type: "object",
              name: "bankField",
              fields: [
                defineField({ name: "label", title: "Label", type: "internationalizedArrayString", description: 'E.g. "IBAN". / Напр. «IBAN».' }),
                defineField({ name: "value", title: "Value", type: "string", description: "The actual bank detail, e.g. an account number. / Сам реквізит, напр. номер рахунку." }),
                defineField({ name: "copyable", title: "Show a copy button", type: "boolean", initialValue: false }),
              ],
              preview: {
                select: { title: "label", subtitle: "value" },
                prepare({ title, subtitle }) {
                  const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
                    (v) => v.language === "en" || v._key === "en",
                  );
                  return { title: en?.value ?? "(untitled)", subtitle: subtitle as string | undefined };
                },
              },
            }),
          ],
        }),
        defineField({ name: "supportText", title: "Closing support text", type: "internationalizedArrayText", description: "Closing paragraph thanking donors. / Завершальний абзац із подякою донорам." }),
      ],
    }),
    defineField({
      name: "priceStripText",
      title: "Price strip text",
      type: "internationalizedArrayString",
      fieldset: "gallerySection",
      description: 'E.g. "Annual membership price: 250 DKK". / Напр. «Річна вартість членства: 250 DKK».',
    }),
    defineField({
      name: "galleryLabel",
      title: "Gallery section label",
      type: "internationalizedArrayString",
      fieldset: "gallerySection",
      description: 'E.g. "Gallery". / Напр. «Галерея».',
    }),
    defineField({
      name: "galleryTitle",
      title: "Gallery section title",
      type: "internationalizedArrayString",
      fieldset: "gallerySection",
      description: 'E.g. "WECODA Community Meetings". / Напр. «Зустрічі спільноти WECODA».',
    }),
    defineField({
      name: "gallery",
      title: "Gallery photos & videos",
      type: "array",
      fieldset: "gallerySection",
      of: [defineArrayMember({ type: "mediaGalleryItem" })],
      description: "Photos and short videos shown in the community gallery grid. Drag to reorder. / Фото та короткі відео у сітці галереї спільноти. Перетягуйте, щоб змінити порядок.",
    }),
    defineField({
      name: "introSectionLabel",
      title: "Intro section label",
      type: "internationalizedArrayString",
      fieldset: "introSection",
      description: 'E.g. "WECODA community". / Напр. «Спільнота WECODA».',
    }),
    defineField({
      name: "introSectionTitle",
      title: "Intro section title",
      type: "internationalizedArrayString",
      fieldset: "introSection",
      description: 'E.g. "Connecting Women Who Inspire, Build and Lead." / Напр. «Об\'єднуємо жінок, які надихають, будують і ведуть за собою».',
    }),
    defineField({
      name: "introColumns",
      title: "Intro columns",
      type: "array",
      fieldset: "introSection",
      of: [defineArrayMember({ type: "titledText" })],
      description: "The 2 intro paragraphs shown side by side. / 2 вступні абзаци, що показуються поруч.",
    }),
    defineField({
      name: "benefitsTitle",
      title: "Benefits section title",
      type: "internationalizedArrayString",
      fieldset: "introSection",
      description: 'E.g. "What You Gain as a Member". / Напр. «Що ви отримуєте як учасниця».',
    }),
    defineField({
      name: "benefits",
      title: "Benefits",
      type: "array",
      fieldset: "introSection",
      of: [
        defineArrayMember({
          type: "object",
          name: "benefit",
          fields: [
            defineField({
              name: "icon",
              title: "Icon",
              type: "image",
              description: "Small icon image (this page uses custom artwork, not the Lucide icon set used elsewhere). / Невелике зображення-іконка (ця сторінка використовує власні зображення, а не набір іконок Lucide, що використовується деінде).",
            }),
            defineField({
              name: "text",
              title: "Benefit",
              type: "internationalizedArrayString",
              description: 'As "Title — Description" in one line. / Як «Назва — опис» одним рядком.',
            }),
          ],
          preview: {
            select: { title: "text", media: "icon" },
            prepare({ title, media }) {
              const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
                (v) => v.language === "en" || v._key === "en",
              );
              return { title: en?.value ?? "(untitled)", media };
            },
          },
        }),
      ],
      description: "Each benefit with its icon, as \"Title — Description\" in one line. / Кожна перевага зі своєю іконкою, у форматі «Назва — опис» одним рядком.",
    }),
    defineField({
      name: "audiencesTitle",
      title: "\"Who it's for\" title",
      type: "internationalizedArrayString",
      fieldset: "introSection",
      description: "Heading for the \"who this is for\" list (not currently shown on the site). / Заголовок для списку «кому це підходить» (наразі не показується на сайті).",
    }),
    defineField({
      name: "audiences",
      title: "Audiences",
      type: "array",
      fieldset: "introSection",
      of: [defineArrayMember({ type: "bulletText" })],
      description: "List of who the membership is aimed at (not currently shown on the site). / Список тих, кому призначене членство (наразі не показується на сайті).",
    }),
    defineField({
      name: "statementText",
      title: "Membership panel statement",
      type: "internationalizedArrayString",
      fieldset: "applicationSection",
      description: 'Short statement shown in the dark membership panel, e.g. "Together, we are building a strong international community." / Короткий напис у темній панелі членства, напр. «Разом ми будуємо сильну міжнародну спільноту».',
    }),
    defineField({
      name: "applicationTitle",
      title: "Application section title",
      type: "internationalizedArrayString",
      fieldset: "applicationSection",
      description: 'E.g. "Application Process". / Напр. «Процес подачі заявки».',
    }),
    defineField({
      name: "applicationSteps",
      title: "Application steps",
      type: "array",
      fieldset: "applicationSection",
      of: [defineArrayMember({ type: "titledText" })],
      description: "The numbered steps to become a member. / Пронумеровані кроки для того, щоб стати учасницею.",
    }),
    defineField({
      name: "applicationCta",
      title: "Application button",
      type: "ctaLink",
      fieldset: "applicationSection",
      description: 'E.g. "Become a Member". / Напр. «Стати учасницею».',
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "Community membership page" };
    },
  },
});
