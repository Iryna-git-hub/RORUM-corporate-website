import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "packageTier",
  title: "Package",
  type: "object",
  description: "One hosting package/pricing tier. / Один тарифний план/пакет для проведення подій.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      description: "Package name. / Назва пакета.",
    }),
    defineField({
      name: "price",
      title: "Price line",
      type: "internationalizedArrayString",
      description: 'E.g. "Price: 2000 kr. ex VAT". / Напр. «Ціна: 2000 крон без ПДВ».',
    }),
    defineField({
      name: "items",
      title: "Details",
      type: "array",
      of: [defineArrayMember({ type: "bulletText" })],
      description:
        "Bullet list of what's included and the time window. / Список того, що входить у пакет, і часові рамки.",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? "(untitled package)" };
    },
  },
});
