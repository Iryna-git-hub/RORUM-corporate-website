import { defineArrayMember, defineField, defineType } from "sanity";

// Singleton. One shared `items` array — the existing site renders the exact
// same nav data for both the desktop bar and the mobile panel (see
// `components/Header.tsx`), so there is no separate "mobile navigation"
// content to maintain independently.
export default defineType({
  name: "navigation",
  title: "Navigation",
  type: "document",
  fields: [
    defineField({
      name: "items",
      title: "Menu items",
      type: "array",
      of: [defineArrayMember({ type: "navItem" })],
    }),
    defineField({
      name: "languageSwitcherLabel",
      title: "Language switcher accessible label",
      type: "internationalizedArrayString",
      description: 'E.g. "Change language" — read by screen readers, not visibly displayed.',
    }),
  ],
  preview: {
    prepare() {
      return { title: "Navigation" };
    },
  },
});
