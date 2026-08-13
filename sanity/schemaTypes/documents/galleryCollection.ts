import { defineArrayMember, defineField, defineType } from "sanity";

// Backs every `HorizontalGallery` instance on the site (catering, event
// decoration, host-at-rorum). `key` is a stable machine identifier the
// frontend queries by (e.g. "catering", "event-decoration",
// "host-at-rorum") — not shown to editors as the thing they edit; `title` is
// just for finding the right gallery in the Studio's document list.
export default defineType({
  name: "galleryCollection",
  title: "Image gallery",
  type: "document",
  description:
    "One image gallery shown on a page (catering, event decoration, or host-at-rorum). Add, remove or reorder images here — changes go live immediately, no code changes needed. / Одна фотогалерея на сторінці (кейтеринг, декор подій або проведення подій у RORUM). Додавайте, видаляйте чи змінюйте порядок зображень тут — зміни з'являються на сайті одразу, без потреби в змінах коду.",
  fields: [
    defineField({
      name: "key",
      title: "Gallery key",
      type: "slug",
      description:
        "Stable identifier the website uses to find this gallery. Do not change after publishing. / Стабільний ідентифікатор, за яким сайт знаходить цю галерею. Не змінюйте після публікації.",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Internal title",
      type: "string",
      description:
        "For finding this gallery in the Studio — not shown on the website. / Для пошуку цієї галереї в адмін-панелі — не показується на сайті.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [defineArrayMember({ type: "imageWithAlt" })],
      description: "The photos shown in this gallery, in order. / Фото в цій галереї, у порядку показу.",
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {
    select: { title: "title", images: "images" },
    prepare({ title, images }) {
      return { title, subtitle: `${(images as unknown[] | undefined)?.length ?? 0} images` };
    },
  },
});
