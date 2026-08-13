import { defineArrayMember, defineField, defineType } from "sanity";

// Singleton. One shared `items` array — the existing site renders the exact
// same nav data for both the desktop bar and the mobile panel (see
// `components/Header.tsx`), so there is no separate "mobile navigation"
// content to maintain independently.
export default defineType({
  name: "navigation",
  title: "Navigation",
  type: "document",
  description:
    "The header's main navigation menu, shared by desktop and mobile. / Головне меню навігації в шапці сайту, спільне для десктопної та мобільної версій.",
  fields: [
    defineField({
      name: "items",
      title: "Menu items",
      type: "array",
      of: [defineArrayMember({ type: "navItem" })],
      description: "The top-level navigation items. / Пункти верхнього рівня меню навігації.",
    }),
    defineField({
      name: "languageSwitcherLabel",
      title: "Language switcher accessible label",
      type: "internationalizedArrayString",
      description:
        'E.g. "Change language" — read by screen readers, not visibly displayed. / Напр. «Змінити мову» — читається програмами читання з екрана, візуально не показується.',
    }),
    defineField({
      name: "contactCtaLabel",
      title: "Persistent header \"contact\" button",
      type: "internationalizedArrayString",
      description:
        'E.g. "Let\'s Talk" — the button always visible in the header, links to /contact. / Напр. «Поговорімо» — кнопка, що завжди видима в шапці сайту, веде на сторінку /contact.',
    }),
  ],
  preview: {
    prepare() {
      return { title: "Navigation" };
    },
  },
});
