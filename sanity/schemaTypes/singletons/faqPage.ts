import { defineField, defineType } from "sanity";

// FAQ questions/answers themselves live in `faqGroup` documents — this
// singleton only owns this page's own heading content.
export default defineType({
  name: "faqPage",
  title: "FAQ page",
  type: "document",
  description:
    "The FAQ page's own heading — the questions/answers themselves are separate FAQ group documents. / Заголовок сторінки поширених запитань — самі запитання та відповіді є окремими документами (групами FAQ).",
  // No `groups`/tabs: all fields render on one continuous page.
  fields: [
    defineField({ name: "heroLabel", title: "Hero label", type: "internationalizedArrayString", description: "Small label above the title. / Невеликий напис над заголовком." }),
    defineField({ name: "heroTitle", title: "Hero title", type: "internationalizedArrayString", description: 'E.g. "Frequently asked questions". / Напр. «Поширені запитання».' }),
    defineField({ name: "heroText", title: "Hero text", type: "internationalizedArrayText", description: "Intro text under the page title. / Вступний текст під заголовком сторінки." }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    prepare() {
      return { title: "FAQ page" };
    },
  },
});
