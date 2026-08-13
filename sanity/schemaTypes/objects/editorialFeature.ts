import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "editorialFeature",
  title: "Editorial feature block",
  type: "object",
  description:
    "A large feature block pairing text with an image, used on the home page (Attend Events / Host at RORUM). / Великий блок із текстом і зображенням на головній сторінці (Відвідати події / Проведення подій у RORUM).",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow label",
      type: "internationalizedArrayString",
      description: "Small label above the title. / Невеликий напис над заголовком.",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      description: "Block heading. / Заголовок блоку.",
    }),
    defineField({
      name: "intro",
      title: "Intro",
      type: "internationalizedArrayText",
      description: "Short intro line under the title. / Короткий вступний рядок під заголовком.",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "internationalizedArrayText",
      description: "Main paragraph of the block. / Основний абзац блоку.",
    }),
    defineField({
      name: "features",
      title: "Feature bullets",
      type: "array",
      of: [defineArrayMember({ type: "bulletText" })],
      validation: (rule) => rule.max(4),
      description: "Up to 4 short feature bullets. / До 4 коротких пунктів-переваг.",
    }),
    defineField({
      name: "cta",
      title: "Call to action",
      type: "ctaLink",
      description: "Button linking to the relevant page. / Кнопка з переходом на відповідну сторінку.",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "imageWithAlt",
      description: "Image shown next to the text. / Зображення поруч із текстом.",
    }),
    defineField({
      name: "reversed",
      title: "Image on the left",
      type: "boolean",
      initialValue: false,
      description: "Show the image on the left instead of the right. / Показати зображення зліва замість справа.",
    }),
  ],
});
