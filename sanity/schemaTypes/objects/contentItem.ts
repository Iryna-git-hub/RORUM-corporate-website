import { defineField, defineType } from "sanity";
import { IconPickerInput } from "@/sanity/components/IconPickerInput";
import { allOrNothingLanguages } from "@/sanity/lib/i18nValidation";

// The one generic "list row" shape reused across every page section's
// `items[]` — icon cards, numbered steps, quick-path cards, menu dishes,
// FAQ question/answer pairs, benefit cards, bank-detail rows, and small
// named form-copy rows (e.g. a row with itemKey "submitLabel"). One shared
// shape means these all reuse the same attribute paths regardless of how
// many pages/sections use them — see MIGRATION_REPORT.md.
//
// Home's 4 hero trust badges (itemKey trust0-trust3) only ever use `icon` +
// `title` — every other field is hidden for just those 4 items below, purely
// as Studio presentation (no schema field was added or removed, so this
// costs zero additional Content Lake attribute paths; every other item type
// reusing `contentItem` is completely unaffected and keeps seeing every
// field, exactly as before).
const HOME_TRUST_BADGE_KEYS = ["trust0", "trust1", "trust2", "trust3"];

function hiddenForTrustBadge({ parent }: { parent?: { itemKey?: string } }) {
  const key = parent?.itemKey;
  return Boolean(key && HOME_TRUST_BADGE_KEYS.includes(key));
}

export default defineType({
  name: "contentItem",
  title: "Item",
  type: "object",
  description:
    "A single list entry — fill in only the fields this item actually needs. / Один елемент списку — заповніть лише ті поля, які дійсно потрібні цьому елементу.",
  fields: [
    defineField({
      name: "itemKey",
      title: "Key (do not change)",
      type: "string",
      readOnly: ({ value }) => Boolean(value),
      description:
        "Only present (and locked) on built-in items the website looks up by key, e.g. a specific form-button label. New items you add don't need one. / Присутній (і заблокований) лише для вбудованих елементів, які сайт шукає за ключем. Новим елементам ключ не потрібен.",
      hidden: hiddenForTrustBadge,
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      components: { input: IconPickerInput },
      description: "Optional icon — search by name. / Необов'язкова іконка — пошук за назвою.",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      description: "Optional heading. / Необов'язковий заголовок.",
      validation: allOrNothingLanguages(),
    }),
    defineField({
      name: "text",
      title: "Text",
      type: "internationalizedArrayText",
      description: "Optional longer text (e.g. a description or answer). / Необов'язковий довший текст (напр. опис або відповідь).",
      validation: allOrNothingLanguages(),
      hidden: hiddenForTrustBadge,
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "imageWithAlt",
      description: "Optional image for this item. / Необов'язкове зображення для цього елемента.",
      hidden: hiddenForTrustBadge,
    }),
    defineField({
      name: "href",
      title: "Link destination",
      type: "string",
      description: "Optional — set only if this item links somewhere. / Необов'язково — заповніть, лише якщо елемент веде на іншу сторінку.",
      hidden: hiddenForTrustBadge,
    }),
    defineField({
      name: "label",
      title: "Link text / value",
      type: "internationalizedArrayString",
      description:
        "Optional — link text if this item has its own link, or the trilingual value for a small labeled row. / Необов'язково — текст посилання (якщо є) або текст значення для невеликого підпису.",
      validation: allOrNothingLanguages(),
      hidden: hiddenForTrustBadge,
    }),
    defineField({
      name: "value",
      title: "Raw value (not translated)",
      type: "string",
      description:
        "Only for values that shouldn't be translated, e.g. a bank account number. / Лише для значень, які не перекладаються, напр. номер банківського рахунку.",
      hidden: hiddenForTrustBadge,
    }),
  ],
  preview: {
    select: { title: "title", icon: "icon", itemKey: "itemKey" },
    prepare({ title, icon, itemKey }) {
      const en = (title as { _key: string; language?: string; value?: string }[] | undefined)?.find(
        (v) => v.language === "en" || v._key === "en",
      );
      return { title: en?.value ?? itemKey ?? "(untitled item)", subtitle: icon as string | undefined };
    },
  },
});
